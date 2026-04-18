import * as React from "react";
import ClientesMobileList from "../../ficheros/clientes/components/ClientesMobileList";
import ClientesTable from "../../ficheros/clientes/components/ClientesTable";
import { listClientes } from "../../ficheros/services/clientes.service";
import type { Cliente, PaginatedResponse } from "../../ficheros/types/clientes.types";
import { SecondaryButton } from "../../../shared/ui/buttons";

type Variant = "drawer" | "fullscreen";

type Props = {
  open: boolean;
  variant: Variant;
  onClose: () => void;
  onPicked: (cliente: Cliente) => void;
  title?: string;
  description?: string;
};

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

export default function ClientePicker(props: Props) {
  const {
    open,
    variant,
    onClose,
    onPicked,
    title = "Seleccionar cliente",
    description = "Busca y selecciona un cliente activo (clic en la fila).",
  } = props;

  const [search, setSearch] = React.useState("");
  const q = useDebouncedValue(search, 300);
  const [page, setPage] = React.useState(INITIAL_PAGE);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Cliente | null>(null);
  const [data, setData] = React.useState<PaginatedResponse<Cliente>>({
    data: [],
    meta: { current_page: INITIAL_PAGE, per_page: INITIAL_PER_PAGE, total: 0, last_page: 1 },
  });

  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!open) return;

    setLoading(true);
    const requestId = ++requestIdRef.current;
    listClientes({ q, page, per_page: INITIAL_PER_PAGE, status: "ACTIVO" })
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setData(res);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [open, q, page]);

  React.useEffect(() => {
    setPage(INITIAL_PAGE);
  }, [q]);

  const handleRowSelect = React.useCallback(
    (c: Cliente) => {
      setSelected(c);
      onPicked(c);
      onClose();
    },
    [onPicked, onClose]
  );

  const onPrev = React.useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const onNext = React.useCallback(
    () => setPage((p) => Math.min(data.meta.last_page, p + 1)),
    [data.meta.last_page]
  );
  const onFirst = React.useCallback(() => setPage(1), []);
  const onLast = React.useCallback(() => setPage(data.meta.last_page), [data.meta.last_page]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const container = (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-(--color-text-primary)">{title}</div>
            <div className="text-xs text-(--color-text-secondary)">{description}</div>
          </div>
          <SecondaryButton type="button" onClick={onClose}>
            Cerrar
          </SecondaryButton>
        </div>

        <div className="mt-3">
          <label className="text-sm text-(--color-text-primary)">Buscar</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, cliente, RUC/DNI o teléfono"
            className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)"
          />
        </div>
      </div>

      <div className="min-w-0">
        <ClientesTable
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
        <ClientesMobileList
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
