import {
  formatCodigoCorrelativo,
  parseCodigoCorrelativo,
} from "../constants/codigoCorrelativo";

export function formatSequentialNumericCode(sequence: number, minWidth?: number): string {
  if (minWidth !== undefined) {
    const safe = Number.isFinite(sequence) ? Math.max(1, Math.trunc(sequence)) : 1;
    const width = Math.max(minWidth, String(safe).length);
    return String(safe).padStart(width, "0");
  }

  return formatCodigoCorrelativo(sequence);
}

export function parseSequentialNumericCode(codigo: string): number {
  return parseCodigoCorrelativo(codigo);
}
