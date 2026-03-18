export function formatCuentaConPrefijo(prefix: string, numeroCuenta: string | null | undefined): string {
  const raw = (numeroCuenta ?? "").toString().trim();
  if (!raw) return "—";
  const normalizedPrefix = String(prefix ?? "").trim();
  if (!normalizedPrefix) return raw;
  if (raw.startsWith(`${normalizedPrefix}-`)) return raw;
  return `${normalizedPrefix}-${raw}`;
}

