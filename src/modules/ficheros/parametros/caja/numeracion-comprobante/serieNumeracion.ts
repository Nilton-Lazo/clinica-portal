import {
  formatCodigoCorrelativo,
  getCodigoCorrelativoMinDigits,
} from "../../../../../shared/constants/codigoCorrelativo";

export function getSerieNumeracionMaxDigits(): number {
  return getCodigoCorrelativoMinDigits();
}

export function parseSerieNumeracionInput(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, getSerieNumeracionMaxDigits());
}

export function formatSerieNumeracion(value: string): string {
  const digits = parseSerieNumeracionInput(value);
  if (!digits) return "";
  return formatCodigoCorrelativo(digits);
}

export function isValidSerieNumeracion(value: string): boolean {
  const digits = parseSerieNumeracionInput(value);
  return digits.length >= 1 && digits.length <= getSerieNumeracionMaxDigits();
}

export function serieNumeracionFromStored(stored: string): string {
  const digits = parseSerieNumeracionInput(stored);
  if (!digits) return "";
  return formatSerieNumeracion(digits);
}
