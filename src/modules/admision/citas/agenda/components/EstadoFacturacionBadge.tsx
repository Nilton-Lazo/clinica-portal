import { ShieldCheck, Clock } from "lucide-react";
import type { EstadoFacturacionServicio } from "../types/atencionCita.types";

const labelMap: Record<EstadoFacturacionServicio, string> = {
  PENDIENTE: "Pendiente",
  FACTURADO: "Facturado",
};

export function EstadoFacturacionBadge({
  estado,
  size = "default",
}: {
  estado: EstadoFacturacionServicio | string | null | undefined;
  size?: "default" | "sm";
}) {
  const value = estado === "FACTURADO" || estado === "PENDIENTE" ? estado : "PENDIENTE";
  const isSm = size === "sm";
  const base = isSm
    ? "inline-flex items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
    : "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";

  const cfg =
    value === "FACTURADO"
      ? {
          cls: `${base} border-[var(--color-success)] text-[var(--color-success)]`,
          Icon: ShieldCheck,
        }
      : {
          cls: `${base} border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]`,
          Icon: Clock,
        };

  const Icon = cfg.Icon;

  return (
    <span className={cfg.cls}>
      <Icon className={isSm ? "h-3 w-3" : "h-4 w-4"} aria-hidden="true" />
      {labelMap[value as EstadoFacturacionServicio]}
    </span>
  );
}
