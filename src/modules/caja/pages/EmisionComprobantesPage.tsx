import * as React from "react";
import { Link } from "react-router-dom";
import { Save, User, UserSearch, Wallet, type LucideIcon } from "lucide-react";
import type { SelectOption } from "../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/buttons";
import { toastService } from "../../../shared/notifications";
import { DateField, SelectField } from "../../admision/historia-clinica/wizard/ui/formFields";
import type { ParamOption } from "../../ficheros/parametros/emergencia/types/paramOption.types";
import type { MedioPagoCajaItem } from "../../ficheros/parametros/caja/services/medioPagoCaja.service";
import type { BancoTarjetaCajaItem } from "../../ficheros/parametros/caja/services/bancoTarjetaCaja.service";
import type { NumeracionComprobanteCajaItem } from "../../ficheros/parametros/caja/services/numeracionComprobanteCaja.service";
import type { Cliente } from "../../ficheros/types/clientes.types";
import CuentaCitaPicker from "../../admision/historia-clinica/components/CuentaCitaPicker";
import type { CuentaCitaListItem } from "../../admision/historia-clinica/types/cuentaCita.types";
import { fetchCuentaDetalle } from "../../admision/historia-clinica/services/cuentaDetalle.service";
import { getPaciente } from "../../admision/historia-clinica/services/historiaClinica.service";
import {
  listContratantesLookup,
  listIafasLookup,
  listPacientePlanes,
} from "../../admision/historia-clinica/wizard/acreditacionPlanes.service";
import type {
  AcreditacionPlan,
  ContratanteLookup,
  IafaLookup,
} from "../../admision/historia-clinica/wizard/acreditacionPlanes.types";
import { ServiciosSolicitadosSection } from "../../admision/citas/agenda/components/ServiciosSolicitadosSection";
import type {
  AtencionServicioItem,
  AtencionServicioLineaDisplay,
  PresupuestoPaqueteSnapshot,
} from "../../admision/citas/agenda/types/atencionCita.types";
import ClientePicker from "../components/ClientePicker";
import { getEmisionBootstrap, getEmisionBootstrapSync } from "../services/emisionBootstrapCache";
import type { EmisionBootstrapBundle } from "../types/emisionBootstrap.types";
import type { EmisionComprobantesCatalog, EmisionComprobantesFormState } from "../types/emisionComprobantes.types";
import { getApiErrorMessage, toApiError } from "../../../shared/api/apiError";
import { getResumenApertura } from "../services/aperturaCaja.service";
import { postEmisionComprobantesRegistrar } from "../services/emisionComprobantesRegistrar.service";

const menuWide = "min-w-full max-w-[calc(100vw-2rem)]";

const inpStretch =
  "h-10 w-full flex-1 rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

const inpReadonlyStretch = `${inpStretch} bg-[#E8EAEE] text-(--color-text-primary) cursor-not-allowed`;

const taGrow =
  "min-h-10 w-full min-w-0 max-w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-sm leading-snug text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) resize-none overflow-hidden whitespace-pre-wrap break-words";

const taGrowReadonly = `${taGrow} bg-[#E8EAEE] text-(--color-text-primary) cursor-not-allowed`;

const taGrowGrid = `${taGrow} flex-1 min-h-0`;
const taGrowReadonlyGrid = `${taGrowReadonly} flex-1 min-h-0`;

const fieldCell = "flex min-h-0 w-full min-w-0 flex-col lg:h-full";

const lbl = "text-sm text-(--color-text-primary)";

const chkChip = "inline-flex max-w-full cursor-pointer items-center gap-1.5";

function normalizarNroCuenta10(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const core = digits.length > 10 ? digits.slice(-10) : digits;
  return core.padStart(10, "0");
}

const chkLbl = "text-[11px] font-medium leading-tight text-(--color-text-secondary)";

const chk =
  "h-4 w-4 shrink-0 cursor-pointer rounded border border-(--border-color-default) accent-(--color-primary)";

const pageWrap = "flex w-full min-h-0 flex-1 flex-col gap-2";

const panel = "rounded-md border border-(--color-border) bg-(--color-surface) p-4 shadow-sm";

const mainSheet =
  "flex flex-col gap-3 overflow-visible rounded-md border border-(--color-border) bg-(--color-surface) p-3 shadow-sm";

const innerBlock = "rounded-md border border-(--color-border) bg-(--color-background) p-3";
const dynamicFieldCharPx = 8;

function getDynamicFieldWidthPx(value: string, min: number, max: number, padding: number): number {
  const text = value.trim();
  const estimated = Math.max(1, text.length) * dynamicFieldCharPx + padding;
  return Math.min(max, Math.max(min, estimated));
}

function getTipoComprobanteDescripcion(option: { label: string; codigo?: string }): string {
  const label = option.label?.trim() ?? "";
  if (!label) return "";
  const codigo = option.codigo?.trim();
  if (codigo) {
    const escapedCodigo = codigo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`^${escapedCodigo}\\s*[-·.]\\s*`, "i");
    return label.replace(rx, "").trim() || label;
  }
  const match = label.match(/^\s*[A-Za-z0-9]+\s*[-·.]\s*(.+)$/);
  return match?.[1]?.trim() || label;
}

type AutoGrowTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows" | "style"
> & {
  value: string;
};

function AutoGrowTextarea({ value, className, onInput, ...rest }: AutoGrowTextareaProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const syncHeight = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.minHeight = "0px";
    el.style.height = "auto";
    el.style.minHeight = `${el.scrollHeight}px`;
  }, []);

  React.useLayoutEffect(() => {
    syncHeight();
  }, [value, syncHeight, rest.readOnly, rest.disabled]);

  React.useEffect(() => {
    window.addEventListener("resize", syncHeight);
    return () => window.removeEventListener("resize", syncHeight);
  }, [syncHeight]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={className}
      onInput={(e) => {
        onInput?.(e);
        syncHeight();
      }}
      {...rest}
    />
  );
}

function BlockTitle(props: { icon: LucideIcon; title: string }) {
  const { icon: Icon, title } = props;
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-(--color-primary)/10">
        <Icon className="h-5 w-5 text-(--color-primary)" aria-hidden />
      </div>
      <span className="text-sm text-(--color-text-primary)">{title}</span>
    </div>
  );
}

