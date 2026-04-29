import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ParamOption, PaginatedResponse, RecordStatus, StatusFilter } from "../../../emergencia/types/paramOption.types";
import {
  createTipoDocumentoCaja,
  deactivateTipoDocumentoCaja,
  getNextTipoDocumentoCajaCodigo,
  listTipoDocumentoCaja,
  updateTipoDocumentoCaja,
} from "../../services/tipoDocumentoCaja.service";
import { useDebouncedValue } from "../../../../../../shared/hooks/useDebouncedValue";
import { useToast } from "../../../../../../shared/feedback";
import { getApiErrorMessage } from "../../../../../../shared/api/apiError";

export type Mode = "new" | "edit";
export type { StatusFilter };

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

export function useTipoDocumentoCaja() {
  const toast = useToast();
  const [data, setData] = useState<PaginatedResponse<ParamOption>>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(50);
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<ParamOption | null>(null);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const originalRef = useRef<{ codigo: string; descripcion: string; estado: RecordStatus } | null>(null);
  const lastToastedErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== "new" || codigo.trim()) return;
    let alive = true;
    (async () => {
      try {
        const res = await getNextTipoDocumentoCajaCodigo();
        if (!alive) return;
        if (res.codigo) setCodigo(res.codigo);
      } catch {}
    })();
    return () => { alive = false; };
  }, [mode, codigo]);

  const isValid = useMemo(() => {
    const c = codigo.trim();
    const d = descripcion.trim();
    if (!d || d.length > 255) return false;
    if (!c || c.length > 50) return false;
    return true;
  }, [codigo, descripcion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return o.codigo !== codigo.trim() || o.descripcion !== descripcion.trim() || o.estado !== estado;
  }, [codigo, descripcion, estado, mode, isValid]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);
    setCodigo("");
    setDescripcion("");
    setEstado("ACTIVO");
    originalRef.current = null;
  }, []);

  const loadForEdit = useCallback((x: ParamOption) => {
    setMode("edit");
    setSelected(x);
    setCodigo(x.codigo);
    setDescripcion(x.descripcion);
    setEstado(x.estado);
    originalRef.current = { codigo: x.codigo, descripcion: x.descripcion, estado: x.estado };
  }, []);

  const cancel = useCallback(() => {
    if (mode === "new") { resetToNew(); return; }
    const o = originalRef.current;
    if (!o || !selected) { resetToNew(); return; }
    setCodigo(o.codigo);
    setDescripcion(o.descripcion);
    setEstado(o.estado);
    toast.success("Cambios cancelados.");
  }, [mode, resetToNew, selected, toast]);

  const refresh = useCallback(async (next?: { page?: number; perPage?: number }) => {
    setLoading(true);
    const targetPage = next?.page ?? page;
    const targetPerPage = next?.perPage ?? perPage;
    try {
      const res = await listTipoDocumentoCaja({
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      lastToastedErrorRef.current = null;
      setData(res);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo cargar la lista de tipos de documento de caja.");
      if (lastToastedErrorRef.current !== msg) {
        lastToastedErrorRef.current = msg;
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [page, perPage, qDebounced, statusFilter, toast]);

  const prevFiltersRef = useRef<{ q: string; status: StatusFilter; perPage: number } | null>(null);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qDebounced, status: statusFilter, perPage };
    const changed = !prev || prev.q !== next.q || prev.status !== next.status || prev.perPage !== next.perPage;
    prevFiltersRef.current = next;
    if (changed && page !== 1) { setPage(1); return; }
    void refresh();
  }, [page, perPage, qDebounced, statusFilter, refresh]);

  const onSave = useCallback(async () => {
    const c = codigo.trim();
    const d = descripcion.trim();
    if (!isValid) { toast.error("Completa código y descripción."); return; }
    if (mode === "edit" && !selected) { toast.error("Selecciona un tipo de documento para editar."); return; }
    if (!isDirty) { toast.error("No hay cambios para guardar."); return; }
    if (saving) return;
    setSaving(true);
    try {
      if (mode === "new") {
        await createTipoDocumentoCaja({ codigo: c, descripcion: d, estado });
        toast.success("Tipo de documento creado.");
        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
      } else {
        const res = await updateTipoDocumentoCaja(selected!.id, { codigo: c, descripcion: d, estado });
        toast.success("Cambios guardados.");
        await refresh();
        loadForEdit(res.data);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudo guardar el tipo de documento."));
    } finally {
      setSaving(false);
    }
  }, [codigo, descripcion, estado, isDirty, isValid, loadForEdit, mode, refresh, resetToNew, saving, selected, toast]);

  const requestDeactivate = useCallback(() => {
    if (!selected) { toast.error("Selecciona un tipo de documento para desactivar."); return; }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await deactivateTipoDocumentoCaja(selected.id);
      setConfirmDeactivateOpen(false);
      toast.success("Tipo de documento desactivado.");
      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      setConfirmDeactivateOpen(false);
      toast.error(getApiErrorMessage(e, "No se pudo desactivar el tipo de documento."));
    } finally {
      setSaving(false);
    }
  }, [loadForEdit, refresh, saving, selected, toast]);

  return {
    data,
    loading,
    saving,
    page,
    setPage,
    perPage: perPage,
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
    canDeactivate: Boolean(selected?.estado !== "INACTIVO"),
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
