import { tokenStore } from "../api/tokenStore";
import { clientContext } from "../telemetry/clientContext";
import { getApiErrorMessage, type ApiError, type ApiValidationErrors } from "../api/apiError";
import type { ReportFormat } from "./reportFormat";

const REPORT_DOWNLOAD_TIMEOUT_MS = 120_000;

export type DownloadReportFileParams = {
  path: string;
  format: ReportFormat;
  query?: Record<string, string | number | boolean | undefined | null>;
  filenameFallback?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

function buildUrl(
  baseUrl: string,
  path: string,
  format: ReportFormat,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const a = baseUrl.replace(/\/+$/, "");
  const b = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams();
  params.set("format", format);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
  }
  return `${a}${b}?${params.toString()}`;
}

function parseFilenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(header);
  if (!match?.[1]) return fallback;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim() || fallback;
  }
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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
      : `No se pudo generar el reporte (HTTP ${status}).`;

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

export async function downloadReportFile(params: DownloadReportFileParams): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
  if (!baseUrl) {
    throw new Error("No está configurada la URL del API (VITE_API_BASE_URL).");
  }

  const url = buildUrl(baseUrl, params.path, params.format, params.query);

  const headers: Record<string, string> = {
    Accept: "*/*",
    ...clientContext.toHeaders(),
  };

  const token = tokenStore.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const timeoutMs = params.timeoutMs ?? REPORT_DOWNLOAD_TIMEOUT_MS;
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs);

  const onExternalAbort = () => timeoutController.abort();
  if (params.signal) {
    if (params.signal.aborted) {
      window.clearTimeout(timeoutId);
      throw new Error("La descarga del reporte fue cancelada.");
    }
    params.signal.addEventListener("abort", onExternalAbort, { once: true });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "omit",
      signal: timeoutController.signal,
      cache: "no-store",
    });
  } catch (e) {
    if (timeoutController.signal.aborted && !params.signal?.aborted) {
      throw new Error(
        "La generación del PDF tardó demasiado. Si usas php artisan serve, reinicia el API o usa un servidor con varios workers."
      );
    }
    throw e;
  } finally {
    window.clearTimeout(timeoutId);
    if (params.signal) {
      params.signal.removeEventListener("abort", onExternalAbort);
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data: unknown = await response.json().catch(() => null);
      throwReportApiError(response.status, data);
    }
    throw new Error(`No se pudo generar el reporte (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (params.format === "pdf" && !contentType.includes("application/pdf")) {
    if (contentType.includes("text/html")) {
      throw new Error(
        "El servidor devolvió HTML en lugar de PDF. Usa «Vista previa» para revisar el diseño y «Descargar PDF» para el archivo."
      );
    }
    throw new Error("La respuesta del servidor no es un PDF válido.");
  }

  const blob = await response.blob();
  const fallback = params.filenameFallback ?? `reporte.${params.format}`;
  const filename = parseFilenameFromDisposition(response.headers.get("Content-Disposition"), fallback);
  triggerBrowserDownload(blob, filename);
}

export async function downloadReportFileSafe(
  params: DownloadReportFileParams,
  onError: (message: string) => void
): Promise<boolean> {
  try {
    await downloadReportFile(params);
    return true;
  } catch (e) {
    onError(getApiErrorMessage(e, "No se pudo descargar el reporte."));
    return false;
  }
}
