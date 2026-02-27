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
  onFirst?: () => void;
  onLast?: () => void;
  selectedId: number | null;
  onSelect: (row: AgendaCita) => void;
  onDoubleClick?: (row: AgendaCita) => void;
}) {
  const { data, loading, onPrev, onNext, onFirst, onLast, selectedId, onSelect, onDoubleClick } = props;

  const formatHora = (value?: string | null) => {
    if (!value) return "—";
    const parts = value.split(":");
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return value;
  };

  const cellBase = "px-3 py-1.5 text-xs";
  const columns: DataTableColumn<AgendaCita>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-28 text-xs",
      cellClassName: `${cellBase} text-center tabular-nums`,
      render: (x) => x.codigo || "—",
    },
    {
      key: "hora",
      header: "Hora",
      headerClassName: "text-center w-24 text-xs",
      cellClassName: `${cellBase} text-center tabular-nums`,
      render: (x) => formatHora(x.hora),
    },
    {
      key: "h_ing",
      header: "H. Ing.",
      headerClassName: "text-center w-20 whitespace-nowrap text-xs",
      cellClassName: `${cellBase} text-center tabular-nums font-semibold`,
      render: (x) =>
        x.estado_atencion === "ATENDIDO" && x.hora_ingreso
          ? formatHora(x.hora_ingreso)
          : x.estado_atencion === "PENDIENTE"
            ? "P"
            : x.estado_atencion === "ATENDIDO"
              ? "A"
              : "—",
    },
    {
      key: "hc",
      header: "N° Historia",
      headerClassName: "text-center w-36 text-xs",
      cellClassName: `${cellBase} text-center tabular-nums`,
      render: (x) => x.hc || "—",
    },
    {
      key: "nr",
      header: "N° Referencia",
      headerClassName: "text-center w-40 text-xs",
      cellClassName: `${cellBase} text-center tabular-nums`,
      render: (x) => x.nr || "—",
    },
    {
      key: "paciente_nombre",
      header: "Paciente",
      headerClassName: "text-left min-w-[240px] text-xs",
      cellClassName: cellBase,
      render: (x) => x.paciente_nombre || "—",
    },
    {
      key: "cuenta",
      header: "Cuenta",
      headerClassName: "text-center w-32 text-xs",
      cellClassName: `${cellBase} text-center`,
      render: (x) => x.cuenta || "—",
    },
    {
      key: "iafa",
      header: "IAFA",
      headerClassName: "text-center w-44 text-xs",
      cellClassName: `${cellBase} text-center`,
      render: (x) =>
        x.iafa?.descripcion_corta ||
        x.iafa?.razon_social ||
        x.iafa?.codigo ||
        (x.iafa_id ? String(x.iafa_id) : "—"),
    },
    {
      key: "motivo",
      header: "Motivo",
      headerClassName: "text-left min-w-[180px] text-xs",
      cellClassName: cellBase,
      render: (x) => x.motivo || "—",
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-32 text-xs",
      cellClassName: `${cellBase} text-center`,
      render: (x) => (
        <div className="flex justify-center">
          <CitaAtencionBadge estado={(x.estado_atencion ?? "PENDIENTE") as CitaAtencionEstado} />
        </div>
      ),
    },
    {
      key: "observacion",
      header: "Observación",
      headerClassName: "text-left min-w-[220px] text-xs",
      cellClassName: cellBase,
      render: (x) => x.observacion || "—",
    },
  ];

  return (
    <div className="hidden h-full min-h-0 flex-1 flex-col overflow-hidden lg:flex">
      <DataTable
        rows={data.data}
        columns={columns}
        loading={loading}
        getRowId={(x) => x.id}
        selectedId={selectedId}
        onSelect={onSelect}
        onDoubleClick={onDoubleClick}
      />
      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