function emptyForm(): EmisionComprobantesFormState {
  return {
    origen: "",
    tipoDocumentoId: "",
    estadoEmision: "",
    cuenta: "",
    numeracionId: "",
    correlativo: "",
    paciente: "",
    titular: "",
    copiaPaciente: false,
    iafasMedico: "",
    editaIafasMedico: false,
    telefono: "",
    documento: "",
    padDocumento8: false,
    direccion: "",
    contratante: "",
    editaContratante: false,
    formaPagoId: "",
    medioPagoId: "",
    bancoTarjetaId: "",
    numeroOperacion: "",
    fechaVencimiento: "",
  };
}

function mediosForForma(medios: MedioPagoCajaItem[], formaId: number): MedioPagoCajaItem[] {
  if (!Number.isFinite(formaId) || formaId <= 0) return [];
  return medios.filter((m) => m.forma_pago_ids.includes(formaId));
}

function bancosForFormaMedio(
  bancos: BancoTarjetaCajaItem[],
  formaId: number,
  medioId: number
): BancoTarjetaCajaItem[] {
  if (!Number.isFinite(formaId) || formaId <= 0 || !Number.isFinite(medioId) || medioId <= 0) return [];
  return bancos.filter(
    (b) => b.forma_pago_ids.includes(formaId) && b.medio_pago_ids.includes(medioId)
  );
}

function serviciosItemsFromCuentaDetalle(detalle: unknown): AtencionServicioItem[] {
  if (!detalle || typeof detalle !== "object") return [];
  const raw = (detalle as { servicios?: unknown }).servicios;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is AtencionServicioItem => {
    if (!x || typeof x !== "object") return false;
    return typeof (x as AtencionServicioItem).tarifa_servicio_id === "number";
  });
}

function lineasDisplayFromServicios(items: AtencionServicioItem[]): AtencionServicioLineaDisplay[] {
  return items.map((item) => {
    const estadoFacturacion =
      item.estado_facturacion === "FACTURADO" || item.estado_facturacion === "PENDIENTE"
        ? item.estado_facturacion
        : "PENDIENTE";
    return {
      id: item.id,
      tarifa_servicio_id: item.tarifa_servicio_id,
      servicio_codigo: item.servicio_codigo ?? null,
      servicio_descripcion: item.servicio_descripcion ?? null,
      categoria_codigo: item.categoria_codigo ?? null,
      desea_liberar_precio: Boolean(item.desea_liberar_precio),
      medico_id: item.medico_id,
      medico_codigo: item.medico_codigo ?? null,
      user_username: item.user_username ?? null,
      user_nombre: item.user_nombre ?? null,
      cop_var: Number(item.cop_var ?? 0),
      cop_fijo: Number(item.cop_fijo ?? 0),
      descuento_pct: Number(item.descuento_pct ?? 0),
      aumento_pct: Number(item.aumento_pct ?? 0),
      cantidad: Number(item.cantidad ?? 1),
      precio_sin_igv: Number(item.precio_sin_igv ?? 0),
      precio_con_igv: Number(item.precio_con_igv ?? 0),
      estado_facturacion: estadoFacturacion,
    };
  });
}

function lineasSoloPendientes(lineas: AtencionServicioLineaDisplay[]): AtencionServicioLineaDisplay[] {
  return lineas.filter((l) => (l.estado_facturacion ?? "PENDIENTE") === "PENDIENTE");
}

function lineasParaCaja(lineas: AtencionServicioLineaDisplay[]): AtencionServicioLineaDisplay[] {
  const pendientes = lineasSoloPendientes(lineas);
  return pendientes.length > 0 ? pendientes : lineas;
}

function parseCuentaDetalleServicios(
  detalle: unknown
): { lineas: AtencionServicioLineaDisplay[]; paquete: PresupuestoPaqueteSnapshot | null } {
  if (
    detalle &&
    typeof detalle === "object" &&
    (detalle as { pre_facturacion_hospitalaria?: boolean }).pre_facturacion_hospitalaria === true
  ) {
    const form = (detalle as { form?: unknown }).form;
    if (form && typeof form === "object") {
      const f = form as Record<string, unknown>;
      const lineas = Array.isArray(f.lineas) ? (f.lineas as AtencionServicioLineaDisplay[]) : [];
      const paquete = Object.prototype.hasOwnProperty.call(f, "presupuestoPaquete")
        ? ((f.presupuestoPaquete as PresupuestoPaqueteSnapshot | null) ?? null)
        : null;
      return { lineas, paquete };
    }
  }

  const servicios = serviciosItemsFromCuentaDetalle(detalle);
  return { lineas: lineasDisplayFromServicios(servicios), paquete: null };
}

function applyDefaultsFromBundle(
  cat: EmisionComprobantesCatalog,
  formas: ParamOption[],
  medios: MedioPagoCajaItem[],
  bancos: BancoTarjetaCajaItem[],
  numeraciones: NumeracionComprobanteCajaItem[]
): EmisionComprobantesFormState {
  const forma0 = formas[0];
  const formaId = forma0 ? forma0.id : 0;
  const mediosOk = mediosForForma(medios, formaId);
  const medio0 = mediosOk[0];
  const medioId = medio0 ? medio0.id : 0;
  const bancosOk = bancosForFormaMedio(bancos, formaId, medioId);
  const banco0 = bancosOk[0];
  const tipoId = cat.tipos_documento[0]?.value ?? "";
  const numsForTipo = numeraciones.filter((n) => String(n.tipo_documento_id) === tipoId);
  const num0 = numsForTipo[0] ?? numeraciones[0];
  const pendiente = cat.estados_emision.find((e) => e.value === "PENDIENTE");
  return {
    ...emptyForm(),
    origen: cat.origenes[0]?.value ?? "",
    tipoDocumentoId: tipoId,
    estadoEmision: pendiente?.value ?? cat.estados_emision[0]?.value ?? "",
    formaPagoId: forma0 ? String(forma0.id) : "",
    medioPagoId: medio0 ? String(medio0.id) : "",
    bancoTarjetaId: banco0 ? String(banco0.id) : "",
    numeracionId: num0 ? String(num0.id) : "",
    correlativo: num0?.numero_formateado?.trim() ? String(num0.numero_formateado) : "",
  };
}

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLgUp;
}

