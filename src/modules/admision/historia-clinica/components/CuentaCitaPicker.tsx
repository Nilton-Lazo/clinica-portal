import * as React from "react";
import { SecondaryButton } from "../../../../shared/ui/buttons";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { listCuentasCita } from "../services/cuentaCita.service";
import type { CuentaCitaListItem, PaginatedResponse } from "../types/cuentaCita.types";
import { AtencionEstadoBadge } from "../../../../shared/ui/AtencionEstadoBadge";

type Variant = "drawer" | "fullscreen";

type Props = {
  open: boolean;
  variant: Variant;
  onClose: () => void;
  onPicked: (row: CuentaCitaListItem) => void;
  title?: string;
  description?: string;
  emisionOrigen?: string;
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

function formatDMY(iso?: string | null): string {
  if (!iso) return "—";
  const s = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function CuentaCitaPicker(props: Props) {
  const {
    open,
    variant,
    onClose,
    onPicked,
    title = "Seleccionar cuenta",
    description = "Busca y selecciona una cuenta (clic en la fila).",
    emisionOrigen,
  } = props;

  const [search, setSearch] = React.useState("");
  const q = useDebouncedValue(search, 300);
  const [page, setPage] = React.useState(INITIAL_PAGE);
  const [perPage] = React.useState(INITIAL_PER_PAGE);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<PaginatedResponse<CuentaCitaListItem>>({
    data: [],
    meta: { current_page: INITIAL_PAGE, per_page: INITIAL_PER_PAGE, total: 0, last_page: 1 },
  });
  const [selectedNro, setSelectedNro] = React.useState<string | null>(null);

  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!open) return;

    setLoading(true);
    const requestId = ++requestIdRef.current;

    listCuentasCita({
      q,
      page,
      per_page: perPage,
      ...(emisionOrigen?.trim() ? { emision_origen: emisionOrigen.trim() } : {}),
    })
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setData(res);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [open, q, page, perPage, emisionOrigen]);

  React.useEffect(() => {
    setPage(INITIAL_PAGE);
  }, [q, emisionOrigen]);

  const handleRowSelect = React.useCallback(
    (row: CuentaCitaListItem) => {
      setSelectedNro(row.nro_cuenta);
      onPicked(row);
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

  const columns: DataGridColumnDef<CuentaCitaListItem>[] = [
    {
      id: "nro_cuenta",
      header: "N° cuenta",
      align: "center",
      size: 110,
      cell: (x) => <span className="tabular-nums">{x.nro_cuenta || "—"}</span>,
    },
    {
      id: "origen",
      header: "Origen cuenta",
      align: "center",
      size: 100,
      cell: (x) => <span className="text-xs text-(--color-text-secondary) tabular-nums">{x.origen_sigla || "—"}</span>,
    },
    {
      id: "nr",
      header: "N° Referencia",
      align: "center",
      size: 120,
      cell: (x) => <span className="tabular-nums">{x.nr ? x.nr : "—"}</span>,
    },
    {
      id: "hc",
      header: "N° Historia",
      align: "center",
      size: 120,
      cell: (x) => <span className="tabular-nums">{x.hc ? x.hc : "—"}</span>,
    },
    {
      id: "apellidos_nombres",
      header: "Apellidos y Nombres",
      align: "left",
      grow: true,
      cell: (x) => (
        <span className="whitespace-normal wrap-anywhere">{x.apellidos_nombres?.trim() ? x.apellidos_nombres : "—"}</span>
      ),
    },
    {
      id: "fecha",
      header: "Fecha",
      align: "center",
      size: 120,
      cell: (x) => <span className="tabular-nums whitespace-nowrap">{formatDMY(x.fecha)}</span>,
    },
    {
      id: "estado",
      header: "Estado",
      align: "center",
      size: 120,
      cell: (x) => (
        <div className="flex justify-center">
          <AtencionEstadoBadge value={x.estado} />
        </div>
      ),
    },
  ];

  const container = (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden">
      <div className="shrink-0 rounded border border-(--border-color-default) bg-(--color-surface) p-4">
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
            placeholder="N° historia, N° cuenta, N° referencia, nombre"
            className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)"
          />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="hidden min-h-0 flex-1 flex-col lg:flex">
          <CrudListGrid
            rows={data.data}
            columns={columns}
            loading={loading}
            meta={data.meta}
            selectedId={selectedNro}
            getRowId={(x) => x.nro_cuenta}
            onSelect={handleRowSelect}
            emptyText="No hay cuentas para mostrar."
            onPrev={onPrev}
            onNext={onNext}
            onFirst={onFirst}
            onLast={onLast}
            heightMode="hug"
            exportFilename="cuentas-cita"
            enableExport
            enableColumnPicker
            className="min-h-0 flex-1"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <MobileEntityList
              rows={data.data}
              loading={loading}
              selectedId={selectedNro}
              getRowId={(x) => x.nro_cuenta}
              onSelect={handleRowSelect}
              renderMain={(x) => (
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-(--color-text-primary)">
                    <span className="tabular-nums">{x.nro_cuenta}</span>
                    {x.apellidos_nombres?.trim() ? ` · ${x.apellidos_nombres}` : ""}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--color-text-secondary)">
                    <span>
                      {(x.origen_sigla || "—")} · HC {x.hc ?? "—"} · Ref {x.nr ?? "—"} · {formatDMY(x.fecha)}
                    </span>
                    <AtencionEstadoBadge value={x.estado} />
                  </div>
                </div>
              )}
            />
          </div>
          <div className="shrink-0">
            <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
          </div>
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
          className="flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden bg-(--color-app-bg) p-4"
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
        className="flex h-full min-h-0 w-full max-w-[900px] flex-col overflow-hidden bg-(--color-app-bg) p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {container}
      </div>
    </div>
  );
}

export default CuentaCitaPicker;
