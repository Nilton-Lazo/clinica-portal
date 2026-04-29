export type ApiValidationErrors = Record<string, string[]>;

export type ApiError =
  | { kind: "validation"; status: 422; message: string; errors: ApiValidationErrors }
  | { kind: "unauthorized"; status: 401; message: string; code?: string }
  | { kind: "forbidden"; status: 403; message: string }
  | { kind: "server"; status: number; message: string }
  | { kind: "network"; status: 0; message: string };

export function isApiError(input: unknown): input is ApiError {
  if (!input || typeof input !== "object") return false;
  const error = input as Record<string, unknown>;
  return typeof error.kind === "string" && typeof error.message === "string";
}

function firstValidationMessages(errors: ApiValidationErrors): string[] {
  return Object.values(errors)
    .flat()
    .map((message) => message.trim())
    .filter(Boolean);
}

export function getApiErrorMessage(input: unknown, fallback: string): string {
  if (!isApiError(input)) return fallback;

  if (input.kind === "validation") {
    const messages = firstValidationMessages(input.errors);
    if (messages.length > 0) return messages.slice(0, 3).join(" ");
  }

  const message = input.message.trim();
  return message || fallback;
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
