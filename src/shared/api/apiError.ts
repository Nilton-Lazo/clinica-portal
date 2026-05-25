export type ApiValidationErrors = Record<string, string[]>;

export type ApiError =
  | { kind: "validation"; status: 422; message: string; errors: ApiValidationErrors }
  | { kind: "unauthorized"; status: 401; message: string; code?: string }
  | { kind: "forbidden"; status: 403; message: string }
  | { kind: "server"; status: number; message: string }
  | { kind: "network"; status: 0; message: string; aborted?: boolean };

export function isAbortedRequest(input: unknown): boolean {
  return (
    isApiError(input) &&
    input.kind === "network" &&
    (input as { aborted?: boolean }).aborted === true
  );
}

export function isApiError(input: unknown): input is ApiError {
  if (!input || typeof input !== "object") return false;
  const error = input as Record<string, unknown>;
  return typeof error.kind === "string" && typeof error.message === "string";
}

const LARAVEL_VALIDATION_MESSAGE_ES: Record<string, string> = {
  "The selected sort is invalid.": "No se puede ordenar por esa columna. Elige otra columna del encabezado.",
  "The selected sort dir is invalid.": "El sentido de ordenamiento no es válido. Debe ser ascendente o descendente.",
  "The given data was invalid.": "Los datos enviados no son válidos. Revisa los filtros e intenta de nuevo.",
  "Error de validación.": "Los datos enviados no son válidos. Revisa los filtros e intenta de nuevo.",
};

const GENERIC_SERVER_MESSAGES = new Set([
  "Error interno del servidor.",
  "Error interno del servidor",
  "Internal Server Error",
]);

function localizeValidationMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;
  return LARAVEL_VALIDATION_MESSAGE_ES[trimmed] ?? trimmed;
}

function firstValidationMessages(errors: ApiValidationErrors): string[] {
  return Object.values(errors)
    .flat()
    .map((message) => localizeValidationMessage(String(message)))
    .filter(Boolean);
}

export function getApiErrorMessage(input: unknown, fallback: string): string {
  if (!isApiError(input)) return fallback;

  if (input.kind === "validation") {
    const messages = firstValidationMessages(input.errors);
    if (messages.length > 0) return messages.slice(0, 3).join(" ");
    const summary = localizeValidationMessage(input.message.trim());
    if (summary) return summary;
  }

  const message = input.message.trim();
  if (input.kind === "server" && GENERIC_SERVER_MESSAGES.has(message)) {
    return `${fallback} El servidor no entregó una causa específica; revisa el registro del servidor para ver el detalle técnico.`;
  }
  return localizeValidationMessage(message) || fallback;
}

export function toApiError(input: unknown): ApiError {
  if (isApiError(input)) {
    return input as ApiError;
  }

  return {
    kind: "network",
    status: 0,
    message: "No se pudo conectar con el servidor.",
  };
}
