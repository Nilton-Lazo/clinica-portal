import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../../../shared/api";
import { toastService } from "../../../shared/notifications";
import { useAuth } from "../../../shared/auth/useAuth";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/buttons";
import { SelectMenu, type SelectOption } from "../../../shared/ui/SelectMenu";
import { PRECISION_DECIMAL } from "../../../shared/constants/decimalPrecision";
import { formatCuentaConPrefijo } from "../../../shared/utils/cuentaPrefijos";
import { toUserFriendlyMessage } from "../../admision/citas/utils/userFriendlyError";
import { ServiciosSolicitadosSection } from "../../admision/citas/agenda/components/ServiciosSolicitadosSection";
import type { AtencionServicioLinea, AtencionServicioLineaDisplay } from "../../admision/citas/agenda/types/atencionCita.types";
import type { TarifaServicioBusqueda } from "../../admision/citas/agenda/services/atencionCita.service";
import { buscarServiciosTarifa, getIgvPorcentaje } from "../../admision/citas/agenda/services/atencionCita.service";
import { listPacientePlanes } from "../../admision/historia-clinica/wizard/acreditacionPlanes.service";
import type { AcreditacionPlan } from "../../admision/historia-clinica/wizard/acreditacionPlanes.types";
import type { PacienteDetail, PacienteUpsertPayload } from "../../admision/historia-clinica/types/historiaClinica.types";
import { getPaciente, listPacientes, updatePaciente } from "../../admision/historia-clinica/services/historiaClinica.service";
import { CONDICION_OPTIONS } from "../types/nuevoRegistro.types";
import type { RegistroEmergencia } from "../types/registroEmergencia.types";
import { getRegistroEmergencia } from "../services/registroEmergencia.service";
import { guardarAtencionEmergencia, getDatosAtencionEmergencia } from "../services/atencionEmergencia.service";
import { getTarifasOperativas } from "../../ficheros/services/recargoNoche.service";
import { listServiciosDefaultEmergenciaByTarifa } from "../../ficheros/parametros/emergencia/services/serviciosDefaultEmergencia.service";

function extractCodigoPrefix(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/^(\d+)\s*·/);
  if (m?.[1]) return m[1].trim();
  const m2 = raw.match(/^(\d+)/);
  return m2?.[1] ? m2[1].trim() : "";
}

const EMERGENCIA_BUSCAR_SERVICIOS_PATH = "/admision/citas/presupuestos/nuevo/buscar-servicios";

function normalizeCodigoForMatch(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return String(Math.trunc(Number(raw)));
  return raw.replace(/^0+/, "");
}

function medicoCodigoFromLabel(label: string | null | undefined): string {
  const raw = (label ?? "").trim();
  if (!raw) return "";
  if (raw.includes(" · ")) return raw.split(" · ")[0]?.trim() ?? "";
  return raw.split(/\s+/)[0] ?? "";
}

function medicoNombreFromLabel(label: string | null | undefined): string {
  const raw = (label ?? "").trim();
  if (!raw) return "";
  if (raw.includes(" · ")) return raw.split(" · ").slice(1).join(" · ").trim();
  if (raw.includes("·")) return raw.split("·").slice(1).join("·").trim();
  return raw;
}

