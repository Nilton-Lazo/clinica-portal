export const EMPTY_CELL = "—";

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "" || value.trim() === EMPTY_CELL;
  if (typeof value === "number") return !Number.isFinite(value);
  return false;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function formatIsoToDmy(iso?: string | null): string {
  if (!iso) return EMPTY_CELL;
  const s = String(iso).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return EMPTY_CELL;
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function formatTimeHm(value?: string | null): string {
  if (!value) return EMPTY_CELL;
  const parts = String(value).split(":");
  if (parts.length < 2) return String(value);
  return `${pad2(Number(parts[0]) || 0)}:${pad2(Number(parts[1]) || 0)}`;
}
