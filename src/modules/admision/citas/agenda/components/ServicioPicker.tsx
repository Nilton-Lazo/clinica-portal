import * as React from "react";
import { createPortal } from "react-dom";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { useDebouncedValue } from "../../../../../shared/hooks/useDebouncedValue";
import {
  buscarServiciosTarifa,
  getIgvPorcentaje,
  type TarifaServicioBusqueda,
  type TarifaServiciosBusquedaMeta,
} from "../services/atencionCita.service";
import { PRECISION_DECIMAL } from "../../../../../shared/constants/decimalPrecision";

type Variant = "drawer" | "fullscreen";

export type ServicioPickerProps = {
  open: boolean;
  variant: Variant;
  onClose: () => void;
  /** Se llama con los servicios elegidos al pulsar «Agregar seleccionados». */
  onSelect: (servicios: TarifaServicioBusqueda[]) => void;
  tarifaId: number | null;
  tarifaDescripcion?: string | null;
  /** IGV % para mostrar precios; si no se pasa, se obtiene del API. */
  igvPct?: number;
};

/** Normaliza búsqueda por código: 010101 → 01.01.01 (igual que CRUD servicios). */
function normalizeCodigoQuery(raw: string): string {
  const compact = raw.replace(/\./g, "").trim();
  if (!compact) return "";
  if (!/^\d+$/.test(compact)) return raw.trim();
  if (compact.length === 6) {
    return compact.replace(/(\d{2})(\d{2})(\d{2})/, "$1.$2.$3");
  }
  if (compact.length === 4) {
    return compact.replace(/(\d{2})(\d{2})/, "$1.$2");
  }
  return compact;
}

function getHoraActual(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function precioConRecargo(
  precioSinIgv: string | number | null | undefined,
  recargoActivo: boolean,
  recargoPct: number
): number {
  const base = parseFloat(String(precioSinIgv ?? 0)) || 0;
  if (!recargoActivo || recargoPct <= 0) return base;
  return base * (1 + recargoPct / 100);
}

const PER_PAGE_OPTIONS: SelectOption[] = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

function clampPerPage(n: number): number {
  return n <= 25 ? 25 : n <= 50 ? 50 : 100;
}

function SelectAllCheckbox({
  data,
  selectedItems,
  onSelectAll,
  onClear,
}: {
  data: TarifaServicioBusqueda[];
  selectedItems: Map<number, TarifaServicioBusqueda>;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const allSelected = data.length > 0 && data.every((r) => selectedItems.has(r.id));
  const someSelected = data.length > 0 && data.some((r) => selectedItems.has(r.id));
  const indeterminate = someSelected && !allSelected;
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allSelected}
      onChange={() => (allSelected ? onClear() : onSelectAll())}
      className="h-4 w-4 rounded border border-(--border-color-default)"
      onClick={(e) => e.stopPropagation()}
      aria-label="Seleccionar todos en esta página"
    />
  );
}

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isLgUp;
}

