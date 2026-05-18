import type { ReactNode } from "react";
import type { RecordStatus } from "../../../shared/types/recordStatus";
import { StatusBadge } from "../components/StatusBadge";
import { GridCellText, type DataGridColumnDef } from "../../../shared/datagrid";

export function ficherosCodigoColumn<T extends { codigo: string }>(): DataGridColumnDef<T> {
  return {
    id: "codigo",
    header: "Código",
    accessor: "codigo",
    sortable: true,
    align: "center",
    size: 100,
    exportValue: (row) => row.codigo,
  };
}

export function ficherosDescripcionColumn<T extends { descripcion: string }>(): DataGridColumnDef<T> {
  return {
    id: "descripcion",
    header: "Descripción",
    sortable: true,
    align: "left",
    grow: true,
    exportValue: (row) => row.descripcion,
    cell: (row) => (
      <GridCellText value={row.descripcion || "—"} title={row.descripcion || undefined} />
    ),
  };
}

export function ficherosEstadoColumn<T extends { estado: RecordStatus }>(): DataGridColumnDef<T> {
  return {
    id: "estado",
    header: "Estado",
    sortable: true,
    align: "center",
    size: 150,
    exportValue: (row) => row.estado,
    cell: (row) => (
      <div className="flex justify-center">
        <StatusBadge status={row.estado} />
      </div>
    ),
  };
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
  return {
    id: opts.id,
    header: opts.header,
    sortable: opts.sortable ?? true,
    align: "left",
    grow: true,
    exportValue: opts.exportValue,
    cell: opts.cell,
  };
}
