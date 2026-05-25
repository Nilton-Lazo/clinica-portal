import { useCrudListQuery } from "../../../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../../../shared/datagrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ParamOption, RecordStatus, StatusFilter } from "../../types/paramOption.types";
import {
  createTipoDocumento,
  deactivateTipoDocumento,
  getNextTipoDocumentoCodigo,
  listTipoDocumento,
  updateTipoDocumento,
} from "../../services/tipoDocumento.service";
import { useToast } from "../../../../../../shared/feedback";
import { getApiErrorMessage } from "../../../../../../shared/api/apiError";
import { prepareFormText } from "../../../../../../shared/textInput/uppercaseTextInput";
export type Mode = "new" | "edit";
export type { StatusFilter };


export function useTipoDocumento() {
  const toast = useToast();
  const list = useCrudListQuery<ParamOption>({
    listFn: useCallback(
      (params: DataGridFetchParams) =>
        listTipoDocumento({
          page: params.page,
          per_page: params.per_page,
          q: params.q,
          status: params.status as RecordStatus | undefined,
          sort: params.sort,
          sort_dir: params.sort_dir,
        }),
      []
    ),
    errorMessage: "No se pudo cargar la lista de tipos de documento.",
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

  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<ParamOption | null>(null);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const originalRef = useRef<{ codigo: string; descripcion: string; estado: RecordStatus } | null>(null);

  useEffect(() => {
    if (mode !== "new" || codigo.trim()) return;
    let alive = true;
    (async () => {
      try {
        const res = await getNextTipoDocumentoCodigo();
        if (!alive) return;
        if (res.codigo) setCodigo(res.codigo);
      } catch { void 0; }
    })();
    return () => { alive = false; };
  }, [mode, codigo]);

  const isValid = useMemo(() => {
    const c = codigo.trim();
    const d = prepareFormText(descripcion);
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

  const onSave = useCallback(async () => {
    const c = codigo.trim();
    const d = prepareFormText(descripcion);
    if (!isValid) { toast.error("Completa código y descripción."); return; }
    if (mode === "edit" && !selected) { toast.error("Selecciona un tipo de documento para editar."); return; }
    if (!isDirty) { toast.error("No hay cambios para guardar."); return; }
    if (saving) return;
    setSaving(true);
    try {
      if (mode === "new") {
        await createTipoDocumento({ codigo: c, descripcion: d, estado });
        toast.success("Tipo de documento creado.");
        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
      } else {
        const res = await updateTipoDocumento(selected!.id, { codigo: c, descripcion: d, estado });
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
    if (selected.estado === "INACTIVO") {
      toast.error("El tipo de documento seleccionado ya está inactivo.");
      return;
    }
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await deactivateTipoDocumento(selected.id);
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
