import * as React from "react";
import type { SelectOption } from "../../../../../shared/ui/SelectMenu";
import type {
  AgendaCita,
  AgendaCitasPaginated,
  AgendaEspecialidadOption,
  AgendaMedicoOption,
  AgendaOpciones,
  AgendaProgramacion,
  AgendaSlotsResponse,
  PacienteAgenda,
} from "../types/agendaMedica.types";
import {
  createAgendaCita,
  getAgendaOpciones,
  getAgendaSlots,
  getPacienteAgenda,
  listAgendaCitas,
} from "../services/agendaMedica.service";
import { toApiError } from "../../../../../shared/api/apiError";

type Notice = { type: "success" | "error"; text: string } | null;

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
  const [notice, setNotice] = React.useState<Notice>(null);
  const noticeTimerRef = React.useRef<number | null>(null);
  const clearNotice = React.useCallback(() => setNotice(null), []);
  const draftKeyRef = React.useRef("admision:agendaMedicaDraft");
  const draftLoadedRef = React.useRef(false);
  const draftReadyRef = React.useRef(false);
  /** Número de respuestas de slots para las que NO resetear contadores (vuelta de Buscar paciente; evita que un 2.º .then por Strict Mode limpie la Hora). */
  const preserveVisibleCountersRef = React.useRef(0);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const selectedDateStr = React.useMemo(() => (selectedDate ? ymd(selectedDate) : ""), [selectedDate]);

  const [especialidadId, setEspecialidadId] = React.useState<number | null>(null);
  const [medicoId, setMedicoId] = React.useState<number | null>(null);

  const [especialidadesList, setEspecialidadesList] = React.useState<AgendaEspecialidadOption[]>([]);
  const [medicosList, setMedicosList] = React.useState<AgendaMedicoOption[]>([]);
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

  const [formOpen, setFormOpen] = React.useState(false);
  const [hora, setHora] = React.useState("");
  const [orden, setOrden] = React.useState<number | null>(null);
  const [motivo, setMotivo] = React.useState("");
  const [observacion, setObservacion] = React.useState("");
  const [autorizacion, setAutorizacion] = React.useState("");
  const [iafaId, setIafaId] = React.useState<number | null>(null);
  const [paciente, setPaciente] = React.useState<PacienteAgenda | null>(null);
  const [pacienteLoading, setPacienteLoading] = React.useState(false);

  React.useEffect(() => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    if (!notice || typeof window === "undefined") return;
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 10000);
  }, [notice]);
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
  const canAddExtra =
    baseFull &&
    adicionalVisible >= adicionalesTotal &&
    extraVisible < extrasTotal;

  // Cargar especialidades solo cuando hay fecha seleccionada.
  React.useEffect(() => {
    if (!selectedDateStr) {
      setEspecialidadesList([]);
      setMedicosList([]);
      setEspecialidadId(null);
      setMedicoId(null);
      return;
    }
    setOpcionesLoading(true);
    setMedicosList([]);
    setMedicoId(null);
    getAgendaOpciones({ fecha: selectedDateStr })
      .then((data) => {
        setEspecialidadesList(data.especialidades);
        const ids = data.especialidades.map((e) => e.id);
        setEspecialidadId((prev) => (prev !== null && ids.includes(prev) ? prev : data.especialidades[0]?.id ?? null));
      })
      .catch((e) => {
        const err = toApiError(e);
        const msg =
          err.kind === "validation"
            ? Object.values(err.errors).flat()[0] ?? err.message
            : err.message;
        setNotice({ type: "error", text: msg || "No se pudieron cargar servicios programados." });
        setEspecialidadesList([]);
        setEspecialidadId(null);
      })
      .finally(() => setOpcionesLoading(false));
  }, [selectedDateStr, reloadFlag]);

  // Cargar médicos cuando hay fecha y servicio seleccionado; por defecto se selecciona el primero.
  // Al cambiar de servicio, limpiar médico de inmediato para no llamar a slots con (fecha, nuevoServicio, médicoViejo).
  React.useEffect(() => {
    if (!selectedDateStr || especialidadId === null) {
      setMedicosList([]);
      setMedicoId(null);
      return;
    }
    setMedicosList([]);
    setMedicoId(null);
    setMedicosLoading(true);
    getAgendaOpciones({ fecha: selectedDateStr, especialidad_id: especialidadId })
      .then((data) => {
        setMedicosList(data.medicos);
        const ids = data.medicos.map((m) => m.id);
        setMedicoId((prev) => (prev !== null && ids.includes(prev) ? prev : data.medicos[0]?.id ?? null));
      })
      .catch((e) => {
        const err = toApiError(e);
        const msg =
          err.kind === "validation"
            ? Object.values(err.errors).flat()[0] ?? err.message
            : err.message;
        setNotice({ type: "error", text: msg || "No se pudieron cargar médicos programados." });
        setMedicosList([]);
        setMedicoId(null);
      })
      .finally(() => setMedicosLoading(false));
  }, [selectedDateStr, especialidadId, reloadFlag]);

  React.useEffect(() => {
    if (!selectedDateStr || !especialidadId || !medicoId) {
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
        if (preserveVisibleCountersRef.current > 0) {
          preserveVisibleCountersRef.current -= 1;
        } else {
          const taken = new Set((res.slots_tomados ?? []).map((h) => (String(h).length >= 5 ? String(h).slice(0, 5) : String(h))));
          const adicionales = res.slots_adicional ?? [];
          const extras = res.slots_extra ?? [];
          const allAdicionalTaken = adicionales.length > 0 && adicionales.every((h) => taken.has(String(h).slice(0, 5)));
          const allExtraTaken = extras.length > 0 && extras.every((h) => taken.has(String(h).slice(0, 5)));
          setAdicionalVisible(allAdicionalTaken ? adicionales.length : 0);
          setExtraVisible(allExtraTaken ? extras.length : 0);
        }
      })
      .catch((e) => {
        const err = toApiError(e);
        const msg =
          err.kind === "validation"
            ? Object.values(err.errors).flat()[0] ?? err.message
            : err.message;
        setNotice({ type: "error", text: msg || "No se pudieron cargar los slots." });
        setSlots(null);
        setProgramacion(null);
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedDateStr, especialidadId, medicoId, reloadFlag]);

  React.useEffect(() => {
    setPage(1);
  }, [selectedDateStr, especialidadId, medicoId, perPage]);

  React.useEffect(() => {
    if (!selectedDateStr || !especialidadId || !medicoId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listAgendaCitas({
      fecha: selectedDateStr,
      especialidad_id: especialidadId,
      medico_id: medicoId,
      page,
      per_page: perPage,
    })
      .then((res) => {
        setData(res.data);
        setProgramacion(res.programacion ?? programacion);
      })
      .catch((e) => {
        const err = toApiError(e);
        const msg =
          err.kind === "validation"
            ? Object.values(err.errors).flat()[0] ?? err.message
            : err.message;
        setNotice({ type: "error", text: msg || "No se pudieron cargar las citas." });
      })
      .finally(() => setLoading(false));
  }, [selectedDateStr, especialidadId, medicoId, page, perPage, reloadFlag]);

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
    } catch {
      setNotice({ type: "error", text: "No se pudo cargar el paciente." });
    } finally {
      setPacienteLoading(false);
    }
  }, [iafaId]);

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
      setNotice({ type: "success", text: "Cita agendada correctamente." });
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
    } catch {
      setNotice({ type: "error", text: "No se pudo agendar la cita." });
      return false;
    }
  }, [programacion, hora, paciente, motivo, observacion, autorizacion, iafaId, selectedDateStr, especialidadId, medicoId]);

  const setSelectedDateStr = React.useCallback((value: string) => {
    const d = parseYmd(value);
    setSelectedDate(d);
  }, []);

  return {
    notice,
    setNotice,
    clearNotice,
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
    /** Refresca slots al entrar en Nueva cita (sin paciente_id). No preserva contadores para que se aplique la lógica de Adicional/Extra agotados. */
    refetchSlotsForNuevaCita: React.useCallback(() => setReloadFlag((v) => v + 1), []),
  };
}
