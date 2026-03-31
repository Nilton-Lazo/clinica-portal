import { ShieldCheck, Clock, CircleDot, CheckCircle2, CalendarX, Ban } from "lucide-react";
import type { EstadoFacturacionServicio, EstadoLineaPresupuesto } from "../types/atencionCita.types";

const labelFacturacion: Record<EstadoFacturacionServicio, string> = {
  PENDIENTE: "Pendiente",
  FACTURADO: "Facturado",
};

const labelPresupuesto: Record<EstadoLineaPresupuesto, string> = {
  VIGENTE: "Vigente",
  UTILIZADO: "Utilizado",
  VENCIDO: "Vencido",
  ANULADO: "Anulado",
};

export function presupuestoEstadoFromStored(raw: string | null | undefined): EstadoLineaPresupuesto {
  if (raw === "VIGENTE" || raw === "UTILIZADO" || raw === "VENCIDO" || raw === "ANULADO") return raw;
  if (raw === "FACTURADO") return "UTILIZADO";
  return "VIGENTE";
}

type BadgeMode = "facturacion" | "presupuesto";

export function EstadoFacturacionBadge({
  estado,
  size = "default",
  mode = "facturacion",
}: {
  estado: EstadoFacturacionServicio | EstadoLineaPresupuesto | string | null | undefined;
  size?: "default" | "sm";
  mode?: BadgeMode;
}) {
  const isSm = size === "sm";
  const base = isSm
    ? "inline-flex items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
    : "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";

  if (mode === "presupuesto") {
    const value = presupuestoEstadoFromStored(estado);
    const cfg =
      value === "UTILIZADO"
        ? {
            cls: `${base} border-[var(--color-success)] text-[var(--color-success)]`,
            Icon: CheckCircle2,
            label: labelPresupuesto.UTILIZADO,
          }
        : value === "VENCIDO"
          ? {
              cls: `${base} border-amber-600/70 text-amber-800 dark:text-amber-200`,
              Icon: CalendarX,
              label: labelPresupuesto.VENCIDO,
            }
          : value === "ANULADO"
            ? {
                cls: `${base} border-[var(--color-danger)] text-[var(--color-danger)]`,
                Icon: Ban,
                label: labelPresupuesto.ANULADO,
              }
            : {
                cls: `${base} border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]`,
                Icon: CircleDot,
                label: labelPresupuesto.VIGENTE,
              };

    const Icon = cfg.Icon;
    return (
      <span className={cfg.cls}>
        <Icon className={isSm ? "h-3 w-3" : "h-4 w-4"} aria-hidden="true" />
        {cfg.label}
      </span>
    );
  }

  const value = estado === "FACTURADO" || estado === "PENDIENTE" ? estado : "PENDIENTE";
  const isFacturado = value === "FACTURADO";
  const cfg = isFacturado
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
      {labelFacturacion[value as EstadoFacturacionServicio]}
    </span>
  );
}
