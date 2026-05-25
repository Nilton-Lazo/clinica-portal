import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RecordStatus, TipoIafa } from "../../types/tiposIafas.types";
import { useCrudListQuery } from "../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../shared/datagrid";
import { toastService } from "../../../../shared/notifications";
import { getApiErrorMessage } from "../../../../shared/api/apiError";
import { prepareFormText } from "../../../../shared/textInput/uppercaseTextInput";
import { formatActionIssues } from "../../utils/actionFeedback";
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

export function useTiposIafas() {
  const list = useCrudListQuery<TipoIafa>({
    listFn: useCallback(
      (params: DataGridFetchParams) =>
        listTiposIafas({
          page: params.page,
          per_page: params.per_page,
          q: params.q,
          status: params.status as RecordStatus | undefined,
          sort: params.sort,
          sort_dir: params.sort_dir,
        }),
      []
    ),
    errorMessage: "No se pudo cargar la lista de tipos de IAFAS.",
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
  const [notice, setNotice] = useState<Notice>(null);

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
    const d = prepareFormText(descripcion);
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

  const onSave = useCallback(async () => {
    setNotice(null);

    if (!isValid) {
      const d = prepareFormText(descripcion);
      const issues: string[] = [];
      if (!d) issues.push("ingresa la descripción");
      else if (d.length > 120) issues.push("la descripción no debe superar 120 caracteres");
      const msg = formatActionIssues(
        mode === "new" ? "No se puede crear el tipo de IAFAS" : "No se puede guardar el tipo de IAFAS",
        issues
      );
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona un tipo de IAFAS para editar." });
      toastService.showError("Selecciona un tipo de IAFAS para editar.");
      return;
    }

    if (!isDirty) {
      const msg = "No hay cambios para guardar en este tipo de IAFAS.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }

    const payloadBase = {
      descripcion: prepareFormText(descripcion),
    };

    setSaving(true);
    try {
      if (mode === "new") {
        await createTipoIafa({ ...payloadBase, estado });
        setNotice({ type: "success", text: "Tipo de IAFAS creado." });
        toastService.showSuccess("Tipo de IAFAS creado.");

        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
        return;
      }

      const res = await updateTipoIafa(selected!.id, { ...payloadBase, estado });
      setNotice({ type: "success", text: "Cambios guardados." });
      toastService.showSuccess("Cambios guardados.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar el tipo de IAFAS.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [isValid, mode, selected, isDirty, descripcion, estado, refresh, loadForEdit, resetToNew]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona un tipo de IAFAS para desactivar." });
      toastService.showError("Selecciona un tipo de IAFAS para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") {
      const msg = "El tipo de IAFAS seleccionado ya está inactivo.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona un tipo de IAFAS para desactivar." });
      toastService.showError("Selecciona un tipo de IAFAS para desactivar.");
      return;
    }

    setSaving(true);
    try {
      const res = await deactivateTipoIafa(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Tipo de IAFAS desactivado." });
      toastService.showSuccess("Tipo de IAFAS desactivado.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar el tipo de IAFAS.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
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
