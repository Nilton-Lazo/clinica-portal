import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { useAuth } from "../../../../../shared/auth/useAuth";
import { api } from "../../../../../shared/api";
import { getAtencionCitaData, getIgvPorcentaje, guardarAtencionCita } from "../services/atencionCita.service";
import type { TarifaServicioBusqueda } from "../services/atencionCita.service";
import type {
  AtencionCitaData,
  AtencionCitaStorePayload,
  AtencionServicioItem,
  AtencionServicioLinea,
  AtencionServicioLineaDisplay,
  PrecargaServicioItem,
} from "../types/atencionCita.types";
import { toApiError } from "../../../../../shared/api/apiError";
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
    medico_codigo: item.medico_codigo,
    user_nombre: item.user_nombre,
  };
}

const TARIFAS_PRECIO_DIRECTO = ["Particular", "Privado"];

function esPrecioDirecto(tarifaDescripcion: string | null): boolean {
  if (!tarifaDescripcion) return false;
  const n = tarifaDescripcion.trim();
  return TARIFAS_PRECIO_DIRECTO.some((t) => t.toLowerCase() === n.toLowerCase());
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

export default function AtencionCitaPage() {
  const { citaId } = useParams<"citaId">();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const id = citaId ? parseInt(citaId, 10) : NaN;

  const [data, setData] = React.useState<AtencionCitaData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [lineas, setLineas] = React.useState<AtencionServicioLineaDisplay[]>([]);
  const [precargaServicios, setPrecargaServicios] = React.useState<PrecargaServicioItem[]>([]);
  const [medicosOptions, setMedicosOptions] = React.useState<SelectOption[]>([]);

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

  const formatHoraLocal = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  React.useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("ID de cita inválido");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getAtencionCitaData(id)
      .then((res) => {
        setData(res);
        setParentescoSeguro(res.paciente.parentesco_seguro ?? res.atencion?.parentesco_seguro ?? "");
        setTitularNombre(res.paciente.titular_nombre ?? res.atencion?.titular_nombre ?? "");
        setAcudio(Boolean(res.atencion?.hora_asistencia));
        setHoraAsistenciaDisplay(res.atencion?.hora_asistencia?.slice(0, 5) ?? "");
        const planId = res.atencion?.paciente_plan_id ?? (res.planes[0]?.id ?? null);
        setPacientePlanId(planId);
        setLastSavedPlanId(planId);
        setLastSavedParentesco(res.paciente.parentesco_seguro ?? res.atencion?.parentesco_seguro ?? "");
        setLastSavedTitular(res.paciente.titular_nombre ?? res.atencion?.titular_nombre ?? "");
        setControlPrePostNatal(Boolean(res.atencion?.control_pre_post_natal));
        setControlNinoSano(Boolean(res.atencion?.control_nino_sano));
        setChequeo(Boolean(res.atencion?.chequeo));
        setCarencia(Boolean(res.atencion?.carencia));
        setLatencia(Boolean(res.atencion?.latencia));
        setLineas((res.servicios ?? []).map(mapServicioToDisplay));
      })
      .catch((e) => {
        const err = toApiError(e);
        setError(err.message);
      })
      .finally(() => setLoading(false));
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

  const serviciosSectionRef = React.useRef<HTMLDivElement | null>(null);
  const processedServiciosRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const st = (location.state ?? {}) as {
      selectedServicios?: TarifaServicioBusqueda[];
      returnLineas?: AtencionServicioLineaDisplay[];
      returnPrecarga?: PrecargaServicioItem[];
      scrollToServicios?: boolean;
    };
    const servs = st.selectedServicios;
    const restoreLineas = st.returnLineas;
    const restorePrecarga = st.returnPrecarga;
    const scrollTo = st.scrollToServicios;

    if (scrollTo && serviciosSectionRef.current) {
      requestAnimationFrame(() => {
        serviciosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navigate(location.pathname, { replace: true, state: { ...st, scrollToServicios: false } });
    }

    if (restoreLineas != null) setLineas(restoreLineas);
    if (restorePrecarga != null) setPrecargaServicios(restorePrecarga);

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
      const tarifaDesc = tarifaActual;
      const nuevas: PrecargaServicioItem[] = servs.map((s) => {
        const precioBase = parseFloat(String(s.precio_sin_igv)) || 0;
        const base = esPrecioDirecto(tarifaDesc) ? precioBase : precioBase;
        const { precioSinIgv, precioConIgv } = calcularPrecios(base, 1, 0, 0, igvPct);
        return {
          tarifa_servicio_id: s.id,
          servicio_codigo: s.codigo ?? "",
          servicio_descripcion: s.descripcion ?? "",
          cop_var: 0,
          cop_fijo: 0,
          descuento_pct: 0,
          aumento_pct: 0,
          cantidad: 1,
          precio_sin_igv: precioSinIgv,
          precio_con_igv: precioConIgv,
          medico_id: medicoId,
          medico_codigo: codigoMedico || medicoNombre,
          medico_nombre: medicoNombre,
        };
      });
      setPrecargaServicios((prev) => [...(restorePrecarga ?? prev), ...nuevas]);
      if (restoreLineas != null) setLineas(restoreLineas);
      processedServiciosRef.current = null;
    });
  }, [location.state, location.pathname, navigate, data, medicosOptions, tarifaActual, user]);

  React.useEffect(() => {
    api
      .get<{ data?: Array<{ id: number; codigo?: string; nombres?: string; apellido_paterno?: string; apellido_materno?: string }> }>(
        "/admision/ficheros/medicos?status=ACTIVO&per_page=200&page=1"
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
    navigate("/admision/citas/agenda");
  }, [navigate]);

  const onAcudioChange = React.useCallback((checked: boolean) => {
    setAcudio(checked);
    if (checked) setHoraAsistenciaDisplay(formatHoraLocal());
    else setHoraAsistenciaDisplay("");
  }, []);

  const hasPendingDataChanges =
    pacientePlanId !== lastSavedPlanId ||
    (parentescoSeguro ?? "") !== lastSavedParentesco ||
    (titularNombre ?? "") !== lastSavedTitular;

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
    setLineas((res.servicios ?? []).map(mapServicioToDisplay));
  }, []);

  const onGuardar = React.useCallback(async () => {
    if (!Number.isFinite(id)) return;
    setSaving(true);
    const soloActualizarDatos = hasPendingDataChanges;
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
    }));

    const payload: AtencionCitaStorePayload = {
      ...(soloActualizarDatos && { solo_actualizar_datos: true }),
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
      servicios: serviciosPayload,
    };
    try {
      const res = await guardarAtencionCita(id, payload);
      actualizarGuardado(res);
    } catch (e) {
      const err = toApiError(e);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [id, hasPendingDataChanges, acudio, horaAsistenciaDisplay, pacientePlanId, parentescoSeguro, titularNombre, controlPrePostNatal, controlNinoSano, chequeo, carencia, latencia, lineas, actualizarGuardado]);

  const onActualizarDatos = React.useCallback(async () => {
    if (!Number.isFinite(id) || !hasPendingDataChanges) return;
    setSaving(true);
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
      servicios: serviciosPayload,
    };
    try {
      const res = await guardarAtencionCita(id, payload);
      actualizarGuardado(res);
    } catch (e) {
      const err = toApiError(e);
      setError(err.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }, [id, hasPendingDataChanges, acudio, horaAsistenciaDisplay, pacientePlanId, parentescoSeguro, titularNombre, controlPrePostNatal, controlNinoSano, chequeo, carencia, latencia, lineas, actualizarGuardado]);

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
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-8">
        <span className="text-sm text-(--color-text-secondary)">Cargando atención de cita…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4 pb-4">
        <div className="rounded-2xl border border-(--color-danger) bg-(--color-surface) p-4 text-(--color-danger)">
          {error ?? "No se encontraron datos."}
        </div>
        <SecondaryButton onClick={onRegresar}>Regresar a la agenda</SecondaryButton>
      </div>
    );
  }

  const { cita, programacion, paciente } = data;
  const fechaDisplay = cita.fecha ? cita.fecha.split("-").reverse().join("/") : "—";
  const nroCuenta = cita.cuenta ?? data.atencion?.nro_cuenta ?? "";

  return (
    <div className="flex w-full min-w-0 flex-col space-y-4">
      {/* Barra superior: motivo y N° de cuenta destacados, botones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full min-w-0 rounded-2xl border border-(--border-color-default) bg-(--color-panel-options-bg) px-4 py-3 sm:w-auto">
          {/* En móvil: dos filas (flex-col). En escritorio (sm+): una fila, contenedor al ancho del contenido */}
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {cita.motivo ? (
              <span className="text-base font-bold text-(--color-danger) shrink-0">{cita.motivo}</span>
            ) : null}
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
              <span className="text-sm font-semibold text-(--color-text-primary) shrink-0">N° de cuenta:</span>
              <input
                value={nroCuenta || "—"}
                readOnly
                className="min-w-0 flex-1 rounded-lg border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-base font-semibold tabular-nums text-(--color-text-primary) outline-none sm:w-48 sm:flex-none"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={onRegresar}>Regresar</SecondaryButton>
          <SecondaryButton
            onClick={() => {
              setPacientePlanId(lastSavedPlanId);
              setParentescoSeguro(lastSavedParentesco);
              setTitularNombre(lastSavedTitular);
            }}
            disabled={!hasPendingDataChanges}
          >
            Cancelar
          </SecondaryButton>
          <PrimaryButton onClick={onGuardar} disabled={saving}>
            {saving ? "Guardando…" : hasPendingDataChanges ? "Actualizar datos" : "Guardar atención"}
          </PrimaryButton>
        </div>
      </div>
      <p className="text-xs text-(--color-text-secondary)">
        {hasPendingDataChanges ? (
          <>
            Hay cambios en plan, condición o titular, guarde primero los datos con <strong>Actualizar datos</strong> y luego podrá <strong>Guardar atención</strong>.
          </>
        ) : (
          <>
            Los cambios en plan, condición y titular se guardan al hacer clic en <strong>Actualizar datos</strong>.
          </>
        )}
      </p>

      {/* Sección: Datos de la cita */}
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
        <h2 className="text-sm font-semibold text-(--color-text-primary)">Datos de la cita</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs text-(--color-text-secondary)">Fecha</label>
            <input
              value={fechaDisplay}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Hora aproximada</label>
            <input
              value={cita.hora ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">N° de orden</label>
            <input
              value={String(cita.orden)}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="block min-h-5 text-xs leading-normal text-(--color-text-secondary)">
              <span className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={acudio}
                  onChange={(e) => onAcudioChange(e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border border-(--border-color-default)"
                />
                Hora de atención
              </span>
            </label>
            <input
              value={acudio ? horaAsistenciaDisplay : ""}
              readOnly
              placeholder=""
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm tabular-nums text-(--color-text-primary) outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sección: Servicio y médico */}
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
        <h2 className="text-sm font-semibold text-(--color-text-primary)">Servicio y médico</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs text-(--color-text-secondary)">Servicio solicitado</label>
            <input
              value={programacion?.especialidad?.descripcion ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Médico tratante</label>
            <input
              value={formatMedico(programacion?.medico ?? null)}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">N° de Historia Clínica</label>
            <input
              value={paciente.numero_documento ?? paciente.nr ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Consultorio</label>
            <input
              value={programacion?.consultorio ? `${programacion.consultorio.abreviatura} · ${programacion.consultorio.descripcion}` : "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Tarifario asignado</label>
            <input
              value={tarifaActual ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">N° de Referencia</label>
            <input
              value={paciente.nr ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sección: Datos del paciente (editables: plan, parentesco, titular) */}
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
        <h2 className="text-sm font-semibold text-(--color-text-primary)">Datos del paciente</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-(--color-text-primary)">Seleccione el plan</label>
            <div className="mt-1">
              <SelectMenu
                value={pacientePlanId != null ? String(pacientePlanId) : ""}
                onChange={(v) => setPacientePlanId(v ? Number(v) : null)}
                options={planOptions}
                ariaLabel="Plan"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Condición</label>
            <div className="mt-1">
              <SelectMenu
                value={parentescoSeguro}
                onChange={setParentescoSeguro}
                options={[{ value: "", label: "Seleccione condición" }, ...PARENTESCO_OPTIONS]}
                ariaLabel="Parentesco seguro"
                buttonClassName="w-full"
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
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary) disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">N° Autorización SITEDS</label>
            <input
              value={cita.autorizacion_siteds ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Apellidos y nombres</label>
            <input
              value={paciente.apellidos_nombres}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Sexo</label>
            <input
              value={paciente.sexo ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">Edad</label>
            <input
              value={paciente.edad != null ? String(paciente.edad) : "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-(--color-text-secondary)">N° de Teléfono móvil</label>
            <input
              value={paciente.celular ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-(--color-text-secondary)">Correo electrónico</label>
            <input
              value={paciente.email ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-(--color-text-secondary)">N° de Teléfono fijo</label>
            <input
              value={paciente.telefono ?? "—"}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sección: Indicadores de atención */}
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
        <h2 className="text-sm font-semibold text-(--color-text-primary)">Indicadores de atención</h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 lg:flex-nowrap lg:gap-4">
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

      {/* Sección: Servicios solicitados */}
      <div ref={serviciosSectionRef}>
      <ServiciosSolicitadosSection
        medicoTratanteId={data.programacion?.medico?.id ?? null}
        medicoTratanteLabel={
          medicosOptions.find((o) => o.value === String(data.programacion?.medico?.id ?? ""))?.label ?? formatMedico(data.programacion?.medico ?? null)
        }
        tarifaId={tarifaId}
        tarifaDescripcion={tarifaActual}
        precargaServicios={precargaServicios}
        onPrecargaChange={setPrecargaServicios}
        lineas={lineas}
        onLineasChange={setLineas}
        medicosOptions={medicosOptions}
        currentUsername={user?.username ?? ""}
        citaId={id}
        hasPendingDataChanges={hasPendingDataChanges}
        onActualizarDatos={onActualizarDatos}
        pendingChangesMessage={pendingChangesMessage}
      />
      </div>
    </div>
  );
}
