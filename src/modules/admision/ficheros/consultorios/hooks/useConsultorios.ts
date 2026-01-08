import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Consultorio, PaginatedResponse, RecordStatus } from "../../types/consultorios.types";

import {
  createConsultorio,
  deactivateConsultorio,
  listConsultorios,
  updateConsultorio,
} from "../../services/consultorios.service";

import { useDebouncedValue } from "../../especialidades/hooks/useDebouncedValue";
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

export function useConsultorios() {
  const [data, setData] = useState<PaginatedResponse<Consultorio>>({
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
  const [selected, setSelected] = useState<Consultorio | null>(null);

  const [abreviatura, setAbreviatura] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");
  const [esTerceros, setEsTerceros] = useState(false);

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    abreviatura: string;
    descripcion: string;
    estado: RecordStatus;
    esTerceros: boolean;
  } | null>(null);

  const isValid = useMemo(() => {
    const a = abreviatura.trim();
    const d = descripcion.trim();
    if (!a || !d) return false;
    if (a.length > 10) return false;
    if (d.length > 255) return false;
    return true;
  }, [abreviatura, descripcion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return (
      o.abreviatura !== abreviatura.trim() ||
      o.descripcion !== descripcion.trim() ||
      o.estado !== estado ||
      o.esTerceros !== esTerceros
    );
  }, [abreviatura, descripcion, estado, esTerceros, mode, isValid]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);
    setAbreviatura("");
    setDescripcion("");
    setEstado("ACTIVO");
    setEsTerceros(false);
    originalRef.current = null;
    setNotice(null);
  }, []);

  const loadForEdit = useCallback((x: Consultorio) => {
    setMode("edit");
    setSelected(x);
    setAbreviatura(x.abreviatura);
    setDescripcion(x.descripcion);
    setEstado(x.estado);
    setEsTerceros(Boolean(x.es_terceros));
    originalRef.current = {
      abreviatura: x.abreviatura,
      descripcion: x.descripcion,
      estado: x.estado,
      esTerceros: Boolean(x.es_terceros),
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

    setAbreviatura(o.abreviatura);
    setDescripcion(o.descripcion);
    setEstado(o.estado);
    setEsTerceros(o.esTerceros);
    setNotice(null);
  }, [mode, resetToNew, selected]);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      try {
        const res = await listConsultorios({
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
      setNotice({ type: "error", text: "Completa Abreviatura y Descripción correctamente." });
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
        const res = await createConsultorio({
          abreviatura: abreviatura.trim(),
          descripcion: descripcion.trim(),
          es_terceros: esTerceros,
          estado,
        });

        setNotice({ type: "success", text: "Consultorio creado." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateConsultorio(selected!.id, {
        abreviatura: abreviatura.trim(),
        descripcion: descripcion.trim(),
        es_terceros: esTerceros,
        estado,
      });

      setNotice({ type: "success", text: "Cambios guardados." });
      await refresh();

      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar.";
      setNotice({ type: "error", text: msg });
    }
  }, [abreviatura, descripcion, esTerceros, estado, isDirty, isValid, loadForEdit, mode, refresh, selected]);

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
      await deactivateConsultorio(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Consultorio desactivado." });

      const updated: Consultorio = { ...selected, estado: "INACTIVO" };
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
    data,
    loading,
    notice,

    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPage(clampPerPage(n)),
    q,
    setQ,
    statusFilter,
    setStatusFilter,

    mode,
    selected,

    abreviatura,
    setAbreviatura,
    descripcion,
    setDescripcion,
    estado,
    setEstado,
    esTerceros,
    setEsTerceros,

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
