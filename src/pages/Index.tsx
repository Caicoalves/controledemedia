import { useMemo, useState } from "react";
import { ClipboardList, FileText, Settings, Plus, Minus, Truck, Check, X, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { NumInput } from "@/components/fleet/NumInput";
import { SectionLabel } from "@/components/fleet/SectionLabel";
import {
  MESES,
  fmtBRL,
  fmtNum,
  toNum,
  type Abast,
  type Motorista,
  type Registro,
} from "@/lib/fleet";

type Tab = "nova" | "historico" | "config";

const STORAGE = {
  motoristas: "frota.motoristas",
  historico: "frota.historico",
  config: "frota.config",
};

export default function Index() {
  const [aba, setAba] = useState<Tab>("nova");

  // ── Motoristas ──
  const [motoristas, setMotoristas] = useLocalStorage<Motorista[]>(STORAGE.motoristas, [
    { id: 1, nome: "Carlos Silva", placa: "ABC-1234" },
    { id: 2, nome: "José Oliveira", placa: "DEF-5678" },
    { id: 3, nome: "Marcos Souza", placa: "GHI-9012" },
  ]);
  const [editandoMotorista, setEditandoMotorista] = useState<number | null>(null);

  function updMotorista(id: number, campo: "nome" | "placa", val: string) {
    setMotoristas((p) => p.map((m) => (m.id === id ? { ...m, [campo]: val } : m)));
  }
  function addMotorista() {
    const id = Date.now();
    setMotoristas((p) => [...p, { id, nome: "", placa: "" }]);
    setEditandoMotorista(id);
  }
  function remMotorista(id: number) {
    setMotoristas((p) => p.filter((m) => m.id !== id));
    if (editandoMotorista === id) setEditandoMotorista(null);
    if (motoristaSel === id) {
      const next = motoristas.find((m) => m.id !== id);
      setMotoristaSel(next?.id ?? 0);
    }
  }

  // ── Config ──
  const [config, setConfig] = useLocalStorage(STORAGE.config, {
    mediaMinStr: "3,6",
    pctBonusStr: "30",
    bonusAtivo: true,
  });
  const mediaMinima = toNum(config.mediaMinStr);
  const pctBonus = toNum(config.pctBonusStr);

  // ── Form ──
  const [motoristaSel, setMotoristaSel] = useState<number>(motoristas[0]?.id ?? 0);
  const [kmSaidaStr, setKmSaidaStr] = useState("");
  const [kmChegadaStr, setKmChegadaStr] = useState("");
  const kmSaida = toNum(kmSaidaStr);
  const kmChegada = toNum(kmChegadaStr);

  const [abasts, setAbasts] = useState<Abast[]>([
    { id: 1, litrosStr: "", litros: 0, precoStr: "", preco: 0 },
  ]);

  const addAbast = () =>
    setAbasts((p) => [...p, { id: Date.now(), litrosStr: "", litros: 0, precoStr: "", preco: 0 }]);
  const updAbast = (id: number, novo: Abast) =>
    setAbasts((p) => p.map((a) => (a.id === id ? novo : a)));
  const remAbast = (id: number) => setAbasts((p) => p.filter((a) => a.id !== id));

  // ── Cálculos ──
  const kmRodado = kmChegada > kmSaida ? kmChegada - kmSaida : 0;
  const totalLitros = abasts.reduce((s, a) => s + a.litros, 0);
  const custoTotal = abasts.reduce((s, a) => s + a.litros * a.preco, 0);
  const precoMedio = totalLitros > 0 ? custoTotal / totalLitros : 0;
  const mediaReal = totalLitros > 0 && kmRodado > 0 ? kmRodado / totalLitros : 0;
  const consumoBase = mediaMinima > 0 && kmRodado > 0 ? kmRodado / mediaMinima : 0;
  const economiaL = consumoBase - totalLitros;
  const economiaR = economiaL * precoMedio;
  const bateuMeta = mediaReal > 0 && mediaReal >= mediaMinima;
  const bonus = config.bonusAtivo && bateuMeta ? Math.max(0, economiaR) * (pctBonus / 100) : 0;
  const lucro = economiaR - bonus;
  const pronto = kmSaida > 0 && kmChegada > kmSaida && totalLitros > 0 && custoTotal > 0;
  const faltando = !motoristaSel
    ? "Selecione o motorista"
    : kmSaida <= 0
      ? "Informe o KM de saída"
      : kmChegada <= 0
        ? "Informe o KM de chegada"
        : kmChegada <= kmSaida
          ? "KM de chegada deve ser maior que a saída"
          : totalLitros <= 0
            ? "Informe os litros abastecidos"
            : custoTotal <= 0
              ? "Informe o preço por litro"
              : "";

  // ── Histórico ──
  const [historico, setHistorico] = useLocalStorage<Registro[]>(STORAGE.historico, []);
  const [filtroMotorista, setFiltroMotorista] = useState<number | "todos">("todos");
  const [mesSelecionado, setMesSelecionado] = useState<string>("todos");

  function registrar() {
    if (!pronto) return;
    const mot = motoristas.find((m) => m.id === motoristaSel);
    const now = new Date();
    const novo: Registro = {
      id: Date.now(),
      data: now.toLocaleDateString("pt-BR"),
      mesAno: `${MESES[now.getMonth()]}/${now.getFullYear()}`,
      motoristaId: motoristaSel,
      motoristaNome: mot?.nome || "—",
      placa: mot?.placa || "—",
      kmSaida,
      kmChegada,
      kmRodado,
      totalLitros,
      custoTotal,
      precoMedio,
      mediaReal,
      mediaMinima,
      economiaL,
      economiaR,
      bateuMeta,
      bonus,
      lucro,
      abasts: abasts.map((a) => ({ litros: a.litros, preco: a.preco })),
    };
    setHistorico((p) => [novo, ...p]);
    setKmSaidaStr("");
    setKmChegadaStr("");
    setAbasts([{ id: Date.now(), litrosStr: "", litros: 0, precoStr: "", preco: 0 }]);
    setAba("historico");
  }

  const mesesDisponiveis = useMemo(
    () => Array.from(new Set(historico.map((r) => r.mesAno))),
    [historico],
  );

  const historicoFiltrado = useMemo(
    () =>
      historico.filter((r) => {
        const passaMot = filtroMotorista === "todos" || r.motoristaId === filtroMotorista;
        const passaMes = mesSelecionado === "todos" || r.mesAno === mesSelecionado;
        return passaMot && passaMes;
      }),
    [historico, filtroMotorista, mesSelecionado],
  );

  const historicoAgrupado = useMemo(() => {
    const grupos: Record<string, Registro[]> = {};
    historicoFiltrado.forEach((r) => {
      (grupos[r.mesAno] ||= []).push(r);
    });
    return Object.entries(grupos);
  }, [historicoFiltrado]);

  const totalFiltrado = useMemo(
    () => ({
      viagens: historicoFiltrado.length,
      km: historicoFiltrado.reduce((s, r) => s + r.kmRodado, 0),
      economia: historicoFiltrado.reduce((s, r) => s + r.economiaR, 0),
      bonus: historicoFiltrado.reduce((s, r) => s + r.bonus, 0),
      lucro: historicoFiltrado.reduce((s, r) => s + r.lucro, 0),
    }),
    [historicoFiltrado],
  );

  return (
    <div className="min-h-screen bg-surface flex justify-center">
      <div className="w-full max-w-[440px] flex flex-col min-h-screen bg-surface">
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-28">
          {/* Header */}
          <header className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-muted-foreground mb-1">
                Frota
              </div>
              <h1 className="text-[22px] font-extrabold leading-tight text-foreground text-balance">
                Controle de
                <br />
                Combustível
              </h1>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md">
              <Truck className="h-5 w-5" />
            </div>
          </header>

          {aba === "nova" && (
            <NovaViagem
              motoristas={motoristas}
              motoristaSel={motoristaSel}
              setMotoristaSel={setMotoristaSel}
              kmSaidaStr={kmSaidaStr}
              setKmSaidaStr={setKmSaidaStr}
              kmChegadaStr={kmChegadaStr}
              setKmChegadaStr={setKmChegadaStr}
              kmRodado={kmRodado}
              abasts={abasts}
              addAbast={addAbast}
              updAbast={updAbast}
              remAbast={remAbast}
              totalLitros={totalLitros}
              custoTotal={custoTotal}
              precoMedio={precoMedio}
              mediaReal={mediaReal}
              mediaMinima={mediaMinima}
              economiaL={economiaL}
              economiaR={economiaR}
              bateuMeta={bateuMeta}
              bonus={bonus}
              lucro={lucro}
              bonusAtivo={config.bonusAtivo}
              pronto={pronto}
              faltando={faltando}
              onRegistrar={registrar}
            />
          )}

          {aba === "historico" && (
            <Historico
              historico={historico}
              motoristas={motoristas}
              filtroMotorista={filtroMotorista}
              setFiltroMotorista={setFiltroMotorista}
              mesSelecionado={mesSelecionado}
              setMesSelecionado={setMesSelecionado}
              mesesDisponiveis={mesesDisponiveis}
              agrupado={historicoAgrupado}
              total={totalFiltrado}
            />
          )}

          {aba === "config" && (
            <ConfigPanel
              config={config}
              setConfig={setConfig}
              pctBonus={pctBonus}
              motoristas={motoristas}
              historico={historico}
              editandoMotorista={editandoMotorista}
              setEditandoMotorista={setEditandoMotorista}
              addMotorista={addMotorista}
              updMotorista={updMotorista}
              remMotorista={remMotorista}
            />
          )}
        </main>

        {aba === "nova" && (
          <div className="sticky bottom-[68px] z-10 px-4 pb-3 pt-2 bg-gradient-to-t from-surface via-surface to-transparent">
            <Button
              size="lg"
              disabled={!pronto}
              onClick={registrar}
              className="w-full h-14 text-base font-extrabold rounded-2xl shadow-lg"
            >
              {pronto ? (
                <>
                  <Check className="h-4 w-4 mr-2" /> Registrar viagem
                </>
              ) : (
                faltando || "Preencha todos os campos"
              )}
            </Button>
          </div>
        )}

        {/* Bottom nav */}
        <nav className="sticky bottom-0 z-10 bg-card/90 backdrop-blur-md border-t border-border flex px-3 pt-2 pb-3">
          <NavBtn icon={<FileText className="h-5 w-5" />} label="Viagem" active={aba === "nova"} onClick={() => setAba("nova")} />
          <NavBtn icon={<ClipboardList className="h-5 w-5" />} label="Histórico" active={aba === "historico"} onClick={() => setAba("historico")} />
          <NavBtn icon={<Settings className="h-5 w-5" />} label="Config" active={aba === "config"} onClick={() => setAba("config")} />
        </nav>
      </div>
    </div>
  );
}

// ─── Nav button ───────────────────────────────────────────────────────────
function NavBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <span
        className={cn(
          "h-1 w-1 rounded-full transition-opacity",
          active ? "bg-foreground opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

// ─── Stat Row (dark card) ─────────────────────────────────────────────────
function StatRow({
  label,
  value,
  bold,
  cor,
  border,
}: {
  label: string;
  value: string;
  bold?: boolean;
  cor?: string;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center py-2.5",
        border && "border-b border-white/10",
      )}
    >
      <span className="text-[13px] text-white/60 font-medium">{label}</span>
      <span
        className={cn(
          "font-mono-num",
          bold ? "text-base font-extrabold" : "text-sm font-bold",
        )}
        style={{ color: cor || "hsl(var(--primary-foreground))" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Nova viagem ──────────────────────────────────────────────────────────
function NovaViagem(props: any) {
  const {
    motoristas, motoristaSel, setMotoristaSel,
    kmSaidaStr, setKmSaidaStr, kmChegadaStr, setKmChegadaStr, kmRodado,
    abasts, addAbast, updAbast, remAbast,
    totalLitros, custoTotal, precoMedio,
    mediaReal, mediaMinima, economiaL, economiaR,
    bateuMeta, bonus, lucro, bonusAtivo, pronto, faltando, onRegistrar,
  } = props;

  return (
    <div className="flex flex-col gap-5">
      {/* Motorista */}
      <section>
        <SectionLabel>Motorista</SectionLabel>
        <div className="flex flex-col gap-2">
          {motoristas.map((m: Motorista) => {
            const selected = motoristaSel === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMotoristaSel(m.id)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all",
                  selected
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-foreground border-transparent shadow-sm hover:border-border",
                )}
              >
                <span className="font-bold text-[15px]">{m.nome || "Sem nome"}</span>
                <span className={cn("text-xs font-semibold font-mono-num", selected ? "opacity-60" : "text-muted-foreground")}>
                  {m.placa}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Hodômetro */}
      <section>
        <SectionLabel>Hodômetro</SectionLabel>
        <Card className="p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Saída</div>
              <NumInput large value={kmSaidaStr} onChange={setKmSaidaStr} suffix="km" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Chegada</div>
              <NumInput large value={kmChegadaStr} onChange={setKmChegadaStr} suffix="km" />
            </div>
          </div>
          {kmRodado > 0 && (
            <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-success-soft flex items-center justify-between">
              <span className="text-[13px] font-semibold text-success">Km rodados</span>
              <span className="text-base font-extrabold font-mono-num text-success">
                {kmRodado.toLocaleString("pt-BR")} km
              </span>
            </div>
          )}
        </Card>
      </section>

      {/* Abastecimentos */}
      <section>
        <SectionLabel
          action={
            <Button size="sm" onClick={addAbast} className="h-7 px-3 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
            </Button>
          }
        >
          Abastecimentos
        </SectionLabel>
        <Card className="p-4 shadow-sm">
          <div className="grid grid-cols-[1fr_1fr_36px] gap-2 mb-2 pb-1.5 border-b border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Litros</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preço/L</span>
            <span />
          </div>
          <div className="flex flex-col gap-2">
            {abasts.map((a: Abast) => (
              <div key={a.id} className="flex gap-2 items-center">
                <NumInput
                  value={a.litrosStr}
                  suffix="L"
                  onChange={(v) => updAbast(a.id, { ...a, litrosStr: v, litros: toNum(v) })}
                />
                <NumInput
                  value={a.precoStr}
                  prefix="R$"
                  placeholder="0,00"
                  onChange={(v) => updAbast(a.id, { ...a, precoStr: v, preco: toNum(v) })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={abasts.length <= 1}
                  onClick={() => remAbast(a.id)}
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-xl",
                    abasts.length > 1 && "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
                  )}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {totalLitros > 0 && custoTotal > 0 && (
            <div className="mt-3 border-t border-border pt-3 grid grid-cols-3 gap-2">
              {[
                { l: "Total", v: `${fmtNum(totalLitros)} L` },
                { l: "Custo", v: fmtBRL(custoTotal) },
                { l: "Média paga", v: `R$ ${fmtNum(precoMedio)}/L` },
              ].map(({ l, v }) => (
                <div key={l} className="text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{l}</div>
                  <div className="text-[13px] font-extrabold font-mono-num text-foreground">{v}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Resultado */}
      {pronto && (
        <section>
          <SectionLabel>Resultado</SectionLabel>
          <Card className="p-4 bg-primary text-primary-foreground border-0 shadow-lg">
            <StatRow label="Km rodados" value={`${kmRodado.toLocaleString("pt-BR")} km`} border />
            <StatRow label="Litros usados" value={`${fmtNum(totalLitros)} L`} border />
            <StatRow
              label="Média realizada"
              value={`${fmtNum(mediaReal)} km/L`}
              cor={bateuMeta ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              border
            />
            <StatRow label="Meta mínima" value={`${fmtNum(mediaMinima)} km/L`} cor="hsl(var(--muted-foreground))" border />
            <StatRow
              label="Economia (litros)"
              value={`${fmtNum(economiaL)} L`}
              cor={economiaL >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              border
            />
            <StatRow
              label="Economia (R$)"
              value={fmtBRL(economiaR)}
              cor={economiaR >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              bold
              border
            />
            <StatRow
              label="Bônus motorista"
              value={bonusAtivo ? fmtBRL(bonus) : "—"}
              cor="hsl(var(--warning))"
              bold
              border
            />
            <StatRow
              label="Lucro empresa"
              value={fmtBRL(lucro)}
              cor={lucro >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              bold
            />
            <div className="mt-4 flex justify-center">
              <Badge
                className={cn(
                  "px-3 py-1 text-[11px] font-extrabold tracking-wider",
                  bateuMeta
                    ? "bg-success-soft text-success hover:bg-success-soft"
                    : "bg-destructive/15 text-destructive hover:bg-destructive/15",
                )}
              >
                {bateuMeta ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                {bateuMeta ? "Meta atingida" : "Abaixo da meta"}
              </Badge>
            </div>
          </Card>
        </section>
      )}

      {/* spacer para o botão fixo */}
      <div className="h-2" />
    </div>
  );
}

// ─── Histórico ────────────────────────────────────────────────────────────
function Historico({
  historico,
  motoristas,
  filtroMotorista,
  setFiltroMotorista,
  mesSelecionado,
  setMesSelecionado,
  mesesDisponiveis,
  agrupado,
  total,
}: any) {
  if (historico.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-60" />
        <div className="text-[15px] font-semibold">Nenhuma viagem registrada</div>
        <div className="text-[13px] mt-1">Registre a primeira viagem na aba Viagem</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filtros motorista */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {[{ id: "todos" as const, nome: "Todos" }, ...motoristas].map((m: any) => {
          const sel = filtroMotorista === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setFiltroMotorista(m.id)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors",
                sel ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {m.nome}
            </button>
          );
        })}
      </div>

      {/* Filtro mês */}
      {mesesDisponiveis.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {["todos", ...mesesDisponiveis].map((m: string) => {
            const sel = mesSelecionado === m;
            return (
              <button
                key={m}
                onClick={() => setMesSelecionado(m)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border-[1.5px] transition-colors",
                  sel ? "border-primary bg-secondary text-foreground" : "border-border bg-card text-muted-foreground",
                )}
              >
                {m === "todos" ? "Todos os meses" : m}
              </button>
            );
          })}
        </div>
      )}

      {/* Consolidado */}
      <Card className="p-4 bg-primary text-primary-foreground border-0 shadow-md">
        <div className="text-[10px] font-extrabold tracking-wider uppercase text-white/50 mb-2.5">
          {filtroMotorista === "todos"
            ? "Consolidado"
            : motoristas.find((m: Motorista) => m.id === filtroMotorista)?.nome}
          {mesSelecionado !== "todos" && ` · ${mesSelecionado}`}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "Viagens", v: String(total.viagens) },
            { l: "Km total", v: `${total.km.toLocaleString("pt-BR")} km` },
            { l: "Economia", v: fmtBRL(total.economia), cor: "hsl(var(--success))" },
            { l: "Lucro", v: fmtBRL(total.lucro), cor: "hsl(var(--success))" },
          ].map(({ l, v, cor }) => (
            <div key={l} className="bg-white/5 rounded-xl px-3 py-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">{l}</div>
              <div className="text-[15px] font-extrabold font-mono-num" style={{ color: cor || "hsl(var(--primary-foreground))" }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Registros agrupados */}
      {agrupado.map(([mesAno, registros]: [string, Registro[]]) => (
        <div key={mesAno}>
          <div className="flex justify-between items-center px-1 py-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{mesAno}</span>
            <span className="text-[11px] text-muted-foreground/70 font-semibold">
              {registros.length} viagem{registros.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {registros.map((r) => (
              <Card key={r.id} className="p-3.5 shadow-sm">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <div className="font-extrabold text-[14px] text-foreground">{r.motoristaNome}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {r.placa} · {r.data} · {r.kmSaida.toLocaleString("pt-BR")} → {r.kmChegada.toLocaleString("pt-BR")} km
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "font-mono-num text-[11px] font-extrabold px-2.5 py-0.5",
                      r.bateuMeta ? "bg-success-soft text-success hover:bg-success-soft" : "bg-destructive/15 text-destructive hover:bg-destructive/15",
                    )}
                  >
                    {fmtNum(r.mediaReal)} km/L
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { l: "Rodados", v: `${r.kmRodado.toLocaleString("pt-BR")} km` },
                    { l: "Litros", v: `${fmtNum(r.totalLitros)} L` },
                    { l: "Custo", v: fmtBRL(r.custoTotal) },
                    { l: "Economia", v: fmtBRL(r.economiaR), cor: r.economiaR >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" },
                    { l: "Bônus", v: fmtBRL(r.bonus), cor: "hsl(var(--warning-foreground))" },
                    { l: "Lucro", v: fmtBRL(r.lucro), cor: r.lucro >= 0 ? "hsl(var(--info))" : "hsl(var(--destructive))" },
                  ].map(({ l, v, cor }) => (
                    <div key={l} className="bg-secondary/60 rounded-lg px-2 py-1.5 border border-border/60">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{l}</div>
                      <div className="text-[12px] font-extrabold font-mono-num" style={{ color: cor || "hsl(var(--foreground))" }}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                {r.abasts?.length > 1 && (
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {r.abasts.map((a, i) => (
                      <span key={i} className="text-[10px] bg-secondary rounded-md px-1.5 py-0.5 text-muted-foreground font-mono-num">
                        {fmtNum(a.litros)}L @ R${fmtNum(a.preco)}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────
function ConfigPanel({
  config,
  setConfig,
  pctBonus,
  motoristas,
  historico,
  editandoMotorista,
  setEditandoMotorista,
  addMotorista,
  updMotorista,
  remMotorista,
}: any) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionLabel>Consumo de referência</SectionLabel>
        <Card className="p-4 shadow-sm">
          <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">
            Média mínima esperada. Abaixo disso o motorista não recebe bônus.
          </p>
          <NumInput
            large
            value={config.mediaMinStr}
            onChange={(v) => setConfig({ ...config, mediaMinStr: v })}
            suffix="km/L"
            placeholder="0,0"
          />
        </Card>
      </section>

      <section>
        <SectionLabel>Bônus do motorista</SectionLabel>
        <Card className="p-4 shadow-sm">
          <div className={cn("flex justify-between items-center", config.bonusAtivo && "mb-4")}>
            <div>
              <div className="font-bold text-[15px] text-foreground">Bônus ativo</div>
              <div className="text-xs text-muted-foreground mt-0.5">% sobre a economia ao bater a meta</div>
            </div>
            <Switch
              checked={config.bonusAtivo}
              onCheckedChange={(v) => setConfig({ ...config, bonusAtivo: v })}
            />
          </div>
          {config.bonusAtivo && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                % do motorista sobre a economia
              </div>
              <div className="flex gap-3 items-stretch">
                <NumInput
                  large
                  value={config.pctBonusStr}
                  onChange={(v) => setConfig({ ...config, pctBonusStr: v })}
                  suffix="%"
                />
                <div className="bg-secondary border border-border rounded-2xl px-3 py-2 text-center min-w-[100px] shrink-0">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Empresa fica
                  </div>
                  <div className="text-lg font-extrabold font-mono-num text-foreground">
                    {fmtNum(100 - pctBonus, 0)}%
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-success-soft text-success rounded-xl px-3.5 py-2.5 text-[13px] font-semibold leading-relaxed">
                Para cada R$&nbsp;100 de economia: motorista recebe R$&nbsp;{fmtNum(pctBonus, 0)}, empresa fica com R$&nbsp;{fmtNum(100 - pctBonus, 0)}.
              </div>
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionLabel
          action={
            <Button size="sm" onClick={addMotorista} className="h-7 px-3 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Novo
            </Button>
          }
        >
          Motoristas
        </SectionLabel>
        <div className="flex flex-col gap-2">
          {motoristas.map((m: Motorista) => {
            const editando = editandoMotorista === m.id;
            const viagens = historico.filter((r: Registro) => r.motoristaId === m.id).length;
            return (
              <Card key={m.id} className="p-4 shadow-sm">
                {editando ? (
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Nome</div>
                      <Input
                        value={m.nome}
                        onChange={(e) => updMotorista(m.id, "nome", e.target.value)}
                        placeholder="Nome do motorista"
                        className="h-10 font-bold bg-secondary/60 border-2"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Placa</div>
                      <Input
                        value={m.placa}
                        onChange={(e) => updMotorista(m.id, "placa", e.target.value.toUpperCase())}
                        placeholder="ABC-1234"
                        className="h-10 font-bold font-mono-num tracking-widest bg-secondary/60 border-2"
                      />
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Button onClick={() => setEditandoMotorista(null)} className="flex-1">
                        <Check className="h-4 w-4 mr-1.5" /> Salvar
                      </Button>
                      {viagens === 0 && (
                        <Button
                          variant="outline"
                          onClick={() => remMotorista(m.id)}
                          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-[15px] text-foreground">
                        {m.nome || <span className="italic text-muted-foreground">Sem nome</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono-num tracking-wider">
                        {m.placa || "—"} · {viagens} viagem{viagens !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setEditandoMotorista(m.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
