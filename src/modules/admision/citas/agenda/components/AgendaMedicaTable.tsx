import * as React from "react";
import { createPortal } from "react-dom";
import type { AgendaCita, AgendaCitasPaginated, CitaAtencionEstado } from "../types/agendaMedica.types";
import { CrudListGrid } from "../../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../../shared/datagrid";
import { GridCellText } from "../../../../../shared/datagrid";
import { CitaAtencionBadge } from "./CitaAtencionBadge";

export default function AgendaMedicaTable(props: {
  data: AgendaCitasPaginated;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  selectedId: number | null;
  onSelect: (row: AgendaCita) => void;
  onDoubleClick?: (row: AgendaCita) => void;
  onRequestEliminar?: (row: AgendaCita) => void;
  onRefresh?: () => void;
  sort?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (columnId: string) => void;
}) {
  const {
    data,
    loading,
    onPrev,
    onNext,
    onFirst,
    onLast,
    selectedId,
    onSelect,
    onDoubleClick,
    onRequestEliminar,
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
  } = props;
  const [contextMenu, setContextMenu] = React.useState<{ row: AgendaCita; x: number; y: number } | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleContextMenu = React.useCallback(
    (row: AgendaCita, e: React.MouseEvent) => {
      e.preventDefault();
      if (onRequestEliminar) setContextMenu({ row, x: e.clientX, y: e.clientY });
    },
    [onRequestEliminar]
  );

  React.useEffect(() => {
    if (!contextMenu) return;
    const close = (e?: MouseEvent) => {
      if (e && menuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("click", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  const handleEliminar = React.useCallback(() => {
    if (contextMenu && onRequestEliminar) {
      onRequestEliminar(contextMenu.row);
      setContextMenu(null);
    }
  }, [contextMenu, onRequestEliminar]);

  const formatHora = (value?: string | null) => {
    if (!value) return "—";
    const parts = value.split(":");
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return value;
  };

  const columns: DataGridColumnDef<AgendaCita>[] = [
    {
      id: "codigo",
      header: "Código",
      sortable: true,
      align: "center",
      size: 90,
      exportValue: (x) => x.codigo ?? "",
      cell: (x) => <span className="tabular-nums text-xs">{x.codigo || "—"}</span>,
    },
    {
      id: "hora",
      header: "Hora",
      sortable: true,
      align: "center",
      size: 80,
      exportValue: (x) => formatHora(x.hora),
      cell: (x) => <span className="tabular-nums text-xs">{formatHora(x.hora)}</span>,
    },
    {
      id: "h_ing",
      header: "H. Ing.",
      align: "center",
      size: 70,
      cell: (x) => (
        <span className="tabular-nums text-xs font-semibold">
          {x.estado_atencion === "ATENDIDO" && x.hora_ingreso
            ? formatHora(x.hora_ingreso)
            : x.estado_atencion === "PENDIENTE"
              ? "P"
              : x.estado_atencion === "ATENDIDO"
                ? "A"
                : "—"}
        </span>
      ),
    },
    {
      id: "hc",
      header: "N° Historia",
      sortable: true,
      align: "center",
      size: 110,
      exportValue: (x) => x.hc ?? "",
      cell: (x) => <span className="tabular-nums text-xs">{x.hc || "—"}</span>,
    },
    {
      id: "nr",
      header: "N° Referencia",
      sortable: true,
      align: "center",
      size: 110,
      exportValue: (x) => x.nr ?? "",
      cell: (x) => <span className="tabular-nums text-xs">{x.nr || "—"}</span>,
    },
    {
      id: "paciente_nombre",
      header: "Paciente",
      sortable: true,
      align: "left",
      size: 150,
      minSize: 120,
      exportValue: (x) => x.paciente_nombre ?? "",
      cell: (x) => (
        <GridCellText
          value={x.paciente_nombre || "—"}
          title={x.paciente_nombre ?? undefined}
          className="text-xs"
        />
      ),
    },
    {
      id: "cuenta",
      header: "Cuenta",
      sortable: true,
      align: "center",
      size: 90,
      exportValue: (x) => x.cuenta ?? "",
      cell: (x) => <span className="text-xs">{x.cuenta || "—"}</span>,
    },
    {
      id: "iafa",
      header: "IAFA",
      align: "center",
      size: 150,
      exportValue: (x) =>
        x.iafa?.descripcion_corta || x.iafa?.razon_social || x.iafa?.codigo || (x.iafa_id ? String(x.iafa_id) : ""),
      cell: (x) => (
        <span className="text-xs">
          {x.iafa?.descripcion_corta ||
            x.iafa?.razon_social ||
            x.iafa?.codigo ||
            (x.iafa_id ? String(x.iafa_id) : "—")}
        </span>
      ),
    },
    {
      id: "motivo",
      header: "Motivo",
      sortable: true,
      align: "left",
      size: 130,
      minSize: 100,
      exportValue: (x) => x.motivo ?? "",
      cell: (x) => (
        <GridCellText value={x.motivo || "—"} title={x.motivo ?? undefined} className="text-xs" />
      ),
    },
    {
      id: "estado",
      header: "Estado",
      sortable: true,
      align: "center",
      size: 110,
      exportValue: (x) => x.estado_atencion ?? "",
      cell: (x) => (
        <div className="flex justify-center">
          <CitaAtencionBadge estado={(x.estado_atencion ?? "PENDIENTE") as CitaAtencionEstado} />
        </div>
      ),
    },
    {
      id: "observacion",
      header: "Observación",
      align: "left",
      grow: true,
      exportValue: (x) => x.observacion ?? "",
      cell: (x) => (
        <GridCellText value={x.observacion || "—"} title={x.observacion ?? undefined} className="text-xs" />
      ),
    },
  ];

  return (
    <>
      <CrudListGrid
        rows={data.data}
        columns={columns}
        loading={loading}
        meta={data.meta}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        onDoubleClick={onDoubleClick}
        onContextMenu={onRequestEliminar ? handleContextMenu : undefined}
        onPrev={onPrev}
        onNext={onNext}
        onFirst={onFirst}
        onLast={onLast}
        onRefresh={onRefresh}
        sort={sort}
        sortDir={sortDir}
        onToggleSort={onToggleSort}
        exportFilename="agenda-medica"
        className="h-full"
      />
      {contextMenu
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-50 min-w-[120px] rounded-lg border border-(--border-color-default) bg-(--color-surface) py-1 shadow-lg"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="mx-1 w-[calc(100%-0.5rem)] rounded-md px-3 py-1.5 text-left text-xs font-medium text-(--color-danger) transition-colors hover:bg-(--color-surface-hover) focus:bg-(--color-surface-hover) focus:outline-none"
                onClick={handleEliminar}
              >
                Eliminar
              </button>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
