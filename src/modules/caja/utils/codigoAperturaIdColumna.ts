export function codigoAperturaIdColumna(raw: string): string {
  const t = String(raw).replace(/^0+/, "");
  return t === "" ? "0" : t;
}
