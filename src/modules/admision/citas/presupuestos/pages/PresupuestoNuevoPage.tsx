import * as React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { toastService } from "../../../../../shared/notifications";
import { useAuth } from "../../../../../shared/auth/useAuth";
import PacientePicker from "../../agenda/components/PacientePicker";
import ClientePicker from "../components/ClientePicker";
import PaquetePicker from "../components/PaquetePicker";
import { ServiciosSolicitadosSection } from "../../agenda/components/ServiciosSolicitadosSection";
import {
  buscarServiciosTarifa,
  getIgvPorcentaje,
  type TarifaServicioBusqueda,
} from "../../agenda/services/atencionCita.service";
import type {
  AtencionDraft,
  AtencionServicioLineaDisplay,
  PresupuestoPaqueteSnapshot,
} from "../../agenda/types/atencionCita.types";
import { getPaqueteConServicios } from "../../../../ficheros/services/paqueteServicios.service";
import type { PaqueteLookup } from "../../../../ficheros/types/paqueteServicios.types";
import { fetchPacientePresupuesto } from "../services/presupuestoPaciente.service";
import { storePresupuesto } from "../services/presupuestoStore.service";
import { fetchPresupuestoShowCached, type PresupuestoShowData } from "../services/presupuestoShow.service";
import { getCachedPresupuestoShow, invalidatePresupuestoShowCache } from "../services/presupuestoShowCache";
import { hydrateDetalleClienteLineasPaquete } from "../utils/hydratePresupuestoFromPayload";
import {
  clearCachedPresupuestoNextCodigo,
  fetchPresupuestoNextCodigo,
  readCachedPresupuestoNextCodigo,
  writeCachedPresupuestoNextCodigo,
} from "../services/presupuestoNextCodigo.service";
import DateInput from "../../../../../shared/ui/DateInput";
import { inputBase } from "../../../../ficheros/utils/crudShared";
import type { PresupuestoPacienteDetalle } from "../types/presupuesto.types";
import { toUserFriendlyMessage } from "../../utils/userFriendlyError";
import { PRECISION_DECIMAL, roundToPrecision } from "../../../../../shared/constants/decimalPrecision";
import type { PacienteListItem } from "../../../historia-clinica/types/historiaClinica.types";
import type { Cliente } from "../../../../ficheros/types/clientes.types";

const PRESUPUESTO_RETURN_PATH = "/admision/citas/presupuestos/nuevo";
const PRESUPUESTO_BUSCAR_PATH = "/admision/citas/presupuestos/nuevo/buscar-servicios";
const PRESUPUESTO_DRAFT_KEY = "admision:presupuestoServiciosDraft";

const PRESUPUESTO_ESTADO_OPTIONS: SelectOption[] = [
  { value: "VIGENTE", label: "Vigente" },
  { value: "UTILIZADO", label: "Utilizado" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "ANULADO", label: "Anulado" },
];

