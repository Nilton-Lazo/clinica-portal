import { ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";
import type { RecordStatus } from "../../../../../shared/types/recordStatus";

export function StatusBadge({ status }: { status: RecordStatus }) {
  const cfg =
    status === "ACTIVO"
      ? {
          label: "Activo",
          Icon: ShieldCheck,
          cls: "border-[var(--color-success)] text-[var(--color-success)] bg-[var(--color-surface)]",
        }
      : status === "INACTIVO"
      ? {
          label: "Inactivo",
          Icon: ShieldX,
          cls: "border-[var(--color-text-secondary)] text-[var(--color-text-secondary)] bg-[var(--color-surface)]",
        }
      : {
          label: "Suspendido",
          Icon: ShieldAlert,
          cls: "border-[var(--color-warning)] text-[var(--color-warning)] bg-[var(--color-surface)]",
        };

  const Icon = cfg.Icon;

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        "whitespace-nowrap",
        cfg.cls,
      ].join(" ")}
      title={cfg.label}
    >
      <Icon className="h-4 w-4" />
      {cfg.label}
    </span>
  );
}
