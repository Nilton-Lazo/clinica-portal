import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { SelectAllCheckbox } from "../../../../../shared/crud/SelectAllCheckbox";
import { GridCellText } from "../../../../../shared/datagrid";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { SelectMenu } from "../../../../../shared/ui/SelectMenu";
import { listPageSizeOptions } from "../../../../../shared/crud/listPageSizeOptions";
import { normalizeListPerPage } from "../../../../../shared/datagrid/buildListQuery";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { useDebouncedValue } from "../../../../../shared/hooks/useDebouncedValue";
import {
  buscarServiciosTarifa,
  getIgvPorcentaje,
  type TarifaServicioBusqueda,
  type TarifaServiciosBusquedaMeta,
} from "../services/atencionCita.service";
import { toastService } from "../../../../../shared/notifications";
import { toUserFriendlyMessage } from "../../utils/userFriendlyError";
import type { AtencionDraft, PresupuestoPaqueteSnapshot } from "../types/atencionCita.types";
import { PRECISION_DECIMAL } from "../../../../../shared/constants/decimalPrecision";

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

type LocationState = {
  tarifaId?: number | null;
  tarifaDescripcion?: string | null;
  tarifaEsPrecioDirecto?: boolean;
  returnLineas?: unknown[];
  atencionDraft?: AtencionDraft | null;
  copVarDefault?: number;
  presupuestoReturnPath?: string;
  presupuestoPaquete?: PresupuestoPaqueteSnapshot | null;
};

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

