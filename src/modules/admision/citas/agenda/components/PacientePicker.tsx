import * as React from "react";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { SecondaryButton } from "../../../../../shared/ui/buttons";
import HistoriaClinicaTable from "../../../historia-clinica/components/HistoriaClinicaTable";
import HistoriaClinicaMobileList from "../../../historia-clinica/components/HistoriaClinicaMobileList";
import {
  type PacienteListItem,
  type PaginatedResponse,
  type PacientesQuery,
} from "../../../historia-clinica/types/historiaClinica.types";
import { listPacientes } from "../../../historia-clinica/services/historiaClinica.service";

type Variant = "drawer" | "fullscreen";

type Props = {
  open: boolean;
  variant: Variant;
  onClose: () => void;
  /** Se llama cuando el usuario elige un paciente (clic o Enter/Espacio). */
  onPicked: (paciente: PacienteListItem) => void;
  /** Texto del título (por defecto: \"Seleccionar paciente\"). */
  title?: string;
  /** Texto descriptivo bajo el título. */
  description?: string;
  /** Mostrar botón para registrar paciente nuevo. */
  showRegisterButton?: boolean;
  /** Acción al pulsar \"Registrar paciente\" (opcional). */
  onRegister?: () => void;
  /** Acción al pulsar \"Ir a Historia clínica\" (opcional; para editar datos de pacientes). */
  onOpenHistoriaClinica?: () => void;
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

export function PacientePicker(props: Props) {
  const {
    open,
    variant,
    onClose,
    onPicked,
    title = "Seleccionar paciente",
    description = "Busca y selecciona el paciente (clic en la fila).",
    showRegisterButton = true,
    onRegister,
    onOpenHistoriaClinica,
  } = props;

  const [search, setSearch] = React.useState("");
  const q = useDebouncedValue(search, 300);

  const [status, setStatus] = React.useState<string>("");
  const [page, setPage] = React.useState(INITIAL_PAGE);
  const [perPage] = React.useState(INITIAL_PER_PAGE);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<PaginatedResponse<PacienteListItem>>({
    data: [],
    meta: { current_page: INITIAL_PAGE, per_page: INITIAL_PER_PAGE, total: 0, last_page: 1 },
  });
  const [selected, setSelected] = React.useState<PacienteListItem | null>(null);

  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!open) return;

    setLoading(true);
    const requestId = ++requestIdRef.current;

    const query: PacientesQuery = { q, page, per_page: perPage };
    if (status && ["ACTIVO", "INACTIVO", "SUSPENDIDO"].includes(status)) {
      query.status = status as PacientesQuery["status"];
    }

    listPacientes(query)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setData(res);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [open, q, status, page, perPage]);

  React.useEffect(() => {
    setPage(INITIAL_PAGE);
  }, [q, status]);

  const handleRowSelect = React.useCallback(
    (p: PacienteListItem) => {
      setSelected(p);
      onPicked(p);
      onClose();
    },
    [onPicked, onClose],
  );

  const onPrev = React.useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);
  const onNext = React.useCallback(() => {
    setPage((p) => Math.min(data.meta.last_page, p + 1));
  }, [data.meta.last_page]);
  const onFirst = React.useCallback(() => setPage(1), []);
  const onLast = React.useCallback(() => setPage(data.meta.last_page), [data.meta.last_page]);

  const container = (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-(--color-text-primary)">{title}</div>
            <div className="text-xs text-(--color-text-secondary)">{description}</div>
            {onOpenHistoriaClinica ? (
              <button
                type="button"
                onClick={onOpenHistoriaClinica}
                className="self-start text-xs font-medium text-(--color-primary) hover:underline"
              >
                Editar datos en Historia clínica
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {showRegisterButton && onRegister ? (
              <SecondaryButton onClick={onRegister}>Registrar paciente</SecondaryButton>
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
              placeholder="N° documento, N° historia o nombre"
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

      <div className="min-w-0">
        <HistoriaClinicaTable
          data={data}
          loading={loading}
          selectedId={selected?.id ?? null}
          onSelect={handleRowSelect}
          page={page}
          onPrev={onPrev}
          onNext={onNext}
          onFirst={onFirst}
          onLast={onLast}
          pickerMode
        />
        <HistoriaClinicaMobileList
          data={data}
          loading={loading}
          selectedId={selected?.id ?? null}
          onSelect={handleRowSelect}
          page={page}
          onPrev={onPrev}
          onNext={onNext}
          onFirst={onFirst}
          onLast={onLast}
        />
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

export default PacientePicker;

