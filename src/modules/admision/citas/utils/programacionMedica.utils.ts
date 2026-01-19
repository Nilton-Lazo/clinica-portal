export function padCodigoFromId(id: number, width = 3): string {
  const n = Number.isFinite(id) ? Math.max(0, Math.trunc(id)) : 0;
  const s = String(n);
  if (s.length >= width) return s;
  return `${"0".repeat(width - s.length)}${s}`;
}

export function coerceYmdFromApiDate(s: string): string {
  const v = String(s ?? "").trim();
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
  return m ? m[1] : v;
}

export function ymdFromDate(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatDmyFromDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

export function dmyFromYmdString(s: string): string {
  const v = coerceYmdFromApiDate(s);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return v;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function sortDates(xs: Date[]): Date[] {
  return [...xs].sort((a, b) => a.getTime() - b.getTime());
}

export function uniqueDates(xs: Date[]): Date[] {
  const out: Date[] = [];
  xs.forEach((d) => {
    if (!out.some((x) => sameDay(x, d))) out.push(d);
  });
  return out;
}

export function summarizeCodes(nextId: number, count: number): { codes: string[]; display: string } {
  const n = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  const start = Number.isFinite(nextId) ? Math.max(0, Math.trunc(nextId)) : 0;
  const codes = Array.from({ length: n }, (_, i) => padCodigoFromId(start + i));

  if (n === 0) return { codes, display: "—" };
  if (n <= 3) return { codes, display: codes.join(", ") };

  const first = codes.slice(0, 3).join(", ");
  return { codes, display: `${first} (+${n - 3})` };
}
