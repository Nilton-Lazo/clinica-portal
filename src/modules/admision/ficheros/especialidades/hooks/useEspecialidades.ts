import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Especialidad, PaginatedResponse, RecordStatus } from "../../types/especialidades.types";

import {
  createEspecialidad,
  deactivateEspecialidad,
  getNextEspecialidadCodigo,
  listEspecialidades,
  updateEspecialidad,
} from "../../services/especialidades.service";

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

export function useEspecialidades() {
  const [data, setData] = useState<PaginatedResponse<Especialidad>>({
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
  const [selected, setSelected] = useState<Especialidad | null>(null);

  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    codigo: string;
    descripcion: string;
    estado: RecordStatus;
  } | null>(null);

  useEffect(() => {
    if (mode !== "new") return;
    if (codigo.trim()) return;

    let alive = true;

    (async () => {
      try {
        const res = await getNextEspecialidadCodigo();
        if (!alive) return;
        setCodigo(res.codigo);
      } catch {
        // si falla preview, no se bloquea aquí; igual backend genera al crear
      }
    })();

    return () => {
      alive = false;
    };
  }, [mode, codigo]);

  const isValid = useMemo(() => {
    const c = codigo.trim();
    const d = descripcion.trim();

    if (!d) return false;
    if (d.length > 255) return false;

    if (mode === "new") {
      if (!c) return false;
      if (c.length > 10) return false;
      if (!/^\d{3,10}$/.test(c)) return false;
    }

    if (mode === "edit") {
      if (!c) return false;
      if (c.length > 10) return false;
    }

    return true;
  }, [codigo, descripcion, mode]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;

    if (!o) return mode === "new" ? isValid : false;

    return o.descripcion !== descripcion.trim() || o.estado !== estado;
  }, [descripcion, estado, mode, isValid]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setCodigo("");
    setDescripcion("");
    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);
  }, []);

  const loadForEdit = useCallback((x: Especialidad) => {
    setMode("edit");
    setSelected(x);

    setCodigo(x.codigo);
    setDescripcion(x.descripcion);
    setEstado(x.estado);

    originalRef.current = {
      codigo: x.codigo,
      descripcion: x.descripcion,
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

    setCodigo(o.codigo);
    setDescripcion(o.descripcion);
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
        const res = await listEspecialidades({
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

    const d = descripcion.trim();

    if (!isValid) {
      setNotice({ type: "error", text: "Completa la Descripción correctamente." });
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

    if (saving) return;

    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createEspecialidad({
          descripcion: d,
          estado,
        });

        setNotice({ type: "success", text: "Especialidad creada." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateEspecialidad(selected!.id, {
        descripcion: d,
        estado,
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
  }, [descripcion, estado, isDirty, isValid, loadForEdit, mode, refresh, saving, selected]);

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

    if (saving) return;

    setSaving(true);
    try {
      const res = await deactivateEspecialidad(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Especialidad desactivada." });

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [loadForEdit, refresh, saving, selected]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO";

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
    descripcion,
    setDescripcion,
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
