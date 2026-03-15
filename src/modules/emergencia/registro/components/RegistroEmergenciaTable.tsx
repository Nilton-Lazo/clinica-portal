import type {
  RegistroEmergencia,
  PaginatedResponse,
} from "../../types/registroEmergencia.types";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { ShieldCheck, ClipboardList } from "lucide-react";

function topicoSoloTexto(value: string): string {
  if (!value || typeof value !== "string") return value ?? "";
  const trimmed = value.trim();
  const match = trimmed.match(/^\d+\s*·\s*(.+)$/);
  return match ? match[1].trim() : trimmed;
}

function EstadoEmergenciaBadge({ value }: { value?: string | null }) {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";
  if (v === "ATENDIDO") {
    return (
      <span className={`${base} border-(--color-success) text-(--color-success)`}>
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Atendido
      </span>
    );
  }
  if (v === "REGISTRADO") {
    return (
      <span className={`${base} border-(--color-primary) text-(--color-primary)`}>
        <ClipboardList className="h-4 w-4" aria-hidden="true" />
        Registrado
      </span>
    );
  }
  return <span className="text-(--color-text-secondary) text-xs">{value}</span>;
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
      render: (x) => <EstadoEmergenciaBadge value={x.estado} />,
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
