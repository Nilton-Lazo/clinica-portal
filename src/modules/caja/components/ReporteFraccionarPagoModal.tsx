import * as React from "react";
import { Wallet } from "lucide-react";
import { SecondaryButton, PrimaryButton } from "../../../shared/ui/buttons";
import type { SelectOption } from "../../../shared/ui/SelectMenu";
import { DateField, SelectField } from "../../admision/historia-clinica/wizard/ui/formFields";
import type { ParamOption } from "../../ficheros/parametros/emergencia/types/paramOption.types";
import type { ReporteFraccionarContext, ReporteFraccionarLineaPago, ReporteIngresosMovimiento } from "../services/reporteIngresosCaja.service";
import type { EmisionBootstrapBundle } from "../types/emisionBootstrap.types";
import { getEmisionBootstrap } from "../services/emisionBootstrapCache";
import { mediosForForma, bancosForFormaMedio } from "../utils/formaMedioBancoFilters";
import { postFraccionarEmisionPagos } from "../services/fraccionarEmisionPagos.service";
import { toastService } from "../../../shared/notifications";
import { getApiErrorMessage } from "../../../shared/api/apiError";

const menuWide = "min-w-full max-w-[calc(100vw-2rem)]";

const inputPayment =
  "h-10 w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

type PagoLin = {
  formaPagoId: string;
  medioPagoId: string;
  bancoTarjetaId: string;
  numeroOperacion: string;
  fechaVencimiento: string;
  montoStr: string;
};

