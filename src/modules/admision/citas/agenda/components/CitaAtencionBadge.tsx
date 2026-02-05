import type { CitaAtencionEstado } from "../types/agendaMedica.types";
import { Clock, CheckCircle } from "lucide-react";

const labelMap: Record<CitaAtencionEstado, string> = {
  PENDIENTE: "Pendiente",
  ATENDIDO: "Atendido",
};

export function CitaAtencionBadge({ estado }: { estado: CitaAtencionEstado }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";

  const cfg =
    estado === "PENDIENTE"
      ? {
          cls: `${base} border-[var(--color-warning)] text-[var(--color-warning)]`,
          Icon: Clock,
        }
      : {
          cls: `${base} border-[var(--color-success)] text-[var(--color-success)]`,
          Icon: CheckCircle,
        };

  const Icon = cfg.Icon;

  return (
    <span className={cfg.cls}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {labelMap[estado]}
    </span>
  );
}
