import * as React from "react";
import type { SelectOption } from "../../../../../shared/ui/SelectMenu";
import type {
  AgendaCita,
  AgendaCitasPaginated,
  AgendaEspecialidadOption,
  AgendaMedicoOption,
  // AgendaOpciones,
  AgendaProgramacion,
  AgendaSlotsResponse,
  CitaAtencionEstado,
  PacienteAgenda,
} from "../types/agendaMedica.types";
import {
  anularAgendaCita,
  createAgendaCita,
  getAgendaInitData,
  getAgendaOpciones,
  getAgendaSlots,
  getPacienteAgenda,
  listAgendaCitas,
} from "../services/agendaMedica.service";
import type { AgendaInitData } from "../services/agendaMedica.service";
import { toUserFriendlyMessage } from "../../utils/userFriendlyError";
import { useToast } from "../../../../../shared/feedback";

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function medicoLabel(m: { nombres: string; apellido_paterno: string; apellido_materno: string }): string {
  return `${m.apellido_paterno} ${m.apellido_materno} ${m.nombres}`.trim();
}

export function useAgendaMedica() {
  const toast = useToast();
  const draftKeyRef = React.useRef("admision:agendaMedicaDraft");
  const draftLoadedRef = React.useRef(false);
  const draftReadyRef = React.useRef(false);
  const opcionesCacheRef = React.useRef<Record<string, AgendaMedicoOption[]>>({});
  /** Cache de init por fecha: al volver a una fecha ya visitada la carga es al instante. */
  const initDataCacheRef = React.useRef<Record<string, AgendaInitData>>({});
  /** Número de respuestas de slots para las que NO resetear contadores (vuelta de Buscar paciente; evita que un 2.º .then por Strict Mode limpie la Hora). */
  const preserveVisibleCountersRef = React.useRef(0);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());
  const selectedDateStr = React.useMemo(() => (selectedDate ? ymd(selectedDate) : ""), [selectedDate]);

  const [especialidadId, setEspecialidadId] = React.useState<number | null>(null);
  const [medicoId, setMedicoId] = React.useState<number | null>(null);

  const [especialidadesList, setEspecialidadesList] = React.useState<AgendaEspecialidadOption[]>([]);
  const [medicosList, setMedicosList] = React.useState<AgendaMedicoOption[]>([]);
  const [initLoading, setInitLoading] = React.useState(true);
  const [opcionesLoading, setOpcionesLoading] = React.useState(false);
  const [medicosLoading, setMedicosLoading] = React.useState(false);

  const [slots, setSlots] = React.useState<AgendaSlotsResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [reloadFlag, setReloadFlag] = React.useState(0);

  const [data, setData] = React.useState<AgendaCitasPaginated>({
    data: [],
    meta: { current_page: 1, per_page: 25, total: 0, last_page: 1 },
  });
  const [programacion, setProgramacion] = React.useState<AgendaProgramacion | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);
  const [estadoAtencionFilter, setEstadoAtencionFilter] = React.useState<"ALL" | CitaAtencionEstado>("ALL");

  const [formOpen, setFormOpen] = React.useState(false);
  const [hora, setHora] = React.useState("");
  const [orden, setOrden] = React.useState<number | null>(null);
  const [motivo, setMotivo] = React.useState("");
  const [observacion, setObservacion] = React.useState("");
  const [autorizacion, setAutorizacion] = React.useState("");
  const [iafaId, setIafaId] = React.useState<number | null>(null);
  const [paciente, setPaciente] = React.useState<PacienteAgenda | null>(null);
  const [pacienteLoading, setPacienteLoading] = React.useState(false);

  const [selectedCita, setSelectedCita] = React.useState<AgendaCita | null>(null);
  const [confirmEliminarOpen, setConfirmEliminarOpen] = React.useState(false);

  const saveDraft = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const payload = {
      selectedDateStr,
      especialidadId,
      medicoId,
      hora,
      motivo,
      observacion,
      autorizacion,
      iafaId,
      pacienteId: paciente?.id ?? null,
    };
    window.sessionStorage.setItem(draftKeyRef.current, JSON.stringify(payload));
  }, [
    selectedDateStr,
    especialidadId,
    medicoId,
    hora,
    motivo,
    observacion,
    autorizacion,
    iafaId,
    paciente,
  ]);

  React.useEffect(() => {
    if (!draftReadyRef.current) return;
    saveDraft();
  }, [saveDraft]);

  const [adicionalVisible, setAdicionalVisible] = React.useState(0);
  const [extraVisible, setExtraVisible] = React.useState(0);

  const especialidadOptions: SelectOption[] = React.useMemo(
    () => especialidadesList.map((e) => ({ value: String(e.id), label: `${e.codigo} · ${e.descripcion}` })),
    [especialidadesList]
  );
  const medicoOptions: SelectOption[] = React.useMemo(
    () => medicosList.map((m) => ({ value: String(m.id), label: medicoLabel(m) })),
    [medicosList]
  );

  const allSlots = React.useMemo(() => {
    if (!slots) return [];
    return [...slots.slots_base, ...slots.slots_adicional, ...slots.slots_extra];
  }, [slots]);

  const slotOrderMap = React.useMemo(() => {
    const map = new Map<string, number>();
    allSlots.forEach((t, idx) => map.set(t, idx + 1));
    return map;
  }, [allSlots]);

  const takenSet = React.useMemo(() => new Set(slots?.slots_tomados ?? []), [slots?.slots_tomados]);
  const baseAvailable = React.useMemo(
    () => (slots?.slots_base ?? []).filter((t) => !takenSet.has(t)),
    [slots?.slots_base, takenSet]
  );

  const additionalAvailable = React.useMemo(() => {
    const src = slots?.slots_adicional ?? [];
    return src.slice(0, adicionalVisible).filter((t) => !takenSet.has(t));
  }, [slots?.slots_adicional, adicionalVisible, takenSet]);

  const extraAvailable = React.useMemo(() => {
    const src = slots?.slots_extra ?? [];
    return src.slice(0, extraVisible).filter((t) => !takenSet.has(t));
  }, [slots?.slots_extra, extraVisible, takenSet]);

  const availableHoras = React.useMemo(() => {
    return [...baseAvailable, ...additionalAvailable, ...extraAvailable];
  }, [baseAvailable, additionalAvailable, extraAvailable]);

  const adicionalesTotal = slots?.adicionales ?? 0;
  const extrasTotal = slots?.extras ?? 0;
  const baseFull = slots ? baseAvailable.length === 0 : false;
  const canAddAdicional = baseFull && adicionalVisible < adicionalesTotal;
  const adicionalesAllTaken =
    adicionalesTotal === 0 ||
    (slots?.slots_adicional ?? []).every((h) => takenSet.has(h));
  const canAddExtra = baseFull && adicionalesAllTaken && extraVisible < extrasTotal;

  // Carga inicial consolidada: cache por fecha para respuesta al instante al volver a una fecha ya visitada.
  React.useEffect(() => {
    if (!selectedDateStr) {
      setEspecialidadesList([]);
      setMedicosList([]);
      setEspecialidadId(null);
      setMedicoId(null);
      setSlots(null);
      setProgramacion(null);
      setData({ data: [], meta: { current_page: 1, per_page: perPage, total: 0, last_page: 1 } });
      setInitLoading(false);
      return;
    }

    const useCache = reloadFlag === 0;
    const cached = useCache ? initDataCacheRef.current[selectedDateStr] : undefined;
    if (cached) {
      setEspecialidadesList(cached.opciones.especialidades);
      setMedicosList(cached.opciones.medicos);
      setEspecialidadId(cached.defaults.especialidad_id);
      setMedicoId(cached.defaults.medico_id);
      if (cached.defaults.especialidad_id != null) {
        opcionesCacheRef.current[`${selectedDateStr}|${cached.defaults.especialidad_id}`] = cached.opciones.medicos;
      }
      setSlots(cached.slots);
      setProgramacion(cached.programacion);
      if (cached.citas?.paginator) {
        const paginator = cached.citas.paginator as { data?: AgendaCita[]; current_page?: number; per_page?: number; total?: number; last_page?: number };
        setData({
          data: paginator.data ?? [],
          meta: {
            current_page: paginator.current_page ?? 1,
            per_page: paginator.per_page ?? perPage,
            total: paginator.total ?? 0,
            last_page: paginator.last_page ?? 1,
          },
        });
      } else {
        setData({ data: [], meta: { current_page: 1, per_page: perPage, total: 0, last_page: 1 } });
      }
      setInitLoading(false);
      setLoading(false);
      return;
    }

    setInitLoading(true);
    setLoading(true);
    getAgendaInitData(selectedDateStr)
      .then((res) => {
        const d = res.data;
        initDataCacheRef.current[selectedDateStr] = d;
        setEspecialidadesList(d.opciones.especialidades);
        setMedicosList(d.opciones.medicos);
        setEspecialidadId(d.defaults.especialidad_id);
        setMedicoId(d.defaults.medico_id);
        if (d.defaults.especialidad_id != null) {
          opcionesCacheRef.current[`${selectedDateStr}|${d.defaults.especialidad_id}`] = d.opciones.medicos;
        }
        setSlots(d.slots);
        setProgramacion(d.programacion);
        if (d.citas?.paginator) {
          const paginator = d.citas.paginator as any;
          setData({
            data: paginator.data ?? [],
            meta: {
              current_page: paginator.current_page ?? 1,
              per_page: paginator.per_page ?? perPage,
              total: paginator.total ?? 0,
              last_page: paginator.last_page ?? 1,
            },
          });
        } else {
          setData({ data: [], meta: { current_page: 1, per_page: perPage, total: 0, last_page: 1 } });
        }
      })
      .catch((e) => {
        toast.error(toUserFriendlyMessage(e, "No se pudo cargar la agenda."));
        delete initDataCacheRef.current[selectedDateStr];
        setEspecialidadesList([]);
        setMedicosList([]);
        setEspecialidadId(null);
        setMedicoId(null);
        setSlots(null);
        setProgramacion(null);
        setData({ data: [], meta: { current_page: 1, per_page: perPage, total: 0, last_page: 1 } });
      })
      .finally(() => {
        setInitLoading(false);
        setLoading(false); // Desactiva el spinner principal
      });
  }, [selectedDateStr, reloadFlag, perPage, toast]);

  // Cargar médicos cuando la especialidad cambia (con cache para respuesta al instante al volver)
  React.useEffect(() => {
    if (initLoading || !selectedDateStr || especialidadId === null) {
      return;
    }
    const cacheKey = `${selectedDateStr}|${especialidadId}`;
    const cached = opcionesCacheRef.current[cacheKey];
    if (cached !== undefined) {
      setMedicosList(cached);
      setMedicoId(cached[0]?.id ?? null);
      return;
    }
    setMedicosList([]);
    setMedicoId(null);
    setMedicosLoading(true);
    getAgendaOpciones({ fecha: selectedDateStr, especialidad_id: especialidadId })
      .then((data) => {
        opcionesCacheRef.current[cacheKey] = data.medicos;
        setMedicosList(data.medicos);
        setMedicoId(data.medicos[0]?.id ?? null);
      })
      .catch((e) => {
        toast.error(toUserFriendlyMessage(e, "No se pudieron cargar los médicos programados."));
        setMedicosList([]);
        setMedicoId(null);
      })
      .finally(() => setMedicosLoading(false));
  }, [selectedDateStr, especialidadId, initLoading, toast]);

  // Cargar slots y citas cuando el médico cambia MANUALMENTE
  React.useEffect(() => {
    if (initLoading || !selectedDateStr || !especialidadId || !medicoId) {
      setSlots(null);
      setProgramacion(null);
      setData({ data: [], meta: { current_page: 1, per_page: perPage, total: 0, last_page: 1 } });
      return;
    }

    setSlotsLoading(true);
    getAgendaSlots({ fecha: selectedDateStr, especialidad_id: especialidadId, medico_id: medicoId })
      .then((res) => {
        setSlots(res);
        setProgramacion(res.programacion ?? null);
      })
      .catch((e) => {
        toast.error(toUserFriendlyMessage(e, "No se pudieron cargar los horarios disponibles."));
        setSlots(null);
        setProgramacion(null);
      })
      .finally(() => setSlotsLoading(false));

    setLoading(true);
    listAgendaCitas({
      fecha: selectedDateStr,
      especialidad_id: especialidadId,
      medico_id: medicoId,
      estado_atencion: estadoAtencionFilter === "ALL" ? undefined : estadoAtencionFilter,
      page,
      per_page: perPage,
    })
      .then((res) => {
        setData(res.data);
        setProgramacion((p) => res.programacion ?? p);
      })
      .catch((e) => {
        toast.error(toUserFriendlyMessage(e, "No se pudieron cargar las citas."));
      })
      .finally(() => setLoading(false));
  }, [selectedDateStr, especialidadId, medicoId, estadoAtencionFilter, page, perPage, initLoading]);

  React.useEffect(() => {
    if (!initLoading) {
      setPage(1);
    }
  }, [selectedDateStr, especialidadId, medicoId, perPage, estadoAtencionFilter, initLoading]);

  const resetForm = React.useCallback(() => {
    setHora("");
    setOrden(null);
    setMotivo("");
    setObservacion("");
    setAutorizacion("");
    setIafaId(null);
    setPaciente(null);
    setAdicionalVisible(0);
    setExtraVisible(0);
  }, []);

  const clearDraft = React.useCallback(() => {
    resetForm();
  }, [resetForm]);

  const openForm = React.useCallback(() => {
    resetForm();
    setFormOpen(true);
  }, [resetForm]);

  const closeForm = React.useCallback(() => {
    setFormOpen(false);
  }, []);

  const onPickHora = React.useCallback(
    (value: string) => {
      setHora(value);
      setOrden(slotOrderMap.get(value) ?? null);
    },
    [slotOrderMap]
  );

  React.useEffect(() => {
    if (!hora) {
      setOrden(null);
      return;
    }
    setOrden(slotOrderMap.get(hora) ?? null);
  }, [hora, slotOrderMap]);

  const onAddAdicional = React.useCallback(() => {
    if (!canAddAdicional || !slots) return;
    const src = slots.slots_adicional ?? [];
    // El slot que estamos revelando es el que está en el índice actual de la lista completa
    // (no de la lista filtrada por no tomados), para evitar el bug del “segundo clic”.
    // Revelar hasta el siguiente slot disponible y seleccionarlo en un solo clic.
    let nextVisible = adicionalVisible + 1;
    while (nextVisible <= adicionalesTotal) {
      const slot = src[nextVisible - 1] ?? null;
      if (slot && !takenSet.has(slot)) {
        setAdicionalVisible(nextVisible);
        setHora(slot);
        setOrden(slotOrderMap.get(slot) ?? null);
        return;
      }
      nextVisible++;
    }
    setAdicionalVisible(adicionalesTotal);
  }, [canAddAdicional, adicionalesTotal, slots, takenSet, adicionalVisible, slotOrderMap]);

  const onAddExtra = React.useCallback(() => {
    if (!canAddExtra || !slots) return;
    const src = slots.slots_extra ?? [];
    let nextVisible = extraVisible + 1;
    while (nextVisible <= extrasTotal) {
      const slot = src[nextVisible - 1] ?? null;
      if (slot && !takenSet.has(slot)) {
        setExtraVisible(nextVisible);
        setHora(slot);
        setOrden(slotOrderMap.get(slot) ?? null);
        return;
      }
      nextVisible++;
    }
    setExtraVisible(extrasTotal);
  }, [canAddExtra, extrasTotal, slots, takenSet, extraVisible, slotOrderMap]);

  const onSelectPaciente = React.useCallback(async (id: number) => {
    setPacienteLoading(true);
    try {
      const p = await getPacienteAgenda(id);
      setPaciente(p);
      if (!iafaId && p.iafas.length > 0) {
        setIafaId(p.iafas[0].id);
      }
    } catch (e) {
      toast.error(toUserFriendlyMessage(e, "No se pudo cargar el paciente."));
    } finally {
      setPacienteLoading(false);
    }
  }, [iafaId, toast]);

  React.useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(draftKeyRef.current);
    if (!raw) {
      draftReadyRef.current = true;
      return;
    }
    try {
      const todayStr = ymd(new Date());
      const d = JSON.parse(raw) as {
        selectedDateStr?: string;
        especialidadId?: number | null;
        medicoId?: number | null;
        hora?: string;
        motivo?: string;
        observacion?: string;
        autorizacion?: string;
        iafaId?: number | null;
        pacienteId?: number | null;
      };
      if (d.selectedDateStr && d.selectedDateStr !== todayStr) {
        window.sessionStorage.removeItem(draftKeyRef.current);
        draftReadyRef.current = true;
        return;
      }
      if (d.selectedDateStr) {
        setSelectedDateStr(d.selectedDateStr);
      }
      if (typeof d.especialidadId === "number") setEspecialidadId(d.especialidadId);
      if (typeof d.medicoId === "number") setMedicoId(d.medicoId);
      if (d.hora) setHora(d.hora);
      if (d.motivo) setMotivo(d.motivo);
      if (d.observacion) setObservacion(d.observacion);
      if (d.autorizacion) setAutorizacion(d.autorizacion);
      if (typeof d.iafaId === "number") setIafaId(d.iafaId);
      if (typeof d.pacienteId === "number") {
        void onSelectPaciente(d.pacienteId);
      }
    } catch {
      window.sessionStorage.removeItem(draftKeyRef.current);
    } finally {
      draftReadyRef.current = true;
    }
  }, [onSelectPaciente]);

  const onAgendar = React.useCallback(async () => {
    if (!programacion || !hora || !paciente) return false;
    try {
      await createAgendaCita({
        programacion_medica_id: programacion.id,
        paciente_id: paciente.id,
        hora,
        motivo: motivo || undefined,
        observacion: observacion || undefined,
        autorizacion_siteds: autorizacion || undefined,
        iafa_id: iafaId ?? undefined,
      });
      toast.success("Cita agendada correctamente.");
      setFormOpen(false);
      setHora("");
      setOrden(null);
      setPaciente(null);
      setMotivo("");
      setObservacion("");
      setAutorizacion("");
      setIafaId(null);
      setAdicionalVisible(0);
      setExtraVisible(0);
      setReloadFlag((v) => v + 1);
      setPage(1);
      return true;
    } catch (e) {
      toast.error(toUserFriendlyMessage(e, "No se pudo agendar la cita."));
      return false;
    }
  }, [programacion, hora, paciente, motivo, observacion, autorizacion, iafaId, selectedDateStr, especialidadId, medicoId, toast]);

  const setSelectedDateStr = React.useCallback((value: string) => {
    const d = parseYmd(value);
    setSelectedDate(d);
  }, []);

  const requestEliminarCita = React.useCallback(() => {
    if (!selectedCita) return;
    setConfirmEliminarOpen(true);
  }, [selectedCita]);

  const onEliminarCitaConfirmed = React.useCallback(async () => {
    if (!selectedCita) return;
    setConfirmEliminarOpen(false);
    try {
      await anularAgendaCita(selectedCita.id);
      toast.success("Cita eliminada. La hora quedó libre para otra cita.");
      setSelectedCita(null);
      setReloadFlag((v) => v + 1);
    } catch (e) {
      toast.error(toUserFriendlyMessage(e, "No se pudo eliminar la cita."));
    }
  }, [selectedCita, toast]);

  return {
    selectedDate,
    selectedDateStr,
    setSelectedDate,
    setSelectedDateStr,
    especialidadId,
    setEspecialidadId,
    medicoId,
    setMedicoId,
    especialidadesList,
    medicosList,
    opcionesLoading,
    medicosLoading,
    initLoading,
    especialidadOptions,
    medicoOptions,
    slots,
    slotsLoading,
    data,
    loading,
    page,
    setPage,
    perPage,
    setPerPage,
    estadoAtencionFilter,
    setEstadoAtencionFilter,
    programacion,
    formOpen,
    openForm,
    closeForm,
    hora,
    orden,
    onPickHora,
    availableHoras,
    canAddAdicional,
    canAddExtra,
    onAddAdicional,
    onAddExtra,
    paciente,
    pacienteLoading,
    onSelectPaciente,
    motivo,
    setMotivo,
    observacion,
    setObservacion,
    autorizacion,
    setAutorizacion,
    iafaId,
    setIafaId,
    onAgendar,
    clearDraft,
    saveDraft,
    selectedCita,
    setSelectedCita,
    confirmEliminarOpen,
    setConfirmEliminarOpen,
    requestEliminarCita,
    onEliminarCitaConfirmed,
    /** Refresca slots al entrar en Nueva cita (sin paciente_id). No preserva contadores para que se aplique la lógica de Adicional/Extra agotados. */
    refetchSlotsForNuevaCita: React.useCallback(() => setReloadFlag((v) => v + 1), []),
  };
}
