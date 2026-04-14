import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import PacientePicker from "../../citas/agenda/components/PacientePicker";
import CuentaCitaPicker from "../components/CuentaCitaPicker";
import type { PacienteListItem } from "../types/historiaClinica.types";
import type { CuentaCitaListItem } from "../types/cuentaCita.types";
import { fetchPacientePresupuesto } from "../../citas/presupuestos/services/presupuestoPaciente.service";
import type { PresupuestoPacienteDetalle } from "../../citas/presupuestos/types/presupuesto.types";
import { toastService } from "../../../../shared/notifications";
import { listCirugias } from "../../../ficheros/services/cirugias.service";
import { getPacienteFormCatalogs } from "../services/historiaClinica.service";
import type { PacienteFormCatalogs } from "../types/historiaClinica.types";
import { toApiError } from "../../../../shared/api/apiError";
import { autorizacionSitedsFromCuentaDetalle, fetchCuentaDetalle } from "../services/cuentaDetalle.service";
import { guardarPreFacturacionHospitalaria } from "../services/preFacturacionHospitalaria.service";
import DateInput from "../../../../shared/ui/DateInput";
import { AtencionEstadoBadge } from "../../../../shared/ui/AtencionEstadoBadge";
import MedicoPicker from "../../../emergencia/registro/components/MedicoPicker";
import type { Medico } from "../../../ficheros/types/medicos.types";
import { useAuth } from "../../../../shared/auth/useAuth";
import { api } from "../../../../shared/api";
import { ServiciosSolicitadosSection } from "../../citas/agenda/components/ServiciosSolicitadosSection";
import {
  buscarServiciosTarifa,
  getIgvPorcentaje,
  type TarifaServicioBusqueda,
} from "../../citas/agenda/services/atencionCita.service";
import type {
  AtencionDraft,
  AtencionServicioItem,
  AtencionServicioLineaDisplay,
  PresupuestoPaqueteSnapshot,
} from "../../citas/agenda/types/atencionCita.types";
import CuentaBitacoraDrawer from "../components/CuentaBitacoraDrawer";
import PaquetePicker from "../../citas/presupuestos/components/PaquetePicker";
import { getPaqueteConServicios } from "../../../ficheros/services/paqueteServicios.service";
import type { PaqueteLookup } from "../../../ficheros/types/paqueteServicios.types";

const PREF_RETURN_PATH = "/admision/historia-clinica/pre-facturacion-hospitalaria";
const PREF_BUSCAR_PATH = "/admision/historia-clinica/pre-facturacion-hospitalaria/buscar-servicios";
const PREF_DRAFT_KEY = "admision:preFacturacionHospitalariaServiciosDraft";

function userNombreCompleto(user: {
  name?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  nombres?: string;
  username?: string;
} | null | undefined): string {
  if (!user) return "";
  if (user.name && user.name.trim() !== "") return user.name.trim();
  const full = [user.apellido_paterno ?? "", user.apellido_materno ?? "", user.nombres ?? ""].join(" ").trim();
  return full || (user.username ?? "");
}

function calcularPrecios(
  precioBaseSinIgv: number,
  cantidad: number,
  descuentoPct: number,
  aumentoPct: number,
  igvPct: number
): { precioSinIgv: number; precioConIgv: number } {
  let subtotal = precioBaseSinIgv * Math.max(0, cantidad);
  if (descuentoPct > 0) subtotal *= 1 - descuentoPct / 100;
  if (aumentoPct > 0) subtotal *= 1 + aumentoPct / 100;
  const precioSinIgv = Math.round(subtotal * 1000) / 1000;
  const igv = precioSinIgv * (igvPct / 100);
  const precioConIgv = Math.round((precioSinIgv + igv) * 1000) / 1000;
  return { precioSinIgv, precioConIgv };
}

