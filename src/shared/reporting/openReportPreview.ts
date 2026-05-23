import { tokenStore } from "../api/tokenStore";
import { clientContext } from "../telemetry/clientContext";
import { getApiErrorMessage, type ApiError, type ApiValidationErrors } from "../api/apiError";

export type OpenReportPreviewParams = {
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(
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
      : `No se pudo abrir la vista previa (HTTP ${status}).`;

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

export async function openReportPreview(params: OpenReportPreviewParams): Promise<void> {
  const token = tokenStore.get();
  if (!token) {
    throw new Error("Inicia sesión en el portal para abrir la vista previa del reporte.");
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
  if (!baseUrl) {
    throw new Error("No está configurada la URL del API (VITE_API_BASE_URL).");
  }

  const url = buildUrl(baseUrl, params.path, params.query);
  const headers: Record<string, string> = {
    Accept: "text/html,application/pdf,*/*",
    ...clientContext.toHeaders(),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "omit",
    cache: "no-store",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data: unknown = await response.json().catch(() => null);
      throwReportApiError(response.status, data);
    }
    throw new Error(`No se pudo abrir la vista previa (HTTP ${response.status}).`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
}

export async function openReportPreviewSafe(
  params: OpenReportPreviewParams,
  onError: (message: string) => void
): Promise<boolean> {
  try {
    await openReportPreview(params);
    return true;
  } catch (e) {
    onError(getApiErrorMessage(e, "No se pudo abrir la vista previa del reporte."));
    return false;
  }
}
