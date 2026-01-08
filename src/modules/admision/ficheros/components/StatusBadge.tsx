import type { RecordStatus } from "../types/especialidades.types";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

const labelMap: Record<RecordStatus, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  SUSPENDIDO: "Suspendido",
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";

  const cfg =
    status === "ACTIVO"
      ? {
          cls: `${base} border-[var(--color-success)] text-[var(--color-success)]`,
          Icon: ShieldCheck,
        }
      : status === "INACTIVO"
      ? {
          cls: `${base} border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]`,
          Icon: ShieldX,
        }
      : {
          cls: `${base} border-[var(--color-warning)] text-[var(--color-warning)]`,
          Icon: ShieldAlert,
        };

  const Icon = cfg.Icon;

  return (
    <span className={cfg.cls}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {labelMap[status]}
    </span>
  );
}
