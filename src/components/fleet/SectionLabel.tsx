import { ReactNode } from "react";

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2.5 px-0.5">
      <span className="text-[10px] font-extrabold tracking-[0.15em] uppercase text-muted-foreground">
        {children}
      </span>
      {action}
    </div>
  );
}
