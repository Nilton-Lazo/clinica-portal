import type { PacienteListItem, PaginatedResponse } from "../types/historiaClinica.types";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";

function formatDMY(iso?: string | null): string {
  if (!iso) return "—";
  const s = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-");
  return `${d}-${m}-${y}`;
}

function labelize(v?: string | null): string {
  if (!v) return "—";
  const x = v.replace(/_/g, " ").toLowerCase();
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export default function HistoriaClinicaTable(props: {
  data: PaginatedResponse<PacienteListItem>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: PacienteListItem) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext } = props;

  const columns: DataTableColumn<PacienteListItem>[] = [
    {
      key: "hc",
      header: "N° Historia",
      headerClassName: "text-center w-40",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.hc || "—",
    },
    {
      key: "nombre_completo",
      header: "Apellidos y nombres",
      headerClassName: "text-left min-w-[260px]",
      cellClassName: "px-3 py-2",
      render: (x) => (x.nombre_completo?.trim() ? x.nombre_completo : "—"),
    },
    {
      key: "condicion",
      header: "Condición",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => labelize(x.parentesco_seguro),
    },
    {
      key: "nr",
      header: "N° Referencia",
      headerClassName: "text-center w-40",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => (x.nr ? x.nr : "—"),
    },
    {
      key: "sexo",
      header: "Sexo",
      headerClassName: "text-center w-32",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => labelize(x.sexo),
    },
    {
      key: "fecha_nacimiento",
      header: "F. nacimiento",
      headerClassName: "text-center w-40",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => formatDMY(x.fecha_nacimiento),
    },
    {
      key: "created_at",
      header: "F. filiación",
      headerClassName: "text-center w-40",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => formatDMY(x.created_at),
    },
    {
      key: "updated_at",
      header: "F. actualización",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => formatDMY(x.updated_at),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="hidden h-full min-h-0 flex-col lg:flex">
      <DataTable
        rows={data.data}
        columns={columns}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
      />

      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
