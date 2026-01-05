export type ApiValidationErrors = Record<string, string[]>;

export type ApiError =
  | { kind: "validation"; status: 422; message: string; errors: ApiValidationErrors }
  | { kind: "unauthorized"; status: 401; message: string; code?: string }
  | { kind: "forbidden"; status: 403; message: string }
  | { kind: "server"; status: 500; message: string }
  | { kind: "network"; status: 0; message: string };

export function toApiError(input: unknown): ApiError {
  if (typeof input === "object" && input !== null && "kind" in input) {
    return input as ApiError;
  }

  return {
    kind: "network",
    status: 0,
    message: "No se pudo conectar con el servidor.",
  };
}
