export const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtNum = (v: number, d = 2) =>
  typeof v === "number" && isFinite(v) ? v.toFixed(d).replace(".", ",") : "—";

export const toNum = (s: string) => parseFloat(String(s).replace(",", ".")) || 0;

export type Motorista = { id: number; nome: string; placa: string };

export type Abast = { id: number; litrosStr: string; litros: number; precoStr: string; preco: number };

export type Registro = {
  id: number;
  data: string;
  mesAno: string;
  motoristaId: number;
  motoristaNome: string;
  placa: string;
  kmSaida: number;
  kmChegada: number;
  kmRodado: number;
  totalLitros: number;
  custoTotal: number;
  precoMedio: number;
  mediaReal: number;
  mediaMinima: number;
  economiaL: number;
  economiaR: number;
  bateuMeta: boolean;
  bonus: number;
  lucro: number;
  abasts: { litros: number; preco: number }[];
};
