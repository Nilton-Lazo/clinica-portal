import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiError } from "../../../../shared/api/apiError";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";

import type {
  AcreditacionPlan,
  ParentescoSeguro,
  RecordStatus,
  TipoClienteLookup,
  IafaLookup,
  ContratanteLookup,
} from "./acreditacionPlanes.types";
import type { PaginatedResponse } from "../../../../shared/types/pagination";

import {
  createPacientePlan,
  deactivatePacientePlan,
  listPacientePlanes,
  listContratantesLookup,
  listIafasLookup,
  listTiposClientesLookup,
  updatePacientePlan,
} from "./acreditacionPlanes.service";

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
  const t = s.trim();
  return t ? t : null;
}

function isDateIso(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(t);
}

function normalizeParentesco(v: string | null | undefined): ParentescoSeguro | "" {
  const s = (v ?? "").trim().toUpperCase();
  if (s === "NO_DEFINIDO") return "NO_DEFINIDO";
  if (s === "TITULAR") return "TITULAR";
  if (s === "CONYUGE") return "CONYUGE";
  if (s === "HIJO") return "HIJO";
  if (s === "HIJA") return "HIJA";
  if (s === "HERMANO") return "HERMANO";
  if (s === "HERMANA") return "HERMANA";
  if (s === "HIJO_INCAPACITADO") return "HIJO_INCAPACITADO";
  if (s === "PADRE") return "PADRE";
  if (s === "MADRE") return "MADRE";
  if (s === "OTRO") return "OTRO";
  return "";
}

