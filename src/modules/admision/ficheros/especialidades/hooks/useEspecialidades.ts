import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Especialidad,
  PaginatedResponse,
  RecordStatus,
} from "../../types/especialidades.types";

import {
  createEspecialidad,
  deactivateEspecialidad,
  listEspecialidades,
  updateEspecialidad,
} from "../../services/especialidades.service";

import { useDebouncedValue } from "./useDebouncedValue";
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
  const [notice, setNotice] = useState<Notice>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

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

  const isValid = useMemo(() => {
    const c = codigo.trim();
    const d = descripcion.trim();
    if (!c || !d) return false;
    if (c.length > 10) return false;
    if (d.length > 255) return false;
    return true;
  }, [codigo, descripcion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return (
      o.codigo !== codigo.trim() ||
      o.descripcion !== descripcion.trim() ||
      o.estado !== estado
    );
  }, [codigo, descripcion, estado, mode, isValid]);

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

  const prevFiltersRef = useRef<{
    q: string;
    status: StatusFilter;
    perPage: number;
  } | null>(null);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qDebounced, status: statusFilter, perPage };

    const filtersChanged =
      !prev ||
      prev.q !== next.q ||
      prev.status !== next.status ||
      prev.perPage !== next.perPage;

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
      setNotice({
        type: "error",
        text: "Completa Código y Descripción correctamente.",
      });
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

    try {
      if (mode === "new") {
        const res = await createEspecialidad({
          codigo: codigo.trim(),
          descripcion: descripcion.trim(),
          estado,
        });

        setNotice({ type: "success", text: "Especialidad creada." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateEspecialidad(selected!.id, {
        codigo: codigo.trim(),
        descripcion: descripcion.trim(),
        estado,
      });

      setNotice({ type: "success", text: "Cambios guardados." });
      await refresh();

      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar.";
      setNotice({ type: "error", text: msg });
    }
  }, [
    codigo,
    descripcion,
    estado,
    isDirty,
    isValid,
    loadForEdit,
    mode,
    refresh,
    selected,
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

    try {
      await deactivateEspecialidad(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Especialidad desactivada." });

      const updated: Especialidad = { ...selected, estado: "INACTIVO" };
      await refresh();
      loadForEdit(updated);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
    }
  }, [loadForEdit, refresh, selected]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO";

  return {
    // data
    data,
    loading,
    notice,
    setNotice,

    // filters
    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPage(clampPerPage(n)),
    q,
    setQ,
    statusFilter,
    setStatusFilter,

    // form
    mode,
    selected,
    codigo,
    setCodigo,
    descripcion,
    setDescripcion,
    estado,
    setEstado,

    isValid,
    isDirty,
    canDeactivate,

    // actions
    refresh,
    resetToNew,
    loadForEdit,
    cancel,
    onSave,
    requestDeactivate,

    // confirm
    confirmDeactivateOpen,
    setConfirmDeactivateOpen,
    onDeactivateConfirmed,
  };
}
