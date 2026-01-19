import * as React from "react";
import type { RecordStatus } from "../../../../../shared/types/recordStatus";
import type {
  ConsultorioLookup,
  EspecialidadLookup,
  MedicoLookup,
  ModalidadFechasProgramacion,
  ProgramacionMedica,
  ProgramacionMedicaPaginated,
  ProgramacionMedicaStorePayload,
  TipoProgramacionMedica,
  TurnoLookup,
} from "../../types/programacionMedica.types";
import { programacionMedicaService, isApiError } from "../../services/programacionMedica.service";

import {
  dmyFromYmdString,
  formatDmyFromDate,
  summarizeCodes,
  uniqueDates,
  ymdFromDate,
  sortDates,
  sameDay,
} from "../../utils/programacionMedica.utils";

export type Mode = "new" | "edit";
export type StatusFilter = "ALL" | RecordStatus;
export type Notice = { type: "success" | "error"; text: string } | null;

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

function medicoLabel(m: MedicoLookup): string {
  const ap = [m.apellido_paterno, m.apellido_materno].filter(Boolean).join(" ").trim();
  const nm = String(m.nombres ?? "").trim();
  const full = [ap, nm].filter(Boolean).join(" ").trim();
  return full || `Médico ${m.id}`;
}

function especialidadLabel(e: EspecialidadLookup): string {
  return `${e.codigo} · ${e.descripcion}`.trim();
}

function consultorioLabel(c: ConsultorioLookup): string {
  const a = String(c.abreviatura ?? "").trim();
  const d = String(c.descripcion ?? "").trim();
  return a && d ? `${a} · ${d}` : a || d || `Consultorio ${c.id}`;
}

function turnoLabel(t: TurnoLookup): string {
  const c = String(t.codigo ?? "").trim();
  const d = String(t.descripcion ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `Turno ${t.id}`;
}

function errorMessage(e: unknown, fallback: string): string {
  if (isApiError(e)) {
    const x = e as Record<string, unknown>;

    const errs = x.errors;
    if (errs && typeof errs === "object") {
      const keys = Object.keys(errs as Record<string, unknown>);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const v = (errs as Record<string, unknown>)[firstKey];
        if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim() !== "") {
          return v[0];
        }
      }
    }

    const m = x.message;
    if (typeof m === "string" && m.trim() !== "") return m;
  }

  return fallback;
}

type MedicoWithEspecialidades = MedicoLookup & {
  especialidades?: EspecialidadLookup[];
  especialidad_id?: number;
  especialidad?: { id: number } | null;
};

function hasEspecialidades(x: MedicoLookup): x is MedicoWithEspecialidades {
  return (
    typeof x === "object" &&
    x !== null &&
    "especialidades" in x &&
    Array.isArray((x as MedicoWithEspecialidades).especialidades)
  );
}

function getPreferredEspecialidadId(x: MedicoLookup): number | null {
  const m = x as MedicoWithEspecialidades;
  if (typeof m.especialidad_id === "number" && m.especialidad_id > 0) return m.especialidad_id;
  if (m.especialidad && typeof m.especialidad.id === "number" && m.especialidad.id > 0) return m.especialidad.id;
  return null;
}

