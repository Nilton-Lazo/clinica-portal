import { tokenStore } from "../api/tokenStore";
import { clientContext } from "../telemetry/clientContext";
import { type ApiError, type ApiValidationErrors } from "../api/apiError";
import type { ReportFormat } from "./reportFormat";
import { buildReportRequestUrl } from "./reportRequestUrl";

const REPORT_FETCH_TIMEOUT_MS = 120_000;

export type FetchReportPdfBlobParams = {
  path: string;
  format?: ReportFormat;
  query?: Record<string, string | number | boolean | undefined | null>;
  filenameFallback?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type FetchReportPdfBlobResult = {
  blob: Blob;
  filename: string;
};

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

export async function fetchReportPdfBlob(params: FetchReportPdfBlobParams): Promise<FetchReportPdfBlobResult> {
  const token = tokenStore.get();
  if (!token) {
    throw new Error("Inicia sesión en el portal para ver el reporte.");
  }

  const format = params.format ?? "pdf";
  const url = buildReportRequestUrl(params.path, format, params.query);

  const headers: Record<string, string> = {
    Accept: "application/pdf",
    ...clientContext.toHeaders(),
    Authorization: `Bearer ${token}`,
  };

  const timeoutMs = params.timeoutMs ?? REPORT_FETCH_TIMEOUT_MS;
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs);

  const onExternalAbort = () => timeoutController.abort();
  if (params.signal) {
    if (params.signal.aborted) {
      window.clearTimeout(timeoutId);
      throw new Error("La generación del reporte fue cancelada.");
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
        "La generación del PDF tardó demasiado. Reinicie el API o use un servidor con más recursos."
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
  if (!contentType.includes("application/pdf")) {
    throw new Error("La respuesta del servidor no es un PDF válido.");
  }

  const blob = await response.blob();
  const fallback = params.filenameFallback ?? `reporte.${format}`;
  const filename = parseFilenameFromDisposition(response.headers.get("Content-Disposition"), fallback);

  return { blob, filename };
}
