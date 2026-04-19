import * as React from "react";
import { FolderInput, SlidersHorizontal } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/buttons";
import { SelectField } from "../../admision/historia-clinica/wizard/ui/formFields";
import type { SelectOption } from "../../../shared/ui/SelectMenu";
import { toastService } from "../../../shared/notifications";
import { toApiError } from "../../../shared/api/apiError";
import {
  fetchReporteIngresosBootstrap,
  fetchReporteIngresosMovimientos,
  type ReporteIngresosApertura,
  type ReporteIngresosBootstrap,
  type ReporteIngresosMedio,
  type ReporteIngresosMovimiento,
} from "../services/reporteIngresosCaja.service";

const pageWrap = "flex w-full min-h-0 flex-1 flex-col gap-4 lg:gap-2";

const mainSheet =
  "flex flex-col gap-5 overflow-visible rounded-md border border-(--color-border) bg-(--color-surface) p-4 shadow-sm sm:p-5";

const sectionCard =
  "rounded-md border border-(--color-border) bg-(--color-background) p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

const sectionTitle = "text-sm font-semibold text-(--color-text-primary)";

const sectionHint = "mt-0.5 text-xs leading-snug text-(--color-text-secondary)";

/** Misma etiqueta base que en emisión de comprobantes (`lbl`). */
const lbl = "text-sm text-(--color-text-primary)";

/** Solo lectura, misma tipografía que inputs (`text-sm`) — sin monoespaciado. */
const readoutInline =
  "inline-flex h-10 w-fit max-w-full min-w-[4.5rem] shrink-0 items-center rounded-md border border-(--border-color-default) bg-[#E8EAEE] px-3 text-sm text-(--color-text-primary)";

const menuWide = "min-w-full max-w-[calc(100vw-2rem)]";

const th =
  "sticky top-0 z-[1] border-b border-(--color-border) bg-(--color-background) px-3 py-2.5 text-left text-xs font-semibold capitalize tracking-normal text-(--color-text-secondary)";

const td = "border-b border-(--color-border)/80 px-3 py-2.5 text-sm text-(--color-text-primary) align-middle";

