import type { EstadoLineaPresupuesto } from "../types/atencionCita.types";

export function presupuestoEstadoFromStored(raw: string | null | undefined): EstadoLineaPresupuesto {
  if (raw === "VIGENTE" || raw === "UTILIZADO" || raw === "VENCIDO" || raw === "ANULADO") return raw;
  if (raw === "FACTURADO") return "UTILIZADO";
  return "VIGENTE";
}
