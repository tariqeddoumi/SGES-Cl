import { cn } from "@/lib/utils";

/** Tableau de données : en-têtes discrets, lignes séparées, chiffres alignés. */
export function Tableau({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cn("w-full border-collapse text-[13px]", className)}>{children}</table>;
}

export function Th({ children, className, alignFin }: { children?: React.ReactNode; className?: string; alignFin?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        alignFin ? "text-end" : "text-start",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, alignFin, colSpan, dir }: { children?: React.ReactNode; className?: string; alignFin?: boolean; colSpan?: number; dir?: "ltr" | "rtl" }) {
  return (
    <td dir={dir} colSpan={colSpan} className={cn("border-b border-border/70 px-3 py-2.5 align-middle", alignFin && "text-end tabulaire", className)}>
      {children}
    </td>
  );
}

export function Tr({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr onClick={onClick} className={cn("transition-colors hover:bg-surface/70", onClick && "cursor-pointer", className)}>
      {children}
    </tr>
  );
}
