import * as React from "react";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { SecondaryButton } from "../../../../shared/ui/buttons";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";
import { listMedicos } from "../../../ficheros/services/medicos.service";
import type { Medico } from "../../../ficheros/types/medicos.types";
import type { PaginatedResponse } from "../../../../shared/types/pagination";
import type { RecordStatus } from "../../../../shared/types/recordStatus";

type Variant = "drawer" | "fullscreen";

type Props = {
  open: boolean;
  variant: Variant;
  onClose: () => void;
  onPicked: (medico: Medico) => void;
  title?: string;
  description?: string;
  showRegisterButton?: boolean;
  onRegister?: () => void;
  onOpenMedicos?: () => void;
};

const statusOptions: SelectOption[] = [
  { value: "", label: "Todos" },
  { value: "ACTIVO", label: "Activos" },
  { value: "INACTIVO", label: "Inactivos" },
  { value: "SUSPENDIDO", label: "Suspendidos" },
];

const INITIAL_PAGE = 1;
const INITIAL_PER_PAGE = 25;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function medicoLabel(m: Medico): string {
  if (m.nombre_completo?.trim()) return m.nombre_completo.trim();
  return [m.apellido_paterno, m.apellido_materno, m.nombres].filter(Boolean).join(" ").trim();
}

const columns: DataTableColumn<Medico>[] = [
  {
    key: "cmp",
    header: "CMP",
    headerClassName: "text-center w-36",
    cellClassName: "px-3 py-2 text-center tabular-nums",
    render: (x) => x.cmp ?? "—",
  },
  {
    key: "nombre",
    header: "Apellidos y nombres",
    headerClassName: "text-left min-w-0",
    cellClassName: "px-3 py-2",
    render: (x) => medicoLabel(x),
  },
  {
    key: "estado",
    header: "Estado",
    headerClassName: "text-center w-32",
    cellClassName: "px-3 py-2 text-center",
    render: (x) => (
      <div className="flex justify-center">
        <StatusBadge status={x.estado as RecordStatus} />
      </div>
    ),
  },
];

export default function MedicoPicker(props: Props) {
  const {
    open,
    variant,
    onClose,
    onPicked,
    title = "Seleccionar médico",
    description = "Busca y selecciona el médico (clic en la fila).",
    showRegisterButton = true,
    onRegister,
    onOpenMedicos,
  } = props;

  const [search, setSearch] = React.useState("");
  const q = useDebouncedValue(search, 300);
  const [status, setStatus] = React.useState<string>("");
  const [page, setPage] = React.useState(INITIAL_PAGE);
  const [perPage] = React.useState(INITIAL_PER_PAGE);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<PaginatedResponse<Medico>>({
    data: [],
    meta: { current_page: INITIAL_PAGE, per_page: INITIAL_PER_PAGE, total: 0, last_page: 1 },
  });
  const [selected, setSelected] = React.useState<Medico | null>(null);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const requestId = ++requestIdRef.current;
    const query: { q: string; page: number; per_page: number; status?: RecordStatus } = {
      q,
      page,
      per_page: perPage,
    };
    if (status && ["ACTIVO", "INACTIVO", "SUSPENDIDO"].includes(status)) {
      query.status = status as RecordStatus;
    }
    listMedicos(query)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setData(res);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [open, q, status, page, perPage]);

  React.useEffect(() => {
    setPage(INITIAL_PAGE);
  }, [q, status]);

  const handleRowSelect = React.useCallback(
    (m: Medico) => {
      setSelected(m);
      onPicked(m);
      onClose();
    },
    [onPicked, onClose]
  );

  const onPrev = React.useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const onNext = React.useCallback(() => setPage((p) => Math.min(data.meta.last_page, p + 1)), [data.meta.last_page]);
  const onFirst = React.useCallback(() => setPage(1), []);
  const onLast = React.useCallback(() => setPage(data.meta.last_page), [data.meta.last_page]);

  const container = (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-(--color-text-primary)">{title}</div>
            <div className="text-xs text-(--color-text-secondary)">{description}</div>
            {onOpenMedicos ? (
              <button
                type="button"
                onClick={onOpenMedicos}
                className="self-start text-xs font-medium text-(--color-primary) hover:underline"
              >
                Editar datos en Médicos
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {showRegisterButton && onRegister ? (
              <SecondaryButton onClick={onRegister}>Registrar médico</SecondaryButton>
            ) : null}
            <SecondaryButton type="button" onClick={onClose}>
              Cerrar
            </SecondaryButton>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="text-sm text-(--color-text-primary)">Buscar</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="CMP, apellidos o nombre"
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)"
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="text-sm text-(--color-text-primary)">Estado</label>
            <div className="mt-1">
              <SelectMenu
                value={status}
                onChange={(v) => setStatus(v ?? "")}
                options={statusOptions}
                ariaLabel="Estado"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex min-h-0 flex-1 flex-col">
        <div className="hidden min-h-0 min-w-0 flex-1 flex-col lg:flex">
          <DataTable
            rows={data.data}
            columns={columns}
            loading={loading}
            selectedId={selected?.id ?? null}
            getRowId={(x) => x.id}
            onSelect={handleRowSelect}
            emptyText="No hay registros."
            heightMode="fill"
            shellClassName="min-h-0 flex-1"
            meta={data.meta}
            paginationVariant="desktop"
            onPrev={onPrev}
            onNext={onNext}
            onFirst={onFirst}
            onLast={onLast}
            exportFilename="medicos-picker"
            enableColumnPicker
            enableExport
          />
        </div>
        <div className="min-h-0 min-w-0 flex-1 lg:hidden">
          <MobileEntityList
            rows={data.data}
            loading={loading}
            selectedId={selected?.id ?? null}
            getRowId={(x) => x.id}
            onSelect={handleRowSelect}
            renderMain={(x) => (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-(--color-text-primary)">
                  {x.cmp ?? "—"} · {medicoLabel(x)}
                </div>
              </div>
            )}
            renderRight={(x) => <StatusBadge status={x.estado as RecordStatus} />}
            emptyText="No hay registros."
          />
          <PaginationFooter
            meta={data.meta}
            variant="mobile"
            onPrev={onPrev}
            onNext={onNext}
            onFirst={onFirst}
            onLast={onLast}
          />
        </div>
      </div>
    </div>
  );

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (variant === "fullscreen") {
    return (
      <div
        className="fixed inset-0 z-40 flex items-stretch justify-center bg-black/40"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="flex h-full w-full max-w-6xl flex-col bg-(--color-app-bg) p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {container}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/40"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex h-full w-full max-w-[720px] flex-col bg-(--color-app-bg) p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {container}
      </div>
    </div>
  );
}