export function useProgramacionMedica() {
  const svc = React.useMemo(() => programacionMedicaService(), []);
  const today = React.useMemo(() => new Date(), []);

  const [data, setData] = React.useState<ProgramacionMedicaPaginated>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(null);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(50);

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");

  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");

  const [q, setQ] = React.useState<string>("");

  const [mode, setMode] = React.useState<Mode>("new");
  const [selected, setSelected] = React.useState<ProgramacionMedica | null>(null);

  const [modalidad, setModalidad] = React.useState<ModalidadFechasProgramacion>("DIARIA");
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => today);

  const [selectedDates, setSelectedDates] = React.useState<Date[]>(() => [today]);
  const [rangeStart, setRangeStart] = React.useState<Date | null>(() => today);
  const [rangeEnd, setRangeEnd] = React.useState<Date | null>(() => today);

  const [medicos, setMedicos] = React.useState<MedicoLookup[]>([]);
  const [especialidades, setEspecialidades] = React.useState<EspecialidadLookup[]>([]);
  const [especialidadesDelMedico, setEspecialidadesDelMedico] = React.useState<EspecialidadLookup[]>([]);
  const [consultorios, setConsultorios] = React.useState<ConsultorioLookup[]>([]);
  const [turnos, setTurnos] = React.useState<TurnoLookup[]>([]);

  const [codigo, setCodigo] = React.useState<string>("");
  const [medicoId, setMedicoId] = React.useState<number>(0);
  const [especialidadId, setEspecialidadId] = React.useState<number>(0);
  const [consultorioId, setConsultorioId] = React.useState<number>(0);
  const [turnoId, setTurnoId] = React.useState<number>(0);
  const [cupos, setCupos] = React.useState<number>(0);

  const [tipo, setTipo] = React.useState<TipoProgramacionMedica>("NORMAL");
  const [estado, setEstado] = React.useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = React.useState(false);

  const originalRef = React.useRef<{
    fecha: string;
    medico_id: number;
    especialidad_id: number;
    consultorio_id: number;
    turno_id: number;
    tipo: TipoProgramacionMedica;
    estado: RecordStatus;
  } | null>(null);

  const clearNotice = React.useCallback(() => setNotice(null), []);

  const fechaDisplay = React.useMemo(() => {
    if (mode === "edit") return formatDmyFromDate(selectedDate);

    if (modalidad === "DIARIA") return formatDmyFromDate(selectedDate);

    if (modalidad === "ALEATORIA") {
      const xs = sortDates(uniqueDates(selectedDates));
      if (xs.length === 0) return "";
      const parts = xs.map(formatDmyFromDate);
      if (parts.length <= 3) return parts.join(", ");
      const first = parts.slice(0, 3).join(", ");
      return `${first} (+${parts.length - 3})`;
    }

    const a = rangeStart ? formatDmyFromDate(rangeStart) : "—";
    const b = rangeEnd ? formatDmyFromDate(rangeEnd) : "—";
    return `${a} al ${b}`;
  }, [mode, modalidad, selectedDate, selectedDates, rangeStart, rangeEnd]);

  const enabledEditModalidad = mode === "new";

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const qClean = q.trim();
      const fromClean = from.trim();
      const toClean = to.trim();

      const res = await svc.list({
        page,
        per_page: clampPerPage(perPage),
        status: statusFilter === "ALL" ? undefined : statusFilter,
        from: fromClean !== "" ? fromClean : undefined,
        to: toClean !== "" ? toClean : undefined,
        q: qClean !== "" ? qClean : undefined,
      });

      setData(res);
    } catch (e) {
      setNotice({ type: "error", text: errorMessage(e, "Error al listar.") });
    } finally {
      setLoading(false);
    }
  }, [svc, page, perPage, statusFilter, from, to, q]);

  const lastFiltersRef = React.useRef<string>("");
  React.useEffect(() => {
    const key = `${clampPerPage(perPage)}|${statusFilter}|${from}|${to}|${q}`;
    const prev = lastFiltersRef.current;
    lastFiltersRef.current = key;

    if (prev !== "" && prev !== key && page !== 1) {
      setPage(1);
      return;
    }
    refresh();
  }, [perPage, statusFilter, from, to, q, page, refresh]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [m, e, c, t] = await Promise.all([
          svc.listMedicosActivos(),
          svc.listEspecialidadesActivas(),
          svc.listConsultoriosActivos(),
          svc.listTurnosActivos(),
        ]);
        if (!alive) return;
        setMedicos(m);
        setEspecialidades(e);
        setConsultorios(c);
        setTurnos(t);
      } catch (err) {
        if (!alive) return;
        setNotice({ type: "error", text: errorMessage(err, "Error cargando catálogos.") });
      }
    })();
    return () => {
      alive = false;
    };
  }, [svc]);

  const especialidadIdRef = React.useRef<number>(0);
  React.useEffect(() => {
    especialidadIdRef.current = especialidadId;
  }, [especialidadId]);

  const recomputeEspecialidadesDelMedico = React.useCallback(
    (mId: number) => {
      const m = medicos.find((x) => x.id === mId);

      if (!m) {
        setEspecialidadesDelMedico([]);
        return;
      }

      const embedded = hasEspecialidades(m)
        ? (m.especialidades ?? []).filter((x) => (x.estado ? x.estado === "ACTIVO" : true))
        : [];

      if (embedded.length > 0) {
        setEspecialidadesDelMedico(embedded);

        const curId = especialidadIdRef.current;
        if (!embedded.some((x) => x.id === curId)) {
          setEspecialidadId(embedded[0].id);
        }
        return;
      }

      const preferred = getPreferredEspecialidadId(m);
      if (preferred) {
        const one = especialidades.find((e) => e.id === preferred && (!e.estado || e.estado === "ACTIVO"));
        if (one) {
          setEspecialidadesDelMedico([one]);
          setEspecialidadId(one.id);
          return;
        }
      }

      const curId = especialidadIdRef.current;
      if (curId > 0) {
        const cur = especialidades.find((e) => e.id === curId && (!e.estado || e.estado === "ACTIVO"));
        if (cur) {
          setEspecialidadesDelMedico([cur]);
          return;
        }
      }

      setEspecialidadesDelMedico([]);
    },
    [medicos, especialidades]
  );

  React.useEffect(() => {
    if (medicoId > 0) {
      recomputeEspecialidadesDelMedico(medicoId);
    } else {
      setEspecialidadesDelMedico([]);
      if (mode === "new") setEspecialidadId(0);
    }
  }, [medicoId, mode, recomputeEspecialidadesDelMedico]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (medicoId <= 0 || turnoId <= 0) {
        setCupos(0);
        return;
      }
      try {
        const r = await svc.cupos(medicoId, turnoId);
        if (!alive) return;
        setCupos(r.cupos);
      } catch (e) {
        if (!alive) return;
        setCupos(0);
        setNotice({ type: "error", text: errorMessage(e, "No se pudo calcular cupos.") });
      }
    })();
    return () => {
      alive = false;
    };
  }, [svc, medicoId, turnoId]);

  const batchCount = React.useMemo(() => {
    if (mode !== "new") return 1;

    if (modalidad === "DIARIA") return 1;

    if (modalidad === "ALEATORIA") return uniqueDates(selectedDates).length;

    if (modalidad === "RANGO") return rangeStart && rangeEnd ? 2 : 0;

    return 0;
  }, [mode, modalidad, selectedDates, rangeStart, rangeEnd]);

  const [nextId, setNextId] = React.useState<number>(0);
  const [codigoPreview, setCodigoPreview] = React.useState<string>("Generando...");

  React.useEffect(() => {
    let alive = true;

    (async () => {
      if (mode !== "new") return;

      if (batchCount <= 0) {
        setCodigoPreview("—");
        return;
      }

      setCodigoPreview("Generando...");
      try {
        const nid = await svc.nextCodigo();
        if (!alive) return;

        if (!Number.isFinite(nid) || nid <= 0) {
          setCodigoPreview("—");
          return;
        }

        setNextId(nid);
        const { display } = summarizeCodes(nid, batchCount);
        setCodigoPreview(display);
      } catch {
        if (!alive) return;
        setCodigoPreview("—");
      }
    })();

    return () => {
      alive = false;
    };
  }, [svc, mode, batchCount, modalidad, selectedDate, selectedDates, rangeStart, rangeEnd]);

  const codigoDisplay = mode === "edit" ? codigo : codigoPreview;

  const resetToNew = React.useCallback(() => {
    clearNotice();

    setMode("new");
    setSelected(null);
    originalRef.current = null;

    setModalidad("DIARIA");
    setSelectedDate(today);

    setSelectedDates([today]);
    setRangeStart(today);
    setRangeEnd(today);

    setCodigo("");
    setMedicoId(0);
    setEspecialidadId(0);
    setEspecialidadesDelMedico([]);
    setConsultorioId(0);
    setTurnoId(0);
    setCupos(0);

    setTipo("NORMAL");
    setEstado("ACTIVO");

    setConfirmDeactivateOpen(false);
  }, [today, clearNotice]);

  const loadForEdit = React.useCallback(
    (pm: ProgramacionMedica) => {
      clearNotice();

      setMode("edit");
      setSelected(pm);

      setModalidad("DIARIA");

      const d = new Date(`${pm.fecha}T00:00:00`);
      setSelectedDate(d);
      setSelectedDates([d]);
      setRangeStart(d);
      setRangeEnd(d);

      setCodigo(pm.codigo);

      especialidadIdRef.current = pm.especialidad_id;
      setEspecialidadId(pm.especialidad_id);
      setMedicoId(pm.medico_id);

      setConsultorioId(pm.consultorio_id);
      setTurnoId(pm.turno_id);

      setTipo(pm.tipo);
      setEstado(pm.estado);

      originalRef.current = {
        fecha: pm.fecha,
        medico_id: pm.medico_id,
        especialidad_id: pm.especialidad_id,
        consultorio_id: pm.consultorio_id,
        turno_id: pm.turno_id,
        tipo: pm.tipo,
        estado: pm.estado,
      };
    },
    [clearNotice]
  );

  const cancel = React.useCallback(() => {
    clearNotice();

    if (mode === "new") {
      resetToNew();
      return;
    }
    if (!selected || !originalRef.current) return;

    const o = originalRef.current;
    const d = new Date(`${o.fecha}T00:00:00`);

    setSelectedDate(d);
    setSelectedDates([d]);
    setRangeStart(d);
    setRangeEnd(d);

    setCodigo(selected.codigo);

    especialidadIdRef.current = o.especialidad_id;
    setMedicoId(o.medico_id);
    setEspecialidadId(o.especialidad_id);
    setConsultorioId(o.consultorio_id);
    setTurnoId(o.turno_id);

    setTipo(o.tipo);
    setEstado(o.estado);

    setConfirmDeactivateOpen(false);
  }, [mode, resetToNew, selected, clearNotice]);

  const canDeactivate = !!selected && selected.estado !== "INACTIVO";

  const isValid = React.useMemo(() => {
    const idsOk = medicoId > 0 && especialidadId > 0 && consultorioId > 0 && turnoId > 0;
    const cuposOk = cupos >= 1;
    if (!idsOk || !cuposOk) return false;

    if (mode === "edit") return true;

    if (modalidad === "DIARIA") return !!selectedDate;
    if (modalidad === "ALEATORIA") return uniqueDates(selectedDates).length >= 1;
    if (modalidad === "RANGO") return !!rangeStart && !!rangeEnd;
    return false;
  }, [mode, medicoId, especialidadId, consultorioId, turnoId, cupos, modalidad, selectedDate, selectedDates, rangeStart, rangeEnd]);

  const isDirty = React.useMemo(() => {
    if (saving) return false;

    if (mode === "new") {
      const hasIds = medicoId > 0 || especialidadId > 0 || consultorioId > 0 || turnoId > 0;
      const hasDates =
        modalidad === "DIARIA"
          ? true
          : modalidad === "ALEATORIA"
            ? uniqueDates(selectedDates).length >= 1
            : !!rangeStart && !!rangeEnd;
      return hasIds && hasDates;
    }

    const o = originalRef.current;
    if (!o) return false;

    const fechaNow = ymdFromDate(selectedDate);
    return (
      fechaNow !== o.fecha ||
      medicoId !== o.medico_id ||
      especialidadId !== o.especialidad_id ||
      consultorioId !== o.consultorio_id ||
      turnoId !== o.turno_id ||
      tipo !== o.tipo ||
      estado !== o.estado
    );
  }, [saving, mode, medicoId, especialidadId, consultorioId, turnoId, modalidad, selectedDates, rangeStart, rangeEnd, selectedDate, tipo, estado]);

  const onSave = React.useCallback(async () => {
    if (!isValid) return;

    setSaving(true);
    clearNotice();

    try {
      if (mode === "new") {
        const base = {
          medico_id: medicoId,
          especialidad_id: especialidadId,
          consultorio_id: consultorioId,
          turno_id: turnoId,
          tipo,
          estado,
        };

        let payload: ProgramacionMedicaStorePayload;

        if (modalidad === "DIARIA") {
          payload = { ...base, modalidad_fechas: "DIARIA", fecha: ymdFromDate(selectedDate) };
        } else if (modalidad === "ALEATORIA") {
          payload = {
            ...base,
            modalidad_fechas: "ALEATORIA",
            fechas: sortDates(uniqueDates(selectedDates)).map(ymdFromDate),
          };
        } else {
          payload = {
            ...base,
            modalidad_fechas: "RANGO",
            fecha_inicio: rangeStart ? ymdFromDate(rangeStart) : null,
            fecha_fin: rangeEnd ? ymdFromDate(rangeEnd) : null,
          };
        }

        const created = await svc.createBatch(payload);

        await refresh();

        if (created.length > 0) {
          loadForEdit(created[0]);
        } else {
          resetToNew();
        }
      } else {
        if (!selected) return;

        const upd = await svc.update(selected.id, {
          fecha: ymdFromDate(selectedDate),
          medico_id: medicoId,
          especialidad_id: especialidadId,
          consultorio_id: consultorioId,
          turno_id: turnoId,
          tipo,
          estado,
        });

        await refresh();
        loadForEdit(upd);
      }
    } catch (e) {
      setNotice({ type: "error", text: errorMessage(e, "Error al guardar.") });
    } finally {
      setSaving(false);
    }
  }, [
    isValid,
    mode,
    medicoId,
    especialidadId,
    consultorioId,
    turnoId,
    tipo,
    estado,
    modalidad,
    selectedDate,
    selectedDates,
    rangeStart,
    rangeEnd,
    svc,
    refresh,
    loadForEdit,
    resetToNew,
    selected,
    clearNotice,
  ]);

  const requestDeactivate = React.useCallback(() => {
    if (!canDeactivate) return;
    clearNotice();
    setConfirmDeactivateOpen(true);
  }, [canDeactivate, clearNotice]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!selected) return;

    setSaving(true);
    clearNotice();

    try {
      const upd = await svc.deactivate(selected.id);
      await refresh();
      loadForEdit(upd);
    } catch (e) {
      setNotice({ type: "error", text: errorMessage(e, "Error al desactivar.") });
    } finally {
      setSaving(false);
      setConfirmDeactivateOpen(false);
    }
  }, [svc, selected, refresh, loadForEdit, clearNotice]);

  const onPickDaily = React.useCallback(
    (d: Date) => {
      setSelectedDate(d);
      if (mode === "new") {
        setSelectedDates([d]);
        setRangeStart(d);
        setRangeEnd(d);
      }
    },
    [mode]
  );

  const onToggleRandom = React.useCallback((d: Date) => {
    setSelectedDates((prev) => {
      const exists = prev.some((x) => sameDay(x, d));
      const next = exists ? prev.filter((x) => !sameDay(x, d)) : [...prev, d];
      return sortDates(uniqueDates(next));
    });
  }, []);

  const onPickRange = React.useCallback(
    (d: Date) => {
      setRangeStart((rs) => {
        const re = rangeEnd;

        if (rs && re) {
          setRangeEnd(null);
          return d;
        }

        if (!rs) {
          setRangeEnd(null);
          return d;
        }

        if (!re) {
          setRangeEnd(d);
          return rs;
        }

        return d;
      });
    },
    [rangeEnd]
  );

  const onModalidadChange = React.useCallback(
    (m: ModalidadFechasProgramacion) => {
      clearNotice();
      setModalidad(m);

      if (m === "DIARIA") {
        setSelectedDate(today);
        setSelectedDates([today]);
        setRangeStart(today);
        setRangeEnd(today);
      } else if (m === "ALEATORIA") {
        setSelectedDates([]);
        setSelectedDate(today);
        setRangeStart(today);
        setRangeEnd(today);
      } else {
        setRangeStart(today);
        setRangeEnd(today);
        setSelectedDate(today);
        setSelectedDates([today]);
      }
    },
    [today, clearNotice]
  );

  const medicoOptions = React.useMemo(
    () => medicos.map((m) => ({ id: m.id, label: medicoLabel(m) })),
    [medicos]
  );

  const especialidadOptions = React.useMemo(
    () =>
      especialidadesDelMedico.map((e) => ({
        id: e.id,
        label: especialidadLabel(e),
      })),
    [especialidadesDelMedico]
  );

  const consultorioOptions = React.useMemo(
    () => consultorios.map((c) => ({ id: c.id, label: consultorioLabel(c) })),
    [consultorios]
  );

  const turnoOptions = React.useMemo(
    () => turnos.map((t) => ({ id: t.id, label: turnoLabel(t) })),
    [turnos]
  );

  return {
    data,
    loading,
    notice,
    setNotice,

    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPage(clampPerPage(n)),

    statusFilter,
    setStatusFilter,

    from,
    to,
    setFrom,
    setTo,

    q,
    setQ,

    mode,
    selected,
    loadForEdit,
    resetToNew,
    cancel,

    modalidad,
    onModalidadChange,
    enabledEditModalidad,

    selectedDate,
    selectedDates,
    rangeStart,
    rangeEnd,

    onPickDaily,
    onToggleRandom,
    onPickRange,

    codigoDisplay,
    medicoId,
    setMedicoId,
    especialidadId,
    setEspecialidadId,
    consultorioId,
    setConsultorioId,
    turnoId,
    setTurnoId,
    cupos,

    tipo,
    setTipo,
    estado,
    setEstado,

    medicoOptions,
    especialidadOptions,
    consultorioOptions,
    turnoOptions,

    fechaDisplay,

    saving,
    isValid,
    isDirty,

    canDeactivate,
    confirmDeactivateOpen,
    setConfirmDeactivateOpen,
    requestDeactivate,
    onSave,
    onDeactivateConfirmed,

    helpers: {
      dmyFromYmdString,
      ymdFromDate,
      nextId,
    },
  };
}
