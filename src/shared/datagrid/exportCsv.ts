import type { DataGridColumnDef } from "./types";

function escapeCsvCell(value: string): string {
  if (/[",\n\r;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function normalizeExported(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function getRowExportValue<T>(row: T, col: DataGridColumnDef<T>): string {
  if (col.exportValue) {
    return normalizeExported(col.exportValue(row));
  }
  if (col.accessor) {
    return normalizeExported((row as Record<string, unknown>)[col.accessor as string]);
  }
  if (col.sortValue) {
    return normalizeExported(col.sortValue(row));
  }
  const raw = (row as Record<string, unknown>)[col.id];
  return normalizeExported(raw);
}

function getColumnHeaderLabel<T>(col: DataGridColumnDef<T>): string {
  if (col.columnLabel) return col.columnLabel;
  if (typeof col.header === "string") return col.header;
  return col.id;
}

export function exportRowsToCsv<T>(
  rows: T[],
  columns: DataGridColumnDef<T>[],
  filename: string
): void {
  const exportable = columns.filter((c) => c.id !== "actions" && c.id !== "_actions");
  const headers = exportable.map(getColumnHeaderLabel);

  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      exportable.map((col) => escapeCsvCell(getRowExportValue(row, col))).join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
