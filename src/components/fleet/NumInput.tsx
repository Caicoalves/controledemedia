import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  large?: boolean;
  className?: string;
};

export function NumInput({ value, onChange, placeholder = "0", prefix, suffix, large, className }: Props) {
  return (
    <div className="relative w-full">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "font-mono-num font-bold bg-secondary/60 border-2 border-border focus-visible:ring-0 focus-visible:border-primary transition-colors",
          large ? "h-12 text-lg" : "h-10 text-base",
          prefix && "pl-8",
          suffix && "pr-10",
          className,
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}
