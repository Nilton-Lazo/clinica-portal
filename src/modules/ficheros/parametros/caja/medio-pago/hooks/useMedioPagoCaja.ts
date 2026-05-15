import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RecordStatus, StatusFilter } from "../../../emergencia/types/paramOption.types";
import {
  createMedioPagoCaja,
  deactivateMedioPagoCaja,
  getNextMedioPagoCajaCodigo,
  listFormasPagoActivas,
  listMedioPagoCaja,
  updateMedioPagoCaja,
  type FormaPagoCajaOption,
  type MedioPagoCajaItem,
  type MedioPagoCajaListResponse,
} from "../../services/medioPagoCaja.service";
import { useDebouncedValue } from "../../../../../../shared/hooks/useDebouncedValue";
import { useToast } from "../../../../../../shared/feedback";
import { getApiErrorMessage } from "../../../../../../shared/api/apiError";
import { prepareFormText } from "../../../../../../shared/textInput/uppercaseTextInput";
export type Mode = "new" | "edit";
export type { StatusFilter };

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

export function useMedioPagoCaja() {
  const toast = useToast();
  const [data, setData] = useState<MedioPagoCajaListResponse>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });
  const [formasPago, setFormasPago] = useState<FormaPagoCajaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(50);
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<MedioPagoCajaItem | null>(null);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");
  const [formaPagoId, setFormaPagoId] = useState("");
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const originalRef = useRef<{ codigo: string; descripcion: string; estado: RecordStatus; forma_pago_id: string } | null>(null);
  const lastToastedErrorRef = useRef<string | null>(null);

  const loadFormasPago = useCallback(async () => {
    try {
      const rows = await listFormasPagoActivas();
      setFormasPago(rows);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudieron cargar las formas de pago activas."));
    }
  }, [toast]);

  useEffect(() => {
    void loadFormasPago();
  }, [loadFormasPago]);

  useEffect(() => {
    if (mode !== "new" || codigo.trim()) return;
    let alive = true;
    (async () => {
      try {
        const res = await getNextMedioPagoCajaCodigo();
        if (!alive) return;
        if (res.codigo) setCodigo(res.codigo);
      } catch { void 0; }
    })();
    return () => {
      alive = false;
    };
  }, [mode, codigo]);

  const isValid = useMemo(() => {
    const c = codigo.trim();
    const d = prepareFormText(descripcion);
    if (!d || d.length > 255) return false;
    if (!c || c.length > 50) return false;
    if (!formaPagoId.trim()) return false;
    return true;
  }, [codigo, descripcion, formaPagoId]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return o.codigo !== codigo.trim() || o.descripcion !== descripcion.trim() || o.estado !== estado || o.forma_pago_id !== formaPagoId;
  }, [codigo, descripcion, estado, formaPagoId, mode, isValid]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);
    setCodigo("");
    setDescripcion("");
    setEstado("ACTIVO");
    setFormaPagoId("");
    originalRef.current = null;
  }, []);

  const loadForEdit = useCallback((x: MedioPagoCajaItem) => {
    setMode("edit");
    setSelected(x);
    setCodigo(x.codigo);
    setDescripcion(x.descripcion);
    setEstado(x.estado);
    const firstForma = (x.forma_pago_ids ?? [])[0];
    setFormaPagoId(firstForma ? String(firstForma) : "");
    originalRef.current = {
      codigo: x.codigo,
      descripcion: x.descripcion,
      estado: x.estado,
      forma_pago_id: firstForma ? String(firstForma) : "",
    };
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
    setFormaPagoId(o.forma_pago_id);
    toast.success("Cambios cancelados.");
  }, [mode, resetToNew, selected, toast]);

  const refresh = useCallback(async (next?: { page?: number; perPage?: number }) => {
    setLoading(true);
    const targetPage = next?.page ?? page;
    const targetPerPage = next?.perPage ?? perPage;
    try {
      const res = await listMedioPagoCaja({
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      lastToastedErrorRef.current = null;
      setData(res);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo cargar la lista de medios de pago.");
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
    if (changed && page !== 1) {
      setPage(1);
      return;
    }
    void refresh();
  }, [page, perPage, qDebounced, statusFilter, refresh]);

  const onSave = useCallback(async () => {
    const c = codigo.trim();
    const d = prepareFormText(descripcion);
    const formaId = Number(formaPagoId);
    const ids = Number.isFinite(formaId) && formaId > 0 ? [formaId] : [];
    if (!isValid) {
      toast.error("Completa código, descripción y forma de pago.");
      return;
    }
    if (mode === "edit" && !selected) {
      toast.error("Selecciona un medio de pago para editar.");
      return;
    }
    if (!isDirty) {
      toast.error("No hay cambios para guardar.");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (mode === "new") {
        await createMedioPagoCaja({ codigo: c, descripcion: d, estado, forma_pago_ids: ids });
        toast.success("Medio de pago creado.");
        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
      } else {
        const res = await updateMedioPagoCaja(selected!.id, { codigo: c, descripcion: d, estado, forma_pago_ids: ids });
        toast.success("Cambios guardados.");
        await refresh();
        loadForEdit(res.data);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudo guardar el medio de pago."));
    } finally {
      setSaving(false);
    }
  }, [codigo, descripcion, formaPagoId, isValid, mode, selected, isDirty, saving, estado, toast, refresh, resetToNew, loadForEdit]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      toast.error("Selecciona un medio de pago para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await deactivateMedioPagoCaja(selected.id);
      setConfirmDeactivateOpen(false);
      toast.success("Medio de pago desactivado.");
      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      setConfirmDeactivateOpen(false);
      toast.error(getApiErrorMessage(e, "No se pudo desactivar el medio de pago."));
    } finally {
      setSaving(false);
    }
  }, [selected, saving, toast, refresh, loadForEdit]);

  return {
    data,
    formasPago,
    loading,
    saving,
    refresh,
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
    formaPagoId,
    setFormaPagoId,
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
