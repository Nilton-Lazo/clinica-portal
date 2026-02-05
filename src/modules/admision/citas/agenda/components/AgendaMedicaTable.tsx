import type { AgendaCita, AgendaCitasPaginated, CitaAtencionEstado } from "../types/agendaMedica.types";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { CitaAtencionBadge } from "./CitaAtencionBadge";

export default function AgendaMedicaTable(props: {
  data: AgendaCitasPaginated;
  loading: boolean;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  selectedId: number | null;
  onSelect: (row: AgendaCita) => void;
}) {
  const { data, loading, onPrev, onNext, selectedId, onSelect } = props;

  const formatHora = (value?: string | null) => {
    if (!value) return "—";
    const parts = value.split(":");
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return value;
  };

  const columns: DataTableColumn<AgendaCita>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.codigo || "—",
    },
    {
      key: "hora",
      header: "Hora",
      headerClassName: "text-center w-24",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => formatHora(x.hora),
    },
    {
      key: "h_ing",
      header: "H. Ing.",
      headerClassName: "text-center w-20 whitespace-nowrap",
      cellClassName: "px-3 py-2 text-center tabular-nums font-semibold",
      render: (x) => (x.estado_atencion === "PENDIENTE" ? "P" : x.estado_atencion === "ATENDIDO" ? "A" : "—"),
    },
    {
      key: "hc",
      header: "N° Historia",
      headerClassName: "text-center w-36",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.hc || "—",
    },
    {
      key: "nr",
      header: "N° Referencia",
      headerClassName: "text-center w-40",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.nr || "—",
    },
    {
      key: "paciente_nombre",
      header: "Paciente",
      headerClassName: "text-left min-w-[240px]",
      cellClassName: "px-3 py-2",
      render: (x) => x.paciente_nombre || "—",
    },
    {
      key: "cuenta",
      header: "Cuenta",
      headerClassName: "text-center w-32",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => x.cuenta || "—",
    },
    {
      key: "iafa",
      header: "IAFA",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (x) =>
        x.iafa?.descripcion_corta ||
        x.iafa?.razon_social ||
        x.iafa?.codigo ||
        (x.iafa_id ? String(x.iafa_id) : "—"),
    },
    {
      key: "motivo",
      header: "Motivo",
      headerClassName: "text-left min-w-[180px]",
      cellClassName: "px-3 py-2",
      render: (x) => x.motivo || "—",
    },
    {
      key: "observacion",
      header: "Observación",
      headerClassName: "text-left min-w-[220px]",
      cellClassName: "px-3 py-2",
      render: (x) => x.observacion || "—",
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-32",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (
        <div className="flex justify-center">
          <CitaAtencionBadge estado={(x.estado_atencion ?? "PENDIENTE") as CitaAtencionEstado} />
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
        getRowId={(x) => x.id}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
