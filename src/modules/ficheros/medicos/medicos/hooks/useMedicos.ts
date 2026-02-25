import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  EspecialidadLookup,
  Medico,
  PaginatedResponse,
  RecordStatus,
  TipoProfesionalClinica,
} from "../../types/medicos.types";

import {
  createMedico,
  deactivateMedico,
  listEspecialidadesLookup,
  listMedicos,
  updateMedico,
  getNextMedicoCodigo,
} from "../../services/medicos.service";

import { useDebouncedValue } from "../../../../../shared/hooks/useDebouncedValue";
import type { ApiError } from "../../../../../shared/api/apiError";

export type Mode = "new" | "edit";
export type StatusFilter = "ALL" | RecordStatus;
export type Notice = { type: "success" | "error"; text: string } | null;

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

function isApiError(e: unknown): e is ApiError {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return typeof x.kind === "string" && typeof x.message === "string";
}

function toNullIfBlank(s: string): string | null {
  const x = s.trim();
  return x ? x : null;
}

function toIntNonNegFromString(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  const n = Number(t);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function isEmail(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function normalizeDateForInput(s: string | null | undefined): string {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length >= 10 ? t.slice(0, 10) : "";
}

function isDateIso(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(t);
}

function isRuc(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  return /^[0-9]{11}$/.test(t);
}

function fullName(m: { apellido_paterno: string; apellido_materno: string; nombres: string }): string {
  const ap = (m.apellido_paterno ?? "").trim();
  const am = (m.apellido_materno ?? "").trim();
  const n = (m.nombres ?? "").trim();
  return `${ap} ${am}, ${n}`.trim();
}

export function useMedicos() {
  const [data, setData] = useState<PaginatedResponse<Medico>>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(50);

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [especialidades, setEspecialidades] = useState<EspecialidadLookup[]>([]);
  const [especialidadesLoading, setEspecialidadesLoading] = useState(false);

  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<Medico | null>(null);

  // codigo solo visual: en new = preview, en edit = selected.codigo
  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [cmp, setCmp] = useState("");
  const [rne, setRne] = useState("");
  const [dni, setDni] = useState("");

  const [tipoProfesional, setTipoProfesional] = useState<TipoProfesionalClinica>("STAFF");

  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");

  const [especialidadId, setEspecialidadId] = useState<number>(0);

  const [telefono, setTelefono] = useState("");
  const [telefono2, setTelefono2] = useState("");
  const [email, setEmail] = useState("");

  const [direccion, setDireccion] = useState("");
  const [centroTrabajo, setCentroTrabajo] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const [ruc, setRuc] = useState("");

  const [adicionales, setAdicionales] = useState("0");
  const [extras, setExtras] = useState("0");
  const [tiempoPromedio, setTiempoPromedio] = useState("0");

  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    cmp: string | null;
    rne: string | null;
    dni: string | null;

    tipoProfesional: TipoProfesionalClinica;

    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;

    especialidadId: number;

    telefono: string | null;
    telefono2: string | null;
    email: string | null;

    direccion: string | null;
    centroTrabajo: string | null;
    fechaNacimiento: string | null;

    ruc: string | null;

    adicionales: number;
    extras: number;
    tiempoPromedio: number;

    estado: RecordStatus;
  } | null>(null);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextMedicoCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setEspecialidadesLoading(true);

      try {
        const res = await listEspecialidadesLookup();
        if (!alive) return;
        setEspecialidades(res);
      } catch {
        if (!alive) return;
        setEspecialidades([]);
      } finally {
        if (alive) setEspecialidadesLoading(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (mode === "new") void fetchCodigoPreview();
  }, [mode, fetchCodigoPreview]);

  const isValid = useMemo(() => {
    // OJO: codigo NO se valida (backend lo genera)
    if (!nombres.trim() || nombres.trim().length > 120) return false;
    if (!apellidoPaterno.trim() || apellidoPaterno.trim().length > 120) return false;
    if (!apellidoMaterno.trim() || apellidoMaterno.trim().length > 120) return false;

    if (!especialidadId || especialidadId <= 0) return false;

    if (cmp.trim().length > 20) return false;
    if (rne.trim().length > 20) return false;
    if (dni.trim().length > 20) return false;

    if (direccion.trim().length > 255) return false;
    if (centroTrabajo.trim().length > 255) return false;

    if (telefono.trim().length > 30) return false;
    if (telefono2.trim().length > 30) return false;

    if (email.trim().length > 255) return false;
    if (!isEmail(email)) return false;

    if (!isDateIso(fechaNacimiento)) return false;
    if (!isRuc(ruc)) return false;

    const a = toIntNonNegFromString(adicionales);
    const e = toIntNonNegFromString(extras);
    const t = toIntNonNegFromString(tiempoPromedio);

    if (a < 0 || e < 0 || t < 0) return false;

    return true;
  }, [
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    especialidadId,
    cmp,
    rne,
    dni,
    direccion,
    centroTrabajo,
    telefono,
    telefono2,
    email,
    fechaNacimiento,
    ruc,
    adicionales,
    extras,
    tiempoPromedio,
  ]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    return (
      o.cmp !== toNullIfBlank(cmp) ||
      o.rne !== toNullIfBlank(rne) ||
      o.dni !== toNullIfBlank(dni) ||
      o.tipoProfesional !== tipoProfesional ||
      o.nombres !== nombres.trim() ||
      o.apellidoPaterno !== apellidoPaterno.trim() ||
      o.apellidoMaterno !== apellidoMaterno.trim() ||
      o.especialidadId !== especialidadId ||
      o.telefono !== toNullIfBlank(telefono) ||
      o.telefono2 !== toNullIfBlank(telefono2) ||
      o.email !== toNullIfBlank(email) ||
      o.direccion !== toNullIfBlank(direccion) ||
      o.centroTrabajo !== toNullIfBlank(centroTrabajo) ||
      o.fechaNacimiento !== toNullIfBlank(fechaNacimiento) ||
      o.ruc !== toNullIfBlank(ruc) ||
      o.adicionales !== toIntNonNegFromString(adicionales) ||
      o.extras !== toIntNonNegFromString(extras) ||
      o.tiempoPromedio !== toIntNonNegFromString(tiempoPromedio) ||
      o.estado !== estado
    );
  }, [
    mode,
    isValid,
    cmp,
    rne,
    dni,
    tipoProfesional,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    especialidadId,
    telefono,
    telefono2,
    email,
    direccion,
    centroTrabajo,
    fechaNacimiento,
    ruc,
    adicionales,
    extras,
    tiempoPromedio,
    estado,
  ]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setCmp("");
    setRne("");
    setDni("");

    setTipoProfesional("STAFF");

    setNombres("");
    setApellidoPaterno("");
    setApellidoMaterno("");

    setEspecialidadId(0);

    setTelefono("");
    setTelefono2("");
    setEmail("");

    setDireccion("");
    setCentroTrabajo("");
    setFechaNacimiento("");

    setRuc("");

    setAdicionales("0");
    setExtras("0");
    setTiempoPromedio("0");

    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: Medico) => {
    const fn = normalizeDateForInput(x.fecha_nacimiento ?? null);

    setMode("edit");
    setSelected(x);

    setCmp(x.cmp ?? "");
    setRne(x.rne ?? "");
    setDni(x.dni ?? "");

    setTipoProfesional(x.tipo_profesional_clinica);

    setNombres(x.nombres);
    setApellidoPaterno(x.apellido_paterno);
    setApellidoMaterno(x.apellido_materno);

    setEspecialidadId(x.especialidad_id);

    setTelefono(x.telefono ?? "");
    setTelefono2(x.telefono_02 ?? "");
    setEmail(x.email ?? "");

    setDireccion(x.direccion ?? "");
    setCentroTrabajo(x.centro_trabajo ?? "");
    setFechaNacimiento(fn);

    setRuc(x.ruc ?? "");

    setAdicionales(String(x.adicionales ?? 0));
    setExtras(String(x.extras ?? 0));
    setTiempoPromedio(String(x.tiempo_promedio_por_paciente ?? 0));

    setEstado(x.estado);

    originalRef.current = {
      cmp: x.cmp ?? null,
      rne: x.rne ?? null,
      dni: x.dni ?? null,

      tipoProfesional: x.tipo_profesional_clinica,

      nombres: x.nombres,
      apellidoPaterno: x.apellido_paterno,
      apellidoMaterno: x.apellido_materno,

      especialidadId: x.especialidad_id,

      telefono: x.telefono ?? null,
      telefono2: x.telefono_02 ?? null,
      email: x.email ?? null,

      direccion: x.direccion ?? null,
      centroTrabajo: x.centro_trabajo ?? null,
      fechaNacimiento: fn ? fn : null,

      ruc: x.ruc ?? null,

      adicionales: x.adicionales ?? 0,
      extras: x.extras ?? 0,
      tiempoPromedio: x.tiempo_promedio_por_paciente ?? 0,

      estado: x.estado,
    };

    setNotice(null);
  }, []);

  const cancel = useCallback(() => {
    if (mode === "new") {
      resetToNew();
      return;
    }

    const o = originalRef.current;
    if (!o || !selected) {
      resetToNew();
      return;
    }

    setCmp(o.cmp ?? "");
    setRne(o.rne ?? "");
    setDni(o.dni ?? "");

    setTipoProfesional(o.tipoProfesional);

    setNombres(o.nombres);
    setApellidoPaterno(o.apellidoPaterno);
    setApellidoMaterno(o.apellidoMaterno);

    setEspecialidadId(o.especialidadId);

    setTelefono(o.telefono ?? "");
    setTelefono2(o.telefono2 ?? "");
    setEmail(o.email ?? "");

    setDireccion(o.direccion ?? "");
    setCentroTrabajo(o.centroTrabajo ?? "");
    setFechaNacimiento(o.fechaNacimiento ?? "");

    setRuc(o.ruc ?? "");

    setAdicionales(String(o.adicionales));
    setExtras(String(o.extras));
    setTiempoPromedio(String(o.tiempoPromedio));

    setEstado(o.estado);

    setNotice(null);
  }, [mode, resetToNew, selected]);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      try {
        const res = await listMedicos({
          page: targetPage,
          per_page: targetPerPage,
          q: qDebounced.trim() ? qDebounced.trim() : undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });
        setData(res);
      } catch (e) {
        const msg = isApiError(e) ? e.message : "No se pudo cargar la lista.";
        setNotice({ type: "error", text: msg });
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, qDebounced, statusFilter]
  );

  const prevFiltersRef = useRef<{ q: string; status: StatusFilter; perPage: number } | null>(null);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qDebounced, status: statusFilter, perPage };

    const filtersChanged =
      !prev || prev.q !== next.q || prev.status !== next.status || prev.perPage !== next.perPage;

    prevFiltersRef.current = next;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    void refresh();
  }, [page, perPage, qDebounced, statusFilter, refresh]);

  const onSave = useCallback(async () => {
    setNotice(null);

    if (!isValid) {
      setNotice({ type: "error", text: "Datos inválidos." });
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona un registro para editar." });
      return;
    }

    if (!isDirty) {
      setNotice({ type: "error", text: "No hay cambios para guardar." });
      return;
    }

    // OJO: NO enviamos codigo
    const payloadBase = {
      cmp: toNullIfBlank(cmp),
      rne: toNullIfBlank(rne),
      dni: toNullIfBlank(dni),

      tipo_profesional_clinica: tipoProfesional,

      nombres: nombres.trim(),
      apellido_paterno: apellidoPaterno.trim(),
      apellido_materno: apellidoMaterno.trim(),

      direccion: toNullIfBlank(direccion),
      centro_trabajo: toNullIfBlank(centroTrabajo),
      fecha_nacimiento: toNullIfBlank(fechaNacimiento),

      ruc: toNullIfBlank(ruc),

      especialidad_id: especialidadId,

      telefono: toNullIfBlank(telefono),
      telefono_02: toNullIfBlank(telefono2),
      email: toNullIfBlank(email),

      adicionales: toIntNonNegFromString(adicionales),
      extras: toIntNonNegFromString(extras),
      tiempo_promedio_por_paciente: toIntNonNegFromString(tiempoPromedio),
    };

    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createMedico({
          ...payloadBase,
          estado,
        });

        setNotice({ type: "success", text: "Médico creado." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateMedico(selected!.id, {
        ...payloadBase,
        estado,
      });

      setNotice({ type: "success", text: "Cambios guardados." });
      await refresh();

      // esto deja isDirty=false y el botón se deshabilita
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar.";
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [
    isValid,
    mode,
    selected,
    isDirty,
    cmp,
    rne,
    dni,
    tipoProfesional,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    direccion,
    centroTrabajo,
    fechaNacimiento,
    ruc,
    especialidadId,
    telefono,
    telefono2,
    email,
    adicionales,
    extras,
    tiempoPromedio,
    estado,
    refresh,
    loadForEdit,
  ]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona un registro para desactivar." });
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona un registro para desactivar." });
      return;
    }

    setSaving(true);
    try {
      const res = await deactivateMedico(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Médico desactivado." });

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [loadForEdit, refresh, selected]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO" && !saving;

  const selectedFullName = useMemo(() => {
    if (!selected) return "";
    return fullName(selected);
  }, [selected]);

  return {
    data,
    loading,
    saving,
    notice,

    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPageState(clampPerPage(n)),
    q,
    setQ,
    statusFilter,
    setStatusFilter,

    especialidades,
    especialidadesLoading,

    mode,
    selected,
    selectedFullName,

    // solo visual
    codigo,

    cmp,
    setCmp,
    rne,
    setRne,
    dni,
    setDni,

    tipoProfesional,
    setTipoProfesional,

    nombres,
    setNombres,
    apellidoPaterno,
    setApellidoPaterno,
    apellidoMaterno,
    setApellidoMaterno,

    especialidadId,
    setEspecialidadId,

    telefono,
    setTelefono,
    telefono2,
    setTelefono2,
    email,
    setEmail,

    direccion,
    setDireccion,
    centroTrabajo,
    setCentroTrabajo,
    fechaNacimiento,
    setFechaNacimiento,

    ruc,
    setRuc,

    adicionales,
    setAdicionales,
    extras,
    setExtras,
    tiempoPromedio,
    setTiempoPromedio,

    estado,
    setEstado,

    isValid,
    isDirty,
    canDeactivate,

    resetToNew,
    loadForEdit,
    cancel,
    onSave,
    requestDeactivate,

    confirmDeactivateOpen,
    setConfirmDeactivateOpen,
    onDeactivateConfirmed,
  };
}
