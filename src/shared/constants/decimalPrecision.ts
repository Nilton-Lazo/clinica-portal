/**
 * Precisión decimal estándar para precio y unidad de servicios (enterprise).
 * Usar en formularios, tablas y cálculos para mantener coherencia.
 */
export const PRECISION_DECIMAL = 4;

export function formatPrecioUnidad(value: string | number | null | undefined): string {
  const n = value === null || value === undefined ? NaN : Number(value);
  return Number.isFinite(n) ? n.toFixed(PRECISION_DECIMAL) : "—";
}

/**
 * Redondea un número a la precisión decimal estándar (4 decimales).
 * Útil para normalizar valores antes de guardar o calcular.
 */
export function roundToPrecision(value: number, decimals: number = PRECISION_DECIMAL): number {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * Formato compacto para mostrar números con hasta 4 decimales:
 * - Quita solo ceros finales: 100.000 → "100", 54.6700 → "54.67".
 * - Mantiene ceros significativos: 54.0806 → "54.0806".
 * - No trunca: 77.7242 se muestra como "77.7242".
 * Se redondea internamente a maxDecimals para evitar ruido de punto flotante.
 */
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
