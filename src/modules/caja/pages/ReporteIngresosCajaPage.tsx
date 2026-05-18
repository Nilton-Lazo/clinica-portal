import * as React from "react";
import { FolderInput, SlidersHorizontal } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/buttons";
import { SelectField } from "../../admision/historia-clinica/wizard/ui/formFields";
import { SelectMenu, type SelectOption } from "../../../shared/ui/SelectMenu";
import { toastService } from "../../../shared/notifications";
import { getApiErrorMessage } from "../../../shared/api/apiError";
import { useRealtimeModuleRefresh } from "../../../shared/realtime/useRealtimeModuleRefresh";
import {
  fetchReporteIngresosBootstrap,
  fetchReporteIngresosMovimientos,
  type ReporteIngresosBootstrap,
  type ReporteIngresosMedio,
  type ReporteIngresosMovimiento,
} from "../services/reporteIngresosCaja.service";
import { ReporteIngresoMediosResumen } from "../components/ReporteIngresoMediosResumen";
import { ReporteIngresosAperturasMobileList } from "../components/ReporteIngresosAperturasMobileList";
import { ReporteIngresosAperturasTable } from "../components/ReporteIngresosAperturasTable";
import { ReporteIngresosMovimientosTable } from "../components/ReporteIngresosMovimientosTable";
import { ReporteIngresosMovimientosMobileList } from "../components/ReporteIngresosMovimientosMobileList";
import { ReporteFraccionarPagoModal } from "../components/ReporteFraccionarPagoModal";
import { PaginationFooter } from "../../../shared/crud/PaginationFooter";
import type { PaginationMeta } from "../../../shared/types/pagination";
import { closeAperturaCaja } from "../services/aperturaCaja.service";
import type { CajaAperturaTipo } from "../types/aperturaCaja.types";
import { ConfirmDialog } from "../../ficheros/components/ConfirmDialog";
import { nextGridSort } from "../../../shared/datagrid/gridSortCycle";
import type { SortDirection } from "../../../shared/datagrid/types";

const pageWrap = "flex w-full min-h-0 flex-1 flex-col gap-4 lg:gap-2";

const mainSheet =
  "flex flex-col gap-5 overflow-visible rounded-md border border-(--color-border) bg-(--color-surface) p-4 shadow-sm sm:p-5";

const sectionCard =
  "rounded-md border border-(--color-border) bg-(--color-background) p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";
const sectionCardFlush =
  "rounded-md bg-transparent p-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] overflow-hidden";

const sectionTitle = "text-sm font-semibold text-(--color-text-primary)";

const lbl = "text-sm text-(--color-text-primary)";

const readoutInline =
  "inline-flex h-10 w-fit max-w-full min-w-[4.5rem] shrink-0 items-center rounded-md border border-(--border-color-default) bg-[#E8EAEE] px-3 text-sm text-(--color-text-primary)";

const menuWide = "min-w-full max-w-[calc(100vw-2rem)]";

const CAJA_REPORTE_ENTITIES = ["caja_apertura", "emision_comprobante"];
const FICHEROS_CAJA_ENTITIES = [
  "caja_medio_pago",
  "caja_forma_pago",
  "caja_banco_tarjeta",
  "caja_numeracion_comprobante",
  "caja_tipo_documento",
];
const ADMISION_REPORTE_ENTITIES = ["cuenta", "cita_atencion", "prefacturacion_hospitalaria", "paciente"];
const EMERGENCIA_REPORTE_ENTITIES = ["registro_emergencia", "atencion_emergencia"];

const MOV_PER_PAGE_OPTS: SelectOption[] = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

const defaultMovMeta: PaginationMeta = {
  current_page: 1,
  per_page: 25,
  total: 0,
  last_page: 1,
};

