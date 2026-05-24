import { tokenStore } from "../api/tokenStore";
import { clientContext } from "../telemetry/clientContext";
import { type ApiError, type ApiValidationErrors } from "../api/apiError";

export type FetchReportPreviewHtmlParams = {
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
};

function buildPreviewUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const a = baseUrl.replace(/\/+$/, "");
  const b = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams();
  params.set("format", "pdf");
  params.set("preview", "1");
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
  }
  return `${a}${b}?${params.toString()}`;
}

function parseValidationErrors(data: unknown): ApiValidationErrors {
  if (!data || typeof data !== "object" || !("errors" in data)) {
    return {};
  }
  const raw = (data as { errors: unknown }).errors;
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const out: ApiValidationErrors = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      out[key] = value.map((v) => String(v));
    }
  }
  return out;
}

function throwReportApiError(status: number, data: unknown): never {
  const message =
    data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string"
      ? (data as { message: string }).message
      : `No se pudo cargar la vista previa (HTTP ${status}).`;

  if (status === 422) {
    const err: ApiError = {
      kind: "validation",
      status: 422,
      message,
      errors: parseValidationErrors(data),
    };
    throw err;
  }

  const err: ApiError = {
    kind: "server",
    status,
    message,
  };
  throw err;
}

export async function fetchReportPreviewHtml(params: FetchReportPreviewHtmlParams): Promise<string> {
  const token = tokenStore.get();
  if (!token) {
    throw new Error("Inicia sesión en el portal para ver la vista previa del reporte.");
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
  if (!baseUrl) {
    throw new Error("No está configurada la URL del API (VITE_API_BASE_URL).");
  }

  const url = buildPreviewUrl(baseUrl, params.path, params.query);
  const headers: Record<string, string> = {
    Accept: "text/html,application/xhtml+xml",
    ...clientContext.toHeaders(),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "omit",
    cache: "no-store",
    signal: params.signal,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data: unknown = await response.json().catch(() => null);
      throwReportApiError(response.status, data);
    }
    throw new Error(`No se pudo cargar la vista previa (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    if (contentType.includes("application/pdf")) {
      throw new Error(
        "La vista previa no está habilitada en el servidor. Activa REPORT_PREVIEW_ENABLED en el API o contacta al administrador."
      );
    }
    throw new Error("La respuesta del servidor no es una vista previa HTML válida.");
  }

  return response.text();
}