function isoDateLocalAddDays(daysFromToday: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

function userNombreCompleto(user: {
  name?: string | null;
  apellido_paterno?: string;
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

const readonlyAutoHeightClass =
  "box-border mt-1 w-full min-h-10 rounded border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:min-h-8 resize-none overflow-hidden wrap-break-word whitespace-pre-wrap break-words leading-normal disabled:cursor-not-allowed disabled:opacity-60";

function ReadonlyAutoHeightArea(props: { value: string; disabled?: boolean }) {
  const { value, disabled } = props;
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      el.style.height = "0px";
      const min =
        typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches ? 32 : 40;
      el.style.height = `${Math.max(el.scrollHeight, min)}px`;
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [value]);

  return (
    <textarea
      ref={ref}
      readOnly
      disabled={disabled}
      value={value}
      rows={1}
      aria-readonly="true"
      className={readonlyAutoHeightClass}
    />
  );
}

export default function PresupuestoNuevoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const presupuestoIdVer = params.id != null && /^\d+$/.test(params.id) ? Number(params.id) : NaN;
  const modoVer = Number.isFinite(presupuestoIdVer) && presupuestoIdVer > 0;
  const { user } = useAuth();
  const isLgUp = useIsLgUp();
  const [conHistoriaClinica, setConHistoriaClinica] = React.useState(true);
  const [pacientePickerOpen, setPacientePickerOpen] = React.useState(false);
  const [clientePickerOpen, setClientePickerOpen] = React.useState(false);
  const [paquetePickerOpen, setPaquetePickerOpen] = React.useState(false);
  const [pacienteLoading, setPacienteLoading] = React.useState(false);
  const [detalle, setDetalle] = React.useState<PresupuestoPacienteDetalle | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState("");
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [presupuestoPaquete, setPresupuestoPaquete] = React.useState<PresupuestoPaqueteSnapshot | null>(null);
  const [lineas, setLineas] = React.useState<AtencionServicioLineaDisplay[]>([]);
  const [copVarDefault, setCopVarDefault] = React.useState(0);
  const [montoAPagar, setMontoAPagar] = React.useState(0);
  const [vigenciaHasta, setVigenciaHasta] = React.useState(() => isoDateLocalAddDays(7));
  const [estadoDocumentoPresupuesto, setEstadoDocumentoPresupuesto] = React.useState("VIGENTE");
  const [guardandoPresupuesto, setGuardandoPresupuesto] = React.useState(false);
  const [codigoVistaPrevia, setCodigoVistaPrevia] = React.useState("…");
  const [cargandoVista, setCargandoVista] = React.useState(() => {
    if (!modoVer) return false;
    return getCachedPresupuestoShow(presupuestoIdVer) == null;
  });

  const serviciosSectionRef = React.useRef<HTMLDivElement | null>(null);
  const processedServiciosRef = React.useRef<string | null>(null);
  const prevPlanIdRef = React.useRef<string>("");
  const tarifaIdRef = React.useRef<number | null>(null);
  const lineasRef = React.useRef<AtencionServicioLineaDisplay[]>(lineas);
  const recargoRecalcInFlightRef = React.useRef(false);
  const recargoRecalcTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const igvPctCacheRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    lineasRef.current = lineas;
  }, [lineas]);

  React.useEffect(() => {
    if (modoVer) return;
    const cached = readCachedPresupuestoNextCodigo();
    if (cached) setCodigoVistaPrevia(cached);
    let cancelled = false;
    void (async () => {
      try {
        const c = await fetchPresupuestoNextCodigo();
        if (!cancelled) {
          setCodigoVistaPrevia(c);
          writeCachedPresupuestoNextCodigo(c);
        }
      } catch {
        if (!cancelled) setCodigoVistaPrevia("—");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modoVer]);

  const aplicarDocumentoPresupuesto = React.useCallback(
    (doc: PresupuestoShowData): boolean => {
      const payload = doc.payload && typeof doc.payload === "object" ? (doc.payload as Record<string, unknown>) : {};
      const { detalle, cliente, lineas, presupuestoPaquete, copVarDefault } = hydrateDetalleClienteLineasPaquete(payload);
      if (!detalle) {
        toastService.showError("El presupuesto no tiene datos de paciente guardados.");
        navigate("/admision/citas/presupuestos", { replace: true });
        return false;
      }
      setConHistoriaClinica(true);
      setCodigoVistaPrevia(doc.codigo ?? "—");
      setVigenciaHasta(doc.vigencia_hasta?.slice(0, 10) ?? "");
      setEstadoDocumentoPresupuesto(doc.estado ?? "VIGENTE");
      setMontoAPagar(parseFloat(String(doc.monto_a_pagar)) || 0);
      setDetalle(detalle);
      setSelectedPlanId(detalle.planes[0] ? String(detalle.planes[0].pacientePlanId) : "");
      setCliente(cliente);
      setPresupuestoPaquete(presupuestoPaquete);
      setLineas(lineas);
      setCopVarDefault(copVarDefault);
      return true;
    },
    [navigate]
  );

  React.useLayoutEffect(() => {
    if (!modoVer) return;
    const cached = getCachedPresupuestoShow(presupuestoIdVer);
    if (!cached) return;
    aplicarDocumentoPresupuesto(cached);
    setCargandoVista(false);
  }, [modoVer, presupuestoIdVer, aplicarDocumentoPresupuesto]);

  React.useEffect(() => {
    if (!modoVer) return;
    if (getCachedPresupuestoShow(presupuestoIdVer)) {
      setCargandoVista(false);
      return;
    }
    let cancelled = false;
    setCargandoVista(true);
    void fetchPresupuestoShowCached(presupuestoIdVer)
      .then((doc) => {
        if (cancelled) return;
        aplicarDocumentoPresupuesto(doc);
      })
      .catch((e) => {
        if (!cancelled) {
          toastService.showError(toUserFriendlyMessage(e, "No se pudo cargar el presupuesto."));
          navigate("/admision/citas/presupuestos", { replace: true });
        }
      })
      .finally(() => {
        if (!cancelled) setCargandoVista(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modoVer, presupuestoIdVer, navigate, aplicarDocumentoPresupuesto]);

  const planOptions: SelectOption[] = React.useMemo(() => {
    if (!detalle?.planes.length) return [];
    return detalle.planes.map((p) => ({
      value: String(p.pacientePlanId),
      label: p.label,
    }));
  }, [detalle?.planes]);

  const planSeleccionado = React.useMemo(() => {
    if (!detalle || !selectedPlanId) return null;
    const id = Number(selectedPlanId);
    return detalle.planes.find((p) => p.pacientePlanId === id) ?? null;
  }, [detalle, selectedPlanId]);

  const tarifaId = planSeleccionado?.tarifaId ?? null;
  const tarifaDescripcion = planSeleccionado
    ? planSeleccionado.tarifaDescripcion ?? planSeleccionado.tarifaCodigo ?? "—"
    : null;
  const tarifaEsPrecioDirecto = planSeleccionado?.tarifaEsPrecioDirecto ?? false;

  React.useEffect(() => {
    tarifaIdRef.current = tarifaId;
  }, [tarifaId]);

  React.useEffect(() => {
    if (!selectedPlanId) {
      prevPlanIdRef.current = "";
      return;
    }
    if (prevPlanIdRef.current !== "" && prevPlanIdRef.current !== selectedPlanId) {
      setLineas([]);
      setPresupuestoPaquete(null);
    }
    prevPlanIdRef.current = selectedPlanId;
  }, [selectedPlanId]);

  const iafaDisplay = React.useMemo(() => {
    if (!detalle || !selectedPlanId) return "";
    const id = Number(selectedPlanId);
    const pl = detalle.planes.find((p) => p.pacientePlanId === id);
    return pl?.iafaLabel?.trim() || "—";
  }, [detalle, selectedPlanId]);

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
              per_page: 10,
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
  }, [setLineas]);

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

  const getAtencionDraft = React.useCallback((): AtencionDraft => {
    const pid = selectedPlanId ? Number(selectedPlanId) : null;
    return {
      acudio: false,
      horaAsistenciaDisplay: "",
      pacientePlanId: pid != null && Number.isFinite(pid) ? pid : null,
      parentescoSeguro: "",
      titularNombre: detalle?.nombre_completo ?? "",
      controlPrePostNatal: false,
      controlNinoSano: false,
      chequeo: false,
      carencia: false,
      latencia: false,
      soatActivo: false,
      soatNumeroPoliza: "",
      soatNumeroPlaca: "",
      lineas,
      ...(presupuestoPaquete != null ? { presupuesto_paquete: presupuestoPaquete } : {}),
    };
  }, [selectedPlanId, detalle?.nombre_completo, lineas, presupuestoPaquete]);

  const onServiciosSelected = React.useCallback(
    (servicios: TarifaServicioBusqueda[]) => {
      if (!servicios.length) return;
      const existingIds = new Set(lineas.map((l) => l.tarifa_servicio_id));
      const toAdd = servicios.filter((s) => !existingIds.has(s.id));
      const duplicateCount = servicios.length - toAdd.length;
      if (duplicateCount > 0) {
        const msg =
          duplicateCount === 1
            ? "1 servicio ya está en la lista."
            : `${duplicateCount} servicios ya están en la lista.`;
        toastService.showWarning(msg);
      }
      if (!toAdd.length) return;
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
            medico_id: 0,
            medico_codigo: "",
            user_username: user?.username ?? "",
            user_nombre: userNombreCompleto(user),
            estado_facturacion: "VIGENTE",
            recargo_noche_activo: recargoNoche,
          };
        });
        setLineas((prev) => [...prev, ...nuevas]);
        requestAnimationFrame(() => {
          serviciosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    },
    [lineas, user, copVarDefault]
  );

  React.useEffect(() => {
    if (modoVer) return;
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

    if (!servs?.length) return;
    const key = servs.map((s) => s.id).join(",");
    if (processedServiciosRef.current === key) return;
    processedServiciosRef.current = key;
    const nextNavState: Record<string, unknown> = {};
    if (typeof st.presupuestoPaquete !== "undefined") {
      nextNavState.presupuestoPaquete = st.presupuestoPaquete;
    }
    navigate(location.pathname, { replace: true, state: nextNavState });
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
          medico_id: 0,
          medico_codigo: "",
          user_username: user?.username ?? "",
          user_nombre: userNombreCompleto(user),
          estado_facturacion: "VIGENTE",
          recargo_noche_activo: recargoNoche,
        };
      });
      setLineas((prev) => [...(restoreLineas ?? prev), ...nuevas]);
      processedServiciosRef.current = null;
    });
  }, [location.state, location.pathname, navigate, user, copVarDefault, modoVer]);

  const onConHistoriaClinicaChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setConHistoriaClinica(checked);
    if (!checked) {
      setDetalle(null);
      setSelectedPlanId("");
      setCliente(null);
      setPresupuestoPaquete(null);
      setLineas([]);
      setCopVarDefault(0);
      setMontoAPagar(0);
      setVigenciaHasta(isoDateLocalAddDays(7));
      setEstadoDocumentoPresupuesto("VIGENTE");
      setPacientePickerOpen(false);
      setClientePickerOpen(false);
      setPaquetePickerOpen(false);
      prevPlanIdRef.current = "";
    }
  }, []);

  const onPacientePicked = React.useCallback(async (p: PacienteListItem) => {
    setPacienteLoading(true);
    setSelectedPlanId("");
    setLineas([]);
    setPresupuestoPaquete(null);
    setVigenciaHasta(isoDateLocalAddDays(7));
    setEstadoDocumentoPresupuesto("VIGENTE");
    try {
      const d = await fetchPacientePresupuesto(p.id);
      setDetalle(d);
      const first = d.planes[0];
      setSelectedPlanId(first ? String(first.pacientePlanId) : "");
      if (!d.planes.length) {
        toastService.showInfo("Este paciente no tiene planes activos registrados.");
      }
    } catch (e) {
      setDetalle(null);
      setSelectedPlanId("");
      toastService.showError(toUserFriendlyMessage(e, "No se pudieron cargar los datos del paciente para el presupuesto."));
    } finally {
      setPacienteLoading(false);
    }
  }, []);

  const inputReadOnly =
    "mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8";
  const inputBarFieldClass =
    "h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:h-8 read-only:cursor-default";
  const inputReadOnlyDisabled = `${inputReadOnly} disabled:cursor-not-allowed disabled:opacity-60`;

  const serviciosSectionDescription = React.useMemo(() => {
    if (modoVer) return "Vista de solo lectura del presupuesto guardado.";
    if (!conHistoriaClinica) return "Active el recuadro de historia clínica para habilitar búsqueda de paciente y cliente.";
    if (!detalle) return "Sin paciente no hay tarifario aplicable; búsquelo y elija plan.";
    if (!selectedPlanId) return "Elija un plan para poder buscar servicios en su tarifario.";
    if (tarifaId == null) return "Este plan no tiene tarifa en ficheros; no puede agregar servicios.";
    if (presupuestoPaquete != null) {
      return "Listado del paquete. Para sumar servicios del tarifario, quite el paquete en la columna superior.";
    }
    return "Use «Buscar servicio» para sumar ítems. Cada línea inicia en Vigente; el estado se actualizará con las acciones del flujo. Filtre por estado si lo necesita.";
  }, [modoVer, conHistoriaClinica, detalle, selectedPlanId, tarifaId, presupuestoPaquete]);

  const tieneContenidoServicios = presupuestoPaquete != null || lineas.length > 0;
  const datosListosParaGuardarPresupuesto =
    conHistoriaClinica &&
    detalle != null &&
    selectedPlanId !== "" &&
    tarifaId != null &&
    tieneContenidoServicios;

  const handleGuardarPresupuesto = React.useCallback(async () => {
    if (!detalle) {
      toastService.showError("Selecciona un paciente antes de guardar el presupuesto.");
      return;
    }
    if (!selectedPlanId || tarifaId == null) {
      toastService.showError("Selecciona un plan con tarifa vigente antes de guardar el presupuesto.");
      return;
    }
    if (!presupuestoPaquete && lineas.length === 0) {
      toastService.showError("Agrega al menos un servicio o paquete antes de guardar el presupuesto.");
      return;
    }
    const pacientePlanId = Number(selectedPlanId);
    if (!Number.isFinite(pacientePlanId)) {
      toastService.showError("El plan seleccionado no es válido para generar el presupuesto.");
      return;
    }

    setGuardandoPresupuesto(true);
    try {
      const monto = roundToPrecision(montoAPagar, PRECISION_DECIMAL);
      const snapshotPayload: Record<string, unknown> = {
        version: 1,
        schema: "admision.presupuesto_snapshot.v1",
        generado_cliente_iso: new Date().toISOString(),
        codigo_vista_previa:
          codigoVistaPrevia !== "…" && codigoVistaPrevia !== "—" ? codigoVistaPrevia : null,
        vigencia_hasta: vigenciaHasta,
        estado: estadoDocumentoPresupuesto,
        paciente: {
          id: detalle.id,
          hc: detalle.hc,
          nr: detalle.nr,
          nombre_completo: detalle.nombre_completo,
        },
        paciente_plan: planSeleccionado
          ? {
              paciente_plan_id: planSeleccionado.pacientePlanId,
              label: planSeleccionado.label,
              iafa_id: planSeleccionado.iafaId,
              iafa_label: planSeleccionado.iafaLabel,
              tarifa_id: planSeleccionado.tarifaId,
              tarifa_codigo: planSeleccionado.tarifaCodigo,
              tarifa_descripcion: planSeleccionado.tarifaDescripcion,
              tarifa_es_precio_directo: planSeleccionado.tarifaEsPrecioDirecto,
              tipo_cliente_id: planSeleccionado.tipoClienteId,
            }
          : null,
        cliente: cliente
          ? {
              id: cliente.id,
              codigo: cliente.codigo,
              tipo: cliente.tipo,
              nombre: cliente.nombre,
              dni_o_ruc: cliente.dni_o_ruc,
            }
          : null,
        paquete: presupuestoPaquete,
        lineas_servicio: lineas,
        atencion_draft: getAtencionDraft(),
        cop_var_default: copVarDefault,
        usuario: {
          username: user?.username ?? null,
          nombre: userNombreCompleto(user),
        },
      };

      await storePresupuesto({
        paciente_id: detalle.id,
        paciente_plan_id: pacientePlanId,
        tarifa_id: tarifaId,
        cliente_id: cliente?.id ?? null,
        vigencia_hasta: vigenciaHasta,
        estado: estadoDocumentoPresupuesto,
        monto_a_pagar: monto,
        payload: snapshotPayload,
      });
      clearCachedPresupuestoNextCodigo();
      invalidatePresupuestoShowCache();
      toastService.showSuccess("Presupuesto guardado correctamente.");
      navigate("/admision/citas/presupuestos", { replace: true });
    } catch (e) {
      toastService.showError(toUserFriendlyMessage(e, "No se pudo guardar el presupuesto."));
    } finally {
      setGuardandoPresupuesto(false);
    }
  }, [
    detalle,
    selectedPlanId,
    tarifaId,
    presupuestoPaquete,
    lineas,
    montoAPagar,
    vigenciaHasta,
    estadoDocumentoPresupuesto,
    planSeleccionado,
    cliente,
    copVarDefault,
    getAtencionDraft,
    user,
    navigate,
    codigoVistaPrevia,
  ]);

  const presupuestoReturnPath = modoVer
    ? `/admision/citas/presupuestos/${presupuestoIdVer}`
    : PRESUPUESTO_RETURN_PATH;

  if (modoVer && cargandoVista) {
    return (
      <div className="flex w-full flex-1 items-center justify-center p-8 text-sm text-(--color-text-secondary)">
        Cargando presupuesto…
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col space-y-4 lg:space-y-2">
      <div className="rounded border border-(--border-color-default) bg-(--color-surface) px-3 py-3 lg:px-3 lg:py-2.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-x-4 gap-y-2 lg:items-center">
            <div className="w-full min-w-0 sm:w-40 lg:w-44">
              <label htmlFor="presupuesto-nuevo-codigo" className="text-xs text-(--color-text-secondary)">
                Código
              </label>
              <div className="mt-1 lg:mt-0.5">
                <input
                  id="presupuesto-nuevo-codigo"
                  readOnly
                  value={codigoVistaPrevia}
                  title="Vista previa según el último registro; el código definitivo se confirma al guardar."
                  aria-label="Código de presupuesto (vista previa)"
                  className={inputBarFieldClass}
                />
              </div>
            </div>
            <div className="w-full min-w-0 sm:w-40 lg:w-44">
              <label className="text-xs text-(--color-text-secondary)">Vigencia hasta</label>
              <div className="mt-1 lg:mt-0.5">
                <DateInput
                  value={vigenciaHasta}
                  onChange={setVigenciaHasta}
                  aria-label="Vigencia hasta"
                  inputClassName="lg:h-8"
                  readOnly={modoVer}
                />
              </div>
            </div>
            <div className="w-full min-w-0 sm:w-40 lg:w-44">
              <label className="text-xs text-(--color-text-secondary)">Estado</label>
              <div className="mt-1 lg:mt-0.5">
                <SelectMenu
                  value={estadoDocumentoPresupuesto}
                  onChange={(v) => setEstadoDocumentoPresupuesto(v ?? "VIGENTE")}
                  options={PRESUPUESTO_ESTADO_OPTIONS}
                  ariaLabel="Estado"
                  buttonClassName={`h-10 w-full lg:h-8 ${inputBase}`}
                  menuClassName="min-w-full"
                  disabled={modoVer}
                />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:justify-end">
            <SecondaryButton type="button" onClick={() => navigate("/admision/citas/presupuestos")}>
              Volver
            </SecondaryButton>
            {!modoVer && (
              <PrimaryButton
                type="button"
                disabled={!datosListosParaGuardarPresupuesto || guardandoPresupuesto}
                onClick={() => void handleGuardarPresupuesto()}
              >
                {guardandoPresupuesto ? "Guardando…" : "Guardar presupuesto"}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-2">
        <div className="min-w-0 flex">
          <div className="flex h-full min-h-0 w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-1 pr-2">
                <div className="row-start-1 flex items-center self-stretch">
                  <input
                    id="presupuesto-paciente-con-hc"
                    type="checkbox"
                    checked={conHistoriaClinica}
                    onChange={onConHistoriaClinicaChange}
                    disabled={modoVer}
                    className="h-4 w-4 shrink-0 rounded border border-(--border-color-default) accent-(--color-primary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-describedby="presupuesto-paciente-con-hc-desc"
                  />
                </div>
                <label
                  htmlFor="presupuesto-paciente-con-hc"
                  className="row-start-1 min-w-0 cursor-pointer text-sm font-semibold leading-tight text-(--color-text-primary)"
                >
                  Datos del paciente
                </label>
                <p
                  id="presupuesto-paciente-con-hc-desc"
                  className="col-start-2 row-start-2 min-w-0 text-xs leading-snug text-(--color-text-secondary)"
                >
                  Paciente y plan: definen tarifario e IAFA de este presupuesto.
                </p>
              </div>
              {!modoVer && (
                <PrimaryButton
                  type="button"
                  className="shrink-0"
                  disabled={pacienteLoading || !conHistoriaClinica}
                  onClick={() => setPacientePickerOpen(true)}
                >
                  {detalle ? "Cambiar paciente" : "Buscar paciente"}
                </PrimaryButton>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 lg:mt-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">Apellidos y nombres</label>
                <ReadonlyAutoHeightArea value={detalle?.nombre_completo ?? ""} disabled={!conHistoriaClinica} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-2">
                <div>
                  <label className="text-xs text-(--color-text-secondary)">N° Historia</label>
                  <input value={detalle?.hc ?? ""} readOnly disabled={!conHistoriaClinica} className={inputReadOnlyDisabled} />
                </div>
                <div>
                  <label className="text-xs text-(--color-text-secondary)">N° Referencia</label>
                  <input value={detalle?.nr ?? ""} readOnly disabled={!conHistoriaClinica} className={inputReadOnlyDisabled} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-2">
                <div>
                  <label className="text-xs text-(--color-text-secondary)">Plan</label>
                  <div className="mt-1 lg:mt-0.5">
                    <SelectMenu
                      value={selectedPlanId}
                      onChange={(v) => setSelectedPlanId(v ?? "")}
                      options={planOptions}
                      ariaLabel="Plan"
                      buttonClassName="h-10 w-full lg:h-8"
                      menuClassName="min-w-full"
                      disabled={!detalle || planOptions.length === 0 || modoVer}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-(--color-text-secondary)">IAFAS</label>
                  <input value={iafaDisplay} readOnly disabled={!conHistoriaClinica} className={inputReadOnlyDisabled} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex">
          <div className="flex h-full min-h-0 w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h2 className="text-sm font-semibold text-(--color-text-primary)">Cliente</h2>
                <p className="mt-0.5 text-xs leading-snug text-(--color-text-secondary)">
                  Responsable de pago en el comprobante de venta.
                </p>
              </div>
              {!modoVer && (
                <PrimaryButton type="button" className="shrink-0" disabled={!conHistoriaClinica} onClick={() => setClientePickerOpen(true)}>
                  {cliente ? "Cambiar cliente" : "Buscar cliente"}
                </PrimaryButton>
              )}
            </div>

            <div className="mt-3 grid flex-1 grid-cols-1 content-start gap-4 lg:mt-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">Cliente</label>
                <ReadonlyAutoHeightArea value={cliente?.nombre ?? ""} disabled={!conHistoriaClinica} />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">DNI / RUC</label>
                <input value={cliente?.dni_o_ruc ?? ""} readOnly disabled={!conHistoriaClinica} className={inputReadOnlyDisabled} />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex">
          <div className="flex h-full min-h-0 w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h2 className="text-sm font-semibold text-(--color-text-primary)">Paquetes</h2>
                <p className="mt-0.5 text-xs leading-snug text-(--color-text-secondary)">Paquetes de la tarifa del plan.</p>
              </div>
              {!modoVer && (
                <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                  {presupuestoPaquete != null && (
                    <SecondaryButton
                      type="button"
                      className="whitespace-nowrap"
                      disabled={!conHistoriaClinica}
                      onClick={() => setPresupuestoPaquete(null)}
                    >
                      Quitar
                    </SecondaryButton>
                  )}
                  <PrimaryButton
                    type="button"
                    className="whitespace-nowrap"
                    disabled={!conHistoriaClinica || pacienteLoading || tarifaId == null}
                    onClick={() => setPaquetePickerOpen(true)}
                  >
                    {presupuestoPaquete ? "Cambiar paquete" : "Buscar paquete"}
                  </PrimaryButton>
                </div>
              )}
            </div>

            <div className="mt-3 grid flex-1 grid-cols-1 content-start gap-4 lg:mt-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">Código</label>
                <input
                  value={presupuestoPaquete?.codigo ?? ""}
                  readOnly
                  disabled={!conHistoriaClinica}
                  className={inputReadOnlyDisabled}
                />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Descripción</label>
                <ReadonlyAutoHeightArea value={presupuestoPaquete?.descripcion ?? ""} disabled={!conHistoriaClinica} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={serviciosSectionRef} className="min-w-0">
        <ServiciosSolicitadosSection
          medicoTratanteId={null}
          medicoTratanteLabel=""
          tarifaId={tarifaId}
          tarifaDescripcion={tarifaDescripcion}
          tarifaEsPrecioDirecto={tarifaEsPrecioDirecto}
          lineas={lineas}
          onLineasChange={setLineas}
          medicosOptions={[]}
          currentUsername={user?.username ?? ""}
          nav={{
            type: "presupuesto",
            buscarPath: PRESUPUESTO_BUSCAR_PATH,
            returnPath: presupuestoReturnPath,
            draftStorageKey: PRESUPUESTO_DRAFT_KEY,
          }}
          onMontoAPagarChange={setMontoAPagar}
          copVarDefault={copVarDefault}
          onCopVarDefaultChange={setCopVarDefault}
          getAtencionDraft={getAtencionDraft}
          onServiciosSelected={onServiciosSelected}
          sectionDescription={serviciosSectionDescription}
          presupuestoPaquete={presupuestoPaquete}
          readOnly={modoVer}
        />
      </div>

      <PacientePicker
        open={pacientePickerOpen && conHistoriaClinica}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setPacientePickerOpen(false)}
        onPicked={onPacientePicked}
        title="Seleccionar paciente"
        showRegisterButton
        onRegister={() => navigate("/admision/historia-clinica/nuevo/datos-generales")}
        onOpenHistoriaClinica={() => {
          setPacientePickerOpen(false);
          navigate("/admision/historia-clinica");
        }}
      />

      <ClientePicker
        open={clientePickerOpen && conHistoriaClinica}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setClientePickerOpen(false)}
        onPicked={(c) => {
          setCliente(c);
          setClientePickerOpen(false);
        }}
      />

      <PaquetePicker
        open={paquetePickerOpen && conHistoriaClinica}
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
            } catch (e) {
              toastService.showError(toUserFriendlyMessage(e, "No se pudo cargar el paquete seleccionado para el presupuesto."));
            }
          })();
        }}
      />
    </div>
  );
}
