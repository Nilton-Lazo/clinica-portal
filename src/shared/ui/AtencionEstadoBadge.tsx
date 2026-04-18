import { ClipboardList, ShieldCheck, Clock } from "lucide-react";

function formatFallbackLabel(raw: string): string {
  const x = raw.replace(/_/g, " ").trim().toLowerCase();
  if (!x) return raw;
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export function AtencionEstadoBadge({ value }: { value?: string | null }) {
  if (!value || !String(value).trim()) {
    return <span className="text-(--color-text-secondary) text-xs">—</span>;
  }
  const v = String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  const base =
    "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";

  if (v === "ATENDIDO") {
    return (
      <span className={`${base} border-(--color-success) text-(--color-success)`}>
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        Atendido
      </span>
    );
  }
  if (v === "REGISTRADO") {
    return (
      <span className={`${base} border-(--color-primary) text-(--color-primary)`}>
        <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
        Registrado
      </span>
    );
  }
  if (v === "PENDIENTE") {
    return (
      <span className={`${base} border-(--color-warning) text-(--color-warning)`}>
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        Pendiente
      </span>
    );
  }
  if (v === "CANCELADO_LISTO_PARA_FACTURAR") {
    return (
      <span className={`${base} border-(--color-warning) text-(--color-warning)`}>
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        Listo para facturar
      </span>
    );
  }

  return <span className="text-(--color-text-secondary) text-xs">{formatFallbackLabel(value)}</span>;
}
