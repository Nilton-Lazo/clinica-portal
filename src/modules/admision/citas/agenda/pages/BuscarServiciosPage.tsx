import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { useDebouncedValue } from "../../../../../shared/hooks/useDebouncedValue";
import {
  buscarServiciosTarifa,
  type TarifaServicioBusqueda,
  type TarifaServiciosBusquedaMeta,
} from "../services/atencionCita.service";

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
  returnLineas?: unknown[];
  returnPrecarga?: unknown[];
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

export default function BuscarServiciosPage() {
  const { citaId } = useParams<"citaId">();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const tarifaId = state.tarifaId ?? null;
  const tarifaDescripcion = state.tarifaDescripcion ?? "—";

  const [data, setData] = React.useState<TarifaServicioBusqueda[]>([]);
  const [meta, setMeta] = React.useState<TarifaServiciosBusquedaMeta | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(50);
  const qDebounced = useDebouncedValue(q, 350);
  const qNormalized = React.useMemo(
    () => normalizeCodigoQuery(qDebounced),
    [qDebounced]
  );

  const perPageOptions: SelectOption[] = [
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const clampPerPage = (n: number) => (n <= 25 ? 25 : n <= 50 ? 50 : 100);
  const handlePerPageChange = React.useCallback((v: string) => {
    setPerPage(clampPerPage(Number(v) || 50));
    setPage(1);
  }, []);

  const [multiSelect, setMultiSelect] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  const isLgUp = useIsLgUp();

  const refresh = React.useCallback(() => {
    if (!tarifaId) return;
    setLoading(true);
    const searchQ = qNormalized.trim() || undefined;
    buscarServiciosTarifa(tarifaId, {
      page,
      per_page: perPage,
      q: searchQ,
      status: "ACTIVO",
    })
      .then((res) => {
        setData(res.data ?? []);
        setMeta(res.meta ?? null);
      })
      .catch(() => {
        setData([]);
        setMeta(null);
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

  const handleRegresar = React.useCallback(() => {
    const st = state as LocationState;
    navigate(`/admision/citas/agenda/${citaId}/atencion`, {
      replace: true,
      state: {
        returnLineas: st.returnLineas,
        returnPrecarga: st.returnPrecarga,
        scrollToServicios: true,
      },
    });
  }, [navigate, citaId, state]);

  const handleDoubleClick = React.useCallback(
    (row: TarifaServicioBusqueda) => {
      if (multiSelect) return;
      const st = state as LocationState;
      navigate(`/admision/citas/agenda/${citaId}/atencion`, {
        replace: true,
        state: {
          selectedServicios: [row],
          returnLineas: st.returnLineas,
          returnPrecarga: st.returnPrecarga,
          scrollToServicios: true,
        },
      });
    },
    [navigate, citaId, multiSelect, state]
  );

  const handleAgregarSeleccionados = React.useCallback(() => {
    if (selectedIds.size === 0) return;
    const selected = data.filter((r) => selectedIds.has(r.id));
    const st = state as LocationState;
    navigate(`/admision/citas/agenda/${citaId}/atencion`, {
      replace: true,
      state: {
        selectedServicios: selected,
        returnLineas: st.returnLineas,
        returnPrecarga: st.returnPrecarga,
        scrollToServicios: true,
      },
    });
  }, [navigate, citaId, selectedIds, data, state]);

  const toggleSelect = React.useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRowSelect = React.useCallback(
    (row: TarifaServicioBusqueda) => {
      if (multiSelect) toggleSelect(row.id);
    },
    [multiSelect, toggleSelect]
  );

  const columns: DataTableColumn<TarifaServicioBusqueda & { _checked?: boolean }>[] = React.useMemo(() => {
    const base: DataTableColumn<TarifaServicioBusqueda & { _checked?: boolean }>[] = [
      {
        key: "codigo",
        header: "Código",
        headerClassName: "text-center w-36",
        cellClassName: "px-3 py-2 text-center tabular-nums text-(--color-primary) whitespace-nowrap",
        render: (x) => x.codigo,
      },
      {
        key: "descripcion",
        header: "Descripción",
        cellClassName: "px-3 py-2 whitespace-nowrap",
        render: (x) => x.descripcion,
      },
      {
        key: "unidad",
        header: "Unidad",
        headerClassName: "text-center w-24",
        cellClassName: "px-3 py-2 text-center tabular-nums whitespace-nowrap",
        render: (x) => x.unidad ?? "—",
      },
      {
        key: "precio_sin_igv",
        header: <span className="whitespace-nowrap">Precio sin IGV</span>,
        headerClassName: "text-right w-32 min-w-[7rem]",
        cellClassName: "px-3 py-2 text-right whitespace-nowrap",
        render: (x) => {
          if (x.precio_sin_igv == null || x.precio_sin_igv === "") return "—";
          return (
            <div className="flex justify-end items-baseline gap-0">
              <span className="inline-block w-10 shrink-0 text-right tabular-nums">S/. </span>
              <span className="tabular-nums inline-block min-w-18 text-right">
                {x.precio_sin_igv}
              </span>
            </div>
          );
        },
      },
      {
        key: "nomenclador",
        header: "Nomenclador",
        headerClassName: "text-center min-w-[100px]",
        cellClassName: "px-3 py-2 text-center text-(--color-text-secondary) whitespace-nowrap",
        render: (x) => x.nomenclador ?? "—",
      },
    ];
    if (multiSelect) {
      base.unshift({
        key: "check",
        header: "",
        headerClassName: "w-12 text-center",
        cellClassName: "px-2 py-2 text-center",
        render: (x) => (
          <input
            type="checkbox"
            checked={selectedIds.has(x.id)}
            onChange={() => toggleSelect(x.id)}
            className="h-4 w-4 rounded border border-(--border-color-default)"
            onClick={(e) => e.stopPropagation()}
          />
        ),
      });
    }
    return base;
  }, [multiSelect, selectedIds, toggleSelect]);

  const rowsWithCheck = React.useMemo(
    () => data.map((r) => ({ ...r, _checked: selectedIds.has(r.id) })),
    [data, selectedIds]
  );

  if (!citaId || !tarifaId) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-8">
        <p className="text-sm text-(--color-text-secondary)">
          No hay tarifario asignado. Seleccione un plan en la atención.
        </p>
        <SecondaryButton onClick={() => navigate(`/admision/citas/agenda/${citaId}/atencion`)}>
          Regresar
        </SecondaryButton>
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
                disabled={selectedIds.size === 0}
              >
                Agregar seleccionados ({selectedIds.size})
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
        <>
          <DataTable
            rows={rowsWithCheck}
            columns={columns}
            loading={loading}
            selectedId={null}
            getRowId={(r) => r.id}
            onSelect={handleRowSelect}
            onDoubleClick={handleDoubleClick}
            emptyText="No hay servicios activos."
          />
          {meta && (
            <PaginationFooter
              meta={meta}
              variant="desktop"
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            />
          )}
        </>
      ) : (
        <>
          <MobileEntityList
            rows={data}
            loading={loading}
            selectedId={null}
            getRowId={(r) => r.id}
            onSelect={(r) =>
              multiSelect ? toggleSelect(r.id) : handleDoubleClick(r)
            }
            renderMain={(r) => {
              const precioStr =
                r.precio_sin_igv != null && r.precio_sin_igv !== ""
                  ? `S/. ${r.precio_sin_igv}`
                  : "—";
              return (
                <div className="flex items-start gap-2 min-w-0">
                  {multiSelect && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
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
                        Unidad: {r.unidad ?? "—"} ·
                      </span>
                      <span className="whitespace-nowrap">
                        Precio sin IGV: {precioStr}
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
            />
          )}
        </>
      )}
    </div>
  );
}
