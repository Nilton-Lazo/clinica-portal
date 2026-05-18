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
} from "../../services/medioPagoCaja.service";
import { useCrudListQuery } from "../../../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../../../shared/datagrid";
import { useToast } from "../../../../../../shared/feedback";
import { getApiErrorMessage } from "../../../../../../shared/api/apiError";
import { prepareFormText } from "../../../../../../shared/textInput/uppercaseTextInput";
export type Mode = "new" | "edit";
export type { StatusFilter };

export function useMedioPagoCaja() {
  const toast = useToast();
  const list = useCrudListQuery<MedioPagoCajaItem>({
    listFn: useCallback(
      (params: DataGridFetchParams) =>
        listMedioPagoCaja({
          page: params.page,
          per_page: params.per_page,
          q: params.q,
          status: params.status as RecordStatus | undefined,
          sort: params.sort,
          sort_dir: params.sort_dir,
        }),
      []
    ),
    errorMessage: "No se pudo cargar la lista de medios de pago.",
    initialSort: "codigo",
  });

  const {
    data,
    loading,
    page,
    setPage,
    perPage,
    setPerPage,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    sort,
    sortDir,
    toggleSort,
    refresh,
  } = list;

  const [formasPago, setFormasPago] = useState<FormaPagoCajaOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<MedioPagoCajaItem | null>(null);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");
  const [formaPagoId, setFormaPagoId] = useState("");
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const originalRef = useRef<{ codigo: string; descripcion: string; estado: RecordStatus; forma_pago_id: string } | null>(null);

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
    setPerPage,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    sort,
    sortDir,
    toggleSort,
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
