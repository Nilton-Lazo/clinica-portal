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
 * Formato compacto para mostrar cantidades con decimales: quita ceros finales.
 * 150.0000 → "150", 141.6200 → "141.62", 103.0508 → "103.0508"
 * Sin impacto en cálculos; solo para presentación en tablas e inputs de solo lectura.
 */
export function formatDecimalDisplay(
  value: number | null | undefined,
  maxDecimals: number = PRECISION_DECIMAL
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const s = value.toFixed(maxDecimals);
  return s.replace(/\.?0+$/, "");
}