function normalizePersonName(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const sinAcentos = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return sinAcentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function nombreCompletoPaciente(p: PacienteDetail): string {
  return (
    p.nombre_completo?.trim() ||
    [p.apellido_paterno ?? "", p.apellido_materno ?? "", p.nombres ?? ""].filter(Boolean).join(" ").trim()
  );
}

function userNombreCompleto(
  user:
    | {
        name?: string | null;
        apellido_paterno?: string;
        apellido_materno?: string | null;
        nombres?: string;
        username?: string;
      }
    | null
    | undefined
): string {
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

type LocationState = {
  registro?: RegistroEmergencia | null;
};

type TarifaOperativaLite = { codigo: string; descripcion_tarifa?: string };

const medicosOptionsCache: {
  data: SelectOption[] | null;
  promise: Promise<SelectOption[]> | null;
} = { data: null, promise: null };

const tarifasOperativasCache: {
  dataById: Map<number, TarifaOperativaLite> | null;
  promise: Promise<Map<number, TarifaOperativaLite>> | null;
} = { dataById: null, promise: null };

const pacienteCacheById = new Map<number, PacienteDetail>();
const planesCacheByPacienteId = new Map<number, AcreditacionPlan[]>();

export default function AtencionEmergenciaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const registroId = id ? parseInt(id, 10) : NaN;
  const navState = (location.state ?? {}) as LocationState;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [registro, setRegistro] = React.useState<RegistroEmergencia | null>(navState.registro ?? null);
  const [paciente, setPaciente] = React.useState<PacienteDetail | null>(null);
  const [planes, setPlanes] = React.useState<AcreditacionPlan[]>([]);
  const [medicosOptions, setMedicosOptions] = React.useState<SelectOption[]>(() => medicosOptionsCache.data ?? []);
  const [tarifasOperativasById, setTarifasOperativasById] = React.useState<Map<number, TarifaOperativaLite>>(
    () => tarifasOperativasCache.dataById ?? new Map()
  );

  const [medicoTratanteId, setMedicoTratanteId] = React.useState<number | null>(null);
  const medicoCodigoFallback = React.useMemo(() => medicoCodigoFromLabel(registro?.medico_emergencia ?? null), [registro?.medico_emergencia]);

  const [pacientePlanId, setPacientePlanId] = React.useState<number | null>(null);
  const [lastSavedPlanId, setLastSavedPlanId] = React.useState<number | null>(null);

  const [condicion, setCondicion] = React.useState<string>("");
  const [titularNombre, setTitularNombre] = React.useState<string>("");
  const [lastSavedCondicion, setLastSavedCondicion] = React.useState<string>("");
  const [lastSavedTitular, setLastSavedTitular] = React.useState<string>("");

  const [lineas, setLineas] = React.useState<AtencionServicioLineaDisplay[]>([]);
  const [copVarDefault, setCopVarDefault] = React.useState(0);

  const [horaAsistenciaDisplay, setHoraAsistenciaDisplay] = React.useState<string>("");

  const [montoAPagar, setMontoAPagar] = React.useState(0);
  const [savingState, setSavingState] = React.useState<"actualizar" | "guardar" | null>(null);
  const saving = savingState !== null;

  const serviciosSectionRef = React.useRef<HTMLDivElement | null>(null);

  const fullName = React.useMemo(() => (paciente ? nombreCompletoPaciente(paciente) : ""), [paciente]);

  const defaultsAppliedPlanIdRef = React.useRef<number | null>(null);
  const defaultsApplyingRef = React.useRef(false);

  React.useEffect(() => {
    defaultsAppliedPlanIdRef.current = null;
  }, [pacientePlanId]);

  const planOptions: SelectOption[] = React.useMemo(() => {
    const opts: SelectOption[] = [{ value: "", label: "Seleccione tipo de cliente" }];
    return opts.concat(
      planes.map((p) => {
        const code = p.tipo_cliente?.codigo ?? "";
        const desc = p.tipo_cliente?.descripcion_tipo_cliente ?? "";
        const label = code ? `${code} · ${desc}` : `Plan ${p.id}`;
        return { value: String(p.id), label };
      })
    );
  }, [planes]);

  const tarifaActual = React.useMemo(() => {
    if (!pacientePlanId) return null;
    return planes.find((p) => p.id === pacientePlanId) ?? null;
  }, [planes, pacientePlanId]);

  const tarifaId = React.useMemo(() => tarifaActual?.tarifa_id ?? null, [tarifaActual]);
  const tarifaDirectText = React.useMemo(() => tarifaActual?.tarifa_descripcion ?? tarifaActual?.tarifa_codigo ?? null, [tarifaActual]);
  const tarifaDescripcion = React.useMemo(() => {
    if (tarifaDirectText) return tarifaDirectText;
    if (!tarifaId) return null;
    const t = tarifasOperativasById.get(tarifaId);
    return t?.descripcion_tarifa ?? t?.codigo ?? null;
  }, [tarifaDirectText, tarifaId, tarifasOperativasById]);
  const tarifaEsPrecioDirecto = React.useMemo(() => Boolean(tarifaActual?.tarifa_es_precio_directo), [tarifaActual]);

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
      const codes = snapshot.map((l) => (l.servicio_codigo ?? "").trim()).filter(Boolean);
      if (codes.length === 0) return;

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

  const hasPendingDataChanges =
    pacientePlanId !== lastSavedPlanId ||
    (condicion ?? "").trim().toUpperCase() !== (lastSavedCondicion ?? "").trim().toUpperCase() ||
    (titularNombre ?? "").trim() !== (lastSavedTitular ?? "").trim();

  const pendingChangesMessage = React.useMemo(() => {
    const partes: string[] = [];
    if (pacientePlanId !== lastSavedPlanId) partes.push("Tipo de cliente");
    if ((condicion ?? "").trim() !== (lastSavedCondicion ?? "").trim()) partes.push("Condición");
    if ((titularNombre ?? "").trim() !== (lastSavedTitular ?? "").trim()) partes.push("Titular");
    if (partes.length === 0) return "";
    return `Los siguientes cambios están pendientes por guardar: ${partes.join(", ")}. ¿Desea actualizar los datos antes de buscar servicios?`;
  }, [pacientePlanId, lastSavedPlanId, condicion, lastSavedCondicion, titularNombre, lastSavedTitular]);

  const canGuardarAtencion = !hasPendingDataChanges && lineas.length > 0;

  React.useEffect(() => {
    if (!Number.isFinite(registroId)) {
      setError("ID de registro inválido");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let reg = navState.registro ?? null;
        let isExistingAtencion = false;
        let pFull: PacienteDetail | null = null;
        
        try {
          const atencionData = await getDatosAtencionEmergencia(registroId);
          if (cancelled) return;
          reg = atencionData.registro;
          setRegistro(reg);
          
          if (atencionData.paciente) {
            pFull = atencionData.paciente;
            setPaciente(atencionData.paciente);
            pacienteCacheById.set(atencionData.paciente.id, atencionData.paciente);
          }
          
          if (atencionData.servicios && atencionData.servicios.length > 0) {
            setLineas(atencionData.servicios);
            isExistingAtencion = true;
          }
          
        } catch {
          if (!reg) reg = await getRegistroEmergencia(registroId);
          if (cancelled) return;
          setRegistro(reg);
        }

        if (!pFull) {
          const hc = reg.numero_hc;
          const pacientesRes = await listPacientes({ page: 1, per_page: 5, q: hc });
          const match = pacientesRes.data.find((p) => p.hc === hc) ?? pacientesRes.data[0];
          if (!match) throw new Error("No se pudo encontrar el paciente por el N° de Historia clínica.");
          
          const cachedPaciente = pacienteCacheById.get(match.id) ?? null;
          pFull = cachedPaciente ?? (await getPaciente(match.id));
          if (cancelled) return;
          setPaciente(pFull);
          if (!cachedPaciente) pacienteCacheById.set(pFull.id, pFull);
        }

        setHoraAsistenciaDisplay(reg.hora_asistencia ? String(reg.hora_asistencia).slice(0, 5) : (reg.hora ? String(reg.hora).slice(0, 5) : ""));

        setLoading(false);

        if (!pFull) return;
        const full = pFull;

        const cachedPlanes = planesCacheByPacienteId.get(full.id) ?? null;
        const planesRaw =
          cachedPlanes ??
          (await listPacientePlanes(full.id, {
            soloActivos: true,
            incluirPlanId: reg.paciente_plan_id ?? null,
          }));
        if (cancelled) return;
        setPlanes(planesRaw);
        if (!cachedPlanes) planesCacheByPacienteId.set(full.id, planesRaw);

        const initialPlanId = reg.paciente_plan_id ?? (() => {
          const tipoClienteCode = normalizeCodigoForMatch(extractCodigoPrefix(reg.tipo_cliente ?? null));
          const initialPlan =
            planesRaw.find((p) => normalizeCodigoForMatch(p.tipo_cliente?.codigo) === tipoClienteCode) ??
            planesRaw[0] ??
            null;
          return initialPlan?.id ?? null;
        })();

        setPacientePlanId(initialPlanId);
        setLastSavedPlanId(initialPlanId);

        const condInit = (reg.parentesco_seguro ?? full.parentesco_seguro ?? "").trim();
        setCondicion(condInit);
        setLastSavedCondicion(condInit);

        const isTitular = condInit.toUpperCase() === "TITULAR";
        const titInit = reg.titular_nombre ?? (isTitular ? nombreCompletoPaciente(full) : (full.titular_nombre ?? ""));
        setTitularNombre(titInit);
        setLastSavedTitular(titInit);
        
        if (reg.monto_a_pagar != null) {
          setMontoAPagar(Number(reg.monto_a_pagar));
        }

        if (isExistingAtencion) {
          defaultsApplyingRef.current = true;
          defaultsAppliedPlanIdRef.current = initialPlanId;
        }
      } catch (e) {
        if (cancelled) return;
        const msg = toUserFriendlyMessage(e, "No se pudo cargar la atención de emergencia.");
        setError(msg);
        toastService.showError(msg);
        setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [registroId, navState.registro]);

  React.useEffect(() => {
    if (!paciente) return;
    if ((condicion ?? "").trim().toUpperCase() !== "TITULAR") return;
    if (!fullName) return;
    setTitularNombre(fullName);
  }, [condicion, paciente, fullName]);

  React.useEffect(() => {
    let alive = true;

    const run = async () => {
      if (medicosOptionsCache.data) {
        setMedicosOptions(medicosOptionsCache.data);
        return;
      }

      if (!medicosOptionsCache.promise) {
        medicosOptionsCache.promise = api
          .get<{ data?: Array<{ id: number; codigo?: string; nombres?: string; apellido_paterno?: string; apellido_materno?: string }> }>(
            "/ficheros/medicos?status=ACTIVO&per_page=200&page=1"
          )
          .then((res) => {
            const arr = Array.isArray(res.data) ? res.data : [];
            const opts: SelectOption[] = arr.map((m) => {
              const code = (m.codigo ?? "").trim();
              const name = [m.apellido_paterno, m.apellido_materno, m.nombres].filter(Boolean).join(" ").trim();
              const label = code ? (name ? `${code} · ${name}` : code) : name || `Médico ${m.id}`;
              return { value: String(m.id), label };
            });
            medicosOptionsCache.data = opts;
            return opts;
          });
      }

      const opts = await medicosOptionsCache.promise;
      if (!alive) return;
      setMedicosOptions(opts);
    };

    void run();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!medicosOptions.length) return;
    const registroRaw = (registro?.medico_emergencia ?? "").trim();
    if (!registroRaw) {
      setMedicoTratanteId(null);
      return;
    }

    const registroCode = normalizeCodigoForMatch(medicoCodigoFromLabel(registroRaw));
    const optByCode = medicosOptions.find(
      (o) => normalizeCodigoForMatch(medicoCodigoFromLabel(o.label)) === registroCode
    );
    if (optByCode) {
      setMedicoTratanteId(Number(optByCode.value));
      return;
    }

    const registroNameRaw = registroRaw.includes("·")
      ? registroRaw.split("·").slice(1).join("·").trim()
      : registroRaw;
    const registroTokens = normalizePersonName(registroNameRaw)
      .split(" ")
      .map((t) => t.trim())
      .filter(Boolean);

    const optByName = medicosOptions.find((o) => {
      const optNameRaw = medicoNombreFromLabel(o.label);
      const optTokens = normalizePersonName(optNameRaw)
        .split(" ")
        .map((t) => t.trim())
        .filter(Boolean);
      if (!registroTokens.length || !optTokens.length) return false;
      return registroTokens.every((t) => optTokens.includes(t));
    });

    setMedicoTratanteId(optByName ? Number(optByName.value) : null);
  }, [medicosOptions, registro?.medico_emergencia]);

  React.useEffect(() => {
    const needsLookup = Boolean(tarifaId && tarifaDirectText == null);
    if (!needsLookup) return;

    if (tarifasOperativasCache.dataById) {
      setTarifasOperativasById(tarifasOperativasCache.dataById);
      return;
    }

    if (!tarifasOperativasCache.promise) {
      tarifasOperativasCache.promise = getTarifasOperativas().then((arr) => {
        const m = new Map<number, TarifaOperativaLite>();
        arr.forEach((t) => m.set(t.id, { codigo: String(t.codigo ?? ""), descripcion_tarifa: t.descripcion_tarifa }));
        tarifasOperativasCache.dataById = m;
        return m;
      });
    }

    let alive = true;
    void tarifasOperativasCache.promise
      .then((m) => {
        if (!alive) return;
        setTarifasOperativasById(m);
      })
      .catch((e) => {
        if (!alive) return;
        setTarifasOperativasById(new Map());
        toastService.showError(toUserFriendlyMessage(e, "No se pudieron cargar las tarifas operativas para la atención de emergencia."));
      });

    return () => {
      alive = false;
    };
  }, [tarifaId, tarifaDirectText]);

  const onActualizarDatos = React.useCallback(async () => {
    if (!paciente) return;
    if (!hasPendingDataChanges) return;

    const planChanged = pacientePlanId !== lastSavedPlanId;
    setSavingState("actualizar");
    try {
      if (planChanged) setLineas([]);

      const condChanged =
        (condicion ?? "").trim().toUpperCase() !== (lastSavedCondicion ?? "").trim().toUpperCase() ||
        (titularNombre ?? "").trim() !== (lastSavedTitular ?? "").trim();

      if (condChanged) {
        const rest = { ...paciente } as Record<string, unknown>;
        ["id", "hc", "nr", "created_at", "updated_at", "nombre_completo", "edad"].forEach((key) => {
          delete rest[key];
        });
        const payload: PacienteUpsertPayload = {
          ...(rest as PacienteUpsertPayload),
          parentesco_seguro: (condicion ?? "").trim() || null,
          titular_nombre: (titularNombre ?? "").trim() || null,
        };
        await updatePaciente(paciente.id, payload);
        setLastSavedCondicion(condicion);
        setLastSavedTitular(titularNombre);
      }

      if (planChanged) setLastSavedPlanId(pacientePlanId);
      toastService.showSuccess("Datos de la atención actualizados correctamente.");
    } catch (e) {
      const msg = toUserFriendlyMessage(e, "No se pudieron actualizar los datos del paciente para la atención de emergencia.");
      toastService.showError(msg);
      throw e;
    } finally {
      setSavingState(null);
    }
  }, [paciente, hasPendingDataChanges, pacientePlanId, lastSavedPlanId, condicion, lastSavedCondicion, titularNombre, lastSavedTitular]);

  const onGuardar = React.useCallback(async () => {
    if (!Number.isFinite(registroId)) return;
    if (!lineas.length) {
      toastService.showError("Agrega al menos un servicio final antes de guardar la atención de emergencia.");
      return;
    }
    if (pacientePlanId == null) {
      toastService.showError("Selecciona el tipo de cliente del paciente antes de guardar la atención de emergencia.");
      return;
    }

    setSavingState("guardar");
    try {
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

      const payload = {
        acudio_a_su_cita: true,
        hora_asistencia: horaAsistenciaDisplay ? horaAsistenciaDisplay : null,
        paciente_plan_id: pacientePlanId ?? null,
        parentesco_seguro: (condicion ?? "").trim() || null,
        titular_nombre: (titularNombre ?? "").trim() || null,
        monto_a_pagar: Math.round(montoAPagar * 10 ** PRECISION_DECIMAL) / 10 ** PRECISION_DECIMAL,
        servicios: serviciosPayload,
      };

      await guardarAtencionEmergencia(registroId, payload);
      toastService.showSuccess("Atención de emergencia guardada correctamente.");
      navigate("/emergencia/registro", { replace: true });
    } catch (e) {
      const msg = toUserFriendlyMessage(e, "No se pudo guardar la atención de emergencia.");
      toastService.showError(msg);
    } finally {
      setSavingState(null);
    }
  }, [registroId, horaAsistenciaDisplay, lineas, pacientePlanId, condicion, titularNombre, montoAPagar, navigate]);

  const onServiciosSelected = React.useCallback(
    (servicios: TarifaServicioBusqueda[]) => {
      if (!servicios.length || !tarifaId) return;

      const existingIds = new Set(lineas.map((l) => l.tarifa_servicio_id));
      const toAdd = servicios.filter((s) => !existingIds.has(s.id));
      const duplicateCount = servicios.length - toAdd.length;
      if (duplicateCount > 0) {
        const msg = duplicateCount === 1 ? "1 servicio ya está en la lista." : `${duplicateCount} servicios ya están en la lista.`;
        toastService.showWarning(msg);
      }
      if (!toAdd.length) return;

      const medicoId = medicoTratanteId ?? 0;
      const medicoOpt = medicosOptions.find((o) => o.value === String(medicoId));
      const medicoLabel = medicoOpt?.label ?? registro?.medico_emergencia ?? "";
      const codigoMedico = medicoCodigoFromLabel(medicoLabel) || medicoCodigoFallback || "";

      void getIgvPorcentaje()
        .then((igvPct) => {
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
              medico_codigo: codigoMedico || medicoLabel,
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
        })
        .catch((e) => {
          toastService.showError(toUserFriendlyMessage(e, "No se pudo cargar el porcentaje de IGV para calcular los servicios de emergencia."));
        });
    },
    [tarifaId, lineas, medicoTratanteId, medicosOptions, registro?.medico_emergencia, medicoCodigoFallback, copVarDefault, user]
  );

  React.useEffect(() => {
    if (!pacientePlanId || !tarifaId) return;
    if (!medicoTratanteId || medicoTratanteId <= 0) return;
    if (lineas.length > 0) return;
    if (defaultsAppliedPlanIdRef.current === pacientePlanId) return;
    if (defaultsApplyingRef.current) return;

    defaultsApplyingRef.current = true;

    let cancelled = false;
    const run = async () => {
      try {
        const horaReal = getHoraActual();
        const [codigosGlobal, codigosTarifa] = await Promise.all([
          listServiciosDefaultEmergenciaByTarifa(0).catch(() => [] as string[]),
          listServiciosDefaultEmergenciaByTarifa(tarifaId),
        ]);
        const codigosRaw = [...codigosGlobal, ...codigosTarifa];
        if (cancelled) return;

        const normalizeServicioCodigo = (c: string) => c.replace(/\./g, "").trim().toUpperCase();
        const maxDefaults = 30;
        const codigosOrdenados = codigosRaw
          .map((c) => c.trim())
          .filter(Boolean)
          .slice(0, maxDefaults);

        const codigosUnicos: string[] = [];
        const seen = new Set<string>();
        for (const c of codigosOrdenados) {
          const n = normalizeServicioCodigo(c);
          if (seen.has(n)) continue;
          seen.add(n);
          codigosUnicos.push(c);
        }

        const servicesToAdd: TarifaServicioBusqueda[] = [];
        const chunkSize = 4;
        for (let i = 0; i < codigosUnicos.length; i += chunkSize) {
          const chunk = codigosUnicos.slice(i, i + chunkSize);
          const results = await Promise.all(
            chunk.map(async (codigo) => {
              const res = await buscarServiciosTarifa(tarifaId, {
                page: 1,
                per_page: 25,
                codigo,
                status: "ACTIVO",
                hora: horaReal,
              });
              const found =
                res.data.find((s) => normalizeServicioCodigo(String(s.codigo ?? "")) === normalizeServicioCodigo(codigo)) ??
                res.data[0];
              return found ?? null;
            })
          );

          for (const found of results) {
            if (found) servicesToAdd.push(found);
          }
        }

        if (servicesToAdd.length) onServiciosSelected(servicesToAdd);
        if (!cancelled) defaultsAppliedPlanIdRef.current = pacientePlanId;
      } catch (e) {
        toastService.showWarning(toUserFriendlyMessage(e, "No se pudieron precargar los servicios por defecto de emergencia."));
      } finally {
        defaultsApplyingRef.current = false;
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [pacientePlanId, tarifaId, medicoTratanteId, lineas.length, onServiciosSelected]);

  const onRegresar = React.useCallback(() => {
    navigate("/emergencia/registro", { state: { returnFromAtencion: true, registroId } });
  }, [navigate, registroId]);

  const onCancelar = React.useCallback(() => {
    setPacientePlanId(lastSavedPlanId);
    setCondicion(lastSavedCondicion);
    setTitularNombre(lastSavedTitular);
  }, [lastSavedPlanId, lastSavedCondicion, lastSavedTitular]);

  if (loading) {
    return (
      <div className="flex min-h-50 flex-col items-center justify-center gap-3 rounded-lg border border-(--border-color-default) bg-(--color-surface) p-8">
        <div className="h-8 w-8 shrink-0 rounded-full border-2 border-(--color-primary) border-t-transparent animate-spin" aria-hidden />
        <span className="text-sm font-medium text-(--color-text-secondary)">Cargando atención de emergencia…</span>
      </div>
    );
  }

  if (error || !registro || !paciente) {
    return (
      <div className="flex flex-col gap-4 pb-4 p-4">
        <div className="rounded border border-(--color-danger) bg-(--color-surface) p-4 text-(--color-danger)">
          {error ?? "No se encontraron datos."}
        </div>
        <SecondaryButton onClick={onRegresar}>Regresar</SecondaryButton>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col space-y-4 lg:space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-2">
        <div className="w-full min-w-0 rounded border border-(--border-color-default) bg-(--color-panel-options-bg) px-4 py-3 lg:px-3 lg:py-2 sm:w-auto">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
              <span className="text-sm font-semibold text-(--color-text-primary) shrink-0">Cuenta:</span>
              <input
                value={formatCuentaConPrefijo("EM", registro.numero_cuenta ?? null)}
                readOnly
                className="min-w-0 flex-1 rounded border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-center text-base font-semibold tabular-nums text-(--color-text-primary) outline-none sm:w-48 sm:flex-none"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Acciones de la atención">
          <SecondaryButton onClick={onRegresar} title="Volver a la lista de registros de emergencia">
            Regresar
          </SecondaryButton>
          <SecondaryButton
            onClick={onCancelar}
            disabled={saving || !hasPendingDataChanges}
            title="Descartar cambios en tipo de cliente, condición y titular (restaurar últimos guardados)"
          >
            Cancelar
          </SecondaryButton>
          <SecondaryButton onClick={onActualizarDatos} disabled={saving || !hasPendingDataChanges} title="Guardar solo los datos del paciente (condición y titular)">
            {savingState === "actualizar" ? "Guardando…" : "Actualizar datos"}
          </SecondaryButton>
          <PrimaryButton onClick={onGuardar} disabled={saving || !canGuardarAtencion} title="Guardar la atención completa (asistencia, servicios y montos)">
            {savingState === "guardar" ? "Guardando…" : "Guardar atención"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
          <h2 className="text-sm font-semibold text-(--color-text-primary)">Datos del paciente</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:mt-2 lg:gap-2">
            <div>
              <label className="text-xs text-(--color-text-secondary)">N° de Historia</label>
              <input
                value={paciente.hc || "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-(--color-text-primary)">Tipo de cliente</label>
              <div className="mt-1 lg:mt-0.5">
                <SelectMenu
                  value={pacientePlanId != null ? String(pacientePlanId) : ""}
                  onChange={(v) => setPacientePlanId(v ? Number(v) : null)}
                  options={planOptions}
                  ariaLabel="Tipo de cliente"
                  buttonClassName="w-full h-10 rounded lg:h-8 lg:rounded"
                  menuClassName="min-w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Tarifario asignado</label>
              <input
                value={tarifaDescripcion ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Apellidos y nombres</label>
              <input
                value={paciente.nombre_completo ?? fullName ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Condición</label>
              <div className="mt-1 lg:mt-0.5">
                <SelectMenu
                  value={condicion}
                  onChange={(v) => setCondicion(v ?? "")}
                  options={CONDICION_OPTIONS as unknown as SelectOption[]}
                  ariaLabel="Condición"
                  buttonClassName="w-full h-10 rounded lg:h-8 lg:rounded"
                  menuClassName="min-w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Titular</label>
              <input
                value={titularNombre}
                onChange={(e) => setTitularNombre(e.target.value)}
                readOnly={(condicion ?? "").trim().toUpperCase() === "TITULAR"}
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) disabled:opacity-70 disabled:cursor-not-allowed lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Teléfono</label>
              <input
                value={paciente.telefono ?? paciente.celular ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">DNI</label>
              <input
                value={paciente.numero_documento ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
            <div>
              <label className="text-xs text-(--color-text-secondary)">Dirección</label>
              <input
                value={paciente.direccion ?? "—"}
                readOnly
                className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8"
              />
            </div>
          </div>
        </div>
      </div>

      <div ref={serviciosSectionRef}>
        <ServiciosSolicitadosSection
          medicoTratanteId={medicoTratanteId}
          medicoTratanteLabel={registro.medico_emergencia ?? ""}
          tarifaId={tarifaId}
          tarifaDescripcion={tarifaDescripcion}
          tarifaEsPrecioDirecto={tarifaEsPrecioDirecto}
          lineas={lineas}
          onLineasChange={setLineas}
          medicosOptions={medicosOptions}
          currentUsername={user?.username ?? ""}
          nav={{
            type: "emergencia",
            registroId,
            buscarPath: EMERGENCIA_BUSCAR_SERVICIOS_PATH,
            returnPath: `/emergencia/atencion/${registroId}`,
            draftStorageKey: `emergencia:atencionDraft:${registroId}`,
          }}
          hasPendingDataChanges={hasPendingDataChanges}
          onActualizarDatos={onActualizarDatos}
          pendingChangesMessage={pendingChangesMessage}
          onMontoAPagarChange={(monto) => setMontoAPagar(monto)}
          copVarDefault={copVarDefault}
          onCopVarDefaultChange={setCopVarDefault}
          onServiciosSelected={onServiciosSelected}
        />
      </div>
    </div>
  );
}

