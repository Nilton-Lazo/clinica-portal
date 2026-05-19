import type { ReactNode } from "react";
import type { RecordStatus } from "../../../shared/types/recordStatus";
import { StatusBadge } from "../components/StatusBadge";
import { type DataGridColumnDef } from "../../../shared/datagrid";
import { badgeColumn, codeColumn, textColumn } from "../../../shared/datatable";

export function ficherosCodigoColumn<T extends { codigo: string }>(): DataGridColumnDef<T> {
  return codeColumn<T>({
    id: "codigo",
    header: "Código",
    accessor: "codigo",
    sortable: true,
    size: 100,
    exportValue: (row) => row.codigo,
  });
}

export function ficherosDescripcionColumn<T extends { descripcion: string }>(): DataGridColumnDef<T> {
  return textColumn<T>({
    id: "descripcion",
    header: "Descripción",
    sortable: true,
    grow: true,
    exportValue: (row) => row.descripcion,
    cell: (row) => row.descripcion || "—",
    title: (row) => row.descripcion || undefined,
  });
}

export function ficherosEstadoColumn<T extends { estado: RecordStatus }>(): DataGridColumnDef<T> {
  return badgeColumn<T>({
    id: "estado",
    header: "Estado",
    sortable: true,
    size: 150,
    exportValue: (row) => row.estado,
    render: (row) => <StatusBadge status={row.estado} />,
  });
}

export function ficherosCodigoDescripcionEstadoColumns<
  T extends { codigo: string; descripcion: string; estado: RecordStatus },
>(): DataGridColumnDef<T>[] {
  return [ficherosCodigoColumn<T>(), ficherosDescripcionColumn<T>(), ficherosEstadoColumn<T>()];
}

export function ficherosMainColumn<T>(opts: {
  id: string;
  header: string;
  sortable?: boolean;
  cell: (row: T) => ReactNode;
  exportValue?: (row: T) => string;
}): DataGridColumnDef<T> {
  return textColumn<T>({
    id: opts.id,
    header: opts.header,
    sortable: opts.sortable ?? true,
    grow: true,
    exportValue: opts.exportValue,
    cell: opts.cell,
  });
}