function getHoraActual(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

function medicoPredeterminadoDesdeDetalleCuenta(detalle: unknown): { id: number; cmp: string; nombre: string } | null {
  if (!detalle || typeof detalle !== "object") return null;
  const d = detalle as Record<string, unknown>;
  const prog = d.programacion as
    | {
        medico?: {
          id: number;
          nombres?: string;
          apellido_paterno?: string;
          apellido_materno?: string;
        };
      }
    | undefined;
  if (prog?.medico?.id) {
    const m = prog.medico;
    const nombre = [m.apellido_paterno, m.apellido_materno, m.nombres].filter(Boolean).join(" ").trim();
    return { id: m.id, cmp: "", nombre: nombre || "" };
  }
  const servs = d.servicios as
    | Array<{ medico_id?: number; medico_codigo?: string | null; medico_nombre?: string | null }>
    | undefined;
  if (Array.isArray(servs) && servs.length) {
    const first = servs[0];
    const mid = first.medico_id;
    if (mid != null && mid > 0) {
      return {
        id: mid,
        cmp: (first.medico_codigo ?? "").trim(),
        nombre: (first.medico_nombre ?? "").trim(),
      };
    }
  }
  return null;
}

function mapServicioCuentaToDisplay(item: AtencionServicioItem): AtencionServicioLineaDisplay {
  const estado_facturacion =
    item.estado_facturacion === "FACTURADO" || item.estado_facturacion === "PENDIENTE"
      ? item.estado_facturacion
      : "PENDIENTE";
  return {
    id: item.id,
    tarifa_servicio_id: item.tarifa_servicio_id,
    medico_id: item.medico_id,
    cop_var: item.cop_var,
    cop_fijo: item.cop_fijo,
    descuento_pct: item.descuento_pct,
    aumento_pct: item.aumento_pct,
    cantidad: item.cantidad,
    precio_sin_igv: item.precio_sin_igv,
    precio_con_igv: item.precio_con_igv,
    servicio_codigo: item.servicio_codigo ?? null,
    servicio_descripcion: item.servicio_descripcion,
    categoria_codigo: item.categoria_codigo ?? null,
    desea_liberar_precio: item.desea_liberar_precio ?? false,
    precio_unitario_tarifario_sin_igv:
      Math.round((item.precio_sin_igv / Math.max(1, item.cantidad)) * 10 ** 4) / 10 ** 4,
    medico_codigo: item.medico_codigo,
    user_username: item.user_username ?? null,
    user_nombre: item.user_nombre,
    estado_facturacion,
  };
}

function labelizeEnum(v: string): string {
  const s = v.replace(/_/g, " ").toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : v;
}

function catalogLabel(
  value: string | null | undefined,
  options: { value: string; label: string }[] | undefined
): string {
  if (!value?.trim()) return "—";
  const v = value.trim();
  const opt = options?.find((o) => o.value === v);
  return opt?.label ?? labelizeEnum(v);
}

function planEsPrivadoSeguro(plan: { label: string; iafaLabel: string } | undefined): boolean {
  if (!plan) return false;
  const t = `${plan.label} ${plan.iafaLabel}`.toUpperCase();
  return /\bPRIVADO\b/.test(t);
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

export default function PreFacturacionHospitalariaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isLgUp = useIsLgUp();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [cuentaPickerOpen, setCuentaPickerOpen] = React.useState(false);
  const [medicoPickerOpen, setMedicoPickerOpen] = React.useState(false);
  const [cuentaNro, setCuentaNro] = React.useState("");
  const [loadingPaciente, setLoadingPaciente] = React.useState(false);
  const [loadingCirugias, setLoadingCirugias] = React.useState(false);
  const [detalle, setDetalle] = React.useState<PresupuestoPacienteDetalle | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState("");
  const [cirugiaId, setCirugiaId] = React.useState("");
  const [tipo, setTipo] = React.useState("HOSPITALIZACION");
  const [cirugiaOptions, setCirugiaOptions] = React.useState<SelectOption[]>([]);
  const [catalogs, setCatalogs] = React.useState<PacienteFormCatalogs | null>(null);
  const [bloquearCuenta, setBloquearCuenta] = React.useState("HABILITADO");
  const [autorizacionSiteds, setAutorizacionSiteds] = React.useState("");
  const [cuentaEstado, setCuentaEstado] = React.useState("");
  const [fechaHospitalizacion, setFechaHospitalizacion] = React.useState("");
  const [fechaAlta, setFechaAlta] = React.useState("");
  const [medicoTratanteId, setMedicoTratanteId] = React.useState<number | null>(null);
  const [medicoTratanteCmp, setMedicoTratanteCmp] = React.useState("");
  const [medicoTratanteNombre, setMedicoTratanteNombre] = React.useState("");
  const [medicoServiciosId, setMedicoServiciosId] = React.useState<number | null>(null);
  const [medicoServiciosCmp, setMedicoServiciosCmp] = React.useState("");
  const [medicoServiciosNombre, setMedicoServiciosNombre] = React.useState("");
  const [lineas, setLineas] = React.useState<AtencionServicioLineaDisplay[]>([]);
  const [medicosOptions, setMedicosOptions] = React.useState<SelectOption[]>([]);
  const [copVarDefault, setCopVarDefault] = React.useState(0);
  const [paquetePickerOpen, setPaquetePickerOpen] = React.useState(false);
  const [bitacoraOpen, setBitacoraOpen] = React.useState(false);
  const [savingRegistro, setSavingRegistro] = React.useState(false);
  const [lockedByServer, setLockedByServer] = React.useState(false);
  const [presupuestoPaquete, setPresupuestoPaquete] = React.useState<PresupuestoPaqueteSnapshot | null>(null);
  const serviciosSectionRef = React.useRef<HTMLDivElement | null>(null);
  const processedServiciosRef = React.useRef<string | null>(null);

  const bloquearCuentaOptions: SelectOption[] = React.useMemo(
    () => [
      { value: "HABILITADO", label: "Habilitado" },
      { value: "BLOQUEADO", label: "Bloqueado" },
    ],
    []
  );

  const inputReadOnly =
    "mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8";

  const planOptions: SelectOption[] = React.useMemo(() => {
    if (!detalle?.planes.length) return [];
    return detalle.planes.map((p) => ({
      value: String(p.pacientePlanId),
      label: p.label,
    }));
  }, [detalle?.planes]);

  const iafaDisplay = React.useMemo(() => {
    if (!detalle || !selectedPlanId) return "";
    const id = Number(selectedPlanId);
    const plan = detalle.planes.find((p) => p.pacientePlanId === id);
    return plan?.iafaLabel?.trim() || "—";
  }, [detalle, selectedPlanId]);

  const pacienteAfiliadoComoDisplay = React.useMemo(
    () => catalogLabel(detalle?.tipo_paciente, catalogs?.tipos_paciente),
    [detalle?.tipo_paciente, catalogs?.tipos_paciente]
  );

  const condicionDisplay = React.useMemo(
    () => catalogLabel(detalle?.parentesco_seguro, catalogs?.parentescos_seguro),
    [detalle?.parentesco_seguro, catalogs?.parentescos_seguro]
  );

  const medicoTratanteDisplay = React.useMemo(() => {
    if (medicoTratanteCmp && medicoTratanteNombre) {
      return `${medicoTratanteCmp} · ${medicoTratanteNombre}`;
    }
    return medicoTratanteNombre || "";
  }, [medicoTratanteCmp, medicoTratanteNombre]);

  const medicoServiciosDisplay = React.useMemo(() => {
    const opt = medicosOptions.find((o) => o.value === String(medicoServiciosId ?? ""));
    if (opt?.label) return opt.label;
    if (medicoServiciosCmp && medicoServiciosNombre) {
      return `${medicoServiciosCmp} · ${medicoServiciosNombre}`;
    }
    return medicoServiciosNombre || medicoServiciosCmp || "";
  }, [medicosOptions, medicoServiciosId, medicoServiciosCmp, medicoServiciosNombre]);

  const bitacoraContextLine = React.useMemo(() => {
    if (cuentaNro.trim()) return `Cuenta ${cuentaNro.trim()}`;
    if (detalle) {
      const nom = detalle.nombre_completo?.trim();
      return nom ? `HC ${detalle.hc} · ${nom}` : `HC ${detalle.hc}`;
    }
    return "";
  }, [cuentaNro, detalle]);

  const pickersDisabled = loadingPaciente || lockedByServer;
  const formDisabled = !detalle || loadingPaciente || lockedByServer;

  const pacientePlanIdParaGuardar = React.useMemo(() => {
    if (!detalle) return 0;
    if (selectedPlanId.trim() !== "") return Number(selectedPlanId);
    return detalle.planes[0]?.pacientePlanId ?? 0;
  }, [detalle, selectedPlanId]);

  const canSaveRegistro = React.useMemo(() => {
    if (!detalle) return false;
    if (pacientePlanIdParaGuardar <= 0) return false;
    if (medicoTratanteId == null || medicoTratanteId <= 0) return false;
    if (lineas.length < 1 && presupuestoPaquete == null) return false;
    if (lockedByServer) {
      return bloquearCuenta === "HABILITADO";
    }
    return true;
  }, [
    detalle,
    lockedByServer,
    bloquearCuenta,
    pacientePlanIdParaGuardar,
    medicoTratanteId,
    lineas.length,
    presupuestoPaquete,
  ]);

  const onMedicoTratantePicked = React.useCallback((m: Medico) => {
    const nombre =
      m.nombre_completo?.trim() ||
      [m.apellido_paterno, m.apellido_materno, m.nombres].filter(Boolean).join(" ").trim();
    const cmp = m.cmp?.trim() ?? m.codigo?.trim() ?? "";
    setMedicoTratanteId(m.id);
    setMedicoTratanteCmp(cmp);
    setMedicoTratanteNombre(nombre);
    setMedicoPickerOpen(false);
  }, []);

  const planSeleccionado = React.useMemo(() => {
    if (!detalle || !selectedPlanId) return undefined;
    const id = Number(selectedPlanId);
    return detalle.planes.find((p) => p.pacientePlanId === id);
  }, [detalle, selectedPlanId]);

  const tarifaId = planSeleccionado?.tarifaId ?? null;
  const tarifaDescripcion = planSeleccionado
    ? (planSeleccionado.tarifaDescripcion?.trim() || planSeleccionado.tarifaCodigo?.trim() || null)
    : null;
  const tarifaEsPrecioDirecto = Boolean(planSeleccionado?.tarifaEsPrecioDirecto);

  const mostrarPacientePrivado = Boolean(detalle && planEsPrivadoSeguro(planSeleccionado));

  const tarifaIdRef = React.useRef<number | null>(tarifaId);
  const lineasRef = React.useRef<AtencionServicioLineaDisplay[]>(lineas);
  const recargoRecalcInFlightRef = React.useRef(false);
  const recargoRecalcTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const igvPctCacheRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    tarifaIdRef.current = tarifaId;
  }, [tarifaId]);
  React.useEffect(() => {
    lineasRef.current = lineas;
  }, [lineas]);

  const recalcularRecargoNocheEnLineas = React.useCallback(async () => {
    const currentTarifaId = tarifaIdRef.current;
    const snapshot = lineasRef.current;
    if (!currentTarifaId || snapshot.length === 0) return;
    if (recargoRecalcInFlightRef.current) return;

    recargoRecalcInFlightRef.current = true;
    try {
      const horaReal = getHoraActual();
      const igvPct = igvPctCacheRef.current ?? (await getIgvPorcentaje());
      igvPctCacheRef.current = igvPct;

      const updatesByTarifaServicioId = new Map<
        number,
        { recargoActivo: boolean; aumentoPct: number; precioSinIgv: number; precioConIgv: number }
      >();

      const maxConcurrent = 4;

      for (let i = 0; i < snapshot.length; i += maxConcurrent) {
        const chunk = snapshot.slice(i, i + maxConcurrent);
        await Promise.all(
          chunk.map(async (l) => {
            const codigo = (l.servicio_codigo ?? "").trim();
            if (!codigo) return;
            const res = await buscarServiciosTarifa(currentTarifaId, {
              page: 1,
              per_page: 25,
              codigo,
              status: "ACTIVO",
              hora: horaReal,
            });

            const found =
              res.data.find((s) => s.id === l.tarifa_servicio_id) ??
              res.data.find((s) => (s.codigo ?? "").trim() === codigo) ??
              res.data[0];

            if (!found) return;

            const recargoActivo = Boolean(found.recargo_noche_activo);
            const aumentoPct = recargoActivo ? found.recargo_noche_porcentaje ?? 0 : 0;
            const precioBase = parseFloat(String(found.precio_sin_igv)) || 0;
            const cantidad = Math.max(1, Math.floor(Number(l.cantidad ?? 1) || 1));
            const descuentoPct = Math.max(0, Number(l.descuento_pct ?? 0) || 0);

            const { precioSinIgv, precioConIgv } = calcularPrecios(precioBase, cantidad, descuentoPct, aumentoPct, igvPct);

            updatesByTarifaServicioId.set(l.tarifa_servicio_id, {
              recargoActivo,
              aumentoPct,
              precioSinIgv,
              precioConIgv,
            });
          })
        );
      }

      setLineas((prev) =>
        prev.map((l) => {
          const upd = updatesByTarifaServicioId.get(l.tarifa_servicio_id);
          if (!upd) return l;
          return {
            ...l,
            recargo_noche_activo: upd.recargoActivo,
            aumento_pct: upd.aumentoPct,
            precio_sin_igv: upd.precioSinIgv,
            precio_con_igv: upd.precioConIgv,
            precio_unitario_tarifario_sin_igv: upd.precioSinIgv,
          };
        })
      );
    } catch {
      void 0;
    } finally {
      recargoRecalcInFlightRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    const applyRecargoUpdate = (nextTarifaId: number | null) => {
      if (!nextTarifaId) return;
      if (!tarifaIdRef.current) return;
      if (nextTarifaId !== tarifaIdRef.current) return;
      if (lineasRef.current.length === 0) return;

      if (recargoRecalcTimeoutRef.current) clearTimeout(recargoRecalcTimeoutRef.current);
      recargoRecalcTimeoutRef.current = setTimeout(() => {
        void recalcularRecargoNocheEnLineas();
      }, 150);
    };

    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ tarifaId?: number }>;
      applyRecargoUpdate(ce.detail?.tarifaId ?? null);
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("recargo-noche-channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "changed") {
          applyRecargoUpdate(event.data.tarifaId ?? null);
        }
      };
    } catch {
      void 0;
    }

    window.addEventListener("recargoNoche:changed", handler);
    return () => {
      window.removeEventListener("recargoNoche:changed", handler);
      if (channel) channel.close();
      if (recargoRecalcTimeoutRef.current) clearTimeout(recargoRecalcTimeoutRef.current);
    };
  }, [recalcularRecargoNocheEnLineas]);

  const loadPacienteDetalle = React.useCallback(
    async (
      pacienteId: number,
      nroCuenta: string | null,
      preferPacientePlanId: number | null,
      estadoCuentaDesdeListado?: string | null
    ) => {
      setLoadingPaciente(true);
      setLockedByServer(false);
      setLineas([]);
      setPresupuestoPaquete(null);
      processedServiciosRef.current = null;
      setSelectedPlanId("");
      setAutorizacionSiteds("");
      setCuentaEstado("");
      setBloquearCuenta("HABILITADO");
      setCirugiaId("");
      setTipo("HOSPITALIZACION");
      setFechaHospitalizacion("");
      setFechaAlta("");
      setMedicoTratanteId(null);
      setMedicoTratanteCmp("");
      setMedicoTratanteNombre("");
      setMedicoServiciosId(null);
      setMedicoServiciosCmp("");
      setMedicoServiciosNombre("");
      setCopVarDefault(0);
      try {
        const d = await fetchPacientePresupuesto(pacienteId);
        setDetalle(d);
        setCuentaNro(nroCuenta ?? "");
        setCuentaEstado((estadoCuentaDesdeListado ?? "").trim());
        const matchPrefer =
          preferPacientePlanId != null && d.planes.some((p) => p.pacientePlanId === preferPacientePlanId);
        const first = matchPrefer ? d.planes.find((p) => p.pacientePlanId === preferPacientePlanId) : d.planes[0];
        setSelectedPlanId(first ? String(first.pacientePlanId) : "");
        if (!d.planes.length) {
          toastService.showInfo("Este paciente no tiene planes activos registrados.");
        }

        const nc = (nroCuenta ?? "").trim();
        if (nc) {
          try {
            const cu = await fetchCuentaDetalle(nc);
            const estadoCuentaApi = (cu.cuenta.estado ?? "").trim();
            setCuentaEstado(estadoCuentaApi);
            if (estadoCuentaApi === "CANCELADO_LISTO_PARA_FACTURAR") {
              setLockedByServer(true);
            }
            const rawDet = cu.detalle;
            if (
              rawDet &&
              typeof rawDet === "object" &&
              (rawDet as { pre_facturacion_hospitalaria?: boolean }).pre_facturacion_hospitalaria === true
            ) {
              const f = (rawDet as { form?: unknown }).form;
              if (f && typeof f === "object") {
                const form = f as Record<string, unknown>;
                if (typeof form.selectedPlanId === "string") setSelectedPlanId(form.selectedPlanId);
                if (typeof form.cirugiaId === "string") setCirugiaId(form.cirugiaId);
                if (typeof form.tipo === "string") setTipo(form.tipo);
                if (typeof form.fechaHospitalizacion === "string") setFechaHospitalizacion(form.fechaHospitalizacion);
                if (typeof form.fechaAlta === "string") setFechaAlta(form.fechaAlta);
                if (form.bloquearCuenta === "HABILITADO" || form.bloquearCuenta === "BLOQUEADO") {
                  setBloquearCuenta(form.bloquearCuenta);
                }
                if (typeof form.autorizacionSiteds === "string") setAutorizacionSiteds(form.autorizacionSiteds);
                if (typeof form.medicoTratanteId === "number") setMedicoTratanteId(form.medicoTratanteId);
                else if (form.medicoTratanteId === null) setMedicoTratanteId(null);
                if (typeof form.medicoTratanteCmp === "string") setMedicoTratanteCmp(form.medicoTratanteCmp);
                if (typeof form.medicoTratanteNombre === "string") setMedicoTratanteNombre(form.medicoTratanteNombre);
                if (typeof form.medicoServiciosId === "number") setMedicoServiciosId(form.medicoServiciosId);
                else if (form.medicoServiciosId === null) setMedicoServiciosId(null);
                if (typeof form.medicoServiciosCmp === "string") setMedicoServiciosCmp(form.medicoServiciosCmp);
                if (typeof form.medicoServiciosNombre === "string") setMedicoServiciosNombre(form.medicoServiciosNombre);
                if (typeof form.copVarDefault === "number" && Number.isFinite(form.copVarDefault)) {
                  setCopVarDefault(form.copVarDefault);
                }
                if (Array.isArray(form.lineas)) {
                  setLineas(form.lineas as AtencionServicioLineaDisplay[]);
                }
                if (Object.prototype.hasOwnProperty.call(form, "presupuestoPaquete")) {
                  setPresupuestoPaquete((form.presupuestoPaquete as PresupuestoPaqueteSnapshot | null) ?? null);
                }
                processedServiciosRef.current = null;
                if (form.bloquearCuenta === "BLOQUEADO") {
                  setLockedByServer(true);
                }
              }
            } else {
              setAutorizacionSiteds(autorizacionSitedsFromCuentaDetalle(cu));
              const items = serviciosItemsFromCuentaDetalle(cu.detalle);
              if (items.length > 0) {
                setLineas(items.map(mapServicioCuentaToDisplay));
              }
              const medHint = medicoPredeterminadoDesdeDetalleCuenta(cu.detalle);
              if (medHint) {
                setMedicoServiciosId(medHint.id);
                setMedicoServiciosCmp(medHint.cmp);
                setMedicoServiciosNombre(medHint.nombre);
              }
            }
          } catch {
            setAutorizacionSiteds("");
          }
        }
      } catch {
        setDetalle(null);
        setSelectedPlanId("");
        setCuentaNro("");
        setAutorizacionSiteds("");
        setCuentaEstado("");
        setFechaHospitalizacion("");
        setFechaAlta("");
        setMedicoTratanteId(null);
        setMedicoTratanteCmp("");
        setMedicoTratanteNombre("");
        setMedicoServiciosId(null);
        setMedicoServiciosCmp("");
        setMedicoServiciosNombre("");
        setBloquearCuenta("HABILITADO");
        setLineas([]);
        setPresupuestoPaquete(null);
        processedServiciosRef.current = null;
        toastService.showError("No se pudieron cargar los datos del paciente.");
      } finally {
        setLoadingPaciente(false);
      }
    },
    [],
  );

  const handleGuardarRegistro = React.useCallback(async () => {
    if (!detalle || !canSaveRegistro) return;
    const planId = pacientePlanIdParaGuardar;
    if (planId <= 0) {
      toastService.showError("El paciente debe tener un plan de salud.");
      return;
    }
    setSavingRegistro(true);
    try {
      const form: Record<string, unknown> = {
        selectedPlanId,
        cirugiaId,
        tipo,
        fechaHospitalizacion,
        fechaAlta,
        bloquearCuenta,
        autorizacionSiteds,
        medicoTratanteId,
        medicoTratanteCmp,
        medicoTratanteNombre,
        medicoServiciosId,
        medicoServiciosCmp,
        medicoServiciosNombre,
        copVarDefault,
        lineas,
        presupuestoPaquete,
        tarifaId,
      };
      const res = await guardarPreFacturacionHospitalaria({
        paciente_id: detalle.id,
        paciente_plan_id: planId,
        ...(cuentaNro.trim() ? { nro_cuenta: cuentaNro.trim() } : {}),
        form,
      });
      toastService.showInfo("Registro guardado.");
      await loadPacienteDetalle(detalle.id, res.nro_cuenta, planId, null);
    } catch (e: unknown) {
      toastService.showError(toApiError(e).message);
    } finally {
      setSavingRegistro(false);
    }
  }, [
    detalle,
    canSaveRegistro,
    pacientePlanIdParaGuardar,
    selectedPlanId,
    cirugiaId,
    tipo,
    fechaHospitalizacion,
    fechaAlta,
    bloquearCuenta,
    autorizacionSiteds,
    medicoTratanteId,
    medicoTratanteCmp,
    medicoTratanteNombre,
    medicoServiciosId,
    medicoServiciosCmp,
    medicoServiciosNombre,
    copVarDefault,
    lineas,
    presupuestoPaquete,
    tarifaId,
    cuentaNro,
    loadPacienteDetalle,
  ]);

  const onPacientePicked = React.useCallback(
    async (p: PacienteListItem) => {
      await loadPacienteDetalle(p.id, null, null);
    },
    [loadPacienteDetalle],
  );

  const onCuentaPicked = React.useCallback(
    async (row: CuentaCitaListItem) => {
      if (row.paciente_id == null) {
        toastService.showError("Esta cuenta no está vinculada a un paciente en historia clínica.");
        return;
      }
      await loadPacienteDetalle(row.paciente_id, row.nro_cuenta, row.paciente_plan_id, row.estado);
    },
    [loadPacienteDetalle],
  );

  React.useEffect(() => {
    let cancelled = false;
    void getPacienteFormCatalogs()
      .then((c) => {
        if (!cancelled) setCatalogs(c);
      })
      .catch(() => {
        if (!cancelled) setCatalogs(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingCirugias(true);
    void listCirugias({ page: 1, per_page: 200, status: "ACTIVO" })
      .then((res) => {
        if (cancelled) return;
        const options = res.data.map((item) => ({
          value: String(item.id),
          label: `${item.codigo} · ${item.descripcion}`,
        }));
        setCirugiaOptions(options);
      })
      .catch(() => {
        if (!cancelled) {
          setCirugiaOptions([]);
          toastService.showError("No se pudo cargar la lista de cirugías activas.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCirugias(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tipoOptions: SelectOption[] = React.useMemo(
    () => [
      { value: "HOSPITALIZACION", label: "Hospitalización" },
      { value: "CENTRO_QUIRURGICO", label: "Centro Quirúrgico" },
      { value: "UCI_UCIN", label: "UCI/UCIN" },
    ],
    []
  );

  React.useEffect(() => {
    api
      .get<{ data?: Array<{ id: number; codigo?: string; nombres?: string; apellido_paterno?: string; apellido_materno?: string }> }>(
        "/ficheros/medicos?status=ACTIVO&per_page=200&page=1"
      )
      .then((res) => {
        const raw = res as { data?: unknown };
        const arr = Array.isArray(raw.data) ? raw.data : [];
        const opts: SelectOption[] = arr.map((m: { id: number; codigo?: string; apellido_paterno?: string; apellido_materno?: string; nombres?: string }) => {
          const code = (m.codigo ?? "").trim();
          const name = [m.apellido_paterno, m.apellido_materno, m.nombres].filter(Boolean).join(" ").trim();
          const label = code ? (name ? `${code} · ${name}` : code) : (name || `Médico ${m.id}`);
          return { value: String(m.id), label };
        });
        setMedicosOptions(opts);
      })
      .catch(() => setMedicosOptions([]));
  }, []);

  const getAtencionDraft = React.useCallback((): AtencionDraft => {
    return {
      acudio: false,
      horaAsistenciaDisplay: "",
      pacientePlanId: selectedPlanId ? Number(selectedPlanId) : null,
      parentescoSeguro: detalle?.parentesco_seguro ?? "",
      titularNombre: "",
      controlPrePostNatal: false,
      controlNinoSano: false,
      chequeo: false,
      carencia: false,
      latencia: false,
      soatActivo: false,
      soatNumeroPoliza: "",
      soatNumeroPlaca: "",
      lineas,
      presupuesto_paquete: presupuestoPaquete,
    };
  }, [selectedPlanId, detalle?.parentesco_seguro, lineas, presupuestoPaquete]);

  const onServiciosSelected = React.useCallback(
    (servicios: TarifaServicioBusqueda[]) => {
      if (!servicios.length || !detalle) return;
      const existingIds = new Set(lineas.map((l) => l.tarifa_servicio_id));
      const toAdd = servicios.filter((s) => !existingIds.has(s.id));
      const duplicateCount = servicios.length - toAdd.length;
      if (duplicateCount > 0) {
        toastService.showWarning(
          duplicateCount === 1
            ? "1 servicio ya está en la lista."
            : `${duplicateCount} servicios ya están en la lista.`
        );
      }
      if (!toAdd.length) return;
      const medicoId = medicoServiciosId ?? 0;
      const medicoOpt = medicosOptions.find((o) => o.value === String(medicoServiciosId ?? ""));
      const labelMedico = medicoOpt?.label ?? "";
      const codigoMedico = labelMedico.includes(" · ") ? labelMedico.split(" · ")[0]?.trim() ?? "" : labelMedico.split(/\s+/)[0] ?? "";
      const medicoNombreEtiqueta = labelMedico.includes(" · ")
        ? labelMedico.split(" · ").slice(1).join(" · ").trim()
        : labelMedico.trim();
      const medicoNombre = medicoNombreEtiqueta || medicoServiciosNombre || medicoServiciosCmp;
      getIgvPorcentaje().then((igvPct) => {
        const nuevas: AtencionServicioLineaDisplay[] = toAdd.map((s) => {
          const precioBase = parseFloat(String(s.precio_sin_igv)) || 0;
          const recargoNoche = Boolean(s.recargo_noche_activo);
          const aumentoPct = recargoNoche ? (s.recargo_noche_porcentaje ?? 0) : 0;
          const { precioSinIgv, precioConIgv } = calcularPrecios(precioBase, 1, 0, aumentoPct, igvPct);
          const esCat50 = String(s.categoria_codigo ?? "").trim() === "50";
          return {
            tarifa_servicio_id: s.id,
            servicio_codigo: s.codigo ?? "",
            servicio_descripcion: s.descripcion ?? "",
            categoria_codigo: s.categoria_codigo ?? null,
            desea_liberar_precio: s.desea_liberar_precio ?? false,
            cop_var: esCat50 ? 0 : copVarDefault,
            cop_fijo: 0,
            descuento_pct: 0,
            aumento_pct: aumentoPct,
            cantidad: 1,
            precio_sin_igv: precioSinIgv,
            precio_con_igv: precioConIgv,
            precio_unitario_tarifario_sin_igv: precioSinIgv,
            medico_id: medicoId,
            medico_codigo: codigoMedico || medicoNombre,
            user_username: user?.username ?? "",
            user_nombre: userNombreCompleto(user),
            estado_facturacion: "PENDIENTE",
            recargo_noche_activo: recargoNoche,
          };
        });
        setLineas((prev) => [...prev, ...nuevas]);
        requestAnimationFrame(() => {
          serviciosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    },
    [
      detalle,
      lineas,
      medicosOptions,
      user,
      copVarDefault,
      medicoServiciosId,
      medicoServiciosNombre,
      medicoServiciosCmp,
    ]
  );

  const onDefaultMedicoChange = React.useCallback(
    (id: number | null) => {
      if (id == null) {
        setMedicoServiciosId(null);
        setMedicoServiciosCmp("");
        setMedicoServiciosNombre("");
        setLineas((prev) => prev.map((l) => ({ ...l, medico_id: 0, medico_codigo: "—" })));
        return;
      }
      const opt = medicosOptions.find((o) => o.value === String(id));
      const label = opt?.label ?? "";
      const codigo = label.includes(" · ") ? label.split(" · ")[0]?.trim() ?? "" : label.split(/\s+/)[0] ?? "";
      const nombre = label.includes(" · ") ? label.split(" · ").slice(1).join(" · ").trim() : label.trim();
      setMedicoServiciosId(id);
      setMedicoServiciosCmp(codigo);
      setMedicoServiciosNombre(nombre || codigo);
      const codigoLinea = codigo || nombre || "—";
      setLineas((prev) => prev.map((l) => ({ ...l, medico_id: id, medico_codigo: codigoLinea })));
    },
    [medicosOptions]
  );

  const serviciosPrefactSectionDescription = React.useMemo(() => {
    if (!detalle) return "Seleccione paciente o cuenta y un plan con tarifario.";
    if (!selectedPlanId) return "Elija un plan para el tarifario.";
    if (tarifaId == null) return "Este plan no tiene tarifa asignada.";
    if (presupuestoPaquete != null) {
      return "Paquete activo. Para agregar más ítems del tarifario, quite el paquete arriba.";
    }
    return "Busque paquete (opcional) o servicios del tarifario del plan.";
  }, [detalle, selectedPlanId, tarifaId, presupuestoPaquete]);

  React.useEffect(() => {
    const st = (location.state ?? {}) as {
      selectedServicios?: TarifaServicioBusqueda[];
      returnLineas?: AtencionServicioLineaDisplay[];
      scrollToServicios?: boolean;
      copVarDefault?: number;
      presupuestoPaquete?: PresupuestoPaqueteSnapshot | null;
    };
    const servs = st.selectedServicios;
    const restoreLineas = st.returnLineas;
    const scrollTo = st.scrollToServicios;
    if (st.copVarDefault != null && Number.isFinite(st.copVarDefault)) {
      setCopVarDefault(st.copVarDefault);
    }
    if (typeof st.presupuestoPaquete !== "undefined") {
      setPresupuestoPaquete(st.presupuestoPaquete ?? null);
    }
    const stateSinDraft = () => {
      const o: Record<string, unknown> = {
        returnLineas: st.returnLineas,
        scrollToServicios: st.scrollToServicios,
        selectedServicios: st.selectedServicios,
        copVarDefault: st.copVarDefault,
      };
      if (typeof st.presupuestoPaquete !== "undefined") {
        o.presupuestoPaquete = st.presupuestoPaquete;
      }
      return o;
    };

    if (scrollTo && serviciosSectionRef.current) {
      requestAnimationFrame(() => {
        serviciosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navigate(location.pathname, { replace: true, state: { ...stateSinDraft(), scrollToServicios: false } });
    }

    if (restoreLineas != null) setLineas(restoreLineas);

    if (!servs?.length || !detalle) return;
    const key = servs.map((s) => s.id).join(",");
    if (processedServiciosRef.current === key) return;
    processedServiciosRef.current = key;
    const nextNavState: Record<string, unknown> = {};
    if (typeof st.presupuestoPaquete !== "undefined") {
      nextNavState.presupuestoPaquete = st.presupuestoPaquete;
    }
    navigate(location.pathname, { replace: true, state: nextNavState });
    const medicoId = medicoServiciosId ?? 0;
    const medicoOpt = medicosOptions.find((o) => o.value === String(medicoServiciosId ?? ""));
    const labelMedico = medicoOpt?.label ?? "";
    const codigoMedico = labelMedico.includes(" · ") ? labelMedico.split(" · ")[0]?.trim() ?? "" : labelMedico.split(/\s+/)[0] ?? "";
    const medicoNombreEtiqueta = labelMedico.includes(" · ")
      ? labelMedico.split(" · ").slice(1).join(" · ").trim()
      : labelMedico.trim();
    const medicoNombre = medicoNombreEtiqueta || medicoServiciosNombre || medicoServiciosCmp;
    getIgvPorcentaje().then((igvPct) => {
      const nuevas: AtencionServicioLineaDisplay[] = servs.map((s) => {
        const precioBase = parseFloat(String(s.precio_sin_igv)) || 0;
        const recargoNoche = Boolean(s.recargo_noche_activo);
        const aumentoPct = recargoNoche ? (s.recargo_noche_porcentaje ?? 0) : 0;
        const { precioSinIgv, precioConIgv } = calcularPrecios(precioBase, 1, 0, aumentoPct, igvPct);
        const esCat50 = String(s.categoria_codigo ?? "").trim() === "50";
        const copVar = st.copVarDefault ?? copVarDefault;
        return {
          tarifa_servicio_id: s.id,
          servicio_codigo: s.codigo ?? "",
          servicio_descripcion: s.descripcion ?? "",
          categoria_codigo: s.categoria_codigo ?? null,
          desea_liberar_precio: s.desea_liberar_precio ?? false,
          cop_var: esCat50 ? 0 : copVar,
          cop_fijo: 0,
          descuento_pct: 0,
          aumento_pct: aumentoPct,
          cantidad: 1,
          precio_sin_igv: precioSinIgv,
          precio_con_igv: precioConIgv,
          precio_unitario_tarifario_sin_igv: precioSinIgv,
          medico_id: medicoId,
          medico_codigo: codigoMedico || medicoNombre,
          user_username: user?.username ?? "",
          user_nombre: userNombreCompleto(user),
          estado_facturacion: "PENDIENTE",
          recargo_noche_activo: recargoNoche,
        };
      });
      setLineas((prev) => [...(restoreLineas ?? prev), ...nuevas]);
      processedServiciosRef.current = null;
    });
  }, [
    location.state,
    location.pathname,
    navigate,
    detalle,
    medicosOptions,
    user,
    copVarDefault,
    medicoServiciosId,
    medicoServiciosNombre,
    medicoServiciosCmp,
  ]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-col gap-2 rounded border border-(--border-color-default) bg-(--color-surface) p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          {lockedByServer && bloquearCuenta === "BLOQUEADO" ? (
            <span className="block text-left text-sm font-bold uppercase tracking-wide text-red-600 sm:text-base">
              CANCELADO LISTO PARA FACTURAR
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <SecondaryButton
            type="button"
            disabled={loadingPaciente}
            onClick={() => {
              if (!detalle && !cuentaNro.trim()) {
                toastService.showInfo("Seleccione un paciente o una cuenta para usar la bitácora.");
                return;
              }
              setBitacoraOpen(true);
            }}
          >
            Bitácora
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={!canSaveRegistro || loadingPaciente || savingRegistro}
            onClick={() => void handleGuardarRegistro()}
          >
            {savingRegistro ? "Guardando…" : "Guardar registro"}
          </PrimaryButton>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-2">
        <div className="min-w-0">
          <div className="flex h-full min-h-0 w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0 pr-2">
                <h2 className="text-sm font-semibold text-(--color-text-primary)">Datos de la cuenta</h2>
                <p className="mt-0.5 text-xs text-(--color-text-secondary)">
                  Paciente o cuenta, plan, cirugía y tipo de prestación.
                </p>
                {detalle && (cuentaEstado || mostrarPacientePrivado) ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {cuentaEstado ? <AtencionEstadoBadge value={cuentaEstado} /> : null}
                    {mostrarPacientePrivado ? (
                      <span
                        className="inline-flex items-center rounded-full border border-(--color-primary) bg-(--color-primary)/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-(--color-primary)"
                        title="Plan privado"
                      >
                        Paciente privado
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <SecondaryButton
                  type="button"
                  disabled={pickersDisabled}
                  onClick={() => {
                    setPickerOpen(false);
                    setCuentaPickerOpen(true);
                  }}
                >
                  Buscar cuenta
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  disabled={pickersDisabled}
                  onClick={() => {
                    setCuentaPickerOpen(false);
                    setPickerOpen(true);
                  }}
                >
                  {detalle ? "Cambiar paciente" : "Buscar paciente"}
                </PrimaryButton>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">N° cuenta</label>
                <input value={cuentaNro} readOnly className={inputReadOnly} />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Nombres y apellidos</label>
                <input value={detalle?.nombre_completo ?? ""} readOnly className={inputReadOnly} />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">N° Historia</label>
                <input value={detalle?.hc ?? ""} readOnly className={inputReadOnly} />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">N° Referencia</label>
                <input value={detalle?.nr ?? ""} readOnly className={inputReadOnly} />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Plan</label>
                <div className="mt-1 lg:mt-0.5">
                  <SelectMenu
                    value={selectedPlanId}
                    onChange={(v) => {
                      setSelectedPlanId(v ?? "");
                      setLineas([]);
                      setPresupuestoPaquete(null);
                      processedServiciosRef.current = null;
                    }}
                    options={planOptions}
                    ariaLabel="Plan"
                    buttonClassName="h-10 w-full lg:h-8"
                    menuClassName="min-w-full"
                    disabled={formDisabled || planOptions.length === 0}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">IAFAS</label>
                <input value={iafaDisplay} readOnly className={inputReadOnly} />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Cirugía</label>
                <div className="mt-1 lg:mt-0.5">
                  <SelectMenu
                    value={cirugiaId}
                    onChange={(v) => setCirugiaId(v ?? "")}
                    options={cirugiaOptions}
                    ariaLabel="Cirugía"
                    buttonClassName="h-10 w-full lg:h-8"
                    menuClassName="min-w-full"
                    disabled={formDisabled || loadingCirugias || cirugiaOptions.length === 0}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Tipo</label>
                <div className="mt-1 lg:mt-0.5">
                  <SelectMenu
                    value={tipo}
                    onChange={(v) => setTipo(v ?? "HOSPITALIZACION")}
                    options={tipoOptions}
                    ariaLabel="Tipo"
                    buttonClassName="h-10 w-full lg:h-8"
                    menuClassName="min-w-full"
                    disabled={formDisabled}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Fecha de Hospitalización</label>
                <div className="mt-1 lg:mt-0.5">
                  <DateInput
                    value={fechaHospitalizacion}
                    onChange={setFechaHospitalizacion}
                    aria-label="Fecha de hospitalización"
                    disabled={formDisabled}
                    className="w-full min-w-0 sm:min-w-[120px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Fecha de Alta</label>
                <div className="mt-1 lg:mt-0.5">
                  <DateInput
                    value={fechaAlta}
                    onChange={setFechaAlta}
                    aria-label="Fecha de alta"
                    disabled={formDisabled}
                    className="w-full min-w-0 sm:min-w-[120px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex h-full min-h-0 w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0 pr-2">
                <h2 className="text-sm font-semibold text-(--color-text-primary)">Médico y control de cuenta</h2>
              </div>
              <PrimaryButton type="button" disabled={formDisabled} onClick={() => setMedicoPickerOpen(true)}>
                Buscar médico
              </PrimaryButton>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 lg:mt-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">Bloquear cuenta</label>
                <div className="mt-1 lg:mt-0.5">
                  <SelectMenu
                    value={bloquearCuenta}
                    onChange={(v) => setBloquearCuenta(v ?? "HABILITADO")}
                    options={bloquearCuentaOptions}
                    ariaLabel="Bloquear cuenta"
                    buttonClassName="h-11 min-h-11 w-full text-sm lg:h-10 lg:min-h-10"
                    menuClassName="min-w-full"
                    disabled={!detalle || loadingPaciente}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">N° Autorización SITEDS</label>
                <input
                  value={autorizacionSiteds}
                  onChange={(e) => setAutorizacionSiteds(e.target.value.slice(0, 60))}
                  maxLength={60}
                  disabled={formDisabled}
                  className={inputReadOnly}
                  autoComplete="off"
                  aria-label="Número de autorización SITEDS"
                />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Médico tratante</label>
                <input
                  value={medicoTratanteDisplay}
                  readOnly
                  disabled={formDisabled}
                  className={inputReadOnly}
                  aria-label="Médico tratante"
                />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Paciente afiliado como</label>
                <input
                  value={detalle ? pacienteAfiliadoComoDisplay : ""}
                  readOnly
                  className={inputReadOnly}
                />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Condición</label>
                <input
                  value={detalle ? condicionDisplay : ""}
                  readOnly
                  className={inputReadOnly}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex h-full min-h-0 w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0 pr-2">
                <h2 className="text-sm font-semibold text-(--color-text-primary)">Paquetes</h2>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                {presupuestoPaquete != null && (
                  <SecondaryButton
                    type="button"
                    className="whitespace-nowrap"
                    disabled={formDisabled}
                    onClick={() => setPresupuestoPaquete(null)}
                  >
                    Quitar
                  </SecondaryButton>
                )}
                <PrimaryButton
                  type="button"
                  className="whitespace-nowrap"
                  disabled={formDisabled || tarifaId == null}
                  onClick={() => setPaquetePickerOpen(true)}
                >
                  {presupuestoPaquete ? "Cambiar paquete" : "Buscar paquete"}
                </PrimaryButton>
              </div>
            </div>
            <div className="mt-3 grid flex-1 grid-cols-1 content-start gap-4 lg:mt-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">Código</label>
                <input
                  value={presupuestoPaquete?.codigo ?? ""}
                  readOnly
                  disabled={formDisabled}
                  className={`${inputReadOnly} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Descripción</label>
                <input
                  value={presupuestoPaquete?.descripcion ?? ""}
                  readOnly
                  disabled={formDisabled}
                  title={presupuestoPaquete?.descripcion ?? undefined}
                  className={`${inputReadOnly} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={serviciosSectionRef} className="min-w-0">
        <ServiciosSolicitadosSection
          medicoTratanteId={medicoServiciosId}
          medicoTratanteLabel={medicoServiciosDisplay}
          tarifaId={tarifaId}
          tarifaDescripcion={tarifaDescripcion}
          tarifaEsPrecioDirecto={tarifaEsPrecioDirecto}
          lineas={lineas}
          onLineasChange={setLineas}
          medicosOptions={medicosOptions}
          currentUsername={user?.username ?? ""}
          nav={{
            type: "pre_facturacion",
            buscarPath: PREF_BUSCAR_PATH,
            returnPath: PREF_RETURN_PATH,
            draftStorageKey: PREF_DRAFT_KEY,
          }}
          copVarDefault={copVarDefault}
          onCopVarDefaultChange={setCopVarDefault}
          getAtencionDraft={getAtencionDraft}
          onDefaultMedicoChange={onDefaultMedicoChange}
          onServiciosSelected={onServiciosSelected}
          sectionDescription={serviciosPrefactSectionDescription}
          presupuestoPaquete={presupuestoPaquete}
          readOnly={formDisabled}
        />
      </div>

      <PacientePicker
        open={pickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setPickerOpen(false)}
        onPicked={onPacientePicked}
        title="Seleccionar paciente"
        showRegisterButton
        onRegister={() => navigate("/admision/historia-clinica/nuevo/datos-generales")}
        onOpenHistoriaClinica={() => {
          setPickerOpen(false);
          navigate("/admision/historia-clinica");
        }}
      />

      <CuentaCitaPicker
        open={cuentaPickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setCuentaPickerOpen(false)}
        onPicked={onCuentaPicked}
        title="Seleccionar cuenta"
      />

      <PaquetePicker
        open={paquetePickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        tarifaId={tarifaId}
        onClose={() => setPaquetePickerOpen(false)}
        onPicked={(p: PaqueteLookup) => {
          void (async () => {
            try {
              const { paquete, servicios } = await getPaqueteConServicios(p.id);
              if (tarifaId != null && paquete.tarifa_id !== tarifaId) {
                toastService.showWarning("El paquete no corresponde a la tarifa del plan actual.");
                return;
              }
              const igvPct = await getIgvPorcentaje();
              const base = parseFloat(String(paquete.precio_sin_igv ?? 0)) || 0;
              const { precioSinIgv, precioConIgv } = calcularPrecios(base, 1, 0, 0, igvPct);
              setPresupuestoPaquete({
                id: paquete.id,
                codigo: paquete.codigo,
                descripcion: paquete.descripcion,
                precio_sin_igv: precioSinIgv,
                precio_con_igv: precioConIgv,
                servicios: servicios.map((s) => ({
                  tarifa_servicio_id: s.id,
                  codigo: s.codigo,
                  descripcion: s.descripcion,
                })),
              });
              setPaquetePickerOpen(false);
              requestAnimationFrame(() => {
                serviciosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            } catch {
              toastService.showError("No se pudo cargar el paquete.");
            }
          })();
        }}
      />

      <MedicoPicker
        open={medicoPickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setMedicoPickerOpen(false)}
        onPicked={onMedicoTratantePicked}
        title="Seleccionar médico"
        description="Busca y selecciona el médico (clic en la fila)."
        showRegisterButton
        onRegister={() => {
          setMedicoPickerOpen(false);
          navigate("/ficheros/medicos");
        }}
        onOpenMedicos={() => {
          setMedicoPickerOpen(false);
          navigate("/ficheros/medicos");
        }}
      />

      <CuentaBitacoraDrawer
        open={bitacoraOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        nroCuenta={cuentaNro}
        pacienteId={detalle?.id ?? null}
        contextLine={bitacoraContextLine}
        currentUserId={user?.id ?? 0}
        onClose={() => setBitacoraOpen(false)}
      />
    </div>
  );
}
