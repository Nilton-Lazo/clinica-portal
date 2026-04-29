import * as React from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { toastService } from "../../../../../shared/notifications";
import { listTarifas } from "../../../services/tarifas.service";
import { upsertServiciosDefaultEmergenciaByTarifa, listServiciosDefaultEmergenciaByTarifa } from "../services/serviciosDefaultEmergencia.service";
import { ServicioPicker } from "../../../../admision/citas/agenda/components/ServicioPicker";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { getApiErrorMessage } from "../../../../../shared/api/apiError";
import {
  buscarServiciosTarifa,
  getIgvPorcentaje,
  type TarifaServicioBusqueda,
} from "../../../../admision/citas/agenda/services/atencionCita.service";
import { PRECISION_DECIMAL } from "../../../../../shared/constants/decimalPrecision";

type Row = {
  codigo: string;
  descripcion: string;
  precioConIgv: string;
  recargoActivo: boolean;
  recargoPct: number;
};

function normalizeCodigoForDefault(codigo: string): string {
  return codigo.replace(/\./g, "").trim().toUpperCase();
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

export default function ServiciosDefaultEmergenciaPage() {
  const [loadingTarifas, setLoadingTarifas] = React.useState(true);
  const [tarifas, setTarifas] = React.useState<SelectOption[]>([]);
  const [tarifaId, setTarifaId] = React.useState<number | null>(0);

  const [loadingDefaults, setLoadingDefaults] = React.useState(false);
  const [serviciosDefault, setServiciosDefault] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [tarifaReferenciaId, setTarifaReferenciaId] = React.useState<number | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
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

  React.useEffect(() => {
    if (tarifaId == null) return;
    if (tarifaId !== 0) {
      setTarifaReferenciaId(tarifaId);
      return;
    }
    if (tarifaReferenciaId != null) return;
    if (!tarifas.length) return;
    const first = Number(tarifas[0]?.value ?? 0);
    if (first > 0) setTarifaReferenciaId(first);
  }, [tarifaId, tarifaReferenciaId, tarifas]);

  React.useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoadingTarifas(true);
      try {
        const res = await listTarifas({ page: 1, per_page: 100, status: "ACTIVO" });
        if (!alive) return;
        const opts: SelectOption[] = (res.data ?? []).map((t) => {
          const label = t.codigo ? `${t.codigo} · ${t.descripcion_tarifa}` : `Tarifa ${t.id}`;
          return { value: String(t.id), label };
        });
        setTarifas(opts);
      } catch {
        if (!alive) return;
        setTarifas([]);
      } finally {
        if (alive) setLoadingTarifas(false);
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (tarifaId == null) return;
    let cancelled = false;
    const run = async () => {
      setLoadingDefaults(true);
      try {
        let codes: string[] = [];
        if (tarifaId === 0) {
          codes = [];
        } else {
          codes = await listServiciosDefaultEmergenciaByTarifa(tarifaId);
        }

        if (cancelled) return;
        setServiciosDefault(codes);
        setDirty(false);
      } catch {
        if (cancelled) return;
        setServiciosDefault([]);
        setDirty(false);
      } finally {
        if (!cancelled) setLoadingDefaults(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [tarifaId]);

  const [detalleByNorm, setDetalleByNorm] = React.useState<Map<string, TarifaServicioBusqueda>>(new Map());
  const [igvPct, setIgvPct] = React.useState<number>(18);
  const [needsFetchDetalles, setNeedsFetchDetalles] = React.useState(false);
  const [recargoTick, setRecargoTick] = React.useState(0);
  const [loadingDetalles, setLoadingDetalles] = React.useState(false);

  React.useEffect(() => {
    void getIgvPorcentaje()
      .then((v) => setIgvPct(v))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (tarifaReferenciaId == null) return;
    setDetalleByNorm(new Map());
    setNeedsFetchDetalles(serviciosDefault.length > 0);
  }, [tarifaReferenciaId, serviciosDefault.length]);

  React.useEffect(() => {
    if (tarifaReferenciaId == null) return;
    if (loadingDefaults) return;
    if (serviciosDefault.length === 0) {
      setDetalleByNorm(new Map());
      setNeedsFetchDetalles(false);
      return;
    }
    if (detalleByNorm.size === 0) setNeedsFetchDetalles(true);
  }, [tarifaReferenciaId, serviciosDefault.length, detalleByNorm.size, loadingDefaults]);

  React.useEffect(() => {
    if (tarifaReferenciaId == null) return;
    if (!needsFetchDetalles && recargoTick === 0) return;
    if (serviciosDefault.length === 0) {
      setDetalleByNorm(new Map());
      setNeedsFetchDetalles(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoadingDetalles(true);
      try {
        const horaReal = getHoraActual();
        const nextIgvPct = await getIgvPorcentaje();
        if (cancelled) return;
        setIgvPct(nextIgvPct);

        const uniqueByNorm = new Map<string, string>();
        for (const rawCodigo of serviciosDefault) {
          const norm = normalizeCodigoForDefault(rawCodigo);
          if (!norm) continue;
          if (!uniqueByNorm.has(norm)) uniqueByNorm.set(norm, rawCodigo);
        }

        const normKeys = Array.from(uniqueByNorm.keys());
        const maxConcurrent = 4;

        const newMap = new Map<string, TarifaServicioBusqueda>();

        for (let i = 0; i < normKeys.length; i += maxConcurrent) {
          const chunkNorms = normKeys.slice(i, i + maxConcurrent);
          await Promise.all(
            chunkNorms.map(async (norm) => {
              const rawCodigo = uniqueByNorm.get(norm) ?? norm;
              const res = await buscarServiciosTarifa(tarifaReferenciaId, {
                page: 1,
                per_page: 25,
                codigo: rawCodigo,
                status: "ACTIVO",
                hora: horaReal,
              });

              const found =
                res.data.find(
                  (s) => normalizeCodigoForDefault(String(s.codigo ?? "")) === normalizeCodigoForDefault(rawCodigo)
                ) ?? res.data[0] ?? null;

              if (cancelled) return;
              if (found) newMap.set(norm, found);
            })
          );
        }

        if (cancelled) return;
        setDetalleByNorm(newMap);
        setNeedsFetchDetalles(false);
      } catch {
        if (cancelled) return;
        setDetalleByNorm(new Map());
        setNeedsFetchDetalles(false);
      } finally {
        if (!cancelled) setLoadingDetalles(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [tarifaReferenciaId, needsFetchDetalles, recargoTick, serviciosDefault]);

  const tarifaReferenciaIdRef = React.useRef<number | null>(tarifaReferenciaId);
  React.useEffect(() => {
    tarifaReferenciaIdRef.current = tarifaReferenciaId;
  }, [tarifaReferenciaId]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ tarifaId?: number }>;
      const nextTarifaId = ce.detail?.tarifaId ?? null;
      if (!nextTarifaId) return;
      if (tarifaReferenciaIdRef.current == null) return;
      if (tarifaReferenciaIdRef.current !== nextTarifaId) return;
      setNeedsFetchDetalles(true);
      setRecargoTick((t) => t + 1);
    };

    window.addEventListener("recargoNoche:changed", handler);
    return () => {
      window.removeEventListener("recargoNoche:changed", handler);
    };
  }, []);

  const rows: Row[] = React.useMemo(() => {
    const igvFactor = 1 + igvPct / 100;

    return serviciosDefault.map((codigo) => {
      const norm = normalizeCodigoForDefault(codigo);
      const d = detalleByNorm.get(norm);

      if (!d) {
        return {
          codigo,
          descripcion: "—",
          precioConIgv: "—",
          recargoActivo: false,
          recargoPct: 0,
        };
      }

      const precioSinIgv = parseFloat(String(d.precio_sin_igv ?? ""));
      const recargoActivo = Boolean(d.recargo_noche_activo) && (d.recargo_noche_porcentaje ?? 0) > 0;
      const recargoPct = d.recargo_noche_porcentaje ?? 0;

      if (!Number.isFinite(precioSinIgv)) {
        return {
          codigo,
          descripcion: d.descripcion ?? "—",
          precioConIgv: "—",
          recargoActivo,
          recargoPct,
        };
      }

      const precioConRecargoSinIgv = precioConRecargo(precioSinIgv, recargoActivo, recargoPct);
      const precioConRecargoConIgv = precioConRecargoSinIgv * igvFactor;
      const precioStr = `S/. ${precioConRecargoConIgv.toFixed(PRECISION_DECIMAL)}`;

      return {
        codigo,
        descripcion: d.descripcion ?? "—",
        precioConIgv: precioStr,
        recargoActivo,
        recargoPct,
      };
    });
  }, [serviciosDefault, detalleByNorm, igvPct]);

  const columns: DataTableColumn<Row>[] = React.useMemo(
    () => [
      {
        key: "codigo",
        header: "Código",
        headerClassName: "text-left align-middle",
        cellClassName: "px-3 py-2 text-left tabular-nums align-middle",
        render: (x) => x.codigo,
      },
      {
        key: "descripcion",
        header: "Descripción",
        headerClassName: "text-left align-middle",
        cellClassName: "px-3 py-2 max-w-[280px] align-middle",
        render: (x) => (
          <span className="block wrap-break-word whitespace-normal text-left leading-snug text-sm">
            {x.descripcion ?? "—"}
          </span>
        ),
      },
      {
        key: "precioConIgv",
        header: "Precio con IGV",
        headerClassName: "text-right align-middle",
        cellClassName: "px-3 py-2 text-right align-middle",
        render: (x) => (
          <div className="flex flex-col items-end gap-0.5">
            <span className="tabular-nums text-sm">{x.precioConIgv}</span>
            {x.recargoActivo && x.recargoPct > 0 && (
              <span className="text-xs text-(--color-primary)">Recargo {x.recargoPct}%</span>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "",
        headerClassName: "w-12 text-center align-middle",
        cellClassName: "px-2 py-2 text-center align-middle",
        render: (x) => {
          const norm = normalizeCodigoForDefault(x.codigo);
          return (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded border border-(--color-danger) bg-(--color-surface) text-(--color-danger) w-7 h-7 transition-transform duration-150 hover:scale-[1.12] active:scale-[0.98] hover:bg-(--color-danger) hover:text-(--color-text-inverse)"
              onClick={(e) => {
                e.stopPropagation();
                setServiciosDefault((prev) => prev.filter((c) => normalizeCodigoForDefault(c) !== norm));
                setDetalleByNorm((prev) => {
                  const next = new Map(prev);
                  next.delete(norm);
                  return next;
                });
                setDirty(true);
              }}
              aria-label={`Eliminar ${x.codigo}`}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          );
        },
      },
    ],
    []
  );

  const tarifaReferenciaLabel = React.useMemo(() => {
    if (tarifaReferenciaId == null) return "—";
    return tarifas.find((t) => t.value === String(tarifaReferenciaId))?.label ?? "—";
  }, [tarifas, tarifaReferenciaId]);

  const onPickServiciosDefault = React.useCallback(
    (servicios: TarifaServicioBusqueda[]) => {
      const incoming = servicios
        .map((s) => (s.codigo == null ? "" : String(s.codigo).trim()))
        .filter(Boolean);

      if (!incoming.length) return;

      setServiciosDefault((prev) => {
        const prevNorm = new Set(prev.map((c) => normalizeCodigoForDefault(c)));
        const next = [...prev];
        for (const rawCodigo of incoming) {
          const norm = normalizeCodigoForDefault(rawCodigo);
          if (prevNorm.has(norm)) continue;
          prevNorm.add(norm);
          next.push(rawCodigo);
        }
        return next;
      });

      setDetalleByNorm((prev) => {
        const next = new Map(prev);
        for (const s of servicios) {
          const codigo = s.codigo == null ? "" : String(s.codigo).trim();
          if (!codigo) continue;
          const norm = normalizeCodigoForDefault(codigo);
          if (!norm) continue;
          next.set(norm, s);
        }
        return next;
      });

      setDirty(true);
    },
    [setDetalleByNorm]
  );

  const onSave = React.useCallback(async () => {
    if (tarifaId == null) return;
    setSaving(true);
    try {
      if (tarifaId === 0) {
        const targetTarifas = tarifas
          .map((t) => Number(t.value))
          .filter((id) => Number.isFinite(id) && id > 0);
        if (!targetTarifas.length) throw new Error("No hay tarifarios activos.");

        const maxConcurrent = 4;
        for (let i = 0; i < targetTarifas.length; i += maxConcurrent) {
          const chunk = targetTarifas.slice(i, i + maxConcurrent);
          await Promise.all(chunk.map((id) => upsertServiciosDefaultEmergenciaByTarifa(id, serviciosDefault)));
        }
      } else {
        await upsertServiciosDefaultEmergenciaByTarifa(tarifaId, serviciosDefault);
      }
      setDirty(false);
      toastService.showSuccess("Servicios por defecto guardados.");
    } catch (e) {
      toastService.showError(getApiErrorMessage(e, "No se pudieron guardar los servicios por defecto."));
    } finally {
      setSaving(false);
    }
  }, [tarifaId, tarifas, serviciosDefault]);

  React.useEffect(() => {
    if (!dirty) return;
    if (tarifaId == null) return;
    if (loadingDefaults) return;
    if (tarifaId === 0 && tarifas.length === 0) return;

    const t = window.setTimeout(() => {
      void onSave();
    }, 700);

    return () => {
      window.clearTimeout(t);
    };
  }, [dirty, tarifaId, loadingDefaults, tarifas.length, onSave]);

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-(--color-text-primary)">Servicios por defecto (Emergencia)</div>
          <div className="text-sm text-(--color-text-secondary)">Por cada tarifario, define qué servicios se precargan automáticamente.</div>
        </div>
        <div className="flex gap-2 lg:justify-end">
          <Link
            to="/ficheros/parametros/emergencia"
            className="h-10 rounded px-4 text-sm font-medium border border-(--border-color-default) bg-(--color-surface) text-(--color-text-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto inline-flex items-center justify-center"
          >
            Volver
          </Link>
          {saving ? (
            <div className="flex items-center text-sm text-(--color-text-secondary) px-2">
              Guardando…
            </div>
          ) : null}
        </div>
      </div>

      <div className="w-full shrink-0">
        <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-3 mt-3">
          <div className="text-sm font-semibold text-(--color-text-primary)">Seleccionar</div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-(--color-text-secondary)">Aplicar a</label>
              <div className="mt-1">
                <SelectMenu
                  value={tarifaId != null ? String(tarifaId) : "0"}
                  onChange={(v) => setTarifaId(Number(v))}
                  options={[{ value: "0", label: "Todos los tarifarios" }, ...tarifas]}
                  ariaLabel="Aplicar a"
                  buttonClassName="w-full h-8 lg:h-8 lg:rounded text-sm"
                  menuClassName="min-w-full"
                  disabled={loadingTarifas}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-(--color-text-secondary)">Tarifario de referencia</label>
              <div className="mt-1">
                <SelectMenu
                  value={tarifaReferenciaId != null ? String(tarifaReferenciaId) : ""}
                  onChange={(v) => setTarifaReferenciaId(v ? Number(v) : null)}
                  options={[{ value: "", label: "Seleccione referencia" }, ...tarifas]}
                  ariaLabel="Tarifario de referencia"
                  buttonClassName="w-full h-8 lg:h-8 lg:rounded text-sm"
                  menuClassName="min-w-full"
                  disabled={tarifaId !== 0 || loadingTarifas}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-3 mt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-(--color-text-primary)">Servicios precargados</h3>
            <div className="flex gap-2">
              <PrimaryButton
                onClick={() => setPickerOpen(true)}
                disabled={tarifaReferenciaId == null || loadingTarifas}
                title={tarifaReferenciaId == null ? "Selecciona un tarifario de referencia" : "Buscar y agregar servicios"}
              >
                Buscar servicio
              </PrimaryButton>
            </div>
          </div>

          <div className="hidden lg:block mt-3">
            <DataTable
              rows={rows}
              columns={columns}
              loading={loadingDefaults || loadingDetalles}
              selectedId={null}
              getRowId={(x) => x.codigo}
              onSelect={(row) => {
                void row;
              }}
              emptyText={tarifaId == null ? "Seleccione un tarifario." : "No hay servicios por defecto. Use “Buscar servicio” para agregar."}
            />
          </div>

          <div className="lg:hidden mt-3">
            <MobileEntityList
              rows={rows}
              loading={loadingDefaults || loadingDetalles}
              selectedId={null}
              getRowId={(x) => x.codigo}
              onSelect={(row) => {
                void row;
              }}
              renderMain={(x) => (
                <div className="min-w-0 flex flex-col gap-0.5">
                  <div className="text-sm font-semibold text-(--color-text-primary) tabular-nums truncate">{x.codigo}</div>
                  <div className="text-xs text-(--color-text-secondary) truncate">{x.descripcion}</div>
                  <div className="text-xs text-(--color-text-primary) tabular-nums">
                    {x.precioConIgv}
                    {x.recargoActivo && x.recargoPct > 0 ? ` (Recargo ${x.recargoPct}%)` : ""}
                  </div>
                </div>
              )}
              renderRight={(x) => (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded border border-(--color-danger) bg-(--color-surface) text-(--color-danger) w-8 h-8 transition-transform duration-150 hover:scale-[1.12] active:scale-[0.98] hover:bg-(--color-danger) hover:text-(--color-text-inverse)"
                  onClick={(e) => {
                    e.stopPropagation();
                    const norm = normalizeCodigoForDefault(x.codigo);
                    setServiciosDefault((prev) => prev.filter((c) => normalizeCodigoForDefault(c) !== norm));
                    setDetalleByNorm((prev) => {
                      const next = new Map(prev);
                      next.delete(norm);
                      return next;
                    });
                    setDirty(true);
                  }}
                  aria-label={`Eliminar ${x.codigo}`}
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              emptyText={tarifaId == null ? "Seleccione un tarifario." : "No hay servicios por defecto. Use “Buscar servicio” para agregar."}
            />
          </div>

          <div className="mt-4">
            <SecondaryButton
              onClick={() => {
                setConfirmClearOpen(true);
              }}
              disabled={tarifaId == null || serviciosDefault.length === 0 || saving}
            >
              Limpiar lista
            </SecondaryButton>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        title="Limpiar lista"
        description="¿Deseas quitar todos los servicios por defecto de la lista?"
        confirmText="Limpiar"
        cancelText="Cancelar"
        destructive
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          setConfirmClearOpen(false);
          setServiciosDefault([]);
          setDetalleByNorm(new Map());
          setNeedsFetchDetalles(false);
          setDirty(true);
        }}
      />


      <ServicioPicker
        open={pickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setPickerOpen(false)}
        onSelect={(selected) => {
          onPickServiciosDefault(selected);
          setPickerOpen(false);
        }}
        tarifaId={tarifaReferenciaId}
        tarifaDescripcion={tarifaReferenciaLabel}
      />
    </div>
  );
}

