import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { useAuth } from "../../../../../shared/auth/useAuth";
import { api } from "../../../../../shared/api";
import { toastService } from "../../../../../shared/notifications";
import { buscarServiciosTarifa, getAtencionCitaData, getIgvPorcentaje, guardarAtencionCita } from "../services/atencionCita.service";
import type { TarifaServicioBusqueda } from "../services/atencionCita.service";
import type {
  AtencionCitaData,
  AtencionCitaStorePayload,
  AtencionDraft,
  AtencionServicioItem,
  AtencionServicioLinea,
  AtencionServicioLineaDisplay,
} from "../types/atencionCita.types";
import { toUserFriendlyMessage } from "../../utils/userFriendlyError";
import { PRECISION_DECIMAL } from "../../../../../shared/constants/decimalPrecision";
import { ServiciosSolicitadosSection } from "../components/ServiciosSolicitadosSection";

const PARENTESCO_OPTIONS: SelectOption[] = [
  { value: "TITULAR", label: "Titular" },
  { value: "CONYUGE", label: "Cónyuge" },
  { value: "PADRE", label: "Padre" },
  { value: "MADRE", label: "Madre" },
  { value: "HIJO", label: "Hijo" },
  { value: "HIJA", label: "Hija" },
  { value: "HERMANO", label: "Hermano" },
  { value: "HERMANA", label: "Hermana" },
  { value: "HIJO_INCAPACITADO", label: "Hijo incapacitado" },
  { value: "NO_DEFINIDO", label: "No definido" },
];

function formatMedico(p: NonNullable<AtencionCitaData["programacion"]>["medico"]): string {
  if (!p) return "—";
  return [p.apellido_paterno, p.apellido_materno, p.nombres].filter(Boolean).join(" ").trim() || "—";
}

function mapServicioToDisplay(item: AtencionServicioItem): AtencionServicioLineaDisplay {
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
    precio_unitario_tarifario_sin_igv: Math.round((item.precio_sin_igv / Math.max(1, item.cantidad)) * 10 ** 4) / 10 ** 4,
    medico_codigo: item.medico_codigo,
    user_username: item.user_username ?? null,
    user_nombre: item.user_nombre,
    estado_facturacion,
  };
}