function parentescoLabel(v: string | null | undefined): string {
  const s = (v ?? "").toString().trim().toUpperCase();
  if (s === "NO_DEFINIDO") return "No definido";
  if (s === "TITULAR") return "Titular";
  if (s === "CONYUGE") return "Cónyuge";
  if (s === "HIJO") return "Hijo";
  if (s === "HIJA") return "Hija";
  if (s === "HERMANO") return "Hermano";
  if (s === "HERMANA") return "Hermana";
  if (s === "HIJO_INCAPACITADO") return "Hijo incapacitado";
  if (s === "PADRE") return "Padre";
  if (s === "MADRE") return "Madre";
  if (s === "OTRO") return "Otro";
  return s ? s : "—";
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mapById<T extends { id: number }>(items: T[]): Record<number, T> {
  return items.reduce<Record<number, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function iafaLabel(x?: IafaLookup | null): string {
  if (!x) return "—";
  const dc = x.descripcion_corta?.trim();
  if (dc) return dc;
  const rs = x.razon_social?.trim();
  if (rs) return rs;
  const c = x.codigo?.trim();
  return c || "—";
}

function contratanteLabel(x?: ContratanteLookup | null): string {
  if (!x) return "—";
  const rs = x.razon_social?.trim();
  if (rs) return rs;
  const c = x.codigo?.trim();
  return c || "—";
}

function planLabel(p: AcreditacionPlan | null): string {
  if (!p) return "";
  const c = (p.tipo_cliente?.codigo ?? "").trim();
  const d = (p.tipo_cliente?.descripcion_tipo_cliente ?? "").trim();
  if (c && d) return `${c} · ${d}`;
  return c || d || `#${p.id}`;
}

function matchesQ(p: AcreditacionPlan, q: string): boolean {
  if (!q) return true;

  const parts = [
    p.tipo_cliente?.codigo ?? "",
    p.tipo_cliente?.descripcion_tipo_cliente ?? "",
    p.parentesco_seguro ?? "",
    p.fecha_afiliacion ?? "",
    p.estado ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return parts.includes(q);
}

export function useAcreditacionPlanes(pacienteId: number | null, parentescoPaciente?: string | null) {
  const [raw, setRaw] = useState<AcreditacionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(50);

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [tiposClientes, setTiposClientes] = useState<TipoClienteLookup[]>([]);
  const [tiposClientesLoading, setTiposClientesLoading] = useState(false);
  const [iafas, setIafas] = useState<IafaLookup[]>([]);
  const [contratantes, setContratantes] = useState<ContratanteLookup[]>([]);

  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<AcreditacionPlan | null>(null);

  const [tipoClienteId, setTipoClienteId] = useState<number>(0);
  const [parentesco, setParentesco] = useState<ParentescoSeguro | "">("");
  const [fechaAfiliacion, setFechaAfiliacion] = useState<string>("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    tipoClienteId: number;
    parentesco: ParentescoSeguro | null;
    fechaAfiliacion: string | null;
    estado: RecordStatus;
  } | null>(null);

  const loadTiposClientes = useCallback(async () => {
    setTiposClientesLoading(true);
    try {
      const [resTipos, resIafas, resContratantes] = await Promise.all([
        listTiposClientesLookup(),
        listIafasLookup(),
        listContratantesLookup(),
      ]);
      setTiposClientes(resTipos);
      setIafas(resIafas);
      setContratantes(resContratantes);
    } catch {
      setTiposClientes([]);
      setIafas([]);
      setContratantes([]);
    } finally {
      setTiposClientesLoading(false);
    }
  }, []);

  const reloadPlanes = useCallback(async () => {
    if (!pacienteId) {
      setRaw([]);
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const res = await listPacientePlanes(pacienteId);
      setRaw(res);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo cargar los planes.";
      setNotice({ type: "error", text: msg });
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    void loadTiposClientes();
  }, [loadTiposClientes]);

  useEffect(() => {
    setPage(1);
    setMode("new");
    setSelected(null);
    setTipoClienteId(0);
    setParentesco(normalizeParentesco(parentescoPaciente));
    setFechaAfiliacion(todayIso());
    setEstado("ACTIVO");
    originalRef.current = null;
    void reloadPlanes();
  }, [pacienteId, parentescoPaciente, reloadPlanes]);

  const filtered = useMemo(() => {
    const qx = qDebounced.trim().toLowerCase();
    return raw
      .filter((p) => (statusFilter === "ALL" ? true : p.estado === statusFilter))
      .filter((p) => matchesQ(p, qx));
  }, [raw, qDebounced, statusFilter]);

  const prevFiltersRef = useRef<{ q: string; status: StatusFilter; perPage: number } | null>(null);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qDebounced, status: statusFilter, perPage };
    const changed = !prev || prev.q !== next.q || prev.status !== next.status || prev.perPage !== next.perPage;
    prevFiltersRef.current = next;

    if (changed && page !== 1) setPage(1);
  }, [qDebounced, statusFilter, perPage, page]);

  const data = useMemo<PaginatedResponse<AcreditacionPlan>>(() => {
    const total = filtered.length;
    const last = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(Math.max(1, page), last);

    const start = (current - 1) * perPage;
    const rows = filtered.slice(start, start + perPage);

    return {
      data: rows,
      meta: { current_page: current, per_page: perPage, total, last_page: last },
    };
  }, [filtered, page, perPage]);

  useEffect(() => {
    const last = data.meta.last_page;
    if (page > last) setPage(last);
  }, [data.meta.last_page, page]);

  const isValid = useMemo(() => {
    if (!pacienteId) return false;
    if (!tipoClienteId || tipoClienteId <= 0) return false;
    if (!parentesco) return false;
    if (!isDateIso(fechaAfiliacion)) return false;
    return true;
  }, [pacienteId, tipoClienteId, parentesco, fechaAfiliacion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    return (
      o.tipoClienteId !== tipoClienteId ||
      o.parentesco !== (parentesco ? (parentesco as ParentescoSeguro) : null) ||
      o.fechaAfiliacion !== toNullIfBlank(fechaAfiliacion) ||
      o.estado !== estado
    );
  }, [mode, isValid, tipoClienteId, parentesco, fechaAfiliacion, estado]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);
    setTipoClienteId(0);
    setParentesco(normalizeParentesco(parentescoPaciente));
    setFechaAfiliacion(todayIso());
    setEstado("ACTIVO");
    originalRef.current = null;
    setNotice(null);
  }, [parentescoPaciente]);

  const loadForEdit = useCallback((p: AcreditacionPlan) => {
    setMode("edit");
    setSelected(p);

    setTipoClienteId(p.tipo_cliente_id);
    setParentesco((p.parentesco_seguro ?? "") as ParentescoSeguro | "");
    setFechaAfiliacion((p.fecha_afiliacion ?? "").slice(0, 10));
    setEstado(p.estado);

    originalRef.current = {
      tipoClienteId: p.tipo_cliente_id,
      parentesco: p.parentesco_seguro ?? null,
      fechaAfiliacion: p.fecha_afiliacion ?? null,
      estado: p.estado,
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

    setTipoClienteId(o.tipoClienteId);
    setParentesco((o.parentesco ?? "") as ParentescoSeguro | "");
    setFechaAfiliacion(o.fechaAfiliacion ?? "");
    setEstado(o.estado);
    setNotice(null);
  }, [mode, resetToNew, selected]);

  const onSave = useCallback(async () => {
    setNotice(null);

    if (!pacienteId) {
      setNotice({ type: "error", text: "Guarda el paciente para afiliar planes." });
      return;
    }

    if (!isValid) {
      setNotice({ type: "error", text: "Datos inválidos." });
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona un plan para editar." });
      return;
    }

    if (!isDirty) {
      setNotice({ type: "error", text: "No hay cambios para guardar." });
      return;
    }

    const payload = {
      tipo_cliente_id: tipoClienteId,
      fecha_afiliacion: toNullIfBlank(fechaAfiliacion),
      estado,
    };

    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createPacientePlan(pacienteId, payload);
        setNotice({ type: "success", text: "Plan afiliado." });

        await reloadPlanes();
        loadForEdit(res.data);
        return;
      }

      const res = await updatePacientePlan(pacienteId, selected!.id, payload);
      setNotice({ type: "success", text: "Cambios guardados." });

      await reloadPlanes();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar.";
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [
    pacienteId,
    isValid,
    mode,
    selected,
    isDirty,
    tipoClienteId,
    fechaAfiliacion,
    estado,
    reloadPlanes,
    loadForEdit,
  ]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona un plan para desactivar." });
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!pacienteId || !selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona un plan." });
      return;
    }

    setSaving(true);
    try {
      const res = await deactivatePacientePlan(pacienteId, selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Plan desactivado." });

      await reloadPlanes();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [pacienteId, selected, reloadPlanes, loadForEdit]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO" && !saving;

  const selectedLabel = useMemo(() => planLabel(selected), [selected]);

  const iafaById = useMemo(() => mapById(iafas), [iafas]);
  const contratanteById = useMemo(() => mapById(contratantes), [contratantes]);

  const selectedTipoCliente = useMemo(() => {
    const fromLookup = tiposClientes.find((x) => x.id === tipoClienteId);
    if (fromLookup) return fromLookup;
    if (selected?.tipo_cliente && selected.tipo_cliente.id === tipoClienteId) return selected.tipo_cliente;
    return null;
  }, [tiposClientes, tipoClienteId, selected]);

  const iafaLabelValue = useMemo(() => {
    const id = selectedTipoCliente?.iafa_id ?? null;
    if (!id) return "—";
    return iafaLabel(iafaById[id]);
  }, [selectedTipoCliente, iafaById]);

  const contratanteLabelValue = useMemo(() => {
    const id = selectedTipoCliente?.contratante_id ?? null;
    if (!id) return "—";
    return contratanteLabel(contratanteById[id]);
  }, [selectedTipoCliente, contratanteById]);

  return {
    data,
    rawCount: raw.length,
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

    tiposClientes,
    tiposClientesLoading,
    iafaById,
    contratanteById,

    mode,
    selected,
    selectedLabel,

    tipoClienteId,
    setTipoClienteId,
    parentesco,
    setParentesco,
    condicionLabel: parentescoLabel(parentesco),
    iafaLabel: iafaLabelValue,
    contratanteLabel: contratanteLabelValue,
    fechaAfiliacion,
    setFechaAfiliacion,
    estado,
    setEstado,

    isValid,
    isDirty,
    canDeactivate,

    resetToNew,
    loadForEdit,
    cancel,
    onSave,
    reloadPlanes,

    confirmDeactivateOpen,
    setConfirmDeactivateOpen,
    requestDeactivate,
    onDeactivateConfirmed,
  };
}
