import type { ReportFormat } from "./reportFormat";

export function getReportApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
  if (!baseUrl) {
    throw new Error("No está configurada la URL del API (VITE_API_BASE_URL).");
  }
  return baseUrl;
}

function resolveToSameOriginAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  if (typeof window === "undefined") {
    return url;
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${window.location.origin}${path}`;
}

export function buildReportRequestUrl(
  path: string,
  format: ReportFormat,
  query?: Record<string, string | number | boolean | undefined | null>,
  options?: { absolute?: boolean }
): string {
  const baseUrl = getReportApiBaseUrl();
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams();
  params.set("format", format);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
  }
  const relative = `${normalizedBase}${normalizedPath}?${params.toString()}`;
  if (options?.absolute ?? normalizedBase.startsWith("/")) {
    return resolveToSameOriginAbsoluteUrl(relative);
  }
  return relative;
}
