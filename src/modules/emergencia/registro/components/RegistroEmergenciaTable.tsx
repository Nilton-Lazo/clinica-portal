import type {
  RegistroEmergencia,
  PaginatedResponse,
} from "../../types/registroEmergencia.types";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { AtencionEstadoBadge } from "../../../../shared/ui/AtencionEstadoBadge";

function topicoSoloTexto(value: string): string {
  if (!value || typeof value !== "string") return value ?? "";
  const trimmed = value.trim();
  const match = trimmed.match(/^\d+\s*·\s*(.+)$/);
  return match ? match[1].trim() : trimmed;
}

export default function RegistroEmergenciaTable(props: {
  data: PaginatedResponse<RegistroEmergencia>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: RegistroEmergencia) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;

  const centerClass = "text-center align-middle";
  const columns: DataTableColumn<RegistroEmergencia>[] = [
    {
      key: "orden",
      header: "Orden",
      headerClassName: `${centerClass} w-20`,
      cellClassName: "px-3 py-2 tabular-nums align-middle text-center",
      render: (x) => x.orden,
    },
    {
      key: "hora",
      header: "Hora",
      headerClassName: `${centerClass} w-20`,
      cellClassName: "px-3 py-2 tabular-nums align-middle text-center",
      render: (x) => x.hora,
    },
    {
      key: "numero_hc",
      header: "N° Historia",
      headerClassName: `${centerClass} w-28 whitespace-nowrap`,
      cellClassName: "px-3 py-2 tabular-nums align-middle text-center",
      render: (x) => x.numero_hc,
    },
    {
      key: "numero_cuenta",
      header: "N° Cuenta",
      headerClassName: `${centerClass} w-28 whitespace-nowrap`,
      cellClassName: "px-3 py-2 tabular-nums align-middle text-center",
      render: (x) => x.numero_cuenta ?? "—",
    },
    {
      key: "apellidos_nombres",
      header: "Paciente",
      headerClassName: "text-left align-middle",
      cellClassName: "px-3 py-2 align-middle text-left",
      render: (x) => (
        <div className="flex flex-col">
          <span className="font-medium text-(--color-text-primary)">{x.apellidos_nombres}</span>
        </div>
      ),
    },
    {
      key: "sexo",
      header: "Sexo",
      headerClassName: `${centerClass} w-24`,
      cellClassName: "px-3 py-2 align-middle text-center",
      render: (x) => x.sexo,
    },
    {
      key: "topico",
      header: "Tópico",
      headerClassName: `${centerClass} min-w-[11rem] w-40`,
      cellClassName: "px-3 py-2 align-middle text-center text-(--color-text-primary) whitespace-nowrap",
      render: (x) => topicoSoloTexto(x.topico ?? ""),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: `${centerClass} w-32`,
      cellClassName: "px-3 py-2 align-middle text-center",
      render: (x) => <AtencionEstadoBadge value={x.estado} />,
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
        emptyText="No hay registros de emergencia."
      />
      <PaginationFooter
        meta={data.meta}
        variant="desktop"
        onPrev={onPrev}
        onNext={onNext}
        onFirst={onFirst}
        onLast={onLast}
      />
    </div>
  );
}
