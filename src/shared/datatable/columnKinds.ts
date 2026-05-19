import type { DataGridColumnDef } from "../datagrid/types";

export type ColumnAlign = "left" | "center" | "right";

export type ColumnKind =
  | "text"
  | "code"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "time"
  | "datetime"
  | "badge"
  | "actions"
  | "selection"
  | "custom";

export function defaultAlignForKind(kind: ColumnKind): ColumnAlign {
  switch (kind) {
    case "number":
    case "currency":
    case "percent":
      return "right";
    case "code":
    case "date":
    case "time":
    case "datetime":
    case "badge":
    case "actions":
    case "selection":
      return "center";
    case "text":
    case "custom":
    default:
      return "left";
  }
}

export function isUtilityColumn(columnId: string): boolean {
  return columnId === "actions" || columnId === "check" || columnId === "_actions";
}

export function applyDefaultAlignment<T>(
  col: DataGridColumnDef<T>,
  kind: ColumnKind
): DataGridColumnDef<T> {
  if (col.align) return col;
  return { ...col, align: defaultAlignForKind(kind) };
}
