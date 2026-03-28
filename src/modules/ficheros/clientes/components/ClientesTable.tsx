import type { Cliente, ClienteTipo, PaginatedResponse } from "../../types/clientes.types";
import { StatusBadge } from "../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";

function tipoLabel(t: ClienteTipo): string {
  return t === "ADMINISTRATIVO" ? "Administrativo" : "Asistencial";
}

export default function ClientesTable(props: {
  data: PaginatedResponse<Cliente>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Cliente) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-24 shrink-0",
      cellClassName: "px-3 py-2 text-center tabular-nums align-middle whitespace-nowrap w-24 max-w-24",
      render: (x) => x.codigo || "—",
    },
    {
      key: "nombre",
      header: "Cliente",
      headerClassName: "text-left min-w-0 w-[50%]",
      cellClassName: "px-3 py-2 align-top min-w-0",
      render: (x) => (
        <div className="min-w-0 wrap-anywhere">
          <div className="whitespace-normal text-(--color-text-primary)">{x.nombre || "—"}</div>
          <div className="mt-0.5 whitespace-normal text-xs text-(--color-text-secondary) wrap-anywhere">
            {tipoLabel(x.tipo)}
            {` · ${x.dni_o_ruc.length === 8 ? "DNI" : "RUC"} ${x.dni_o_ruc}`}
            {x.telefono ? ` · Tel ${x.telefono}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44 shrink-0",
      cellClassName: "px-3 py-2 text-center align-middle whitespace-nowrap w-44",
      render: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
      <DataTable
        rows={data.data}
        columns={columns}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        tableClassName="table-fixed w-full max-w-full"
      />

      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