export default function EmisionComprobantesPage() {
  const isLgUp = useIsLgUp();
  const [bundle, setBundle] = React.useState<EmisionBootstrapBundle | null>(() => getEmisionBootstrapSync());
  const [bootErr, setBootErr] = React.useState(false);
  const [awaitingNetwork, setAwaitingNetwork] = React.useState(() => getEmisionBootstrapSync() === null);
  const [clientePickerOpen, setClientePickerOpen] = React.useState(false);
  const [cuentaPickerOpen, setCuentaPickerOpen] = React.useState(false);
  const [loadingCuentaDetalle, setLoadingCuentaDetalle] = React.useState(false);
  const [lineasCuenta, setLineasCuenta] = React.useState<AtencionServicioLineaDisplay[]>([]);
  const [cuentaSinPendientes, setCuentaSinPendientes] = React.useState(false);
  const [cuentaBloqueada, setCuentaBloqueada] = React.useState(false);
  const [tarifaEsPrecioDirectoCuenta, setTarifaEsPrecioDirectoCuenta] = React.useState(false);
  const [paqueteCuenta, setPaqueteCuenta] = React.useState<PresupuestoPaqueteSnapshot | null>(null);
  const [form, setForm] = React.useState<EmisionComprobantesFormState>(() => {
    const s = getEmisionBootstrapSync();
    return s
      ? applyDefaultsFromBundle(s.catalog, s.formas, s.medios, s.bancos, s.numeraciones)
      : emptyForm();
  });
  const formSeededRef = React.useRef(Boolean(getEmisionBootstrapSync()));

  const [cajaNormalAbierta, setCajaNormalAbierta] = React.useState<boolean | null>(null);
  const [cajaResumenError, setCajaResumenError] = React.useState(false);
  const [savingEmision, setSavingEmision] = React.useState(false);
  const cajaAvisoMostradoRef = React.useRef(false);

  const loadCajaResumen = React.useCallback(() => {
    setCajaResumenError(false);
    setCajaNormalAbierta(null);
    getResumenApertura()
      .then((r) => {
        const ok = Boolean(r.cajas_activas?.normal);
        setCajaNormalAbierta(ok);
        if (!ok && !cajaAvisoMostradoRef.current) {
          cajaAvisoMostradoRef.current = true;
          toastService.showError(
            "Debes aperturar la caja normal antes de usar emisión de comprobantes."
          );
        }
      })
      .catch((e) => {
        setCajaResumenError(true);
        setCajaNormalAbierta(false);
        toastService.showError(getApiErrorMessage(e, "No se pudo verificar si existe una caja normal aperturada."));
      });
  }, []);

  React.useEffect(() => {
    loadCajaResumen();
  }, [loadCajaResumen]);

  const titularBeforeCopiaRef = React.useRef("");
  const documentoBeforePadRef = React.useRef("");
  const iafasBeforeEditRef = React.useRef("");
  const contratanteBeforeEditRef = React.useRef("");
  const iafasRef = React.useRef<IafaLookup[] | null>(null);
  const contratantesRef = React.useRef<ContratanteLookup[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setAwaitingNetwork(true);
    getEmisionBootstrap()
      .then((b) => {
        if (cancelled) return;
        setBundle(b);
        setBootErr(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setBootErr(true);
          toastService.showError(getApiErrorMessage(e, "No se pudieron cargar los catálogos para emitir comprobantes."));
        }
      })
      .finally(() => {
        if (!cancelled) setAwaitingNetwork(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!bundle || formSeededRef.current) return;
    formSeededRef.current = true;
    setForm(
      applyDefaultsFromBundle(bundle.catalog, bundle.formas, bundle.medios, bundle.bancos, bundle.numeraciones)
    );
  }, [bundle]);

  const catalog = bundle?.catalog ?? null;

  const cuentaPickerDescription = React.useMemo(() => {
    if (!catalog || !form.origen.trim()) {
      return "Busca y selecciona una cuenta (clic en la fila).";
    }
    const label = catalog.origenes.find((o) => o.value === form.origen)?.label ?? form.origen;
    return `Cuentas filtradas según el origen del comprobante («${label}»). Busca y selecciona una fila.`;
  }, [catalog, form.origen]);

  const formas = React.useMemo(() => bundle?.formas ?? [], [bundle]);
  const medios = React.useMemo(() => bundle?.medios ?? [], [bundle]);
  const bancos = React.useMemo(() => bundle?.bancos ?? [], [bundle]);
  const numeraciones = React.useMemo(() => bundle?.numeraciones ?? [], [bundle]);

  const formaIdNum = Number(form.formaPagoId);
  const medioIdNum = Number(form.medioPagoId);
  const formaSeleccionada = React.useMemo(
    () => formas.find((f) => String(f.id) === form.formaPagoId) ?? null,
    [formas, form.formaPagoId]
  );
  const esFormaCredito = React.useMemo(
    () => (formaSeleccionada?.codigo ?? "").trim() === "002",
    [formaSeleccionada]
  );

  const mediosFiltrados = React.useMemo(
    () => mediosForForma(medios, formaIdNum),
    [medios, formaIdNum]
  );

  const bancosFiltrados = React.useMemo(
    () => bancosForFormaMedio(bancos, formaIdNum, medioIdNum),
    [bancos, formaIdNum, medioIdNum]
  );

  React.useEffect(() => {
    if (!form.formaPagoId) return;
    const ok = mediosFiltrados.some((m) => String(m.id) === form.medioPagoId);
    if (ok) return;
    const first = mediosFiltrados[0];
    setForm((prev) => ({
      ...prev,
      medioPagoId: first ? String(first.id) : "",
      bancoTarjetaId: "",
    }));
  }, [form.formaPagoId, form.medioPagoId, mediosFiltrados]);

  React.useEffect(() => {
    if (!form.medioPagoId || !form.formaPagoId) return;
    const ok = bancosFiltrados.some((b) => String(b.id) === form.bancoTarjetaId);
    if (ok) return;
    const first = bancosFiltrados[0];
    setForm((prev) => ({ ...prev, bancoTarjetaId: first ? String(first.id) : "" }));
  }, [form.formaPagoId, form.medioPagoId, form.bancoTarjetaId, bancosFiltrados]);

  React.useEffect(() => {
    if (esFormaCredito) return;
    if (!form.fechaVencimiento) return;
    setForm((prev) => ({ ...prev, fechaVencimiento: "" }));
  }, [esFormaCredito, form.fechaVencimiento]);

  const patch = React.useCallback((p: Partial<EmisionComprobantesFormState>) => {
    setForm((prev) => ({ ...prev, ...p }));
  }, []);

  React.useEffect(() => {
    if (!form.copiaPaciente) return;
    if (!form.paciente.trim()) return;
    setForm((prev) => ({ ...prev, titular: prev.paciente }));
  }, [form.copiaPaciente, form.paciente]);

  const onDocumentoBlur = React.useCallback(() => {
    if (!form.padDocumento8) return;
    const digits = form.documento.replace(/\D/g, "");
    if (!digits) return;
    const next = digits.padStart(8, "0").slice(-8);
    if (next !== form.documento) patch({ documento: next });
  }, [form.padDocumento8, form.documento, patch]);

  const origenOpts: SelectOption[] = React.useMemo(
    () => (catalog?.origenes ?? []).map((o) => ({ value: o.value, label: o.label })),
    [catalog]
  );
  const tipoDocumentoOpts: SelectOption[] = React.useMemo(
    () =>
      (catalog?.tipos_documento ?? []).map((o) => ({
        value: o.value,
        label: getTipoComprobanteDescripcion(o),
      })),
    [catalog]
  );

  const numeracionesPorTipo = React.useMemo(
    () =>
      !form.tipoDocumentoId
        ? []
        : numeraciones.filter(
            (n) => String(n.tipo_documento_id ?? "") === String(form.tipoDocumentoId)
          ),
    [numeraciones, form.tipoDocumentoId]
  );

  const formaOpts: SelectOption[] = React.useMemo(
    () => formas.map((f) => ({ value: String(f.id), label: `${f.codigo} · ${f.descripcion}` })),
    [formas]
  );
  const medioOpts: SelectOption[] = React.useMemo(
    () => mediosFiltrados.map((m) => ({ value: String(m.id), label: `${m.codigo} · ${m.descripcion}` })),
    [mediosFiltrados]
  );
  const bancoOpts: SelectOption[] = React.useMemo(
    () => bancosFiltrados.map((b) => ({ value: String(b.id), label: `${b.codigo} · ${b.descripcion}` })),
    [bancosFiltrados]
  );
  const serieOpts: SelectOption[] = React.useMemo(
    () =>
      numeracionesPorTipo.map((n) => ({
        value: String(n.id),
        label: String(n.serie ?? "").trim(),
      })),
    [numeracionesPorTipo]
  );
  const origenSeleccionadoLabel = React.useMemo(
    () => origenOpts.find((o) => o.value === form.origen)?.label ?? "",
    [origenOpts, form.origen]
  );
  const tipoSeleccionadoLabel = React.useMemo(
    () => tipoDocumentoOpts.find((o) => o.value === form.tipoDocumentoId)?.label ?? "",
    [tipoDocumentoOpts, form.tipoDocumentoId]
  );
  const serieSeleccionadaLabel = React.useMemo(
    () => serieOpts.find((o) => o.value === form.numeracionId)?.label ?? "",
    [serieOpts, form.numeracionId]
  );
  const origenFieldWidth = React.useMemo(
    () => getDynamicFieldWidthPx(origenSeleccionadoLabel || "Origen", 180, 320, 74),
    [origenSeleccionadoLabel]
  );
  const tipoFieldWidth = React.useMemo(
    () => getDynamicFieldWidthPx(tipoSeleccionadoLabel || "Tipo", 120, 320, 74),
    [tipoSeleccionadoLabel]
  );
  const serieFieldWidth = React.useMemo(
    () => getDynamicFieldWidthPx(serieSeleccionadaLabel || "Serie", 86, 180, 70),
    [serieSeleccionadaLabel]
  );
  const nroFieldWidth = React.useMemo(
    () => getDynamicFieldWidthPx(form.correlativo || "000000", 115, 200, 56),
    [form.correlativo]
  );
  const cuentaFieldWidth = React.useMemo(
    () => getDynamicFieldWidthPx(form.cuenta || "0000000000", 130, 240, 56),
    [form.cuenta]
  );

  React.useEffect(() => {
    if (!form.tipoDocumentoId) return;
    const ok = numeracionesPorTipo.some((n) => String(n.id) === form.numeracionId);
    if (ok) return;
    const first = numeracionesPorTipo[0];
    patch({
      numeracionId: first ? String(first.id) : "",
      correlativo: first?.numero_formateado?.trim() ? String(first.numero_formateado) : "",
    });
  }, [form.tipoDocumentoId, form.numeracionId, numeracionesPorTipo, patch]);

  const onNumeracionChange = React.useCallback(
    (id: string) => {
      const row = numeracionesPorTipo.find((n) => String(n.id) === id);
      patch({
        numeracionId: id,
        correlativo: row?.numero_formateado != null ? String(row.numero_formateado) : "",
      });
    },
    [numeracionesPorTipo, patch]
  );

  const onClientePicked = React.useCallback(
    (cliente: Cliente) => {
      patch({
        iafasMedico: cliente.nombre,
        telefono: cliente.telefono ?? "",
        documento: cliente.dni_o_ruc ?? "",
        direccion: cliente.direccion ?? "",
      });
    },
    [patch]
  );

  const openCuentaPicker = React.useCallback(() => {
    if (!form.origen.trim()) {
      toastService.showError("Selecciona el origen del comprobante antes de buscar una cuenta.");
      return;
    }
    setCuentaPickerOpen(true);
  }, [form.origen]);

  const loadCuentaDetalleYAutocompletar = React.useCallback(
    async (
      nroCuenta: string,
      row: CuentaCitaListItem | null,
      opts?: { suppressBlockedToast?: boolean }
    ) => {
      patch({ cuenta: nroCuenta });

      try {
        setLoadingCuentaDetalle(true);
        const detalle = await fetchCuentaDetalle(nroCuenta);
        const estadoCuenta = (detalle.cuenta.estado ?? "").toString().trim().toUpperCase();
        const bloqueada = estadoCuenta === "CANCELADO";
        setCuentaBloqueada(bloqueada);
        if (bloqueada && !opts?.suppressBlockedToast) {
          toastService.showWarning("La cuenta seleccionada ya está cancelada o facturada y no permite otra emisión.");
        }
        const pacienteId = detalle.cuenta.paciente_id ?? row?.paciente_id ?? null;
        if (!pacienteId || !Number.isFinite(Number(pacienteId))) {
          patch({ cuenta: "" });
          toastService.showWarning("La cuenta seleccionada no tiene un paciente vinculado para emitir el comprobante.");
          return;
        }

        const paciente = await getPaciente(Number(pacienteId));
        const planes = await listPacientePlanes(Number(pacienteId), {
          soloActivos: false,
          incluirPlanId: detalle.cuenta.paciente_plan_id ?? row?.paciente_plan_id ?? null,
        });

        const planObjetivo: AcreditacionPlan | undefined =
          planes.find((p) => p.id === (detalle.cuenta.paciente_plan_id ?? row?.paciente_plan_id ?? null)) ??
          planes.find((p) => p.estado === "ACTIVO") ??
          planes[0];

        if (iafasRef.current === null) {
          iafasRef.current = await listIafasLookup();
        }
        if (contratantesRef.current === null) {
          contratantesRef.current = await listContratantesLookup();
        }

        const iafaId = planObjetivo?.tipo_cliente?.iafa_id ?? null;
        const contratanteId = planObjetivo?.tipo_cliente?.contratante_id ?? null;
        const iafa =
          iafaId != null
            ? iafasRef.current.find((x) => x.id === iafaId)?.razon_social?.trim() ?? ""
            : "";
        const contratante =
          contratanteId != null
            ? contratantesRef.current.find((x) => x.id === contratanteId)?.razon_social?.trim() ?? ""
            : "";

        const nombreCompleto =
          paciente.nombre_completo?.trim() ||
          [paciente.apellido_paterno, paciente.apellido_materno, paciente.nombres]
            .filter(Boolean)
            .join(" ")
            .trim();

        const titular = paciente.titular_nombre?.trim() || nombreCompleto;
        const telefono = paciente.telefono?.trim() || paciente.celular?.trim() || "";
        const documento = paciente.numero_documento?.trim() || paciente.hc?.trim() || "";
        const direccion = paciente.direccion?.trim() || "";
        const parsed = parseCuentaDetalleServicios(detalle.detalle);
        const lineasPendientes = lineasSoloPendientes(parsed.lineas);
        const sinPendientes = parsed.lineas.length > 0 && lineasPendientes.length === 0;
        const lineas = lineasParaCaja(parsed.lineas);
        setCuentaSinPendientes(sinPendientes);

        if (!form.editaIafasMedico) {
          iafasBeforeEditRef.current = iafa;
        }
        if (!form.editaContratante) {
          contratanteBeforeEditRef.current = contratante;
        }
        if (!form.copiaPaciente) {
          titularBeforeCopiaRef.current = titular;
        }

        patch({
          paciente: nombreCompleto,
          titular,
          iafasMedico: iafa,
          telefono,
          documento,
          direccion,
          contratante,
        });
        setLineasCuenta(lineas);
        setPaqueteCuenta(parsed.paquete);
        setTarifaEsPrecioDirectoCuenta(Boolean(planObjetivo?.tarifa_es_precio_directo));
      } catch (e) {
        patch({ cuenta: "" });
        setCuentaBloqueada(false);
        setCuentaSinPendientes(false);
        setLineasCuenta([]);
        setPaqueteCuenta(null);
        setTarifaEsPrecioDirectoCuenta(false);
        const err = toApiError(e);
        if (err.kind === "server" && err.status === 404) {
          toastService.showError("No existe una cuenta con ese número.");
        } else {
          toastService.showError(
            getApiErrorMessage(e, "No se pudo cargar el detalle de la cuenta seleccionada.")
          );
        }
      } finally {
        setLoadingCuentaDetalle(false);
      }
    },
    [patch, form.editaIafasMedico, form.editaContratante, form.copiaPaciente]
  );

  const onCuentaPicked = React.useCallback(
    (row: CuentaCitaListItem) => {
      const normalized = normalizarNroCuenta10(row.nro_cuenta.trim());
      if (!normalized) {
        toastService.showError("El número de cuenta seleccionado no es válido.");
        return;
      }
      setCuentaBloqueada(false);
      setCuentaSinPendientes(false);
      void loadCuentaDetalleYAutocompletar(normalized, row);
    },
    [loadCuentaDetalleYAutocompletar]
  );

  const onCuentaChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value.replace(/\D/g, "").slice(0, 10);
      setCuentaBloqueada(false);
      setCuentaSinPendientes(false);
      patch({ cuenta: next });
    },
    [patch]
  );

  const onCuentaNumeroKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (loadingCuentaDetalle) return;
      if (!form.origen.trim()) {
        toastService.showError("Selecciona el origen del comprobante antes de cargar la cuenta.");
        return;
      }
      const normalized = normalizarNroCuenta10(form.cuenta);
      if (!normalized) {
        toastService.showError("Ingresa un número de cuenta para cargar sus servicios pendientes.");
        return;
      }
      void loadCuentaDetalleYAutocompletar(normalized, null);
    },
    [form.origen, form.cuenta, loadCuentaDetalleYAutocompletar, loadingCuentaDetalle]
  );

  const buildEmisionSnapshot = React.useCallback((): Record<string, unknown> => {
    if (!catalog) return {};
    const tipoOpt = catalog.tipos_documento.find((o) => o.value === form.tipoDocumentoId);
    const numRow = numeraciones.find((n) => String(n.id) === form.numeracionId);
    const formaRow = formas.find((f) => String(f.id) === form.formaPagoId);
    const medioRow = medios.find((m) => String(m.id) === form.medioPagoId);
    const bancoRow = bancos.find((b) => String(b.id) === form.bancoTarjetaId);
    const origenLab = catalog.origenes.find((o) => o.value === form.origen)?.label ?? form.origen;
    const estadoLab =
      catalog.estados_emision.find((e) => e.value === form.estadoEmision)?.label ?? form.estadoEmision;
    return {
      form: { ...form },
      labels: {
        origen_comprobante: origenLab,
        tipo_comprobante: tipoOpt?.label ?? "",
        estado_emision: estadoLab,
        serie_numeracion: numRow
          ? `${numRow.serie ?? ""} · ${numRow.tipo_documento_descripcion ?? ""}`.trim()
          : "",
        forma_pago: formaRow ? `${formaRow.codigo} · ${formaRow.descripcion}` : "",
        medio_pago: medioRow ? `${medioRow.codigo} · ${medioRow.descripcion}` : "",
        banco_tarjeta: bancoRow ? `${bancoRow.codigo} · ${bancoRow.descripcion}` : "",
      },
      servicios_lineas: lineasCuenta.map((l) => ({
        id: l.id,
        tarifa_servicio_id: l.tarifa_servicio_id,
        estado_facturacion: l.estado_facturacion,
        cantidad: l.cantidad,
        precio_con_igv: l.precio_con_igv,
      })),
    };
  }, [catalog, form, numeraciones, formas, medios, bancos, lineasCuenta]);

  const puedeGuardarEmision = React.useMemo(() => {
    if (savingEmision || loadingCuentaDetalle) return false;
    if (cuentaBloqueada) return false;
    const nro = normalizarNroCuenta10(form.cuenta);
    if (!nro) return false;
    if (!form.paciente.trim()) return false;
    if (!form.tipoDocumentoId || !form.numeracionId) return false;
    if (lineasSoloPendientes(lineasCuenta).length === 0) return false;
    if (esFormaCredito && !form.fechaVencimiento.trim()) return false;
    return true;
  }, [
    savingEmision,
    loadingCuentaDetalle,
    cuentaBloqueada,
    form.cuenta,
    form.paciente,
    form.tipoDocumentoId,
    form.numeracionId,
    form.fechaVencimiento,
    lineasCuenta,
    esFormaCredito,
  ]);

  const onGuardarEmision = React.useCallback(async () => {
    const nro = normalizarNroCuenta10(form.cuenta);
    if (!nro) {
      toastService.showError("Ingresa un número de cuenta válido antes de guardar la emisión.");
      return;
    }
    if (!form.paciente.trim()) {
      toastService.showError("Carga los datos de la cuenta antes de guardar el comprobante.");
      return;
    }
    if (!form.tipoDocumentoId || !form.numeracionId) {
      toastService.showError("Selecciona el tipo de comprobante y la serie antes de guardar.");
      return;
    }
    if (cuentaBloqueada) {
      toastService.showError("La cuenta ya está cancelada o facturada y no admite una nueva emisión.");
      return;
    }
    if (lineasSoloPendientes(lineasCuenta).length === 0) {
      toastService.showError("La cuenta seleccionada no tiene servicios pendientes por facturar.");
      return;
    }
    if (esFormaCredito && !form.fechaVencimiento.trim()) {
      toastService.showError("Ingresa la fecha de vencimiento para emitir con forma de pago crédito.");
      return;
    }
    const numeracionIdNum = Number(form.numeracionId);
    if (!Number.isInteger(numeracionIdNum) || numeracionIdNum <= 0) {
      toastService.showError("Selecciona una serie válida para generar el número de comprobante.");
      return;
    }
    setSavingEmision(true);
    try {
      const saved = await postEmisionComprobantesRegistrar({
        nro_cuenta: nro,
        numeracion_id: numeracionIdNum,
        servicio_linea_ids: lineasCuenta.flatMap((l) =>
          typeof l.id === "number" && Number.isFinite(l.id) ? [l.id] : []
        ),
        numero_operacion: form.numeroOperacion.trim() ? form.numeroOperacion.trim() : null,
        fecha_vencimiento: esFormaCredito && form.fechaVencimiento.trim() ? form.fechaVencimiento.trim() : null,
        snapshot: buildEmisionSnapshot(),
      });
      toastService.showSuccess("Comprobante emitido correctamente.");
      const refreshed = await getEmisionBootstrap(true);
      setBundle(refreshed);
      const numeracionRefrescada = refreshed.numeraciones.find(
        (n) => String(n.id) === String(form.numeracionId)
      );
      patch({
        numeroOperacion: "",
        correlativo:
          numeracionRefrescada?.numero_formateado?.trim() ||
          saved.numero_formateado?.trim() ||
          form.correlativo,
      });
      await loadCuentaDetalleYAutocompletar(nro, null, { suppressBlockedToast: true });
    } catch (e) {
      const err = toApiError(e);
      if (err.kind === "validation") {
        const parts = Object.values(err.errors).flat();
        const msg = parts.find((x) => typeof x === "string" && x.trim());
        toastService.showError(msg ? String(msg) : err.message);
      } else {
        toastService.showError(getApiErrorMessage(e, "No se pudo registrar la emisión del comprobante."));
      }
    } finally {
      setSavingEmision(false);
    }
  }, [
    form.cuenta,
    form.paciente,
    form.tipoDocumentoId,
    form.numeracionId,
    form.correlativo,
    form.numeroOperacion,
    form.fechaVencimiento,
    esFormaCredito,
    lineasCuenta,
    cuentaBloqueada,
    buildEmisionSnapshot,
    loadCuentaDetalleYAutocompletar,
    patch,
  ]);

  const showBlockingSpinner = awaitingNetwork && !bundle;

  if (showBlockingSpinner) {
    return (
      <div className={pageWrap}>
        <div className={`${panel} p-6`}>
          <div className="flex items-center justify-center gap-3 py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent" />
            <span className="text-sm text-(--color-text-primary)">Preparando formulario…</span>
          </div>
        </div>
      </div>
    );
  }

  if (bootErr && !bundle) {
    return (
      <div className={pageWrap}>
        <div className={`${panel} p-6 text-sm text-(--color-text-primary)`}>
          No se pudieron cargar los catálogos para emitir comprobantes. Vuelve a intentar o revisa tu conexión.
        </div>
      </div>
    );
  }

  if (!catalog) {
    return null;
  }

  if (cajaResumenError) {
    return (
      <div className={pageWrap}>
        <div className={`${panel} p-6 text-sm text-(--color-text-primary)`}>
          <p className="mb-4">No se pudo verificar si la caja normal está aperturada.</p>
          <SecondaryButton type="button" onClick={() => loadCajaResumen()}>
            Reintentar
          </SecondaryButton>
        </div>
      </div>
    );
  }

  if (cajaNormalAbierta === null) {
    return (
      <div className={pageWrap}>
        <div className={`${panel} p-6`}>
          <div className="flex items-center justify-center gap-3 py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent" />
            <span className="text-sm text-(--color-text-primary)">Verificando apertura de caja…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!cajaNormalAbierta) {
    return (
      <div className={pageWrap}>
        <div className={`${panel} p-6 text-sm text-(--color-text-primary)`}>
          <p className="mb-4">
            Para usar emisión de comprobantes debes tener la <strong>caja normal</strong> aperturada.
          </p>
          <Link
            to="/caja/apertura"
            className="inline-flex rounded-md bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            Ir a apertura de caja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={pageWrap}>
      {awaitingNetwork ? (
        <div className="flex justify-end">
          <span className="shrink-0 text-sm text-(--color-text-primary)">Actualizando catálogo…</span>
        </div>
      ) : null}
      <div className={mainSheet}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end lg:gap-2">
            <div
              className="min-w-0 w-full max-w-full lg:w-(--field-width)"
              style={{ ["--field-width" as string]: `${origenFieldWidth}px` }}
            >
              <SelectField
                label="Origen"
                value={form.origen}
                onChange={(v) => patch({ origen: v })}
                options={origenOpts}
                ariaLabel="Origen del comprobante"
                buttonClassName="w-full"
                menuClassName={menuWide}
              />
            </div>
            <div
              className="min-w-0 w-full max-w-full lg:w-(--field-width)"
              style={{ ["--field-width" as string]: `${tipoFieldWidth}px` }}
            >
              <SelectField
                label="Tipo"
                value={form.tipoDocumentoId}
                onChange={(v) => {
                  const rows = numeraciones.filter(
                    (n) => String(n.tipo_documento_id ?? "") === String(v)
                  );
                  const first = rows[0];
                  patch({
                    tipoDocumentoId: v,
                    numeracionId: first ? String(first.id) : "",
                    correlativo: first?.numero_formateado?.trim() ? String(first.numero_formateado) : "",
                  });
                }}
                options={tipoDocumentoOpts.length ? tipoDocumentoOpts : [{ value: "", label: "—" }]}
                ariaLabel="Tipo de comprobante"
                disabled={tipoDocumentoOpts.length === 0}
                buttonClassName="w-full"
                menuClassName={menuWide}
              />
            </div>
            <div
              className="min-w-0 w-full max-w-full lg:w-(--field-width)"
              style={{ ["--field-width" as string]: `${serieFieldWidth}px` }}
            >
              <SelectField
                label="Serie"
                value={form.numeracionId}
                onChange={(v) => onNumeracionChange(v)}
                options={serieOpts.length ? serieOpts : [{ value: "", label: "—" }]}
                ariaLabel="Serie de numeración"
                disabled={serieOpts.length === 0}
                buttonClassName="w-full"
                menuClassName={menuWide}
              />
            </div>
            <div
              className="min-w-0 w-full max-w-full lg:w-(--field-width)"
              style={{ ["--field-width" as string]: `${nroFieldWidth}px` }}
            >
              <span className="text-sm text-(--color-text-primary)">Número</span>
              <input
                value={form.correlativo}
                onChange={(e) => patch({ correlativo: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-(--border-color-default) bg-amber-50 px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)"
                aria-label="Número correlativo de la serie"
                title="Correlativo sugerido según la numeración activa en ficheros"
              />
            </div>
            <div
              className="min-w-0 sm:col-span-2 w-full max-w-full lg:w-(--field-width)"
              style={{ ["--field-width" as string]: `${cuentaFieldWidth}px` }}
            >
              <span className="text-sm text-(--color-text-primary)">Cuenta</span>
              <input
                value={form.cuenta}
                onChange={onCuentaChange}
                onKeyDown={onCuentaNumeroKeyDown}
                inputMode="numeric"
                maxLength={10}
                autoComplete="off"
                className="mt-1 h-10 w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)"
                aria-label="Cuenta"
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-end gap-1.5 lg:ml-auto lg:items-end">
            <PrimaryButton
              type="button"
              className="h-9 w-auto shrink-0 whitespace-nowrap px-3"
              onClick={openCuentaPicker}
            >
              Buscar cuenta
            </PrimaryButton>
            <PrimaryButton
              type="button"
              className="inline-flex h-9 w-auto shrink-0 items-center gap-2 whitespace-nowrap px-3"
              onClick={() => void onGuardarEmision()}
              disabled={!puedeGuardarEmision}
              aria-label="Guardar emisión y marcar servicios como facturados"
              title="Guardar emisión"
            >
              <Save className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
              Guardar emisión
            </PrimaryButton>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-(--color-border) pt-3 lg:grid-cols-12 lg:items-stretch lg:gap-3">
          <div className="flex min-h-0 min-w-0 lg:col-span-8">
            <div className={`${innerBlock} flex h-full min-h-0 w-full flex-col`}>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-(--color-border) pb-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-(--color-primary)/10">
                    <User className="h-4 w-4 text-(--color-primary)" aria-hidden />
                  </div>
                  <span className="text-xs font-semibold text-(--color-text-primary)">Datos del paciente</span>
                </div>
                <SecondaryButton
                  type="button"
                  className="inline-flex shrink-0 items-center gap-2"
                  onClick={() => setClientePickerOpen(true)}
                >
                  <UserSearch className="h-4 w-4" aria-hidden />
                  Cliente
                </SecondaryButton>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-x-3 lg:gap-y-4">
                <div className={fieldCell}>
                  <span className={lbl}>Paciente</span>
                  <AutoGrowTextarea
                    value={form.paciente}
                    readOnly
                    className={`mt-1 w-full min-w-0 ${taGrowReadonly}`}
                    aria-label="Paciente"
                  />
                </div>

                <div className={fieldCell}>
                  <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
                    <span className={lbl}>Titular</span>
                    <label className={chkChip}>
                      <input
                        type="checkbox"
                        checked={form.copiaPaciente}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            titularBeforeCopiaRef.current = form.titular;
                            patch({ copiaPaciente: true, titular: form.paciente });
                          } else {
                            patch({ copiaPaciente: false, titular: titularBeforeCopiaRef.current });
                          }
                        }}
                        className={chk}
                      />
                      <span className={chkLbl}>Copia paciente</span>
                    </label>
                  </div>
                  <AutoGrowTextarea
                    value={form.titular}
                    onChange={(e) => patch({ titular: e.target.value })}
                    disabled={form.copiaPaciente}
                    className={`mt-1 ${taGrowGrid} ${form.copiaPaciente ? "cursor-not-allowed opacity-80" : ""}`}
                    aria-label="Titular"
                  />
                </div>

                <div className={fieldCell}>
                  <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
                    <span className={lbl}>IAFAS / Médico</span>
                    <label className={chkChip}>
                      <input
                        type="checkbox"
                        checked={form.editaIafasMedico}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            iafasBeforeEditRef.current = form.iafasMedico;
                            patch({ editaIafasMedico: true });
                          } else {
                            patch({ editaIafasMedico: false, iafasMedico: iafasBeforeEditRef.current });
                          }
                        }}
                        className={chk}
                      />
                      <span className={chkLbl}>Edita campo</span>
                    </label>
                  </div>
                  <AutoGrowTextarea
                    value={form.iafasMedico}
                    onChange={(e) => patch({ iafasMedico: e.target.value })}
                    readOnly={!form.editaIafasMedico}
                    className={`mt-1 ${form.editaIafasMedico ? taGrowGrid : taGrowReadonlyGrid}`}
                    aria-label="IAFAS o médico"
                  />
                </div>

                <div className={fieldCell}>
                  <span className={`${lbl} shrink-0`}>Teléfono</span>
                  <input
                    value={form.telefono}
                    readOnly
                    className={`mt-1 ${inpReadonlyStretch}`}
                    aria-label="Teléfono"
                  />
                </div>

                <div className={fieldCell}>
                  <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
                    <span className={lbl}>RUC / DNI</span>
                    <label className={chkChip}>
                      <input
                        type="checkbox"
                        checked={form.padDocumento8}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            documentoBeforePadRef.current = form.documento;
                            patch({ padDocumento8: true, documento: "00000000" });
                          } else {
                            patch({ padDocumento8: false, documento: documentoBeforePadRef.current });
                          }
                        }}
                        className={chk}
                      />
                      <span className={chkLbl}>{"8 veces ('0')"}</span>
                    </label>
                  </div>
                  <input
                    value={form.documento}
                    onChange={(e) => patch({ documento: e.target.value })}
                    onBlur={onDocumentoBlur}
                    className={`mt-1 ${inpStretch}`}
                    aria-label="RUC o DNI"
                  />
                </div>

                <div className={fieldCell}>
                  <span className={`${lbl} shrink-0`}>Dirección</span>
                  <AutoGrowTextarea
                    value={form.direccion}
                    onChange={(e) => patch({ direccion: e.target.value })}
                    className={`mt-1 ${taGrowGrid}`}
                    aria-label="Dirección"
                  />
                </div>

                <div className={fieldCell}>
                  <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
                    <span className={lbl}>Contratante</span>
                    <label className={chkChip}>
                      <input
                        type="checkbox"
                        checked={form.editaContratante}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            contratanteBeforeEditRef.current = form.contratante;
                            patch({ editaContratante: true });
                          } else {
                            patch({ editaContratante: false, contratante: contratanteBeforeEditRef.current });
                          }
                        }}
                        className={chk}
                      />
                      <span className={chkLbl}>Edita campo</span>
                    </label>
                  </div>
                  <AutoGrowTextarea
                    value={form.contratante}
                    onChange={(e) => patch({ contratante: e.target.value })}
                    readOnly={!form.editaContratante}
                    className={`mt-1 ${form.editaContratante ? taGrowGrid : taGrowReadonlyGrid}`}
                    aria-label="Contratante"
                  />
                </div>
                </div>
                <div className="mt-1 min-h-2 flex-1 lg:mt-2" aria-hidden />
              </div>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 lg:col-span-4">
            <div className={`${innerBlock} flex h-full min-h-0 w-full flex-col`}>
              <BlockTitle icon={Wallet} title="Información de pago" />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-x-3 lg:gap-y-3">
                <div className="min-w-0">
                  <SelectField
                    label="Forma de pago"
                    value={form.formaPagoId}
                    onChange={(v) => patch({ formaPagoId: v })}
                    options={formaOpts.length ? formaOpts : [{ value: "", label: "—" }]}
                    ariaLabel="Forma de pago"
                    disabled={formaOpts.length === 0}
                    buttonClassName="w-full"
                    menuClassName={menuWide}
                  />
                </div>
                <div className="min-w-0">
                  <SelectField
                    label="Medio de pago"
                    value={form.medioPagoId}
                    onChange={(v) => patch({ medioPagoId: v })}
                    options={medioOpts.length ? medioOpts : [{ value: "", label: "—" }]}
                    ariaLabel="Medio de pago"
                    disabled={!form.formaPagoId || medioOpts.length === 0}
                    buttonClassName="w-full"
                    menuClassName={menuWide}
                  />
                </div>
                <div className="min-w-0">
                  <SelectField
                    label="Banco o tarjeta"
                    value={form.bancoTarjetaId}
                    onChange={(v) => patch({ bancoTarjetaId: v })}
                    options={bancoOpts.length ? bancoOpts : [{ value: "", label: "—" }]}
                    ariaLabel="Banco o tarjeta"
                    disabled={!form.formaPagoId || !form.medioPagoId || bancoOpts.length === 0}
                    buttonClassName="w-full"
                    menuClassName={menuWide}
                    searchable
                    searchPlaceholder="Buscar…"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-sm text-(--color-text-primary)">Número</span>
                  <input
                    value={form.numeroOperacion}
                    onChange={(e) => patch({ numeroOperacion: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)"
                    maxLength={120}
                    autoComplete="off"
                    aria-label="Número de operación o referencia de pago"
                    title="Referencia de pago para arqueo de caja"
                  />
                </div>
                {esFormaCredito ? (
                  <div className="min-w-0">
                    <DateField
                      label="Fecha de vencimiento"
                      value={form.fechaVencimiento}
                      onChange={(v) => patch({ fechaVencimiento: v })}
                      ariaLabel="Fecha de vencimiento del crédito"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-(--color-border) pt-3">
          <ServiciosSolicitadosSection
            medicoTratanteId={null}
            medicoTratanteLabel=""
            tarifaId={null}
            tarifaDescripcion={null}
            tarifaEsPrecioDirecto={tarifaEsPrecioDirectoCuenta}
            lineas={lineasCuenta}
            onLineasChange={setLineasCuenta}
            medicosOptions={[]}
            currentUsername=""
            nav={{
              type: "pre_facturacion",
              buscarPath: "",
              returnPath: "",
              draftStorageKey: "caja:emision:readonly",
            }}
            sectionDescription={
              cuentaSinPendientes
                ? "La cuenta no tiene servicios pendientes. Se muestran servicios facturados en modo lectura."
                : "Servicios pendientes de la cuenta seleccionada."
            }
            readOnly
            hideEditionControls
            hideMedicoUsuarioColumns
            hideEstado={!cuentaSinPendientes}
            hideCopagoControls
            presupuestoPaquete={paqueteCuenta}
          />
        </div>
      </div>
      <ClientePicker
        open={clientePickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setClientePickerOpen(false)}
        onPicked={onClientePicked}
      />
      <CuentaCitaPicker
        open={cuentaPickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setCuentaPickerOpen(false)}
        onPicked={onCuentaPicked}
        title="Seleccionar cuenta"
        description={cuentaPickerDescription}
        emisionOrigen={form.origen}
      />
    </div>
  );
}
