import type { ReactNode } from "react";

const COLUMN_LABEL_OVERRIDES: Record<string, string> = {
  precio_con_igv: "Precio con IGV",
  precio_sin_igv: "Precio sin IGV",
  cop_var: "Copago variable",
  cop_fijo: "Copago fijo",
  nro_cuenta: "N° Cuenta",
  num_comprobante: "N° Comp.",
  tipo_documento: "Tipo Comp.",
  tipo_origen: "Tipo",
  pago_fracc: "Pago Frac.",
  usuario_elimina: "U. Elimina",
  medico: "Médico",
};

function capitalizeWord(word: string): string {
  const lower = word.toLowerCase();
  if (lower === "igv" || lower === "iafa" || lower === "nr" || lower === "hc") return lower.toUpperCase();
  if (lower === "de" || lower === "del" || lower === "la" || lower === "el" || lower === "y") return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function humanizeColumnId(id: string): string {
  const key = id.trim();
  if (!key) return "";
  if (COLUMN_LABEL_OVERRIDES[key]) return COLUMN_LABEL_OVERRIDES[key]!;
  return key
    .split("_")
    .filter(Boolean)
    .map(capitalizeWord)
    .join(" ");
}

export function getColumnDisplayLabel(col: {
  id: string;
  header: ReactNode;
  columnLabel?: string;
}): string {
  if (col.id === "actions" || col.id === "check") return "";
  const explicit = col.columnLabel?.trim();
  if (explicit) return explicit;
  if (typeof col.header === "string") {
    const text = col.header.trim();
    if (text) return text;
  }
  return humanizeColumnId(col.id);
}

export function getColumnDisplayLabelFromTable(col: {
  key: string;
  header: ReactNode;
  columnLabel?: string;
}): string {
  return getColumnDisplayLabel({ id: col.key, header: col.header, columnLabel: col.columnLabel });
}