function parsePen(raw: string): number {
  const n = parseFloat(String(raw).replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function clamp2(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function format2(value: number): string {
  return clamp2(value).toFixed(2);
}

function esFormaCredito(bundle: EmisionBootstrapBundle | null, formaIdStr: string): boolean {
  if (!bundle || !formaIdStr) return false;
  const f = bundle.formas.find((x) => String(x.id) === formaIdStr);
  return (f?.codigo ?? "").trim() === "002";
}

function lineaToState(linea: ReporteFraccionarLineaPago): PagoLin {
  const fv = linea.fecha_vencimiento;
  return {
    formaPagoId: linea.forma_pago_id > 0 ? String(linea.forma_pago_id) : "",
    medioPagoId: linea.medio_pago_id > 0 ? String(linea.medio_pago_id) : "",
    bancoTarjetaId:
      linea.banco_tarjeta_id !== null && linea.banco_tarjeta_id !== undefined && linea.banco_tarjeta_id > 0
        ? String(linea.banco_tarjeta_id)
        : "",
    numeroOperacion: linea.numero_operacion ?? "",
    fechaVencimiento: fv && String(fv).trim() ? String(fv).trim() : "",
    montoStr: "",
  };
}

function defaultLin(bundle: EmisionBootstrapBundle): PagoLin {
  const f0 = bundle.formas[0];
  const fid = f0 ? f0.id : 0;
  const meds = mediosForForma(bundle.medios, fid);
  const m0 = meds[0];
  const bancosOk = fid > 0 && m0 ? bancosForFormaMedio(bundle.bancos, fid, m0.id) : [];
  const b0 = bancosOk[0];
  return {
    formaPagoId: f0 ? String(f0.id) : "",
    medioPagoId: m0 ? String(m0.id) : "",
    bancoTarjetaId: b0 ? String(b0.id) : "",
    numeroOperacion: "",
    fechaVencimiento: "",
    montoStr: "",
  };
}

function buildInitialPair(ctx: ReporteFraccionarContext, bundle: EmisionBootstrapBundle): [PagoLin, PagoLin] {
  const lineas = ctx.lineas_pago;

  if (lineas.length >= 2) {
    return [lineaToState(lineas[0]), lineaToState(lineas[1])];
  }
  if (lineas.length === 1) {
    const a = lineaToState(lineas[0]);
    const b = defaultLin(bundle);
    return [a, b];
  }

  const def = defaultLin(bundle);
  return [def, defaultLin(bundle)];
}

type BloqueProps = {
  titulo: string;
  lin: PagoLin;
  esCredito: boolean;
  onFormaChange: (formaId: string) => void;
  onMedioChange: (medioId: string) => void;
  onBancoChange: (bancoId: string) => void;
  onNumeroOpChange: (v: string) => void;
  onFechaChange: (v: string) => void;
  onMontoChange: (v: string) => void;
  formaOpts: SelectOption[];
  medioOpts: SelectOption[];
  bancoOpts: SelectOption[];
  bancoDisabled: boolean;
};

function BloqueInformacionPago(props: BloqueProps) {
  const {
    titulo,
    lin,
    esCredito,
    onFormaChange,
    onMedioChange,
    onBancoChange,
    onNumeroOpChange,
    onFechaChange,
    onMontoChange,
    formaOpts,
    medioOpts,
    bancoOpts,
    bancoDisabled,
  } = props;

  return (
    <div className="rounded-md border border-(--border-color-default) bg-(--color-background) p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-(--color-primary)/10">
          <Wallet className="h-5 w-5 text-(--color-primary)" aria-hidden />
        </div>
        <span className="text-sm font-bold text-(--color-text-primary)">{titulo}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-x-3 lg:gap-y-3">
        <SelectField
          label="Forma de pago"
          value={lin.formaPagoId}
          onChange={(v) => onFormaChange(v)}
          options={formaOpts.length ? formaOpts : [{ value: "", label: "—" }]}
          ariaLabel="Forma de pago"
          disabled={formaOpts.length === 0}
          buttonClassName="w-full"
          menuClassName={menuWide}
        />
        <SelectField
          label="Medio de pago"
          value={lin.medioPagoId}
          onChange={(v) => onMedioChange(v)}
          options={medioOpts.length ? medioOpts : [{ value: "", label: "—" }]}
          ariaLabel="Medio de pago"
          disabled={!lin.formaPagoId || medioOpts.length === 0}
          buttonClassName="w-full"
          menuClassName={menuWide}
        />
        <div className="min-w-0">
          <span className="text-sm text-(--color-text-primary)">Subtotal</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-(--color-text-secondary)">S/.</span>
            <input
              value={lin.montoStr}
              onChange={(e) => onMontoChange(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              className={`${inputPayment} min-w-0 flex-1 tabular-nums font-semibold`}
              aria-label="Subtotal de esta parte del pago"
            />
          </div>
        </div>
        <SelectField
          label="Banco o tarjeta"
          value={lin.bancoTarjetaId}
          onChange={(v) => onBancoChange(v)}
          options={bancoOpts.length ? bancoOpts : [{ value: "", label: "—" }]}
          ariaLabel="Banco o tarjeta"
          disabled={bancoDisabled}
          buttonClassName="w-full"
          menuClassName={menuWide}
          searchable
          searchPlaceholder="Buscar…"
        />
        <div className="min-w-0">
          <span className="text-sm text-(--color-text-primary)">Número</span>
          <input
            value={lin.numeroOperacion}
            onChange={(e) => onNumeroOpChange(e.target.value)}
            className={`mt-1 ${inputPayment}`}
            maxLength={120}
            autoComplete="off"
            aria-label="Número de operación o referencia de pago"
          />
        </div>
        {esCredito ? (
          <DateField
            label="Fecha de vencimiento"
            value={lin.fechaVencimiento}
            onChange={(v) => onFechaChange(v)}
            ariaLabel="Fecha de vencimiento del crédito"
          />
        ) : (
          <div className="hidden min-h-13 lg:block" aria-hidden />
        )}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  movimiento: ReporteIngresosMovimiento | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ReporteFraccionarPagoModal(props: Props) {
  const { open, movimiento, onClose, onSaved } = props;
  const [bundle, setBundle] = React.useState<EmisionBootstrapBundle | null>(null);
  const [loadErr, setLoadErr] = React.useState(false);
  const [pago1, setPago1] = React.useState<PagoLin>({
    formaPagoId: "",
    medioPagoId: "",
    bancoTarjetaId: "",
    numeroOperacion: "",
    fechaVencimiento: "",
    montoStr: "",
  });
  const [pago2, setPago2] = React.useState<PagoLin>({
    formaPagoId: "",
    medioPagoId: "",
    bancoTarjetaId: "",
    numeroOperacion: "",
    fechaVencimiento: "",
    montoStr: "",
  });
  const [grandTotalStr, setGrandTotalStr] = React.useState("0.00");
  const [saving, setSaving] = React.useState(false);
  const backdropDownOnBackdropRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    let c = false;
    setLoadErr(false);
    getEmisionBootstrap(true)
      .then((b) => {
        if (!c) setBundle(b);
      })
      .catch(() => {
        if (!c) setLoadErr(true);
        toastService.showError("No se pudieron cargar formas de pago y medios para fraccionar el comprobante.");
      });
    return () => {
      c = true;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || !movimiento?.fraccionar_context || !bundle) return;
    const [a, b] = buildInitialPair(movimiento.fraccionar_context, bundle);
    setPago1(a);
    setPago2(b);
    setGrandTotalStr(movimiento.fraccionar_context.emision_total);
  }, [open, movimiento?.id, movimiento?.fraccionar_context, bundle]);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const formaOpts: SelectOption[] = React.useMemo(
    () =>
      (bundle?.formas ?? []).map((f: ParamOption) => ({
        value: String(f.id),
        label: `${f.codigo} · ${f.descripcion}`,
      })),
    [bundle]
  );

  const totalRef = React.useCallback(() => clamp2(parsePen(grandTotalStr)), [grandTotalStr]);

  const resolveMedios = React.useCallback(
    (formaIdStr: string) => {
      if (!bundle) return [];
      const fid = Number(formaIdStr);
      return mediosForForma(bundle.medios, fid).map((m) => ({
        value: String(m.id),
        label: `${m.codigo} · ${m.descripcion}`,
      }));
    },
    [bundle]
  );

  const medioOpts1 = resolveMedios(pago1.formaPagoId);
  const medioOpts2 = resolveMedios(pago2.formaPagoId);

  const formaIdNum1 = Number(pago1.formaPagoId);
  const medioIdNum1 = Number(pago1.medioPagoId);
  const bancos1 = bundle ? bancosForFormaMedio(bundle.bancos, formaIdNum1, medioIdNum1) : [];
  const bancoOpts1: SelectOption[] = bancos1.map((b) => ({ value: String(b.id), label: `${b.codigo} · ${b.descripcion}` }));

  const formaIdNum2 = Number(pago2.formaPagoId);
  const medioIdNum2 = Number(pago2.medioPagoId);
  const bancos2 = bundle ? bancosForFormaMedio(bundle.bancos, formaIdNum2, medioIdNum2) : [];
  const bancoOpts2: SelectOption[] = bancos2.map((b) => ({ value: String(b.id), label: `${b.codigo} · ${b.descripcion}` }));

  const bancoDisabled1 = !pago1.formaPagoId || !pago1.medioPagoId || bancoOpts1.length === 0;
  const bancoDisabled2 = !pago2.formaPagoId || !pago2.medioPagoId || bancoOpts2.length === 0;

  const cred1 = esFormaCredito(bundle, pago1.formaPagoId);
  const cred2 = esFormaCredito(bundle, pago2.formaPagoId);

  const syncMontosTrasCambioForma = (montoEditado: string, setOtro: React.Dispatch<React.SetStateAction<PagoLin>>) => {
    const t = totalRef();
    const raw = montoEditado.trim();
    if (raw === "") {
      setOtro((prev) => ({ ...prev, montoStr: "" }));
      return;
    }
    const mEdit = clamp2(parsePen(raw));
    setOtro((prev) => ({ ...prev, montoStr: format2(t - mEdit) }));
  };

  const onFormaChange1 = (v: string) => {
    if (!bundle) return;
    const fid = Number(v);
    const meds = mediosForForma(bundle.medios, fid);
    const m0 = meds[0];
    const bOk = fid > 0 && m0 ? bancosForFormaMedio(bundle.bancos, fid, m0.id) : [];
    const b0 = bOk[0];
    const seraCred = esFormaCredito(bundle, v);
    setPago1({
      formaPagoId: v,
      medioPagoId: m0 ? String(m0.id) : "",
      bancoTarjetaId: b0 ? String(b0.id) : "",
      numeroOperacion: pago1.numeroOperacion,
      fechaVencimiento: seraCred ? pago1.fechaVencimiento : "",
      montoStr: pago1.montoStr,
    });
    syncMontosTrasCambioForma(pago1.montoStr, setPago2);
  };

  const onFormaChange2 = (v: string) => {
    if (!bundle) return;
    const fid = Number(v);
    const meds = mediosForForma(bundle.medios, fid);
    const m0 = meds[0];
    const bOk = fid > 0 && m0 ? bancosForFormaMedio(bundle.bancos, fid, m0.id) : [];
    const b0 = bOk[0];
    const seraCred = esFormaCredito(bundle, v);
    setPago2({
      formaPagoId: v,
      medioPagoId: m0 ? String(m0.id) : "",
      bancoTarjetaId: b0 ? String(b0.id) : "",
      numeroOperacion: pago2.numeroOperacion,
      fechaVencimiento: seraCred ? pago2.fechaVencimiento : "",
      montoStr: pago2.montoStr,
    });
    syncMontosTrasCambioForma(pago2.montoStr, setPago1);
  };

  const onMedioChange1 = (v: string) => {
    if (!bundle || !pago1.formaPagoId) return;
    const fid = Number(pago1.formaPagoId);
    const mids = Number(v);
    const bOk = bancosForFormaMedio(bundle.bancos, fid, mids);
    const b0 = bOk[0];
    setPago1((prev) => ({
      ...prev,
      medioPagoId: v,
      bancoTarjetaId: b0 ? String(b0.id) : "",
    }));
  };

  const onMedioChange2 = (v: string) => {
    if (!bundle || !pago2.formaPagoId) return;
    const fid = Number(pago2.formaPagoId);
    const mids = Number(v);
    const bOk = bancosForFormaMedio(bundle.bancos, fid, mids);
    const b0 = bOk[0];
    setPago2((prev) => ({
      ...prev,
      medioPagoId: v,
      bancoTarjetaId: b0 ? String(b0.id) : "",
    }));
  };

  const onMonto1ChangeRaw = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const t = totalRef();
    setPago1((prev) => ({ ...prev, montoStr: cleaned }));
    if (cleaned === "") {
      setPago2((prev) => ({ ...prev, montoStr: "" }));
      return;
    }
    const m1 = clamp2(parsePen(cleaned));
    const m2 = clamp2(t - m1);
    setPago2((prev) => ({ ...prev, montoStr: format2(m2) }));
  };

  const onMonto2ChangeRaw = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const t = totalRef();
    setPago2((prev) => ({ ...prev, montoStr: cleaned }));
    if (cleaned === "") {
      setPago1((prev) => ({ ...prev, montoStr: "" }));
      return;
    }
    const m2 = clamp2(parsePen(cleaned));
    const m1 = clamp2(t - m2);
    setPago1((prev) => ({ ...prev, montoStr: format2(m1) }));
  };

  const guardar = async () => {
    if (!movimiento || !bundle) return;
    const t = totalRef();
    const fid1 = Number(pago1.formaPagoId);
    const fid2 = Number(pago2.formaPagoId);
    const mid1 = Number(pago1.medioPagoId);
    const mid2 = Number(pago2.medioPagoId);
    if (!fid1 || !fid2 || !mid1 || !mid2) {
      toastService.showError("Completa forma y medio de pago en ambas partes.");
      return;
    }
    if (bancoOpts1.length > 0 && !Number(pago1.bancoTarjetaId)) {
      toastService.showError("Selecciona banco o tarjeta para la primera parte del pago.");
      return;
    }
    if (bancoOpts2.length > 0 && !Number(pago2.bancoTarjetaId)) {
      toastService.showError("Selecciona banco o tarjeta para la segunda parte del pago.");
      return;
    }
    const c1 = esFormaCredito(bundle, pago1.formaPagoId);
    const c2 = esFormaCredito(bundle, pago2.formaPagoId);
    if (c1 && !pago1.fechaVencimiento.trim()) {
      toastService.showError("Indica la fecha de vencimiento en la primera parte (forma crédito).");
      return;
    }
    if (c2 && !pago2.fechaVencimiento.trim()) {
      toastService.showError("Indica la fecha de vencimiento en la segunda parte (forma crédito).");
      return;
    }
    const raw1 = pago1.montoStr.trim();
    const raw2 = pago2.montoStr.trim();
    if (!raw1 || !raw2) {
      toastService.showError("Indica el subtotal de cada parte del pago.");
      return;
    }
    const m1 = clamp2(parsePen(raw1));
    const m2 = clamp2(parsePen(raw2));
    if (m1 <= 0 || m2 <= 0) {
      toastService.showError("Cada parte del pago debe tener un subtotal mayor que cero.");
      return;
    }
    if (Math.abs(m1 + m2 - t) > 0.02) {
      toastService.showError(`La suma de los subtotales debe ser S/. ${format2(t)} (total del comprobante).`);
      return;
    }
    const bid1 = Number(pago1.bancoTarjetaId);
    const bid2 = Number(pago2.bancoTarjetaId);
    setSaving(true);
    try {
      await postFraccionarEmisionPagos(Number(movimiento.emision_comprobante_id), {
        pagos: [
          {
            forma_pago_id: fid1,
            medio_pago_id: mid1,
            banco_tarjeta_id: bancoOpts1.length > 0 && bid1 > 0 ? bid1 : null,
            numero_operacion: pago1.numeroOperacion.trim() ? pago1.numeroOperacion.trim() : null,
            fecha_vencimiento: c1 ? pago1.fechaVencimiento.trim() : null,
            monto: Number(m1.toFixed(2)),
          },
          {
            forma_pago_id: fid2,
            medio_pago_id: mid2,
            banco_tarjeta_id: bancoOpts2.length > 0 && bid2 > 0 ? bid2 : null,
            numero_operacion: pago2.numeroOperacion.trim() ? pago2.numeroOperacion.trim() : null,
            fecha_vencimiento: c2 ? pago2.fechaVencimiento.trim() : null,
            monto: Number(m2.toFixed(2)),
          },
        ],
      });
      toastService.showSuccess("Fraccionamiento de pago registrado correctamente.");
      onSaved();
      onClose();
    } catch (e) {
      toastService.showError(getApiErrorMessage(e, "No se pudo guardar el fraccionamiento del pago."));
    } finally {
      setSaving(false);
    }
  };

  const onBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    backdropDownOnBackdropRef.current = e.target === e.currentTarget;
  };

  const onBackdropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && backdropDownOnBackdropRef.current) {
      onClose();
    }
    backdropDownOnBackdropRef.current = false;
  };

  const onBackdropPointerCancel = () => {
    backdropDownOnBackdropRef.current = false;
  };

  if (!open || !movimiento) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40"
      onPointerDown={onBackdropPointerDown}
      onPointerUp={onBackdropPointerUp}
      onPointerCancel={onBackdropPointerCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Detallar comprobante — fraccionar pago"
    >
      <div className="flex h-full min-h-0 w-full max-w-[900px] flex-col overflow-hidden bg-(--color-app-bg) p-4 shadow-xl">
        <div className="flex shrink-0 flex-col gap-3 border-b border-(--border-color-default) pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-(--color-primary)">Detallar comprobante</h2>
              <p className="mt-1 text-xs leading-snug text-(--color-text-secondary)">
                Fracciona el pago en dos medios registrados para este mismo comprobante. Cuenta {movimiento.cuenta ?? "—"} ·{" "}
                {movimiento.num_comprobante ?? "—"}.
              </p>
            </div>
            <SecondaryButton type="button" onClick={onClose}>
              Cerrar
            </SecondaryButton>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border border-(--border-color-default) bg-(--color-surface) px-4 py-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
                Total del comprobante a fraccionar
              </div>
              <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                <span className="text-sm font-semibold text-(--color-text-secondary)">S/.</span>
                <span className="text-lg font-bold text-(--color-text-primary)">{grandTotalStr}</span>
              </div>
            </div>
            <PrimaryButton type="button" disabled={saving || !bundle} className="h-10 shrink-0" onClick={() => void guardar()}>
              {saving ? "Guardando…" : "Guardar fracción"}
            </PrimaryButton>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pt-4">
          {loadErr ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              No se pudo cargar el catálogo de pagos.
            </div>
          ) : null}

          <BloqueInformacionPago
            titulo="Información de pago — parte 1"
            lin={pago1}
            esCredito={cred1}
            onFormaChange={onFormaChange1}
            onMedioChange={onMedioChange1}
            onBancoChange={(v) => setPago1((prev) => ({ ...prev, bancoTarjetaId: v }))}
            onNumeroOpChange={(v) => setPago1((prev) => ({ ...prev, numeroOperacion: v }))}
            onFechaChange={(v) => setPago1((prev) => ({ ...prev, fechaVencimiento: v }))}
            onMontoChange={onMonto1ChangeRaw}
            formaOpts={formaOpts}
            medioOpts={medioOpts1}
            bancoOpts={bancoOpts1}
            bancoDisabled={bancoDisabled1}
          />
          <BloqueInformacionPago
            titulo="Información de pago — parte 2"
            lin={pago2}
            esCredito={cred2}
            onFormaChange={onFormaChange2}
            onMedioChange={onMedioChange2}
            onBancoChange={(v) => setPago2((prev) => ({ ...prev, bancoTarjetaId: v }))}
            onNumeroOpChange={(v) => setPago2((prev) => ({ ...prev, numeroOperacion: v }))}
            onFechaChange={(v) => setPago2((prev) => ({ ...prev, fechaVencimiento: v }))}
            onMontoChange={onMonto2ChangeRaw}
            formaOpts={formaOpts}
            medioOpts={medioOpts2}
            bancoOpts={bancoOpts2}
            bancoDisabled={bancoDisabled2}
          />
        </div>
      </div>
    </div>
  );
}