export function ServicioPicker(props: ServicioPickerProps) {
  const {
    open,
    variant,
    onClose,
    onSelect,
    tarifaId,
    tarifaDescripcion = "—",
    igvPct: igvPctProp,
  } = props;

  const [data, setData] = React.useState<TarifaServicioBusqueda[]>([]);
  const [meta, setMeta] = React.useState<TarifaServiciosBusquedaMeta | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(50);
  const [igvPct, setIgvPct] = React.useState(igvPctProp ?? 18);
  const [selectedItems, setSelectedItems] = React.useState<Map<number, TarifaServicioBusqueda>>(new Map());
  const isLgUp = useIsLgUp();

  const qDebounced = useDebouncedValue(q, 300);
  const qNormalized = React.useMemo(() => normalizeCodigoQuery(qDebounced), [qDebounced]);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (igvPctProp != null && Number.isFinite(igvPctProp)) setIgvPct(igvPctProp);
  }, [igvPctProp]);

  React.useEffect(() => {
    if (typeof igvPctProp === "undefined" && open) {
      getIgvPorcentaje().then(setIgvPct).catch(() => {});
    }
  }, [open, igvPctProp]);

  const refresh = React.useCallback(() => {
    if (!tarifaId || !open) return;
    setLoading(true);
    const requestId = ++requestIdRef.current;
    const searchQ = qNormalized.trim() || undefined;
    const horaReal = getHoraActual();
    buscarServiciosTarifa(tarifaId, {
      page,
      per_page: perPage,
      q: searchQ,
      status: "ACTIVO",
      hora: horaReal,
    })
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setData(res.data ?? []);
        setMeta(res.meta ?? null);
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setData([]);
          setMeta(null);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [tarifaId, open, page, perPage, qNormalized]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const prevQRef = React.useRef(qDebounced);
  React.useEffect(() => {
    if (prevQRef.current !== qDebounced) {
      prevQRef.current = qDebounced;
      setPage(1);
    }
  }, [qDebounced]);

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setPage(1);
      setSelectedItems(new Map());
    }
  }, [open]);

  const handlePerPageChange = React.useCallback((v: string) => {
    setPerPage(clampPerPage(Number(v) || 50));
    setPage(1);
  }, []);

  const toggleSelect = React.useCallback((row: TarifaServicioBusqueda) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.set(row.id, row);
      return next;
    });
  }, []);

  const selectAllOnPage = React.useCallback(() => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      data.forEach((r) => next.set(r.id, r));
      return next;
    });
  }, [data]);

  const clearSelection = React.useCallback(() => {
    setSelectedItems(new Map());
  }, []);

  const handleAgregarSeleccionados = React.useCallback(() => {
    if (selectedItems.size === 0) return;
    onSelect(Array.from(selectedItems.values()));
    onClose();
  }, [selectedItems, onSelect, onClose]);

  /**
   * Clic en la fila (sin Ctrl) = agrega ese servicio y cierra.
   * Ctrl+clic en la fila = toggle checkbox (varios, como el Explorador de Windows).
   * Checkbox = toggle para sumar varios y pulsar Agregar.
   */
  const handleRowSelect = React.useCallback(
    (row: TarifaServicioBusqueda, e?: React.MouseEvent) => {
      if (e?.ctrlKey) {
        toggleSelect(row);
        return;
      }
      onSelect([row]);
      onClose();
    },
    [toggleSelect, onSelect, onClose]
  );

  const columns: DataTableColumn<TarifaServicioBusqueda & { _checked?: boolean }>[] = React.useMemo(() => {
    const base: DataTableColumn<TarifaServicioBusqueda & { _checked?: boolean }>[] = [
      {
        key: "check",
        header: (
          <div className="flex min-h-9 items-center justify-center">
            <SelectAllCheckbox
              data={data}
              selectedItems={selectedItems}
              onSelectAll={selectAllOnPage}
              onClear={clearSelection}
            />
          </div>
        ),
        headerClassName: "w-12 align-middle",
        cellClassName: "px-2 py-2 align-middle",
        render: (x) => (
          <div className="flex min-h-10 items-center justify-center">
            <input
              type="checkbox"
              checked={selectedItems.has(x.id)}
              onChange={() => toggleSelect(x)}
              className="h-4 w-4 rounded border border-(--border-color-default)"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Seleccionar ${x.codigo}`}
            />
          </div>
        ),
      },
      {
        key: "codigo",
        header: "Código",
        headerClassName: "text-center w-24 align-middle",
        cellClassName: "px-3 py-2 text-center tabular-nums text-(--color-primary) align-middle",
        render: (x) => x.codigo,
      },
      {
        key: "descripcion",
        header: "Descripción",
        headerClassName: "text-left align-middle",
        cellClassName: "px-3 py-2 max-w-[260px] align-middle",
        render: (x) => (
          <span className="block wrap-break-word whitespace-normal text-left leading-snug text-sm">
            {x.descripcion ?? "—"}
          </span>
        ),
      },
      {
        key: "precio_sin_igv",
        header: <span className="whitespace-nowrap">Precio sin IGV</span>,
        headerClassName: "text-right w-28 min-w-[6rem] align-middle",
        cellClassName: "px-3 py-2 text-right align-middle",
        render: (x) => {
          const finalPrecio = precioConRecargo(
            x.precio_sin_igv,
            Boolean(x.recargo_noche_activo),
            x.recargo_noche_porcentaje ?? 0
          );
          if (finalPrecio === 0 && (x.precio_sin_igv == null || x.precio_sin_igv === "")) return "—";
          const recargo = Boolean(x.recargo_noche_activo) && (x.recargo_noche_porcentaje ?? 0) > 0;
          return (
            <div className="flex flex-col items-end gap-0.5">
              <span className="tabular-nums text-sm">
                S/. {finalPrecio.toFixed(PRECISION_DECIMAL)}
              </span>
              {recargo && (
                <span className="text-xs text-(--color-primary)">
                  Recargo {(x.recargo_noche_porcentaje ?? 0)}%
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "precio_con_igv",
        header: <span className="whitespace-nowrap">Precio con IGV</span>,
        headerClassName: "text-right w-28 min-w-[6rem] align-middle",
        cellClassName: "px-3 py-2 text-right align-middle",
        render: (x) => {
          const finalPrecioSinIgv = precioConRecargo(
            x.precio_sin_igv,
            Boolean(x.recargo_noche_activo),
            x.recargo_noche_porcentaje ?? 0
          );
          const precioConIgv = finalPrecioSinIgv * (1 + igvPct / 100);
          if (finalPrecioSinIgv === 0 && (x.precio_sin_igv == null || x.precio_sin_igv === ""))
            return "—";
          return (
            <span className="tabular-nums text-sm">
              S/. {precioConIgv.toFixed(PRECISION_DECIMAL)}
            </span>
          );
        },
      },
    ];
    return base;
  }, [data, selectedItems, toggleSelect, selectAllOnPage, clearSelection, igvPct]);

  const rowsWithCheck = React.useMemo(
    () => data.map((r) => ({ ...r, _checked: selectedItems.has(r.id) })),
    [data, selectedItems]
  );

  const content = (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="rounded-xl border border-(--border-color-default) bg-(--color-surface) p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-sm font-semibold text-(--color-text-primary) shrink-0">Buscar servicios</h2>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className={[
                "h-10 min-w-0 flex-1 rounded border border-(--border-color-default) bg-(--color-surface) px-3",
                "text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)",
              ].join(" ")}
              aria-label="Buscar por código, descripción o nomenclador"
            />
            <SelectMenu
              value={String(perPage)}
              onChange={handlePerPageChange}
              options={PER_PAGE_OPTIONS}
              ariaLabel="Registros por página"
              buttonClassName="h-10 rounded border border-(--border-color-default) min-w-[5rem]"
              menuClassName="min-w-[90px]"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PrimaryButton
              onClick={handleAgregarSeleccionados}
              disabled={selectedItems.size === 0}
              className="min-w-0"
            >
              Agregar ({selectedItems.size})
            </PrimaryButton>
            <SecondaryButton type="button" onClick={onClose}>
              Cerrar
            </SecondaryButton>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-(--color-text-secondary)">
          Tarifario {tarifaDescripcion} · Selecciona uno o varios servicios.
        </p>
      </div>

      <div className="min-h-0 min-w-0 flex-1 flex flex-col">
        {!tarifaId ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-6">
            <p className="text-sm text-(--color-text-secondary)">
              No hay tarifario asignado. Seleccione un plan en la atención.
            </p>
          </div>
        ) : isLgUp ? (
          <>
            <div className="flex-1 overflow-auto">
              <DataTable
                rows={rowsWithCheck}
                columns={columns}
                loading={loading}
                selectedId={null}
                getRowId={(r) => r.id}
                onSelect={handleRowSelect}
                emptyText="No hay servicios activos para esta tarifa."
              />
            </div>
            {meta && meta.last_page > 0 && (
              <PaginationFooter
                meta={meta}
                variant="desktop"
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                onFirst={() => setPage(1)}
                onLast={() => setPage(meta.last_page)}
              />
            )}
          </>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <MobileEntityList
                rows={data}
                loading={loading}
                selectedId={null}
                getRowId={(r) => r.id}
                onSelect={handleRowSelect}
                renderMain={(r) => {
                  const finalPrecio = precioConRecargo(
                    r.precio_sin_igv,
                    Boolean(r.recargo_noche_activo),
                    r.recargo_noche_porcentaje ?? 0
                  );
                  const precioStr = finalPrecio > 0 ? `S/. ${finalPrecio.toFixed(4)}` : "—";
                  const recargo = Boolean(r.recargo_noche_activo) && (r.recargo_noche_porcentaje ?? 0) > 0;
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(r.id)}
                        onChange={() => toggleSelect(r)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 shrink-0 rounded border border-(--border-color-default)"
                      />
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5 text-left overflow-hidden">
                        <span className="font-medium tabular-nums text-(--color-primary) truncate">
                          {r.codigo}
                        </span>
                        <span className="text-sm text-(--color-text-primary) truncate">
                          {r.descripcion}
                        </span>
                        <span className="text-xs text-(--color-text-secondary)">
                          {precioStr}
                          {recargo ? ` (Recargo ${r.recargo_noche_porcentaje ?? 0}%)` : ""}
                        </span>
                      </div>
                    </div>
                  );
                }}
                emptyText="No hay servicios activos."
              />
            </div>
            {meta && meta.last_page > 0 && (
              <PaginationFooter
                meta={meta}
                variant="mobile"
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                onFirst={() => setPage(1)}
                onLast={() => setPage(meta.last_page)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );

  const backdropMousedownRef = React.useRef(false);
  const handleBackdropMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) backdropMousedownRef.current = true;
  }, []);
  const handleBackdropMouseUp = React.useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) backdropMousedownRef.current = false;
  }, []);
  const handleBackdropClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && backdropMousedownRef.current) {
        backdropMousedownRef.current = false;
        onClose();
      }
    },
    [onClose]
  );

  if (!open) return null;

  const title = "Buscar servicios";
  const dialog = (
    <div
      className={
        variant === "fullscreen"
          ? "fixed inset-0 z-40 flex items-stretch justify-center bg-black/40"
          : "fixed inset-0 z-40 flex items-stretch justify-end bg-black/40"
      }
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={
          variant === "fullscreen"
            ? "flex h-full w-full max-w-6xl flex-col bg-(--color-app-bg) p-4"
            : "flex h-full w-full max-w-[720px] flex-col bg-(--color-app-bg) p-4 shadow-xl"
        }
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

export default ServicioPicker;
