import type { CitaAtencionEstado } from "../types/agendaMedica.types";
import { Clock, CheckCircle } from "lucide-react";

const labelMap: Record<CitaAtencionEstado, string> = {
  PENDIENTE: "Pendiente",
  ATENDIDO: "Atendido",
};

export function CitaAtencionBadge({ estado }: { estado: CitaAtencionEstado }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold leading-none";

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
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="leading-none">{labelMap[estado]}</span>
    </span>
  );
}
