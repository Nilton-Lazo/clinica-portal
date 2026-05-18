import type { RegistroEmergencia, PaginatedResponse } from "../../types/registroEmergencia.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
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
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  onRefresh?: () => void;
  sort?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (columnId: string) => void;
}) {
  const {
    data,
    loading,
    selectedId,
    onSelect,
    onPrev,
    onNext,
    onFirst,
    onLast,
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
  } = props;

  const columns: DataGridColumnDef<RegistroEmergencia>[] = [
    {
      id: "orden",
      header: "Orden",
      sortable: true,
      align: "center",
      size: 80,
      exportValue: (x) => String(x.orden),
      cell: (x) => <span className="tabular-nums">{x.orden}</span>,
    },
    {
      id: "hora",
      header: "Hora",
      sortable: true,
      align: "center",
      size: 80,
      exportValue: (x) => x.hora,
      cell: (x) => <span className="tabular-nums">{x.hora}</span>,
    },
    {
      id: "numero_hc",
      header: "N° Historia",
      sortable: true,
      align: "center",
      size: 110,
      exportValue: (x) => x.numero_hc,
      cell: (x) => <span className="tabular-nums">{x.numero_hc}</span>,
    },
    {
      id: "numero_cuenta",
      header: "N° Cuenta",
      sortable: true,
      align: "center",
      size: 110,
      exportValue: (x) => x.numero_cuenta ?? "",
      cell: (x) => <span className="tabular-nums">{x.numero_cuenta ?? "—"}</span>,
    },
    {
      id: "apellidos_nombres",
      header: "Paciente",
      sortable: true,
      align: "left",
      grow: true,
      exportValue: (x) => x.apellidos_nombres,
      cell: (x) => (
        <span className="font-medium text-(--color-text-primary) whitespace-normal wrap-anywhere">
          {x.apellidos_nombres}
        </span>
      ),
    },
    {
      id: "sexo",
      header: "Sexo",
      sortable: true,
      align: "center",
      size: 90,
      exportValue: (x) => x.sexo,
      cell: (x) => x.sexo,
    },
    {
      id: "topico",
      header: "Tópico",
      sortable: true,
      align: "center",
      size: 150,
      exportValue: (x) => topicoSoloTexto(x.topico ?? ""),
      cell: (x) => (
        <span className="whitespace-nowrap text-(--color-text-primary)">{topicoSoloTexto(x.topico ?? "")}</span>
      ),
    },
    {
      id: "estado",
      header: "Estado",
      sortable: true,
      align: "center",
      size: 130,
      exportValue: (x) => x.estado,
      cell: (x) => <AtencionEstadoBadge value={x.estado} />,
    },
  ];

  return (
    <CrudListGrid
      rows={data.data}
      columns={columns}
      loading={loading}
      meta={data.meta}
      selectedId={selectedId}
      getRowId={(x) => x.id}
      onSelect={onSelect}
      onPrev={onPrev}
      onNext={onNext}
      onFirst={onFirst}
      onLast={onLast}
      onRefresh={onRefresh}
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      exportFilename="registro-emergencia"
      emptyText="No hay registros de emergencia."
    />
  );
}
