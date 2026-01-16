import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JornadaTurno, PaginatedResponse, RecordStatus, TipoTurno, Turno } from "../../types/turnos.types";

import { createTurno, deactivateTurno, getNextTurnoCodigo, listTurnos, updateTurno } from "../../services/turnos.service";

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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseTimeToMinutes(s: string): number | null {
  const t = s.trim();
  if (!/^\d{2}:\d{2}$/.test(t)) return null;

  const hh = Number(t.slice(0, 2));
  const mm = Number(t.slice(3, 5));

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;

  return hh * 60 + mm;
}

function normalizeToHHMM(s: string): string | null {
  const t = s.trim();
  if (!t) return null;

  if (t.includes(":")) {
    const [hRaw, mRaw] = t.split(":");
    const hd = (hRaw ?? "").replace(/\D/g, "").slice(0, 2);
    const md = (mRaw ?? "").replace(/\D/g, "").slice(0, 2);

    if (!hd) return null;

    const hh = Number(hd);
    const mm = md ? Number(md.padEnd(2, "0").slice(0, 2)) : 0;

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return `${pad2(hh)}:${pad2(mm)}`;
  }

  const d = t.replace(/\D/g, "").slice(0, 4);
  if (!d) return null;

  if (d.length === 1) {
    const hh = Number(d);
    if (hh < 0 || hh > 9) return null;
    return `0${hh}:00`;
  }

  if (d.length === 2) {
    const hh = Number(d);
    if (hh < 0 || hh > 23) return null;
    return `${pad2(hh)}:00`;
  }

  if (d.length === 3) {
    const hh = Number(d.slice(0, 2));
    const mm = Number(`${d.slice(2, 3)}0`);
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  const hh = Number(d.slice(0, 2));
  const mm = Number(d.slice(2, 4));
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return `${pad2(hh)}:${pad2(mm)}`;
}

function calcDurationHHMM(horaInicio: string, horaFin: string): string | null {
  const a = parseTimeToMinutes(horaInicio);
  const b0 = parseTimeToMinutes(horaFin);
  if (a === null || b0 === null) return null;

  const b = b0 <= a ? b0 + 24 * 60 : b0;
  const diff = b - a;

  if (diff <= 0 || diff > 24 * 60) return null;

  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function useTurnos() {
  const [data, setData] = useState<PaginatedResponse<Turno>>({
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

  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<Turno | null>(null);

  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  const [descripcion, _setDescripcion] = useState("");
  const descripcionManualRef = useRef(false);

  const [tipoTurno, setTipoTurno] = useState<TipoTurno>("NORMAL");
  const [jornada, setJornada] = useState<JornadaTurno>("MANANA");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    horaInicio: string;
    horaFin: string;
    descripcion: string;
    descripcionAuto: string;
    descripcionManual: boolean;
    tipoTurno: TipoTurno;
    jornada: JornadaTurno;
    estado: RecordStatus;
  } | null>(null);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextTurnoCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    if (mode === "new") void fetchCodigoPreview();
  }, [mode, fetchCodigoPreview]);

  const duracionPreview = useMemo(() => {
    const hi = normalizeToHHMM(horaInicio);
    const hf = normalizeToHHMM(horaFin);
    if (!hi || !hf) return "";
    return calcDurationHHMM(hi, hf) ?? "";
  }, [horaInicio, horaFin]);

  const descripcionPreview = useMemo(() => {
    const c = (codigo ?? "").trim();
    const hi = normalizeToHHMM(horaInicio);
    const hf = normalizeToHHMM(horaFin);
    if (!c || !hi || !hf) return "";
    return `Turno: ${c} - de ${hi} a ${hf}`;
  }, [codigo, horaInicio, horaFin]);

  useEffect(() => {
    if (descripcionManualRef.current) return;
    if (!descripcionPreview) return;
    _setDescripcion(descripcionPreview);
  }, [descripcionPreview]);

  const setDescripcion = useCallback((v: string) => {
    descripcionManualRef.current = true;
    _setDescripcion(v);
  }, []);

  const effectiveDescripcion = useMemo(() => {
    const d = descripcion.trim();
    return d ? d : descripcionPreview;
  }, [descripcion, descripcionPreview]);

  const isValid = useMemo(() => {
    const hi = normalizeToHHMM(horaInicio);
    const hf = normalizeToHHMM(horaFin);
    if (!hi || !hf) return false;

    const dur = calcDurationHHMM(hi, hf);
    if (!dur) return false;

    const d = (effectiveDescripcion ?? "").trim();
    if (!d) return false;
    if (d.length > 255) return false;

    if (!tipoTurno) return false;
    if (!jornada) return false;

    return true;
  }, [horaInicio, horaFin, tipoTurno, jornada, effectiveDescripcion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    const hi = normalizeToHHMM(horaInicio) ?? "";
    const hf = normalizeToHHMM(horaFin) ?? "";
    const d = (effectiveDescripcion ?? "").trim();

    return (
      o.horaInicio !== hi ||
      o.horaFin !== hf ||
      o.descripcion !== d ||
      o.tipoTurno !== tipoTurno ||
      o.jornada !== jornada ||
      o.estado !== estado
    );
  }, [mode, isValid, horaInicio, horaFin, tipoTurno, jornada, estado, effectiveDescripcion]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setHoraInicio("");
    setHoraFin("");

    descripcionManualRef.current = false;
    _setDescripcion("");

    setTipoTurno("NORMAL");
    setJornada("MANANA");
    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: Turno) => {
    const hi = normalizeToHHMM(x.hora_inicio ?? "") ?? "";
    const hf = normalizeToHHMM(x.hora_fin ?? "") ?? "";
    const c = (x.codigo ?? "").trim();
    const auto = c && hi && hf ? `Turno: ${c} - de ${hi} a ${hf}` : "";

    const dRaw = (x.descripcion ?? "").trim();
    const d = dRaw ? dRaw : auto;
    const manual = dRaw !== "" && dRaw !== auto;

    setMode("edit");
    setSelected(x);

    setHoraInicio(hi);
    setHoraFin(hf);

    descripcionManualRef.current = manual;
    _setDescripcion(d);

    setTipoTurno(x.tipo_turno);
    setJornada(x.jornada);
    setEstado(x.estado);

    originalRef.current = {
      horaInicio: hi,
      horaFin: hf,
      descripcion: d.trim(),
      descripcionAuto: auto,
      descripcionManual: manual,
      tipoTurno: x.tipo_turno,
      jornada: x.jornada,
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

    setHoraInicio(o.horaInicio);
    setHoraFin(o.horaFin);

    descripcionManualRef.current = o.descripcionManual;
    _setDescripcion(o.descripcion);

    setTipoTurno(o.tipoTurno);
    setJornada(o.jornada);
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
        const res = await listTurnos({
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

    const hi = normalizeToHHMM(horaInicio);
    const hf = normalizeToHHMM(horaFin);

    if (!hi || !hf) {
      setNotice({ type: "error", text: "Horas inválidas." });
      return;
    }

    const desc = (effectiveDescripcion ?? "").trim();

    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createTurno({
          hora_inicio: hi,
          hora_fin: hf,
          tipo_turno: tipoTurno,
          jornada,
          estado,
          descripcion: desc,
        });

        setNotice({ type: "success", text: "Turno creado." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateTurno(selected!.id, {
        hora_inicio: hi,
        hora_fin: hf,
        tipo_turno: tipoTurno,
        jornada,
        estado,
        descripcion: desc,
      });

      setNotice({ type: "success", text: "Cambios guardados." });
      await refresh();

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
    horaInicio,
    horaFin,
    tipoTurno,
    jornada,
    estado,
    effectiveDescripcion,
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
      const res = await deactivateTurno(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Turno desactivado." });

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

    mode,
    selected,

    codigo,

    horaInicio,
    setHoraInicio,
    horaFin,
    setHoraFin,

    descripcion,
    setDescripcion,

    tipoTurno,
    setTipoTurno,
    jornada,
    setJornada,
    estado,
    setEstado,

    duracionPreview,
    descripcionPreview,

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
