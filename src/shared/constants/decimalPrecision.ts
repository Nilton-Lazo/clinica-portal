/**
 * Precisión decimal estándar para precio y unidad de servicios (enterprise).
 * Usar en formularios, tablas y cálculos para mantener coherencia.
 */
export const PRECISION_DECIMAL = 4;

export function formatPrecioUnidad(value: string | number | null | undefined): string {
  const n = value === null || value === undefined ? NaN : Number(value);
  return Number.isFinite(n) ? n.toFixed(PRECISION_DECIMAL) : "—";
}
