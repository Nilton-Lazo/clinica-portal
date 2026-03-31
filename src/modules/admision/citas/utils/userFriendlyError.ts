import type { ApiError } from "../../../../shared/api/apiError";

/**
 * Mensajes para el usuario final en Citas (Programación médica, gestión de citas).
 * Sin términos técnicos (token, 401, etc.). Error real en consola solo en desarrollo.
 */
const FIELD_LABELS: Record<string, string> = {
  codigo: "Código",
  fecha: "Fecha",
  medico_id: "Médico",
  especialidad_id: "Especialidad",
  consultorio_id: "Consultorio",
  turno_id: "Turno",
  tipo: "Tipo",
  estado: "Estado",
  modalidad_fechas: "Modalidad de fechas",
  fecha_inicio: "Fecha inicio",
  fecha_fin: "Fecha fin",
  fechas: "Fechas",
  cupos: "Cupos",
  hora: "Hora",
  orden: "Orden",
  motivo: "Motivo",
  observacion: "Observación",
  paciente_id: "Paciente",
  iafa_id: "IAFA",
  estado_atencion: "Estado de atención",
  agenda_cita_id: "Cita",
  paciente_plan_id: "Plan del paciente",
  parentesco_seguro: "Condición",
  titular_nombre: "Titular",
  hora_asistencia: "Hora de atención",
  nro_cuenta: "N° de cuenta",
  tarifa_id: "Tarifa",
  servicios: "Servicios",
  monto_a_pagar: "Monto a pagar",
  vigencia_hasta: "Vigencia hasta",
  payload: "Contenido del presupuesto",
  soat_activo: "SOAT",
  soat_numero_poliza: "N° de póliza SOAT",
  soat_numero_placa: "N° de placa SOAT",
};

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "kind" in e && "message" in e;
}

function toUserMessage(apiError: ApiError): string {
  try {
    if (import.meta.env?.DEV) {
      console.error("[Citas] Error técnico (no mostrar al usuario):", apiError);
    }
  } catch {
    // ignore
  }

  switch (apiError.kind) {
    case "unauthorized":
      return "Tu sesión ha expirado o no es válida. Inicia sesión de nuevo.";
    case "forbidden":
      return "No tienes permiso para realizar esta acción.";
    case "network":
      return apiError.message || "No se pudo conectar. Comprueba tu conexión e intenta de nuevo.";
    case "server":
      return "Ocurrió un error en el servidor. Intenta de nuevo en unos momentos.";
    case "validation": {
      const errors = apiError.errors ?? {};
      const entries = Object.entries(errors);
      if (entries.length === 0) return "Completa los campos requeridos antes de continuar.";
      const [field, msgs] = entries[0];
      const detail = Array.isArray(msgs) ? msgs[0] : String(msgs ?? "");
      const label = getFieldLabel(field);
      if (detail && !/^[a-z_]+$/i.test(detail)) {
        return `${label}: ${detail}`;
      }
      return `Debe completar o corregir el campo "${label}" para continuar.`;
    }
    default:
      return "Ocurrió un error. Intenta de nuevo.";
  }
}

export function toUserFriendlyMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return toUserMessage(error);
  return fallback;
}