function userNombreCompleto(user: { name?: string | null; apellido_paterno?: string; apellido_materno?: string | null; nombres?: string; username?: string } | null | undefined): string {
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

export default function AtencionCitaPage() {
  const { citaId } = useParams<"citaId">();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const id = citaId ? parseInt(citaId, 10) : NaN;

  const [data, setData] = React.useState<AtencionCitaData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingState, setSavingState] = React.useState<"actualizar" | "guardar" | null>(null);
  const saving = savingState !== null;

  const [lineas, setLineas] = React.useState<AtencionServicioLineaDisplay[]>([]);
  const [medicosOptions, setMedicosOptions] = React.useState<SelectOption[]>([]);
  const [copVarDefault, setCopVarDefault] = React.useState(0);

  const [acudio, setAcudio] = React.useState(false);
  const [horaAsistenciaDisplay, setHoraAsistenciaDisplay] = React.useState<string>("");
  const [pacientePlanId, setPacientePlanId] = React.useState<number | null>(null);
  const [parentescoSeguro, setParentescoSeguro] = React.useState<string>("");
  const [titularNombre, setTitularNombre] = React.useState("");
  const [lastSavedPlanId, setLastSavedPlanId] = React.useState<number | null>(null);
  const [lastSavedParentesco, setLastSavedParentesco] = React.useState("");
  const [lastSavedTitular, setLastSavedTitular] = React.useState("");
  const [controlPrePostNatal, setControlPrePostNatal] = React.useState(false);
  const [controlNinoSano, setControlNinoSano] = React.useState(false);
  const [chequeo, setChequeo] = React.useState(false);
  const [carencia, setCarencia] = React.useState(false);
  const [latencia, setLatencia] = React.useState(false);
  const [soatActivo, setSoatActivo] = React.useState(false);
  const [soatNumeroPoliza, setSoatNumeroPoliza] = React.useState("");
  const [soatNumeroPlaca, setSoatNumeroPlaca] = React.useState("");

  const formatHoraLocal = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const DRAFT_STORAGE_KEY_PREFIX = "admision:atencionCitaDraft:";
  const loadRunIdRef = React.useRef(0);
  const atencionDataCacheRef = React.useRef<Record<number, AtencionCitaData>>({});

  const clearDraftForCita = React.useCallback((citaId: number) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(`${DRAFT_STORAGE_KEY_PREFIX}${citaId}`);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("ID de cita inválido");
      setLoading(false);
      return;
    }
    const cached = atencionDataCacheRef.current[id];
    const applyRes = (res: AtencionCitaData) => {
      setData(res);
      setParentescoSeguro(res.paciente.parentesco_seguro ?? res.atencion?.parentesco_seguro ?? "");
      setTitularNombre(res.paciente.titular_nombre ?? res.atencion?.titular_nombre ?? "");
      setAcudio(Boolean(res.atencion?.hora_asistencia));
      setHoraAsistenciaDisplay(res.atencion?.hora_asistencia?.slice(0, 5) ?? "");
      const planId =
        res.atencion?.paciente_plan_id ??
        (res.planes.find((p) => p.iafa_id != null && p.iafa_id === res.cita.iafa_id)?.id ?? res.planes[0]?.id ?? null);
      setPacientePlanId(planId);
      setLastSavedPlanId(planId);
      setLastSavedParentesco(res.paciente.parentesco_seguro ?? res.atencion?.parentesco_seguro ?? "");
      setLastSavedTitular(res.paciente.titular_nombre ?? res.atencion?.titular_nombre ?? "");
      setControlPrePostNatal(Boolean(res.atencion?.control_pre_post_natal));
      setControlNinoSano(Boolean(res.atencion?.control_nino_sano));
      setChequeo(Boolean(res.atencion?.chequeo));
      setCarencia(Boolean(res.atencion?.carencia));
      setLatencia(Boolean(res.atencion?.latencia));
      setSoatActivo(Boolean(res.atencion?.soat_activo));
      setSoatNumeroPoliza(res.atencion?.soat_numero_poliza ?? "");
      setSoatNumeroPlaca(res.atencion?.soat_numero_placa ?? "");
      setLineas((res.servicios ?? []).map(mapServicioToDisplay));
    };
    if (cached) {
      applyRes(cached);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }
    setError(null);
    const thisRunId = ++loadRunIdRef.current;
    const draftStorageKey = `${DRAFT_STORAGE_KEY_PREFIX}${id}`;
    getAtencionCitaData(id)
      .then((res) => {
        if (thisRunId !== loadRunIdRef.current) return;
        atencionDataCacheRef.current[id] = res;
        applyRes(res);

        if (typeof window !== "undefined") {
          const raw = window.sessionStorage.getItem(draftStorageKey);
          if (raw) {
            try {
              const draft = JSON.parse(raw) as AtencionDraft;
              setAcudio(draft.acudio ?? false);
              setHoraAsistenciaDisplay(draft.horaAsistenciaDisplay ?? "");
              setPacientePlanId(draft.pacientePlanId ?? null);
              setParentescoSeguro(draft.parentescoSeguro ?? "");
              setTitularNombre(draft.titularNombre ?? "");
              setControlPrePostNatal(draft.controlPrePostNatal ?? false);
              setControlNinoSano(draft.controlNinoSano ?? false);
              setChequeo(draft.chequeo ?? false);
              setCarencia(draft.carencia ?? false);
              setLatencia(draft.latencia ?? false);
              setSoatActivo(draft.soatActivo ?? false);
              setSoatNumeroPoliza(draft.soatNumeroPoliza ?? "");
              setSoatNumeroPlaca(draft.soatNumeroPlaca ?? "");
              if (draft.lineas != null) setLineas(draft.lineas);
            } catch {
              window.sessionStorage.removeItem(draftStorageKey);
            }
          }
        }
      })
      .catch((e) => {
        if (thisRunId !== loadRunIdRef.current) return;
        setError(toUserFriendlyMessage(e, "No se pudo cargar la atención de la cita."));
        toastService.showError(toUserFriendlyMessage(e, "No se pudo cargar la atención de la cita."));
      })
      .finally(() => {
        if (thisRunId === loadRunIdRef.current) setLoading(false);
      });
  }, [id]);

  const planOptions: SelectOption[] = React.useMemo(() => {
    if (!data?.planes?.length) return [{ value: "", label: "Seleccione el plan" }];
    return data.planes.map((p) => {
      const desc = p.descripcion || `Plan ${p.id}`;
      const idx = desc.indexOf("/");
      const label = idx >= 0 ? `${desc.slice(0, idx).trim()} · ${desc.slice(idx + 1).trim()}` : desc;
      return { value: String(p.id), label };
    });
  }, [data?.planes]);

  const tarifaActual = React.useMemo(() => {
    if (!pacientePlanId || !data?.planes) return null;
    const plan = data.planes.find((p) => p.id === pacientePlanId);
    return plan ? (plan.tarifa_descripcion || plan.tarifa_codigo || "—") : null;
  }, [data?.planes, pacientePlanId]);

  const tarifaId = React.useMemo(() => {
    if (!pacientePlanId || !data?.planes) return null;
    const plan = data.planes.find((p) => p.id === pacientePlanId);
    return plan?.tarifa_id ?? null;
  }, [data?.planes, pacientePlanId]);

  const tarifaEsPrecioDirecto = React.useMemo(() => {
    if (!pacientePlanId || !data?.planes) return false;
    const plan = data.planes.find((p) => p.id === pacientePlanId);
    return Boolean(plan?.tarifa_es_precio_directo);
  }, [data?.planes, pacientePlanId]);
  const soatDeshabilitado = tarifaEsPrecioDirecto;

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
    } finally {
      recargoRecalcInFlightRef.current = false;
    }
  }, [setLineas]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ tarifaId?: number }>;
      const nextTarifaId = ce.detail?.tarifaId ?? null;
      if (!nextTarifaId) return;
      if (!tarifaIdRef.current) return;
      if (nextTarifaId !== tarifaIdRef.current) return;
      if (lineasRef.current.length === 0) return;

      if (recargoRecalcTimeoutRef.current) clearTimeout(recargoRecalcTimeoutRef.current);
      recargoRecalcTimeoutRef.current = setTimeout(() => {
        void recalcularRecargoNocheEnLineas();
      }, 150);
    };

    window.addEventListener("recargoNoche:changed", handler);
    return () => {
      window.removeEventListener("recargoNoche:changed", handler);
      if (recargoRecalcTimeoutRef.current) clearTimeout(recargoRecalcTimeoutRef.current);
    };
  }, [recalcularRecargoNocheEnLineas]);

  React.useEffect(() => {
    if (soatDeshabilitado && (soatActivo || soatNumeroPoliza.trim() || soatNumeroPlaca.trim())) {
      setSoatActivo(false);
      setSoatNumeroPoliza("");
      setSoatNumeroPlaca("");
    }
  }, [soatDeshabilitado, soatActivo, soatNumeroPoliza, soatNumeroPlaca]);

  const getAtencionDraft = React.useCallback((): AtencionDraft => {
    return {
      acudio,
      horaAsistenciaDisplay,
      pacientePlanId,
      parentescoSeguro,
      titularNombre,
      controlPrePostNatal,
      controlNinoSano,
      chequeo,
      carencia,
      latencia,
      soatActivo,
      soatNumeroPoliza,
      soatNumeroPlaca,
      lineas,
    };
  }, [
    acudio,
    horaAsistenciaDisplay,
    pacientePlanId,
    parentescoSeguro,
    titularNombre,
    controlPrePostNatal,
    controlNinoSano,
    chequeo,
    carencia,
    latencia,
    soatActivo,
    soatNumeroPoliza,
    soatNumeroPlaca,
    lineas,
  ]);

  const serviciosSectionRef = React.useRef<HTMLDivElement | null>(null);
  const processedServiciosRef = React.useRef<string | null>(null);

  const onServiciosSelected = React.useCallback(
    (servicios: TarifaServicioBusqueda[]) => {
      if (!servicios.length || !data) return;
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
      const medicoId = data.programacion?.medico?.id ?? 0;
      const medicoNombre = formatMedico(data.programacion?.medico ?? null);
      const medicoOpt = medicosOptions.find((o) => o.value === String(medicoId));
      const labelMedico = medicoOpt?.label ?? "";
      const codigoMedico = labelMedico.includes(" · ") ? labelMedico.split(" · ")[0]?.trim() ?? "" : labelMedico.split(/\s+/)[0] ?? "";
      getIgvPorcentaje().then((igvPct) => {
        const nuevas: AtencionServicioLineaDisplay[] = toAdd.map((s) => {
          const precioBase = parseFloat(String(s.precio_sin_igv)) || 0;
          const recargoNoche = Boolean(s.recargo_noche_activo);
          const aumentoPct = recargoNoche ? (s.recargo_noche_porcentaje ?? 0) : 0;
          const { precioSinIgv, precioConIgv } = calcularPrecios(precioBase, 1, 0, aumentoPct, igvPct);
          const esCat50 = (String(s.categoria_codigo ?? "").trim() === "50");
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
    [data, medicosOptions, user, copVarDefault, lineas]
  );

  React.useEffect(() => {
    const st = (location.state ?? {}) as {
      selectedServicios?: TarifaServicioBusqueda[];
      returnLineas?: AtencionServicioLineaDisplay[];
      scrollToServicios?: boolean;
      copVarDefault?: number;
    };
    const servs = st.selectedServicios;
    const restoreLineas = st.returnLineas;
    const scrollTo = st.scrollToServicios;
    if (st.copVarDefault != null && Number.isFinite(st.copVarDefault)) {
      setCopVarDefault(st.copVarDefault);
    }
    const stateSinDraft = () => ({
      returnLineas: st.returnLineas,
      scrollToServicios: st.scrollToServicios,
      selectedServicios: st.selectedServicios,
      copVarDefault: st.copVarDefault,
    });

    if (scrollTo && serviciosSectionRef.current) {
      requestAnimationFrame(() => {
        serviciosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navigate(location.pathname, { replace: true, state: { ...stateSinDraft(), scrollToServicios: false } });
    }

    if (restoreLineas != null) setLineas(restoreLineas);

    if (!servs?.length || !data) return;
    const key = servs.map((s) => s.id).join(",");
    if (processedServiciosRef.current === key) return;
    processedServiciosRef.current = key;
    navigate(location.pathname, { replace: true, state: {} });
    const medicoId = data.programacion?.medico?.id ?? 0;
    const medicoNombre = formatMedico(data.programacion?.medico ?? null);
    getIgvPorcentaje().then((igvPct) => {
      const medicosOpts = medicosOptions;
      const medicoOpt = medicosOpts.find((o) => o.value === String(medicoId));
      const labelMedico = medicoOpt?.label ?? "";
      const codigoMedico = labelMedico.includes(" · ") ? labelMedico.split(" · ")[0]?.trim() ?? "" : labelMedico.split(/\s+/)[0] ?? "";
      const nuevas: AtencionServicioLineaDisplay[] = servs.map((s) => {
        const precioBase = parseFloat(String(s.precio_sin_igv)) || 0;
        const recargoNoche = Boolean(s.recargo_noche_activo);
        const aumentoPct = recargoNoche ? (s.recargo_noche_porcentaje ?? 0) : 0;
        const { precioSinIgv, precioConIgv } = calcularPrecios(precioBase, 1, 0, aumentoPct, igvPct);
        const esCat50 = (String(s.categoria_codigo ?? "").trim() === "50");
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
  }, [location.state, location.pathname, navigate, data, medicosOptions, tarifaActual, user, copVarDefault]);

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

  React.useEffect(() => {
    if (parentescoSeguro.trim().toUpperCase() === "TITULAR" && data?.paciente) {
      setTitularNombre(data.paciente.apellidos_nombres);
    }
  }, [parentescoSeguro, data?.paciente]);

  const onRegresar = React.useCallback(() => {
    if (Number.isFinite(id)) clearDraftForCita(id);
    navigate("/admision/citas/agenda", { state: { returnFromAtencion: true, citaId: id } });
  }, [navigate, id, clearDraftForCita]);

  const onAcudioChange = React.useCallback((checked: boolean) => {
    setAcudio(checked);
    if (checked) setHoraAsistenciaDisplay(formatHoraLocal());
    else setHoraAsistenciaDisplay("");
  }, []);

  const [montoAPagar, setMontoAPagar] = React.useState(0);
  const onMontoAPagarChange = React.useCallback((monto: number) => setMontoAPagar(monto), []);

  const hasPendingDataChanges =
    pacientePlanId !== lastSavedPlanId ||
    (parentescoSeguro ?? "") !== lastSavedParentesco ||
    (titularNombre ?? "") !== lastSavedTitular;

  const hasFormChangesComparedToSaved = React.useMemo(() => {
    if (!data?.atencion) return true;
    const a = data.atencion;
    const s = data.servicios ?? [];
    if (acudio !== Boolean(a.hora_asistencia)) return true;
    if ((horaAsistenciaDisplay || "").trim() !== (a.hora_asistencia?.slice(0, 5) ?? "").trim()) return true;
    if (controlPrePostNatal !== Boolean(a.control_pre_post_natal)) return true;
    if (controlNinoSano !== Boolean(a.control_nino_sano)) return true;
    if (chequeo !== Boolean(a.chequeo)) return true;
    if (carencia !== Boolean(a.carencia)) return true;
    if (latencia !== Boolean(a.latencia)) return true;
    if (soatActivo !== Boolean(a.soat_activo)) return true;
    if ((soatNumeroPoliza ?? "").trim() !== (a.soat_numero_poliza ?? "").trim()) return true;
    if ((soatNumeroPlaca ?? "").trim() !== (a.soat_numero_placa ?? "").trim()) return true;
    if (lineas.length !== s.length) return true;
    const lineasChanged = lineas.some(
      (l, i) =>
        !s[i] || l.id !== s[i].id || Number(l.cantidad) !== Number(s[i].cantidad)
    );
    if (lineasChanged) return true;
    return false;
  }, [
    data?.atencion,
    data?.servicios,
    acudio,
    horaAsistenciaDisplay,
    controlPrePostNatal,
    controlNinoSano,
    chequeo,
    carencia,
    latencia,
    soatActivo,
    soatNumeroPoliza,
    soatNumeroPlaca,
    lineas,
  ]);

  const canGuardarAtencion =
    !hasPendingDataChanges &&
    acudio &&
    lineas.length > 0 &&
    hasFormChangesComparedToSaved;
  const horaAsistenciaGuardada = Boolean(data?.atencion?.hora_asistencia);

  React.useEffect(() => {
    if (!error) return;
    if (error.startsWith("Debe marcar") && acudio) setError(null);
    if (error.startsWith("Debe haber") && lineas.length > 0) setError(null);
  }, [acudio, lineas.length, error]);

  const actualizarGuardado = React.useCallback((res: AtencionCitaData) => {
    setData(res);
    setAcudio(Boolean(res.atencion?.hora_asistencia));
    setHoraAsistenciaDisplay(res.atencion?.hora_asistencia?.slice(0, 5) ?? "");
    setPacientePlanId(res.atencion?.paciente_plan_id ?? null);
    setParentescoSeguro(res.paciente.parentesco_seguro ?? "");
    setTitularNombre(res.paciente.titular_nombre ?? "");
    setLastSavedPlanId(res.atencion?.paciente_plan_id ?? null);
    setLastSavedParentesco(res.paciente.parentesco_seguro ?? "");
    setLastSavedTitular(res.paciente.titular_nombre ?? "");
    setControlPrePostNatal(Boolean(res.atencion?.control_pre_post_natal));
    setControlNinoSano(Boolean(res.atencion?.control_nino_sano));
    setChequeo(Boolean(res.atencion?.chequeo));
    setCarencia(Boolean(res.atencion?.carencia));
    setLatencia(Boolean(res.atencion?.latencia));
    setSoatActivo(Boolean(res.atencion?.soat_activo));
    setSoatNumeroPoliza(res.atencion?.soat_numero_poliza ?? "");
    setSoatNumeroPlaca(res.atencion?.soat_numero_placa ?? "");
    setLineas((res.servicios ?? []).map(mapServicioToDisplay));
  }, []);

  const onGuardar = React.useCallback(async () => {
    if (!Number.isFinite(id)) return;
    if (!acudio) {
      toastService.showError("Debe marcar la casilla «Hora de atención» para guardar la atención.");
      return;
    }
    if (lineas.length === 0) {
      toastService.showError("Debe haber al menos un servicio en la tabla Servicios finales para guardar la atención.");
      return;
    }
    setSavingState("guardar");
    const serviciosPayload: AtencionServicioLinea[] = lineas.map((l) => ({
      tarifa_servicio_id: l.tarifa_servicio_id,
      medico_id: l.medico_id,
      cop_var: l.cop_var ?? 0,
      cop_fijo: l.cop_fijo ?? 0,
      descuento_pct: l.descuento_pct ?? 0,
      aumento_pct: l.aumento_pct ?? 0,
      cantidad: l.cantidad ?? 1,
      precio_sin_igv: l.precio_sin_igv,
      precio_con_igv: l.precio_con_igv,
      estado_facturacion: l.estado_facturacion ?? "PENDIENTE",
    }));

    const payload: AtencionCitaStorePayload = {
      acudio_a_su_cita: acudio,
      hora_asistencia: acudio && horaAsistenciaDisplay ? horaAsistenciaDisplay : undefined,
      paciente_plan_id: pacientePlanId ?? undefined,
      parentesco_seguro: parentescoSeguro.trim() || undefined,
      titular_nombre: titularNombre.trim() || undefined,
      control_pre_post_natal: controlPrePostNatal,
      control_nino_sano: controlNinoSano,
      chequeo,
      carencia,
      latencia,
      monto_a_pagar: Math.round(montoAPagar * 10 ** PRECISION_DECIMAL) / 10 ** PRECISION_DECIMAL,
      soat_activo: soatActivo,
      soat_numero_poliza: soatActivo ? (soatNumeroPoliza.trim() || null) : null,
      soat_numero_placa: soatActivo ? (soatNumeroPlaca.trim() || null) : null,
      servicios: serviciosPayload,
    };
    try {
      const res = await guardarAtencionCita(id, payload);
      actualizarGuardado(res);
      clearDraftForCita(id);
      toastService.showSuccess("Atención guardada correctamente.");
      navigate("/admision/citas/agenda", {
        replace: true,
        state: { returnFromAtencion: true, citaId: id },
      });
    } catch (e) {
      toastService.showError(toUserFriendlyMessage(e, "No se pudo guardar la atención."));
    } finally {
      setSavingState(null);
    }
  }, [id, acudio, horaAsistenciaDisplay, pacientePlanId, parentescoSeguro, titularNombre, controlPrePostNatal, controlNinoSano, chequeo, carencia, latencia, soatActivo, soatNumeroPoliza, soatNumeroPlaca, montoAPagar, lineas, actualizarGuardado, navigate, clearDraftForCita]);

  const onActualizarDatos = React.useCallback(async () => {
    if (!Number.isFinite(id) || !hasPendingDataChanges) return;
    const planChanged = pacientePlanId !== lastSavedPlanId;
    setSavingState("actualizar");
    const serviciosPayload: AtencionServicioLinea[] =
      planChanged
        ? []
        : lineas.map((l) => ({
            tarifa_servicio_id: l.tarifa_servicio_id,
            medico_id: l.medico_id,
            cop_var: l.cop_var ?? 0,
            cop_fijo: l.cop_fijo ?? 0,
            descuento_pct: l.descuento_pct ?? 0,
            aumento_pct: l.aumento_pct ?? 0,
            cantidad: l.cantidad ?? 1,
            precio_sin_igv: l.precio_sin_igv,
            precio_con_igv: l.precio_con_igv,
            estado_facturacion: l.estado_facturacion ?? "PENDIENTE",
          }));
    const payload: AtencionCitaStorePayload = {
      solo_actualizar_datos: true,
      acudio_a_su_cita: acudio,
      hora_asistencia: acudio && horaAsistenciaDisplay ? horaAsistenciaDisplay : undefined,
      paciente_plan_id: pacientePlanId ?? undefined,
      parentesco_seguro: parentescoSeguro.trim() || undefined,
      titular_nombre: titularNombre.trim() || undefined,
      control_pre_post_natal: controlPrePostNatal,
      control_nino_sano: controlNinoSano,
      chequeo,
      carencia,
      latencia,
      monto_a_pagar: planChanged ? 0 : Math.round(montoAPagar * 10 ** PRECISION_DECIMAL) / 10 ** PRECISION_DECIMAL,
      soat_activo: soatActivo,
      soat_numero_poliza: soatActivo ? (soatNumeroPoliza.trim() || null) : null,
      soat_numero_placa: soatActivo ? (soatNumeroPlaca.trim() || null) : null,
      servicios: serviciosPayload,
    };
    try {
      const res = await guardarAtencionCita(id, payload);
      actualizarGuardado(res);
      if (planChanged) setLineas([]);
      clearDraftForCita(id);
      toastService.showSuccess("Datos actualizados.");
    } catch (e) {
      toastService.showError(toUserFriendlyMessage(e, "No se pudieron actualizar los datos."));
      throw e;
    } finally {
      setSavingState(null);
    }
  }, [id, hasPendingDataChanges, pacientePlanId, lastSavedPlanId, acudio, horaAsistenciaDisplay, parentescoSeguro, titularNombre, controlPrePostNatal, controlNinoSano, chequeo, carencia, latencia, soatActivo, soatNumeroPoliza, soatNumeroPlaca, montoAPagar, lineas, actualizarGuardado, clearDraftForCita]);

  const pendingChangesMessage = React.useMemo(() => {
    const partes: string[] = [];
    if (pacientePlanId !== lastSavedPlanId) partes.push("Plan");
    if ((parentescoSeguro ?? "") !== lastSavedParentesco) partes.push("Condición");
    if ((titularNombre ?? "") !== lastSavedTitular) partes.push("Titular");
    if (partes.length === 0) return "";
    return `Los siguientes cambios están pendientes por guardar: ${partes.join(", ")}. ¿Desea actualizar los datos antes de buscar servicios?`;
  }, [pacientePlanId, lastSavedPlanId, parentescoSeguro, lastSavedParentesco, titularNombre, lastSavedTitular]);

  if (loading) {
    return (
      <div className="flex min-h-50 flex-col items-center justify-center gap-3 rounded-lg border border-(--border-color-default) bg-(--color-surface) p-8">
        <div className="h-8 w-8 shrink-0 rounded-full border-2 border-(--color-primary) border-t-transparent animate-spin" aria-hidden />
        <span className="text-sm font-medium text-(--color-text-secondary)">Cargando atención de cita…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4 pb-4">
        <div className="rounded-2xl border border-(--color-danger) bg-(--color-surface) p-4 text-(--color-danger)">
          {error ?? "No se encontraron datos."}
        </div>
        <SecondaryButton onClick={() => navigate("/admision/citas/agenda", { state: { returnFromAtencion: true, citaId: id } })}>Regresar a la agenda</SecondaryButton>
      </div>
    );
  }

  const { cita, programacion, paciente } = data;
  const fechaDisplay = cita.fecha ? cita.fecha.split("-").reverse().join("/") : "—";
  const nroCuenta = cita.cuenta ?? data.atencion?.nro_cuenta ?? "";

  return (
    <div className="flex w-full min-w-0 flex-col space-y-4 lg:space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-2">
        <div className="w-full min-w-0 rounded-2xl border border-(--border-color-default) bg-(--color-panel-options-bg) px-4 py-3 lg:px-3 lg:py-2 sm:w-auto">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {cita.motivo ? (
              <span className="text-base font-bold text-(--color-danger) shrink-0">{cita.motivo}</span>
            ) : null}
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
              <span className="text-sm font-semibold text-(--color-text-primary) shrink-0">N° de cuenta:</span>
              <input
                value={nroCuenta || "—"}
                readOnly
                className="min-w-0 flex-1 rounded border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-center text-base font-semibold tabular-nums text-(--color-text-primary) outline-none sm:w-48 sm:flex-none"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Acciones de la atención">
          <SecondaryButton onClick={onRegresar} title="Volver a la agenda (los cambios no guardados se pierden)">
            Regresar
          </SecondaryButton>
          <SecondaryButton
            onClick={() => {
              if (hasPendingDataChanges) toastService.showInfo("Cambios descartados.");
              setPacientePlanId(lastSavedPlanId);
              setParentescoSeguro(lastSavedParentesco);
              setTitularNombre(lastSavedTitular);
            }}
            disabled={saving || !hasPendingDataChanges}
            title="Descartar cambios en plan, parentesco y titular (restaurar últimos guardados)"
          >
            Cancelar
          </SecondaryButton>
          <SecondaryButton
            onClick={onActualizarDatos}
            disabled={saving || !hasPendingDataChanges}
            title="Guardar solo los datos del paciente en el servidor (plan, parentesco, titular)"
          >
            {savingState === "actualizar" ? "Guardando…" : "Actualizar datos"}
          </SecondaryButton>
          <PrimaryButton
            onClick={onGuardar}
            disabled={saving || !canGuardarAtencion}
            title="Guardar la atención completa (asistencia, servicios y montos)"
          >
            {savingState === "guardar" ? "Guardando…" : "Guardar atención"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-2">
        <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
          <h2 className="text-sm font-semibold text-(--color-text-primary)">Datos de la cita</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-2 lg:grid-cols-2 lg:gap-2">
            <div>
              <label className="text-xs text-(--color-text-secondary)">Fecha</label>
              <input
                value={fechaDisplay}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Hora aproximada</label>
              <input
                value={cita.hora ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">N° de orden</label>
              <input
                value={String(cita.orden)}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="block min-h-5 text-xs leading-normal text-(--color-text-secondary)">
                <span className={`inline-flex items-center gap-2 ${horaAsistenciaGuardada ? "cursor-default opacity-90" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={acudio}
                    onChange={(e) => !horaAsistenciaGuardada && onAcudioChange(e.target.checked)}
                    disabled={horaAsistenciaGuardada}
                    className="h-4 w-4 shrink-0 rounded border border-(--border-color-default) disabled:cursor-not-allowed"
                  />
                  Hora de atención
                </span>
              </label>
              <input
                value={acudio ? horaAsistenciaDisplay : ""}
                readOnly
                placeholder=""
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm tabular-nums text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
          <h2 className="text-sm font-semibold text-(--color-text-primary)">Servicio y médico</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-2 lg:grid-cols-3 lg:gap-2">
            <div>
              <label className="text-xs text-(--color-text-secondary)">Servicio solicitado</label>
              <input
                value={programacion?.especialidad?.descripcion ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Médico tratante</label>
              <input
                value={formatMedico(programacion?.medico ?? null)}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">N° de Historia Clínica</label>
              <input
                value={paciente.numero_documento ?? paciente.nr ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Consultorio</label>
              <input
                value={programacion?.consultorio ? `${programacion.consultorio.abreviatura} · ${programacion.consultorio.descripcion}` : "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Tarifario asignado</label>
              <input
                value={tarifaActual ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">N° de Referencia</label>
              <input
                value={paciente.nr ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
        <h2 className="text-sm font-semibold text-(--color-text-primary)">Datos del paciente</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-2 lg:grid-cols-4 lg:gap-3">
          <div>
            <label className="text-xs font-medium text-(--color-text-primary)">Seleccione el plan</label>
            <div className="mt-1 lg:mt-0.5">
              <SelectMenu
                value={pacientePlanId != null ? String(pacientePlanId) : ""}
                onChange={(v) => setPacientePlanId(v ? Number(v) : null)}
                options={planOptions}
                ariaLabel="Plan"
                buttonClassName="w-full lg:h-8 lg:rounded"
                menuClassName="min-w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Condición</label>
            <div className="mt-1 lg:mt-0.5">
              <SelectMenu
                value={parentescoSeguro}
                onChange={setParentescoSeguro}
                options={[{ value: "", label: "Seleccione condición" }, ...PARENTESCO_OPTIONS]}
                ariaLabel="Parentesco seguro"
                buttonClassName="w-full lg:h-8 lg:rounded"
                menuClassName="min-w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Titular</label>
            <input
              value={titularNombre}
              onChange={(e) => setTitularNombre(e.target.value)}
              readOnly={parentescoSeguro.trim().toUpperCase() === "TITULAR"}
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) disabled:opacity-70 disabled:cursor-not-allowed lg:mt-0.5 lg:h-8"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">N° Autorización SITEDS</label>
            <input
              value={cita.autorizacion_siteds ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Apellidos y nombres</label>
            <input
              value={paciente.apellidos_nombres}
              readOnly
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Sexo</label>
            <input
              value={paciente.sexo ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Edad</label>
            <input
              value={paciente.edad != null ? String(paciente.edad) : "—"}
              readOnly
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">N° de Teléfono móvil</label>
            <input
              value={paciente.celular ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-(--color-text-secondary)">Correo electrónico</label>
            <input
              value={paciente.email ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-(--color-text-secondary)">N° de Teléfono fijo</label>
            <input
              value={paciente.telefono ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-2">
        <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
          <h2 className="text-sm font-semibold text-(--color-text-primary)">Indicadores de atención</h2>
          <div className="mt-4 flex flex-col gap-3 lg:mt-2 lg:gap-2">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:gap-x-4">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={controlPrePostNatal}
                  onChange={(e) => setControlPrePostNatal(e.target.checked)}
                  className="h-4 w-4 rounded border border-(--border-color-default)"
                />
                <span className="text-sm text-(--color-text-primary)">Control Pre y Post Natal</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={controlNinoSano}
                  onChange={(e) => setControlNinoSano(e.target.checked)}
                  className="h-4 w-4 rounded border border-(--border-color-default)"
                />
                <span className="text-sm text-(--color-text-primary)">Control niño sano</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={chequeo}
                  onChange={(e) => setChequeo(e.target.checked)}
                  className="h-4 w-4 rounded border border-(--border-color-default)"
                />
                <span className="text-sm text-(--color-text-primary)">Chequeo</span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:gap-x-4">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={carencia}
                  onChange={(e) => setCarencia(e.target.checked)}
                  className="h-4 w-4 rounded border border-(--border-color-default)"
                />
                <span className="text-sm text-(--color-text-primary)">Carencia</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={latencia}
                  onChange={(e) => setLatencia(e.target.checked)}
                  className="h-4 w-4 rounded border border-(--border-color-default)"
                />
                <span className="text-sm text-(--color-text-primary)">Latencia</span>
              </label>
            </div>
          </div>
        </div>
        <div
          className={`rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3 ${soatDeshabilitado ? "opacity-60 pointer-events-none" : ""}`}
          aria-disabled={soatDeshabilitado}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="soat-activo"
              checked={soatActivo}
              onChange={(e) => {
                const checked = e.target.checked;
                setSoatActivo(checked);
                if (!checked) {
                  setSoatNumeroPoliza("");
                  setSoatNumeroPlaca("");
                }
              }}
              disabled={soatDeshabilitado}
              className="h-4 w-4 shrink-0 rounded border border-(--border-color-default) disabled:cursor-not-allowed"
            />
            <label htmlFor="soat-activo" className={`text-sm font-semibold text-(--color-text-primary) ${soatDeshabilitado ? "cursor-not-allowed" : "cursor-pointer"}`}>
              SOAT
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-2 lg:gap-3">
            <div>
              <label className="block text-xs text-(--color-text-secondary)">Nº de póliza</label>
              <input
                value={soatNumeroPoliza}
                onChange={(e) => setSoatNumeroPoliza(e.target.value)}
                disabled={soatDeshabilitado || !soatActivo}
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) disabled:opacity-60 disabled:cursor-not-allowed lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="block text-xs text-(--color-text-secondary)">Nº de placa</label>
              <input
                value={soatNumeroPlaca}
                onChange={(e) => setSoatNumeroPlaca(e.target.value)}
                disabled={soatDeshabilitado || !soatActivo}
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) disabled:opacity-60 disabled:cursor-not-allowed lg:mt-0.5 lg:h-8"
              />
            </div>
          </div>
        </div>
      </div>

      <div ref={serviciosSectionRef}>
        <ServiciosSolicitadosSection
          medicoTratanteId={data.programacion?.medico?.id ?? null}
          medicoTratanteLabel={
            medicosOptions.find((o) => o.value === String(data.programacion?.medico?.id ?? ""))?.label ?? formatMedico(data.programacion?.medico ?? null)
          }
          tarifaId={tarifaId}
          tarifaDescripcion={tarifaActual}
          tarifaEsPrecioDirecto={tarifaEsPrecioDirecto}
          lineas={lineas}
          onLineasChange={setLineas}
          medicosOptions={medicosOptions}
          currentUsername={user?.username ?? ""}
          citaId={id}
          hasPendingDataChanges={hasPendingDataChanges}
          onActualizarDatos={onActualizarDatos}
          pendingChangesMessage={pendingChangesMessage}
          onMontoAPagarChange={onMontoAPagarChange}
          copVarDefault={copVarDefault}
          onCopVarDefaultChange={setCopVarDefault}
          getAtencionDraft={getAtencionDraft}
          onServiciosSelected={onServiciosSelected}
        />
      </div>
    </div>
  );
}
