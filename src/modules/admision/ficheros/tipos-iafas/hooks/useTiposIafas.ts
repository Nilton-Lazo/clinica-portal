import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PaginatedResponse, RecordStatus, TipoIafa, TiposIafasQuery } from "../../types/tiposIafas.types";
import { useDebouncedValue } from "../../../../../shared/hooks/useDebouncedValue";
import type { ApiError } from "../../../../../shared/api/apiError";
import {
  createTipoIafa,
  deactivateTipoIafa,
  getNextTipoIafaCodigo,
  listTiposIafas,
  updateTipoIafa,
} from "../../services/tiposIafas.service";

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

export function useTiposIafas() {
  const [data, setData] = useState<PaginatedResponse<TipoIafa>>({
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
  const [selected, setSelected] = useState<TipoIafa | null>(null);

  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{ descripcion: string; estado: RecordStatus } | null>(null);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextTipoIafaCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    if (mode === "new") void fetchCodigoPreview();
  }, [mode, fetchCodigoPreview]);

  const isValid = useMemo(() => {
    const d = descripcion.trim();
    if (!d) return false;
    if (d.length > 120) return false;
    return true;
  }, [descripcion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return o.descripcion !== descripcion.trim() || o.estado !== estado;
  }, [mode, isValid, descripcion, estado]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setDescripcion("");
    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: TipoIafa) => {
    setMode("edit");
    setSelected(x);

    setDescripcion(x.descripcion);
    setEstado(x.estado);

    originalRef.current = {
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

      const query: TiposIafasQuery = {
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() ? qDebounced.trim() : undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      };

      try {
        const res = await listTiposIafas(query);
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

    const payloadBase = {
      descripcion: descripcion.trim(),
    };

    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createTipoIafa({ ...payloadBase, estado });
        setNotice({ type: "success", text: "Tipo de IAFAS creado." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateTipoIafa(selected!.id, { ...payloadBase, estado });
      setNotice({ type: "success", text: "Cambios guardados." });

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar.";
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [isValid, mode, selected, isDirty, descripcion, estado, refresh, loadForEdit]);

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
      const res = await deactivateTipoIafa(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Tipo de IAFAS desactivado." });

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

  const selectedDescripcion = useMemo(() => {
    return (selected?.descripcion ?? "").trim();
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

    mode,
    selected,
    selectedDescripcion,

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
