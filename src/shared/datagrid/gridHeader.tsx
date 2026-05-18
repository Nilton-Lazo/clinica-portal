import type { ReactNode } from "react";
import type { DataGridColumnDef } from "./types";

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

function headerTextAlign(align?: "left" | "center" | "right") {
  if (align === "left") return "text-left";
  if (align === "right") return "text-right";
  return "text-center";
}

export function GridHeaderLabel(props: {
  text: string;
  align?: "left" | "center" | "right";
}) {
  const { text, align = "center" } = props;
  const parts = text.trim().split(/\s+/).filter(Boolean);
  const hAlign = headerTextAlign(align);

  if (parts.length === 0) {
    return <span className="block w-full">&nbsp;</span>;
  }

  if (parts.length === 1) {
    return (
      <span className={`block w-full whitespace-normal leading-[1.15] ${hAlign}`}>{parts[0]}</span>
    );
  }

  if (parts.length === 2) {
    return (
      <span className={`flex w-full flex-col justify-center gap-0 leading-[1.15] ${hAlign}`}>
        <span className="block whitespace-normal">{parts[0]}</span>
        <span className="block whitespace-normal">{parts[1]}</span>
      </span>
    );
  }

  const mid = Math.ceil(parts.length / 2);
  const line1 = parts.slice(0, mid).join(" ");
  const line2 = parts.slice(mid).join(" ");

  return (
    <span className={`flex w-full flex-col justify-center gap-0 leading-[1.15] ${hAlign}`}>
      <span className="block whitespace-normal">{line1}</span>
      <span className="block whitespace-normal">{line2}</span>
    </span>
  );
}

export function renderGridHeader<T>(col: DataGridColumnDef<T>): ReactNode {
  if (typeof col.header !== "string") return col.header;
  if (!col.header.trim()) return "\u00a0";
  return <GridHeaderLabel text={col.header} align={col.align ?? "center"} />;
}
