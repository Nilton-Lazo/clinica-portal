import { getApiErrorMessage, isApiError } from "../../../../shared/api/apiError";
import type { ApiError } from "../../../../shared/api/apiError";

const FIELD_LABELS: Record<string, string> = {
  tipo_documento: "Tipo de documento",
  numero_documento: "N° de documento",
  nombres: "Nombre(s)",
  apellido_paterno: "Apellido paterno",
  apellido_materno: "Apellido materno",
  estado_civil: "Estado civil",
  sexo: "Sexo",
  fecha_nacimiento: "Fecha de nacimiento",
  nacionalidad_iso2: "Nacionalidad",
  ubigeo_nacimiento: "Distrito de nacimiento",
  direccion: "Dirección",
  ubigeo_domicilio: "Distrito de domicilio",
  parentesco_seguro: "Parentesco (seguro)",
  titular_nombre: "Titular",
  celular: "Celular",
  telefono: "Teléfono",
  email: "Correo electrónico",
  medico_tratante_id: "Médico tratante",
  tipo_sangre: "Tipo de sangre",
  tipo_paciente: "Tipo de paciente",
  ocupacion: "Ocupación",
  medio_informacion: "Medio de información",
  medio_informacion_detalle: "Detalle del medio de información",
  ubicacion_archivo_hc: "Ubicación archivo HC",
  estado: "Estado",
  contacto_emergencia: "Contacto de emergencia",
  "contacto_emergencia.nombres": "Nombres (contacto emergencia)",
  "contacto_emergencia.apellido_paterno": "Apellido paterno (contacto emergencia)",
  "contacto_emergencia.apellido_materno": "Apellido materno (contacto emergencia)",
  "contacto_emergencia.parentesco_emergencia": "Parentesco (contacto emergencia)",
  "contacto_emergencia.celular": "Celular (contacto emergencia)",
  tipo_cliente_id: "Tipo de cliente",
  fecha_afiliacion: "Fecha de afiliación",
};

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}

function toUserMessage(apiError: ApiError): string {
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
      if (entries.length === 0) return apiError.message || "Completa los campos requeridos antes de continuar.";
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
  if (isApiError(error)) {
    return toUserMessage(error);
  }
  return getApiErrorMessage(error, fallback);
}