const tableShell = "min-w-0 overflow-x-auto rounded-md border border-(--color-border) bg-(--color-surface)";

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "neutral" | "warning" | "info";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-950"
          : "border-(--color-border) bg-(--color-surface) text-(--color-text-secondary)";
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-semibold leading-tight ${cls}`}
    >
      {children}
    </span>
  );
}

function badgeApertura(estado: string): React.ReactNode {
  const u = estado.toUpperCase();
  if (u === "APERTURADA") return <Badge tone="success">{estado}</Badge>;
  if (u === "CERRADA") return <Badge tone="neutral">{estado}</Badge>;
  return <Badge tone="neutral">{estado}</Badge>;
}

function badgeTipoCaja(tipo: string): React.ReactNode {
  const u = tipo.toUpperCase();
  if (u === "NORMAL") return <Badge tone="info">{tipo}</Badge>;
  if (u === "CHICA") return <Badge tone="warning">{tipo}</Badge>;
  return <Badge tone="neutral">{tipo}</Badge>;
}

function badgeEstadoMovimiento(estado: string): React.ReactNode {
  const u = estado.toUpperCase();
  if (u.includes("PEND")) return <Badge tone="warning">{estado}</Badge>;
  if (u.includes("ANUL") || u.includes("CANCEL")) return <Badge tone="neutral">{estado}</Badge>;
  if (u.includes("FACT") || u.includes("EMIT") || u.includes("REGIST")) return <Badge tone="success">{estado}</Badge>;
  return <Badge tone="neutral">{estado || "—"}</Badge>;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-(--color-border) bg-(--color-surface) px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-(--color-text-primary)">{value}</div>
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
  const [totalesMedio, setTotalesMedio] = React.useState<Record<string, string>>({});
  const [totalesDoc, setTotalesDoc] = React.useState({ facturas: "0.00", boletas: "0.00", recibo_caja: "0.00" });
  const [totalGeneral, setTotalGeneral] = React.useState("0.00");
  const [movLoading, setMovLoading] = React.useState(false);
  const [aplicarAjusteManual, setAplicarAjusteManual] = React.useState(false);

  React.useEffect(() => {
    let c = false;
    setBootLoading(true);
    setBootErr(false);
    fetchReporteIngresosBootstrap()
      .then((b) => {
        if (c) return;
        setBoot(b);
        const pref = b.apertura_preferida_id;
        if (pref && b.aperturas.some((a) => a.id === pref)) {
          setAperturaId(pref);
        } else if (b.aperturas[0]) {
          setAperturaId(b.aperturas[0].id);
        } else {
          setAperturaId(null);
        }
      })
      .catch(() => {
        if (!c) {
          setBootErr(true);
          toastService.showError("No se pudo cargar el reporte de ingresos.");
        }
      })
      .finally(() => {
        if (!c) setBootLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  React.useEffect(() => {
    if (!aperturaId) {
      setMovs([]);
      setTotalesMedio({});
      setTotalesDoc({ facturas: "0.00", boletas: "0.00", recibo_caja: "0.00" });
      setTotalGeneral("0.00");
      return;
    }
    let c = false;
    setMovLoading(true);
    fetchReporteIngresosMovimientos({
      cajaAperturaId: Number(aperturaId),
      numeracionId: numeracionId.trim() || undefined,
    })
      .then((d) => {
        if (c) return;
        setMovs(d.movimientos);
        setTotalesMedio(d.totales_por_medio);
        setTotalesDoc(d.totales_documento);
        setTotalGeneral(d.total_general);
      })
      .catch((e) => {
        if (!c) {
          const err = toApiError(e);
          toastService.showError(err.message.trim() || "No se pudieron cargar los movimientos.");
          setMovs([]);
        }
      })
      .finally(() => {
        if (!c) setMovLoading(false);
      });
    return () => {
      c = true;
    };
  }, [aperturaId, numeracionId]);

  const serieOpts: SelectOption[] = React.useMemo(() => {
    const rows = boot?.series ?? [];
    return [{ value: "", label: "Todas las series" }, ...rows.map((s) => ({ value: String(s.id), label: s.label }))];
  }, [boot]);

  const aperturaSeleccionada = React.useMemo(
    () => (boot?.aperturas ?? []).find((a) => a.id === aperturaId) ?? null,
    [boot, aperturaId]
  );

  const mediosContado: ReporteIngresosMedio[] = boot?.medios_contado ?? [];

  const totalEfectivoEstimado = React.useMemo(() => {
    let s = 0;
    for (const m of mediosContado) {
      if (!/efect/i.test(m.descripcion) && !/efect/i.test(m.codigo)) continue;
      s += Number(String(totalesMedio[String(m.id)] ?? "0").replace(",", ".")) || 0;
    }
    return s.toFixed(2);
  }, [mediosContado, totalesMedio]);

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
        <div className="flex flex-wrap items-end justify-start gap-x-10 gap-y-4 border-b border-(--color-border) pb-5">
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
            <p className={`${sectionHint} max-w-sm`}>Solo numeraciones en estado activo (ficheros).</p>
          </div>
          <div className="flex w-fit min-w-0 max-w-full flex-col items-start">
            <label className={lbl} htmlFor="reporte-ingresos-readout-apertura">
              Código de apertura
            </label>
            <div className="mt-1">
              <div
                id="reporte-ingresos-readout-apertura"
                className={readoutInline}
                aria-label="Código de apertura seleccionada"
              >
                {aperturaSeleccionada?.codigo ?? "—"}
              </div>
            </div>
            <p className={`${sectionHint} max-w-sm`}>Fila seleccionada en la tabla de aperturas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className={sectionCard}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className={sectionTitle}>Aperturas y cierres</h2>
              <span className="text-xs text-(--color-text-secondary)">{boot.aperturas.length} registros</span>
            </div>
            <div className={tableShell}>
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className={th}>Código</th>
                    <th className={th}>Usuario</th>
                    <th className={th}>Fecha</th>
                    <th className={`${th} text-right`}>Monto apertura</th>
                    <th className={`${th} text-right`}>Monto cierre</th>
                    <th className={th}>Estado</th>
                    <th className={th}>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {boot.aperturas.length === 0 ? (
                    <tr>
                      <td className={`${td} text-(--color-text-secondary)`} colSpan={7}>
                        No hay aperturas registradas para tu usuario.
                      </td>
                    </tr>
                  ) : (
                    boot.aperturas.map((r: ReporteIngresosApertura, idx: number) => (
                      <tr
                        key={r.id}
                        onClick={() => setAperturaId(r.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setAperturaId(r.id);
                          }
                        }}
                        className={[
                          "cursor-pointer transition-colors",
                          idx % 2 === 1 ? "bg-(--color-background)/40" : "",
                          aperturaId === r.id
                            ? "bg-(--color-primary)/10 ring-1 ring-(--color-primary)/25 ring-inset"
                            : "hover:bg-(--color-primary)/5",
                        ].join(" ")}
                      >
                        <td className={td}>{r.codigo}</td>
                        <td className={`${td} max-w-[140px] truncate`} title={r.usuario}>
                          {r.usuario}
                        </td>
                        <td className={`${td} whitespace-nowrap text-(--color-text-secondary)`}>{r.fecha}</td>
                        <td className={`${td} text-right`}>{r.monto_apertura}</td>
                        <td className={`${td} text-right text-(--color-text-secondary)`}>{r.monto_cierre}</td>
                        <td className={td}>{badgeApertura(r.estado)}</td>
                        <td className={td}>{badgeTipoCaja(r.tipo)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={sectionCard}>
            <h2 className={sectionTitle}>Resumen por medio de pago</h2>
            <p className={`${sectionHint} mb-3`}>Forma de pago contado · solo medios activos vinculados en ficheros.</p>
            {mediosContado.length === 0 ? (
              <p className="text-sm text-(--color-text-secondary)">
                No hay medios de pago activos para contado, o no existe la forma «contado» en ficheros.
              </p>
            ) : (
              <div className={tableShell}>
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      <th className={th}>Medio de pago</th>
                      <th className={`${th} w-[128px] text-right`}>Monto (PEN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediosContado.map((m, idx) => (
                      <tr key={m.id} className={idx % 2 === 1 ? "bg-(--color-background)/40" : ""}>
                        <td className={td}>
                          <span className="text-xs text-(--color-text-secondary)">{m.codigo}</span>
                          <span className="mx-1.5 text-(--color-text-secondary)">·</span>
                          <span>{m.descripcion}</span>
                        </td>
                        <td className={`${td} text-right text-sm font-semibold text-(--color-text-primary)`}>
                          {totalesMedio[String(m.id)] ?? "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className={sectionCard}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className={sectionTitle}>Movimientos de caja</h2>
              <p className={sectionHint}>Emisiones registradas para la apertura seleccionada.</p>
            </div>
            {movLoading ? (
              <span className="text-xs font-medium text-(--color-text-secondary)">Sincronizando…</span>
            ) : null}
          </div>
          <div className={tableShell}>
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr>
                  <th className={th}>Cuenta</th>
                  <th className={`${th} min-w-[140px]`}>Paciente</th>
                  <th className={`${th} min-w-[120px]`}>Médico / servicio</th>
                  <th className={`${th} min-w-[100px]`}>Tipo comprob.</th>
                  <th className={`${th} whitespace-nowrap`}>N.º comprob.</th>
                  <th className={`${th} text-right`}>Total</th>
                  <th className={`${th} whitespace-nowrap`}>N.º operación</th>
                  <th className={th}>Estado</th>
                  <th className={`${th} w-[88px]`}>Pago fracc.</th>
                  <th className={`${th} min-w-[120px]`}>Medio pago</th>
                  <th className={th}>Origen</th>
                  <th className={`${th} text-right`}>Adelanto</th>
                  <th className={th}>U. elimina</th>
                </tr>
              </thead>
              <tbody>
                {!aperturaId ? (
                  <tr>
                    <td className={`${td} text-(--color-text-secondary)`} colSpan={13}>
                      Selecciona una apertura en la tabla superior.
                    </td>
                  </tr>
                ) : movs.length === 0 ? (
                  <tr>
                    <td className={`${td} text-(--color-text-secondary)`} colSpan={13}>
                      Sin emisiones registradas para esta apertura.
                    </td>
                  </tr>
                ) : (
                  movs.map((r: ReporteIngresosMovimiento, idx: number) => (
                    <tr key={r.id} className={idx % 2 === 1 ? "bg-(--color-background)/40" : ""}>
                      <td className={td}>{r.cuenta}</td>
                      <td className={`${td} max-w-[180px] truncate`} title={r.paciente}>
                        {r.paciente}
                      </td>
                      <td className={`${td} max-w-[160px] truncate text-(--color-text-secondary)`} title={r.medico_servicio}>
                        {r.medico_servicio}
                      </td>
                      <td className={`${td} text-(--color-text-secondary)`}>{r.tipo_comprobante}</td>
                      <td className={`${td} whitespace-nowrap`}>{r.num_comprobante}</td>
                      <td className={`${td} text-right text-sm font-semibold`}>{r.total}</td>
                      <td className={`${td} max-w-[100px] truncate text-xs`} title={r.cuenta_pago}>
                        {r.cuenta_pago || "—"}
                      </td>
                      <td className={td}>{badgeEstadoMovimiento(r.estado)}</td>
                      <td className={`${td} text-(--color-text-secondary)`}>{r.pago_fracc}</td>
                      <td className={`${td} max-w-[160px] truncate text-sm`} title={r.medio_pago}>
                        {r.medio_pago}
                      </td>
                      <td className={`${td} text-xs text-(--color-text-secondary)`}>{r.tipo}</td>
                      <td className={`${td} text-right text-(--color-text-secondary)`}>{r.adelanto}</td>
                      <td className={`${td} text-(--color-text-secondary)`}>{r.usuario_elimina}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 border-t border-(--color-border) pt-5 lg:grid-cols-12 lg:items-stretch">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950">
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
              Leyenda: comprobantes anulados (pendiente de detalle en listado)
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Kpi label="Total facturas (PEN)" value={totalesDoc.facturas} />
              <Kpi label="Total boletas (PEN)" value={totalesDoc.boletas} />
              <Kpi label="Total recibo caja (PEN)" value={totalesDoc.recibo_caja} />
            </div>
          </div>

          <div className={`${sectionCard} lg:col-span-5`}>
            <h2 className={sectionTitle}>Arqueo · efectivo</h2>
            <p className={`${sectionHint} mb-4`}>Valores orientativos según medios y movimientos cargados.</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5">
                <dt className="text-xs font-medium text-(--color-text-secondary)">Ingreso efectivo (estim.)</dt>
                <dd className="mt-0.5 text-right text-base font-semibold text-(--color-text-primary)">
                  {totalEfectivoEstimado}
                </dd>
              </div>
              <div className="rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5">
                <dt className="text-xs font-medium text-(--color-text-secondary)">Ajuste calculado ±</dt>
                <dd className="mt-0.5 text-right text-base font-semibold text-(--color-text-secondary)">
                  0.00
                </dd>
              </div>
              <div className="rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 sm:col-span-2">
                <dt className="text-xs font-medium text-(--color-text-secondary)">Total movimientos (suma líneas, PEN)</dt>
                <dd className="mt-0.5 text-right text-lg font-semibold text-(--color-text-primary)">
                  {totalGeneral}
                </dd>
              </div>
            </dl>
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-(--color-text-primary)">
              <input
                type="checkbox"
                checked={aplicarAjusteManual}
                onChange={(e) => setAplicarAjusteManual(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border border-(--border-color-default) accent-(--color-primary)"
              />
              Aplicar ajuste manual
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-(--color-border) pt-4 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" className="inline-flex h-10 items-center justify-center gap-2 sm:min-w-[168px]">
            <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
            Aplicar ajuste
          </SecondaryButton>
          <PrimaryButton type="button" className="inline-flex h-10 items-center justify-center gap-2 sm:min-w-[168px]">
            <FolderInput className="h-4 w-4 shrink-0" aria-hidden />
            Cierre de caja
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