export default function BuscarServiciosPage() {
  const { citaId } = useParams<{ citaId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = React.useMemo(() => (location.state ?? {}) as LocationState, [location.state]);

  const tarifaId = navState.tarifaId ?? null;
  const tarifaDescripcion = navState.tarifaDescripcion ?? "—";
  const presupuestoReturnPath = navState.presupuestoReturnPath;
  const isPresupuesto = Boolean(presupuestoReturnPath);
  const citaIdNum = citaId ? parseInt(citaId, 10) : NaN;

  const [data, setData] = React.useState<TarifaServicioBusqueda[]>([]);
  const [meta, setMeta] = React.useState<TarifaServiciosBusquedaMeta | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const qDebounced = useDebouncedValue(q, 300);
  const qNormalized = React.useMemo(
    () => normalizeCodigoQuery(qDebounced),
    [qDebounced]
  );

  const perPageOptions = listPageSizeOptions;

  const handlePerPageChange = React.useCallback((v: string) => {
    setPerPage(normalizeListPerPage(Number(v) || 10));
    setPage(1);
  }, []);

  const [multiSelect, setMultiSelect] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<Map<number, TarifaServicioBusqueda>>(new Map());
  const [igvPct, setIgvPct] = React.useState(18);

  const isLgUp = useIsLgUp();

  React.useEffect(() => {
    getIgvPorcentaje()
      .then(setIgvPct)
      .catch((e) => {
        toastService.showError(toUserFriendlyMessage(e, "No se pudo cargar el porcentaje de IGV para calcular los servicios."));
      });
  }, []);

  const refresh = React.useCallback(() => {
    if (!tarifaId) return;
    setLoading(true);
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
        setData(res.data ?? []);
        setMeta(res.meta ?? null);
      })
      .catch((e) => {
        setData([]);
        setMeta(null);
        toastService.showError(toUserFriendlyMessage(e, "No se pudieron cargar los servicios activos del tarifario seleccionado."));
      })
      .finally(() => setLoading(false));
  }, [tarifaId, page, perPage, qNormalized]);

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

  const navigateBackToOrigen = React.useCallback(
    (extra: Record<string, unknown>) => {
      const state: Record<string, unknown> = {
        returnLineas: navState.returnLineas,
        atencionDraft: navState.atencionDraft,
        scrollToServicios: true,
        copVarDefault: navState.copVarDefault,
        ...extra,
      };
      if (typeof navState.presupuestoPaquete !== "undefined") {
        state.presupuestoPaquete = navState.presupuestoPaquete;
      }
      if (isPresupuesto && presupuestoReturnPath) {
        navigate(presupuestoReturnPath, { replace: true, state });
      } else if (Number.isFinite(citaIdNum)) {
        navigate(`/admision/citas/agenda/${citaIdNum}/atencion`, { replace: true, state });
      }
    },
    [navigate, navState, isPresupuesto, presupuestoReturnPath, citaIdNum]
  );

  const handleRegresar = React.useCallback(() => {
    navigateBackToOrigen({});
  }, [navigateBackToOrigen]);

  const handleDoubleClick = React.useCallback(
    (row: TarifaServicioBusqueda) => {
      if (multiSelect) return;
      navigateBackToOrigen({
        selectedServicios: [row],
      });
    },
    [multiSelect, navigateBackToOrigen]
  );

  const handleAgregarSeleccionados = React.useCallback(() => {
    if (selectedItems.size === 0) return;
    const selected = Array.from(selectedItems.values());
    navigateBackToOrigen({
      selectedServicios: selected,
    });
  }, [selectedItems, navigateBackToOrigen]);

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

  const handleRowSelect = React.useCallback(
    (row: TarifaServicioBusqueda) => {
      if (multiSelect) toggleSelect(row);
    },
    [multiSelect, toggleSelect]
  );

  const columns: DataTableColumn<TarifaServicioBusqueda & { _checked?: boolean }>[] = React.useMemo(() => {
    const base: DataTableColumn<TarifaServicioBusqueda & { _checked?: boolean }>[] = [
      {
        key: "codigo",
        header: "Código",
        headerClassName: "text-center w-24 align-middle",
        cellClassName: "px-3 py-2 text-center tabular-nums text-(--color-primary) align-middle",
        render: (x) => x.codigo,
      },
      {
        key: "descripcion",
        header: "Descripción de servicio",
        grow: true,
        headerClassName: "text-left align-middle",
        cellClassName: "px-3 py-2 align-middle",
        render: (x) => (
          <GridCellText value={x.descripcion ?? "—"} title={x.descripcion ?? undefined} />
        ),
      },
      {
        key: "precio_sin_igv",
        header: <span className="whitespace-nowrap">Precio sin IGV</span>,
        headerClassName: "text-right w-32 min-w-[7rem] align-middle",
        cellClassName: "px-3 py-2 text-right align-middle",
        render: (x) => {
          const finalPrecio = precioConRecargo(
            x.precio_sin_igv,
            Boolean(x.recargo_noche_activo),
            x.recargo_noche_porcentaje ?? 0
          );
          if (finalPrecio === 0 && (x.precio_sin_igv == null || x.precio_sin_igv === ""))
            return "—";
          const recargo = Boolean(x.recargo_noche_activo) && (x.recargo_noche_porcentaje ?? 0) > 0;
          return (
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex justify-end items-baseline gap-0">
                <span className="inline-block w-10 shrink-0 text-right tabular-nums">S/. </span>
                <span className="tabular-nums inline-block min-w-18 text-right">
                  {finalPrecio.toFixed(PRECISION_DECIMAL)}
                </span>
              </div>
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
        headerClassName: "text-right w-32 min-w-[7rem] align-middle",
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
            <div className="flex justify-end items-baseline gap-0">
              <span className="inline-block w-10 shrink-0 text-right tabular-nums">S/. </span>
              <span className="tabular-nums inline-block min-w-18 text-right">
                {precioConIgv.toFixed(PRECISION_DECIMAL)}
              </span>
            </div>
          );
        },
      },
      {
        key: "nomenclador",
        header: "Nomenclador",
        headerClassName: "text-center w-32 min-w-[7rem] align-middle",
        cellClassName: "px-3 py-2 text-center text-(--color-text-secondary) align-middle",
        render: (x) => x.nomenclador ?? "—",
      },
    ];
    if (multiSelect) {
      base.unshift({
        key: "check",
        header: (
          <SelectAllCheckbox
            rows={data}
            selectedIds={selectedItems}
            onSelectAll={selectAllOnPage}
            onClear={clearSelection}
          />
        ),
        headerClassName: "w-11 text-center align-middle",
        cellClassName: "px-0 text-center align-middle",
        render: (x) => (
          <input
            type="checkbox"
            checked={selectedItems.has(x.id)}
            onChange={() => toggleSelect(x)}
            className="h-4 w-4 shrink-0 rounded border border-(--border-color-default)"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Seleccionar ${x.codigo}`}
          />
        ),
      });
    }
    return base;
  }, [multiSelect, selectedItems, toggleSelect, igvPct, data, selectAllOnPage, clearSelection]);

  const rowsWithCheck = React.useMemo(
    () => data.map((r) => ({ ...r, _checked: selectedItems.has(r.id) })),
    [data, selectedItems]
  );

  if (!tarifaId) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-8">
        <p className="text-sm text-(--color-text-secondary)">
          No hay tarifario asignado. Seleccione un plan en la atención o en el presupuesto.
        </p>
        <SecondaryButton
          onClick={() => {
            if (isPresupuesto && presupuestoReturnPath) navigate(presupuestoReturnPath, { replace: true });
            else if (Number.isFinite(citaIdNum)) navigate(`/admision/citas/agenda/${citaIdNum}/atencion`, { replace: true });
            else navigate(-1);
          }}
        >
          Regresar
        </SecondaryButton>
      </div>
    );
  }

  if (!isPresupuesto && !Number.isFinite(citaIdNum)) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-8">
        <p className="text-sm text-(--color-text-secondary)">ID de cita inválido.</p>
        <SecondaryButton onClick={() => navigate("/admision/citas/agenda")}>Regresar</SecondaryButton>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-(--color-text-primary)">Servicios</h1>
          <p className="text-sm text-(--color-text-secondary)">
            Búsqueda y selección · {tarifaDescripcion}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {multiSelect ? (
            <>
              <PrimaryButton
                onClick={handleAgregarSeleccionados}
                disabled={selectedItems.size === 0}
              >
                Agregar seleccionados ({selectedItems.size})
              </PrimaryButton>
              <SecondaryButton onClick={() => setMultiSelect(false)}>
                Cancelar selección
              </SecondaryButton>
            </>
          ) : (
            <PrimaryButton onClick={() => setMultiSelect(true)}>
              Seleccionar varios
            </PrimaryButton>
          )}
          <SecondaryButton onClick={handleRegresar}>Regresar</SecondaryButton>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código, descripción o nomenclador"
          className={[
            "h-10 rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3",
            "text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)",
            "basis-full sm:basis-auto sm:flex-1 min-w-65",
          ].join(" ")}
        />
        <SelectMenu
          value={String(perPage)}
          onChange={handlePerPageChange}
          options={perPageOptions}
          ariaLabel="Registros por página"
          buttonClassName="h-10 rounded-xl min-w-[96px]"
          menuClassName="min-w-[90px]"
        />
      </div>

      {isLgUp ? (
        <DataTable
          rows={rowsWithCheck}
          columns={columns}
          loading={loading}
          selectedId={null}
          getRowId={(r) => r.id}
          onSelect={handleRowSelect}
          onDoubleClick={handleDoubleClick}
          emptyText="No hay servicios activos."
          heightMode="hug"
          meta={meta ?? undefined}
          paginationVariant="desktop"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(meta?.last_page ?? 1, p + 1))}
          onFirst={() => setPage(1)}
          onLast={() => setPage(meta?.last_page ?? 1)}
          exportFilename="buscar-servicios"
          enableColumnPicker
          enableExport
        />
      ) : (
        <>
          <MobileEntityList
            rows={data}
            loading={loading}
            selectedId={null}
            getRowId={(r) => r.id}
            onSelect={(r) =>
              multiSelect ? toggleSelect(r) : handleDoubleClick(r)
            }
            renderMain={(r) => {
              const finalPrecio = precioConRecargo(
                r.precio_sin_igv,
                Boolean(r.recargo_noche_activo),
                r.recargo_noche_porcentaje ?? 0
              );
              const precioStr =
                finalPrecio > 0 ? `S/. ${finalPrecio.toFixed(4)}` : "—";
              const recargo = Boolean(r.recargo_noche_activo) && (r.recargo_noche_porcentaje ?? 0) > 0;
              return (
                <div className="flex items-start gap-2 min-w-0">
                  {multiSelect && (
                    <input
                      type="checkbox"
                      checked={selectedItems.has(r.id)}
                      onChange={() => toggleSelect(r)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border border-(--border-color-default)"
                    />
                  )}
                  <div className="min-w-0 flex-1 flex flex-col gap-0.5 text-left overflow-hidden">
                    <span className="font-medium tabular-nums text-(--color-primary) truncate">
                      {r.codigo}
                    </span>
                    <span className="text-sm text-(--color-text-primary) truncate">
                      {r.descripcion}
                    </span>
                    <span className="text-xs text-(--color-text-secondary) flex flex-wrap gap-x-1 gap-y-0.5">
                      <span className="whitespace-nowrap">
                        Precio sin IGV: {precioStr}
                        {recargo ? ` (Recargo ${r.recargo_noche_porcentaje ?? 0}%)` : ""}
                        {r.nomenclador != null && r.nomenclador !== ""
                          ? " ·"
                          : ""}
                      </span>
                      {r.nomenclador != null && r.nomenclador !== "" && (
                        <span className="whitespace-nowrap">
                          Nomenclador: {r.nomenclador}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            }}
            emptyText="No hay servicios activos."
            onLongPress={!multiSelect ? (r) => handleDoubleClick(r) : undefined}
          />
          {meta && (
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
  );
}