function parseMonto(raw: string): number {
  const n = parseFloat(String(raw).replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function parseAjuste(raw: string): number {
  const normalized = String(raw).replace(/\s+/g, "").replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatMonto2(value: number): string {
  return value.toFixed(2);
}

function formatAjuste(value: number): string {
  if (Math.abs(value) < 1e-9) return "0.00";
  const sign = value > 0 ? "+" : "-";
  const abs = Math.abs(value).toFixed(3).replace(/\.?0+$/, "");
  return `${sign} ${abs}`;
}

function KpiSoles({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  const amountClass = muted ? "text-(--color-text-secondary)" : "text-(--color-text-primary)";
  return (
    <div className="rounded-md border border-(--color-border) bg-(--color-surface) px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">{label}</div>
      <div className={`mt-1 flex items-baseline justify-start gap-2 text-base font-semibold tracking-tight tabular-nums ${amountClass}`}>
        <span className="text-(--color-text-secondary)">S/.</span>
        <span>{value}</span>
      </div>
    </div>
  );
}

export default function ReporteIngresosCajaPage() {
  const [boot, setBoot] = React.useState<ReporteIngresosBootstrap | null>(null);
  const [bootErr, setBootErr] = React.useState(false);
  const [bootLoading, setBootLoading] = React.useState(true);
  const [numeracionId, setNumeracionId] = React.useState("");
  const [aperturaId, setAperturaId] = React.useState<string | null>(null);
  const [movs, setMovs] = React.useState<ReporteIngresosMovimiento[]>([]);
  const [movPage, setMovPage] = React.useState(1);
  const [movPerPage, setMovPerPage] = React.useState(25);
  const [movMeta, setMovMeta] = React.useState<PaginationMeta>(defaultMovMeta);
  const [totalesMedio, setTotalesMedio] = React.useState<Record<string, string>>({});
  const [totalesDoc, setTotalesDoc] = React.useState({ facturas: "0.00", boletas: "0.00", recibo_caja: "0.00" });
  const [ajusteCalculado, setAjusteCalculado] = React.useState("0.00");
  const [totalArqueadoCalculado, setTotalArqueadoCalculado] = React.useState("0.00");
  const [editarTotalArqueado, setEditarTotalArqueado] = React.useState(false);
  const [totalArqueadoEditado, setTotalArqueadoEditado] = React.useState("0.00");
  const [cerrandoCaja, setCerrandoCaja] = React.useState(false);
  const [confirmCierreOpen, setConfirmCierreOpen] = React.useState(false);
  const [movLoading, setMovLoading] = React.useState(false);
  const [realtimeReloadKey, setRealtimeReloadKey] = React.useState(0);
  const [aperturasPage, setAperturasPage] = React.useState<number | undefined>(undefined);
  const [aperturasSortState, setAperturasSortState] = React.useState<{
    sort: string | null;
    sortDir: SortDirection;
  }>({ sort: null, sortDir: "desc" });
  const [movSortState, setMovSortState] = React.useState<{
    sort: string | null;
    sortDir: SortDirection;
  }>({ sort: null, sortDir: "asc" });
  const { sort: aperturasSort, sortDir: aperturasSortDir } = aperturasSortState;
  const { sort: movSort, sortDir: movSortDir } = movSortState;
  const [aperturasBusy, setAperturasBusy] = React.useState(false);
  const [codigoAperturaReadout, setCodigoAperturaReadout] = React.useState<string | null>(null);
  const [movSelectedId, setMovSelectedId] = React.useState<string | null>(null);
  const [fraccionarModalOpen, setFraccionarModalOpen] = React.useState(false);
  const movimientosSectionRef = React.useRef<HTMLElement | null>(null);

  const movSelectedRow = React.useMemo(
    () => (movSelectedId ? movs.find((r) => r.id === movSelectedId) ?? null : null),
    [movs, movSelectedId]
  );

  React.useEffect(() => {
    setMovSelectedId(null);
  }, [aperturaId, numeracionId, movPage, movPerPage]);

  React.useEffect(() => {
    if (!movSelectedId || fraccionarModalOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const node = movimientosSectionRef.current;
      if (!node) return;
      if (!node.contains(e.target as Node)) {
        setMovSelectedId(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [movSelectedId, fraccionarModalOpen]);

  React.useEffect(() => {
    setMovSelectedId((prev) => {
      if (prev == null) return prev;
      return movs.some((r) => r.id === prev) ? prev : null;
    });
  }, [movs]);

  React.useEffect(() => {
    if (fraccionarModalOpen && !movSelectedRow) setFraccionarModalOpen(false);
  }, [fraccionarModalOpen, movSelectedRow]);

  const onSelectMovimiento = React.useCallback((row: ReporteIngresosMovimiento) => {
    setMovSelectedId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const toggleAperturasSort = React.useCallback((columnId: string) => {
    setAperturasSortState((prev) => nextGridSort(prev, columnId, { column: "fecha", direction: "desc" }));
    setAperturasPage(1);
  }, []);

  const toggleMovSort = React.useCallback((columnId: string) => {
    setMovSortState((prev) => nextGridSort(prev, columnId, { column: "nro_cuenta", direction: "asc" }));
    setMovPage(1);
  }, []);

  useRealtimeModuleRefresh({
    module: "caja",
    entities: CAJA_REPORTE_ENTITIES,
    onEvent: () => setRealtimeReloadKey((key) => key + 1),
  });

  useRealtimeModuleRefresh({
    module: "ficheros",
    entities: FICHEROS_CAJA_ENTITIES,
    onEvent: () => setRealtimeReloadKey((key) => key + 1),
  });

  useRealtimeModuleRefresh({
    module: "admision",
    entities: ADMISION_REPORTE_ENTITIES,
    onEvent: () => setRealtimeReloadKey((key) => key + 1),
  });

  useRealtimeModuleRefresh({
    module: "emergencia",
    entities: EMERGENCIA_REPORTE_ENTITIES,
    onEvent: () => setRealtimeReloadKey((key) => key + 1),
  });

  React.useEffect(() => {
    let c = false;
    const initialBootstrap = aperturasPage === undefined;
    if (initialBootstrap) {
      setBootLoading(true);
    } else {
      setAperturasBusy(true);
    }
    setBootErr(false);
    fetchReporteIngresosBootstrap({
      ...(aperturasPage !== undefined ? { aperturasPage } : {}),
      sort: aperturasSort ?? undefined,
      sort_dir: aperturasSortDir,
    })
      .then((b) => {
        if (c) return;
        setBoot(b);
        if (aperturasPage === undefined && b.aperturas_meta) {
          setAperturasPage(b.aperturas_meta.current_page);
        }
        const pref = b.apertura_preferida_id;
        const rows = b.aperturas;
        setAperturaId((current) => {
          if (current && rows.some((a) => a.id === current)) {
            return current;
          }
          if (current) {
            return current;
          }
          if (pref && rows.some((a) => a.id === pref)) {
            return pref;
          }
          if (rows[0]) {
            return rows[0].id;
          }
          return null;
        });
      })
      .catch((e) => {
        if (!c) {
          setBootErr(true);
          toastService.showError(getApiErrorMessage(e, "No se pudieron cargar aperturas, series y medios de pago del reporte de ingresos."));
        }
      })
      .finally(() => {
        if (!c) {
          setBootLoading(false);
          setAperturasBusy(false);
        }
      });
    return () => {
      c = true;
    };
  }, [realtimeReloadKey, aperturasPage, aperturasSort, aperturasSortDir]);

  React.useEffect(() => {
    if (!aperturaId) {
      setCodigoAperturaReadout(null);
      return;
    }
    const row = boot?.aperturas.find((a) => a.id === aperturaId);
    if (row) {
      setCodigoAperturaReadout(row.codigo);
    }
  }, [boot, aperturaId]);

  React.useEffect(() => {
    setMovPage(1);
  }, [aperturaId, numeracionId, movPerPage]);

  React.useEffect(() => {
    setMovs([]);
  }, [aperturaId, numeracionId]);

  React.useEffect(() => {
    if (!aperturaId) {
      setMovs([]);
      setMovMeta(defaultMovMeta);
      setTotalesMedio({});
      setTotalesDoc({ facturas: "0.00", boletas: "0.00", recibo_caja: "0.00" });
      return;
    }
    let c = false;
    setMovLoading(true);
    fetchReporteIngresosMovimientos({
      cajaAperturaId: Number(aperturaId),
      numeracionId: numeracionId.trim() || undefined,
      page: movPage,
      perPage: movPerPage,
      sort: movSort ?? undefined,
      sort_dir: movSortDir,
    })
      .then((d) => {
        if (c) return;
        setMovs(d.movimientos);
        setMovMeta(d.meta);
        setTotalesMedio(d.totales_por_medio);
        setTotalesDoc(d.totales_documento);
      })
      .catch((e) => {
        if (!c) {
          toastService.showError(getApiErrorMessage(e, "No se pudieron cargar los movimientos de la apertura seleccionada."));
          setMovs([]);
          setMovMeta(defaultMovMeta);
        }
      })
      .finally(() => {
        if (!c) setMovLoading(false);
      });
    return () => {
      c = true;
    };
  }, [aperturaId, numeracionId, movPage, movPerPage, movSort, movSortDir, realtimeReloadKey]);

  const serieOpts: SelectOption[] = React.useMemo(() => {
    const rows = boot?.series ?? [];
    return [{ value: "", label: "Todas las series" }, ...rows.map((s) => ({ value: String(s.id), label: s.label }))];
  }, [boot]);

  const mediosContado = React.useMemo<ReporteIngresosMedio[]>(() => boot?.medios_contado ?? [], [boot]);
  const mediosAdicionales = React.useMemo<ReporteIngresosMedio[]>(() => boot?.medios_adicionales ?? [], [boot]);
  const aperturaSeleccionada = React.useMemo(
    () => (boot?.aperturas ?? []).find((x) => x.id === aperturaId) ?? null,
    [boot, aperturaId]
  );

  const resolveCierreOperacion = React.useCallback(():
    | { error: string }
    | { tipo: CajaAperturaTipo; montoCierre: number; ajusteCierre: number } => {
    if (!aperturaSeleccionada) {
      return { error: "Selecciona una apertura para cerrar la caja." };
    }
    if (aperturaSeleccionada.estado !== "APERTURADA") {
      return { error: "Solo puedes cerrar una caja que esté aperturada." };
    }
    const tipo = String(aperturaSeleccionada.tipo).toUpperCase();
    if (tipo !== "NORMAL" && tipo !== "CHICA") {
      return { error: "El tipo de caja seleccionado no es válido para cerrar." };
    }
    const montoBase = editarTotalArqueado ? totalArqueadoEditado : totalArqueadoCalculado;
    const montoCierre = parseMonto(montoBase);
    if (montoCierre < 0) {
      return { error: "El monto de cierre no puede ser menor a 0." };
    }
    const ajusteCierre = parseAjuste(ajusteCalculado);
    return { tipo: tipo as CajaAperturaTipo, montoCierre, ajusteCierre };
  }, [ajusteCalculado, aperturaSeleccionada, editarTotalArqueado, totalArqueadoEditado, totalArqueadoCalculado]);

  const cierreDialogDescription = React.useMemo(() => {
    const r = resolveCierreOperacion();
    if ("error" in r) {
      return "Revisa la apertura seleccionada y el monto arqueado antes de confirmar.";
    }
    const display = formatMonto2(r.montoCierre);
    return `¿Deseas cerrar esta caja? Se guardará S/. ${display} como monto de cierre.`;
  }, [resolveCierreOperacion]);

  const onCierreCajaConfirmed = React.useCallback(async () => {
    const r = resolveCierreOperacion();
    if ("error" in r) {
      toastService.showError(r.error);
      setConfirmCierreOpen(false);
      return;
    }
    setConfirmCierreOpen(false);
    setCerrandoCaja(true);
    try {
      await closeAperturaCaja({
        tipo: r.tipo,
        monto_cierre: Number(r.montoCierre.toFixed(3)),
        ajuste_cierre: Number(r.ajusteCierre.toFixed(3)),
      });
      toastService.showSuccess("Caja cerrada correctamente.");
      setEditarTotalArqueado(false);
      setRealtimeReloadKey((key) => key + 1);
    } catch (e) {
      toastService.showError(getApiErrorMessage(e, "No se pudo cerrar la caja con el monto arqueado indicado."));
    } finally {
      setCerrandoCaja(false);
    }
  }, [resolveCierreOperacion]);

  const totalEfectivoEstimado = React.useMemo(() => {
    let s = 0;
    for (const m of mediosContado) {
      if (!/efect/i.test(m.descripcion) && !/efect/i.test(m.codigo)) continue;
      s += Number(String(totalesMedio[String(m.id)] ?? "0").replace(",", ".")) || 0;
    }
    if (aperturaSeleccionada?.monto_apertura) {
      s += parseMonto(aperturaSeleccionada.monto_apertura);
    }
    return formatMonto2(s);
  }, [mediosContado, totalesMedio, aperturaSeleccionada]);

  React.useEffect(() => {
    if (aperturaSeleccionada?.estado === "CERRADA" && aperturaSeleccionada.monto_cierre !== "—") {
      setTotalArqueadoCalculado(aperturaSeleccionada.monto_cierre);
      if (aperturaSeleccionada.ajuste_cierre !== null) {
        setAjusteCalculado(formatAjuste(parseAjuste(aperturaSeleccionada.ajuste_cierre)));
      } else {
        setAjusteCalculado("0.00");
      }
      return;
    }
    setAjusteCalculado("0.00");
    setTotalArqueadoCalculado(totalEfectivoEstimado);
  }, [aperturaSeleccionada, totalEfectivoEstimado]);

  React.useEffect(() => {
    if (!editarTotalArqueado) {
      setTotalArqueadoEditado(totalArqueadoCalculado);
    }
  }, [editarTotalArqueado, totalArqueadoCalculado]);

  if (bootLoading) {
    return (
      <div className={pageWrap}>
        <div className={`${mainSheet} items-center justify-center py-16`}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent" />
            <span className="text-sm text-(--color-text-primary)">Cargando reporte…</span>
          </div>
        </div>
      </div>
    );
  }

  if (bootErr || !boot) {
    return (
      <div className={pageWrap}>
        <div className={`${mainSheet} text-sm text-(--color-text-primary)`}>
          No se pudieron cargar los datos del reporte.
        </div>
      </div>
    );
  }

  return (
    <div className={pageWrap}>
      <div className={mainSheet}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-stretch">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-end justify-start gap-x-4 gap-y-4 pb-2">
              <div className="flex w-fit min-w-0 max-w-full flex-col items-start">
                <SelectField
                  label="Serie"
                  value={numeracionId}
                  onChange={(v) => setNumeracionId(v)}
                  options={serieOpts}
                  ariaLabel="Filtrar por numeración activa"
                  buttonClassName="h-10 w-max min-w-[10rem] max-w-[min(100vw-2rem,36rem)]"
                  menuClassName={menuWide}
                  searchable
                  searchPlaceholder="Buscar serie…"
                />
              </div>
              <div className="flex w-fit min-w-0 max-w-full flex-col items-start">
                <label className={lbl} htmlFor="reporte-ingresos-readout-apertura">
                  Cod. apertura
                </label>
                <div className="mt-1">
                  <div
                    id="reporte-ingresos-readout-apertura"
                    className={readoutInline}
                    aria-label="Código de apertura seleccionada"
                  >
                    {codigoAperturaReadout ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            <section className={`${sectionCardFlush} h-full`}>
            <div className="px-0 pt-0 pb-6">
              <h2 className={sectionTitle}>Aperturas y cierres</h2>
            </div>
            <div className="px-0 pb-0">
            <div className="relative hidden lg:block">
              {aperturasBusy ? (
                <div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md bg-(--color-surface)/75 backdrop-blur-[1px]"
                  aria-hidden
                >
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent" />
                </div>
              ) : null}
              <ReporteIngresosAperturasTable
                rows={boot.aperturas}
                loading={aperturasBusy}
                selectedId={aperturaId}
                meta={boot.aperturas_meta}
                sort={aperturasSort}
                sortDir={aperturasSortDir}
                onToggleSort={toggleAperturasSort}
                onSelect={(row) => setAperturaId(row.id)}
                onPrev={() =>
                  setAperturasPage((prev) => {
                    const cur = prev ?? boot.aperturas_meta.current_page;
                    return Math.max(1, cur - 1);
                  })
                }
                onNext={() =>
                  setAperturasPage((prev) => {
                    const cur = prev ?? boot.aperturas_meta.current_page;
                    return Math.min(boot.aperturas_meta.last_page, cur + 1);
                  })
                }
                onFirst={() => setAperturasPage(1)}
                onLast={() => setAperturasPage(boot.aperturas_meta.last_page)}
                onRefresh={() => setRealtimeReloadKey((k) => k + 1)}
              />
            </div>
            <div className="lg:hidden">
              <ReporteIngresosAperturasMobileList
                rows={boot.aperturas}
                loading={aperturasBusy && boot.aperturas.length === 0}
                selectedId={aperturaId}
                onSelect={(row) => setAperturaId(row.id)}
              />
              {boot.aperturas_meta.total > 0 ? (
                <PaginationFooter
                  meta={boot.aperturas_meta}
                  variant="mobile"
                  onPrev={() =>
                    setAperturasPage((prev) => {
                      const cur = prev ?? boot.aperturas_meta.current_page;
                      return Math.max(1, cur - 1);
                    })
                  }
                  onNext={() =>
                    setAperturasPage((prev) => {
                      const cur = prev ?? boot.aperturas_meta.current_page;
                      return Math.min(boot.aperturas_meta.last_page, cur + 1);
                    })
                  }
                  onFirst={() => setAperturasPage(1)}
                  onLast={() => setAperturasPage(boot.aperturas_meta.last_page)}
                />
              ) : null}
            </div>
            </div>
            </section>
          </div>

          <section className={`${sectionCard} h-full`}>
            <h2 className={`${sectionTitle} mb-3`}>Resumen por medio de pago</h2>
            {mediosContado.length === 0 ? (
              <p className="text-sm text-(--color-text-secondary)">
                No hay medios de pago activos para contado, o no existe la forma «contado» en ficheros.
              </p>
            ) : (
              <ReporteIngresoMediosResumen
                medios={mediosContado}
                mediosAdicionales={mediosAdicionales}
                totalesPorMedio={totalesMedio}
              />
            )}
          </section>
        </div>
      </div>

      <section
        ref={movimientosSectionRef}
        className="flex flex-col gap-3 rounded-md border border-(--border-color-default) bg-(--color-surface) p-4 shadow-sm sm:p-5"
        aria-labelledby="reporte-movimientos-caja-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="reporte-movimientos-caja-heading" className={sectionTitle}>
              Movimientos de caja
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {movSelectedRow ? (
              <SecondaryButton
                type="button"
                disabled={
                  !aperturaId || !movSelectedRow.fraccionar_permitido || !movSelectedRow.fraccionar_context
                }
                onClick={() => setFraccionarModalOpen(true)}
                className="h-10 shrink-0 whitespace-nowrap px-3 text-sm"
                title={
                  !aperturaId
                    ? "Selecciona una apertura"
                    : !movSelectedRow.fraccionar_permitido
                      ? "Este comprobante ya tiene más de dos líneas de pago o no admite fraccionar"
                      : !movSelectedRow.fraccionar_context
                        ? "No hay datos para fraccionar este comprobante"
                        : undefined
                }
              >
                Detallar comprobante
              </SecondaryButton>
            ) : null}
            <div className="w-28 shrink-0">
              <SelectMenu
                value={String(movPerPage)}
                onChange={(v) => setMovPerPage(Number(v) || 25)}
                options={MOV_PER_PAGE_OPTS}
                ariaLabel="Registros por página"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
            {movLoading ? <span className="text-xs font-medium text-(--color-text-secondary)">Sincronizando…</span> : null}
          </div>
        </div>
        <div className="hidden min-w-0 lg:block">
          <ReporteIngresosMovimientosTable
            rows={movs}
            loading={movLoading}
            sinApertura={!aperturaId}
            selectedId={movSelectedId}
            meta={movMeta}
            sort={movSort}
            sortDir={movSortDir}
            onToggleSort={toggleMovSort}
            onSelectRow={onSelectMovimiento}
            onPrev={() => setMovPage((p) => Math.max(1, p - 1))}
            onNext={() => setMovPage((p) => Math.min(movMeta.last_page, p + 1))}
            onFirst={() => setMovPage(1)}
            onLast={() => setMovPage(movMeta.last_page)}
            onRefresh={() => setRealtimeReloadKey((k) => k + 1)}
          />
        </div>
        <div className="min-w-0 lg:hidden">
          <ReporteIngresosMovimientosMobileList
            rows={movs}
            loading={movLoading && movs.length === 0}
            sinApertura={!aperturaId}
            selectedId={movSelectedId}
            onSelectRow={onSelectMovimiento}
          />
          {aperturaId ? (
            <PaginationFooter
              meta={movMeta}
              variant="mobile"
              onPrev={() => setMovPage((p) => Math.max(1, p - 1))}
              onNext={() => setMovPage((p) => Math.min(movMeta.last_page, p + 1))}
              onFirst={() => setMovPage(1)}
              onLast={() => setMovPage(movMeta.last_page)}
            />
          ) : null}
        </div>
      </section>

      <div className={mainSheet}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiSoles label="Total facturas" value={totalesDoc.facturas} />
          <KpiSoles label="Total boletas" value={totalesDoc.boletas} />
          <KpiSoles label="Total recibo caja" value={totalesDoc.recibo_caja} />
          <KpiSoles label="Total ingreso en efectivo" value={totalEfectivoEstimado} />
          <KpiSoles label="Ajuste calculado ±" value={ajusteCalculado} muted />
          <div className="rounded-md border border-(--color-border) bg-(--color-surface) px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">Total efectivo arqueado</div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={editarTotalArqueado}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEditarTotalArqueado(checked);
                    if (!checked) {
                      setTotalArqueadoEditado(totalArqueadoCalculado);
                    }
                  }}
                  className="h-3.5 w-3.5 rounded border border-(--border-color-default) accent-(--color-primary)"
                  aria-label="Habilitar edición de total efectivo arqueado"
                />
              </label>
            </div>
            {editarTotalArqueado ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-(--color-text-secondary)">S/.</span>
                <input
                  value={totalArqueadoEditado}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^\d.]/g, "");
                    setTotalArqueadoEditado(cleaned);
                  }}
                  className="h-8 w-full rounded-md border border-(--border-color-default) bg-(--color-background) px-2 text-sm font-semibold tabular-nums text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)/30"
                  inputMode="decimal"
                  aria-label="Editar total efectivo arqueado"
                />
              </div>
            ) : (
              <div className="mt-1 flex items-baseline justify-start gap-2 text-base font-semibold tracking-tight tabular-nums text-(--color-text-primary)">
                <span className="text-(--color-text-secondary)">S/.</span>
                <span>{totalArqueadoCalculado}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-(--color-border) pt-4 sm:flex-row sm:justify-end">
          <SecondaryButton
            type="button"
            onClick={() => {
              const base = parseMonto(totalEfectivoEstimado);
              const redondeado = Math.round(base * 10) / 10;
              const ajuste = redondeado - base;
              const redondeadoFmt = formatMonto2(redondeado);
              setAjusteCalculado(formatAjuste(ajuste));
              setTotalArqueadoCalculado(redondeadoFmt);
              if (!editarTotalArqueado) {
                setTotalArqueadoEditado(redondeadoFmt);
              }
            }}
            className="inline-flex h-10 items-center justify-center gap-2 sm:min-w-[168px]"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
            Aplicar ajuste
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={cerrandoCaja}
            onClick={() => {
              const r = resolveCierreOperacion();
              if ("error" in r) {
                toastService.showError(r.error);
                return;
              }
              setConfirmCierreOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 sm:min-w-[168px]"
          >
            <FolderInput className="h-4 w-4 shrink-0" aria-hidden />
            {cerrandoCaja ? "Cerrando..." : "Cierre de caja"}
          </PrimaryButton>
        </div>
      </div>

      <ReporteFraccionarPagoModal
        open={fraccionarModalOpen}
        movimiento={movSelectedRow}
        onClose={() => setFraccionarModalOpen(false)}
        onSaved={() => {
          setRealtimeReloadKey((k) => k + 1);
          setMovSelectedId(null);
        }}
      />

      <ConfirmDialog
        open={confirmCierreOpen}
        title="Cierre de caja"
        description={cierreDialogDescription}
        confirmText="Confirmar cierre"
        cancelText="Cancelar"
        onCancel={() => setConfirmCierreOpen(false)}
        onConfirm={onCierreCajaConfirmed}
      />
    </div>
  );
}
