export const PRECISION_DECIMAL = 4;

export function formatPrecioUnidad(value: string | number | null | undefined): string {
  const n = value === null || value === undefined ? NaN : Number(value);
  return Number.isFinite(n) ? n.toFixed(PRECISION_DECIMAL) : "—";
}

export function roundToPrecision(value: number, decimals: number = PRECISION_DECIMAL): number {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function parseDecimalInput(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (t === "" || t === "." || t === "-") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function formatDecimalDisplay(
  value: number | null | undefined,
  maxDecimals: number = PRECISION_DECIMAL
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const f = 10 ** maxDecimals;
  const rounded = Math.round(Number(value) * f) / f;
  const s = rounded.toFixed(maxDecimals);
  return s.replace(/\.?0+$/, "");
}

export function formatDecimalFixed(
  value: number | null | undefined,
  decimals: number
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const f = 10 ** decimals;
  const rounded = Math.round(Number(value) * f) / f;
  return rounded.toFixed(decimals);
}
