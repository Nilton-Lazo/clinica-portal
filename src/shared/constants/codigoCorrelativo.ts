const ENV_MIN = Number(import.meta.env.VITE_CODIGO_CORRELATIVO_MIN_DIGITS);
const ENV_MAX = Number(import.meta.env.VITE_CODIGO_CORRELATIVO_MAX_DIGITS);

export const CODIGO_CORRELATIVO_MIN_DIGITS_DEFAULT = 3;
export const CODIGO_CORRELATIVO_MAX_DIGITS_DEFAULT = 10;

let cachedMinDigits: number | null = Number.isFinite(ENV_MIN) && ENV_MIN > 0 ? ENV_MIN : null;
let cachedMaxDigits: number | null = Number.isFinite(ENV_MAX) && ENV_MAX > 0 ? ENV_MAX : null;

export type CodigoCorrelativoConfig = {
  correlativo_min_digits: number;
  correlativo_max_digits: number;
};

export function applyCodigoCorrelativoConfig(config: CodigoCorrelativoConfig): void {
  if (config.correlativo_min_digits > 0) {
    cachedMinDigits = config.correlativo_min_digits;
  }
  if (config.correlativo_max_digits > 0) {
    cachedMaxDigits = config.correlativo_max_digits;
  }
}

export function getCodigoCorrelativoMinDigits(): number {
  return cachedMinDigits ?? CODIGO_CORRELATIVO_MIN_DIGITS_DEFAULT;
}

export function getCodigoCorrelativoMaxDigits(): number {
  return cachedMaxDigits ?? CODIGO_CORRELATIVO_MAX_DIGITS_DEFAULT;
}

export function formatCodigoCorrelativo(value: string | number): string {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) return raw;

  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return raw;

  const min = getCodigoCorrelativoMinDigits();
  const width = Math.max(min, String(Math.trunc(n)).length);

  return String(Math.trunc(n)).padStart(width, "0");
}

export function parseCodigoCorrelativo(value: string): number {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) return 0;
  return Math.max(0, Number(raw));
}
