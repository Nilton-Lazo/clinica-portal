import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Cirugia, RecordStatus } from "../../types/cirugias.types";

import {
  createCirugia,
  deactivateCirugia,
  getNextCirugiaCodigo,
  listCirugias,
  updateCirugia,
} from "../../services/cirugias.service";

import { useCrudListQuery } from "../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../shared/datagrid";
import { useToast } from "../../../../shared/feedback";
import { getApiErrorMessage } from "../../../../shared/api/apiError";
import { prepareFormText } from "../../../../shared/textInput/uppercaseTextInput";
export type Mode = "new" | "edit";
export type StatusFilter = "ALL" | RecordStatus;
export type Notice = { type: "success" | "error"; text: string } | null;

export function useCirugias() {
  const toast = useToast();
  const list = useCrudListQuery<Cirugia>({
    listFn: useCallback(
      (params: DataGridFetchParams) =>
        listCirugias({
          page: params.page,
          per_page: params.per_page,
          q: params.q,
          status: params.status as RecordStatus | undefined,
          sort: params.sort,
          sort_dir: params.sort_dir,
        }),
      []
    ),
    errorMessage: "No se pudo cargar la lista de cirugías.",
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
  const [selected, setSelected] = useState<Cirugia | null>(null);

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
        const res = await getNextCirugiaCodigo();
        if (!alive) return;
        setCodigo(res.codigo);
      } catch { void 0; }
    })();

    return () => {
      alive = false;
    };
  }, [mode, codigo]);

  const isValid = useMemo(() => {
    const c = codigo.trim();
    const d = prepareFormText(descripcion);

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

  const loadForEdit = useCallback((x: Cirugia) => {
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
    toast.success("Cambios cancelados.");
  }, [mode, resetToNew, selected, toast]);

  const onSave = useCallback(async () => {
    setNotice(null);

    const d = prepareFormText(descripcion);

    if (!isValid) {
      setNotice({ type: "error", text: "Completa la descripción de la cirugía correctamente." });
      toast.error("Completa la descripción de la cirugía correctamente.");
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona una cirugía para editar." });
      toast.error("Selecciona una cirugía para editar.");
      return;
    }

    if (!isDirty) {
      setNotice({ type: "error", text: "No hay cambios para guardar." });
      toast.error("No hay cambios para guardar.");
      return;
    }

    if (saving) return;

    setSaving(true);
    try {
      if (mode === "new") {
        await createCirugia({
          descripcion: d,
          estado,
        });

        setNotice({ type: "success", text: "Cirugía creada." });
        toast.success("Cirugía creada.");

        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
        return;
      }

      const res = await updateCirugia(selected!.id, {
        descripcion: d,
        estado,
      });

      setNotice({ type: "success", text: "Cambios guardados." });
      toast.success("Cambios guardados.");
      await refresh();

      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar la cirugía.");
      setNotice({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [descripcion, estado, isDirty, isValid, loadForEdit, mode, refresh, resetToNew, saving, selected, toast]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona una cirugía para desactivar." });
      toast.error("Selecciona una cirugía para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona una cirugía para desactivar." });
      toast.error("Selecciona una cirugía para desactivar.");
      return;
    }

    if (saving) return;

    setSaving(true);
    try {
      const res = await deactivateCirugia(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Cirugía desactivada." });
      toast.success("Cirugía desactivada.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar la cirugía.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [loadForEdit, refresh, saving, selected, toast]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO";

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
