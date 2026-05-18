import { useCrudListQuery } from "../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../shared/datagrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ContratanteLookup,
  IafaLookup,
  RecordStatus,
  TarifaLookup,
  TipoCliente,
} from "../../types/tiposClientes.types";

import {
  createTipoCliente,
  deactivateTipoCliente,
  getNextTipoClienteCodigo,
  listContratantesLookupActive,
  listIafasLookupActive,
  listTarifasLookupForTipoCliente,
  listTiposClientes,
  updateTipoCliente,
} from "../../services/tiposClientes.service";

import { toastService } from "../../../../shared/notifications";
import { getApiErrorMessage } from "../../../../shared/api/apiError";

export type Mode = "new" | "edit";
export type StatusFilter = "ALL" | RecordStatus;
export type Notice = { type: "success" | "error"; text: string } | null;


export function useTiposClientes() {
  const list = useCrudListQuery<TipoCliente>({
    listFn: useCallback(
      (params: DataGridFetchParams) =>
        listTiposClientes({
          page: params.page,
          per_page: params.per_page,
          q: params.q,
          status: params.status as RecordStatus | undefined,
          sort: params.sort,
          sort_dir: params.sort_dir,
        }),
      []
    ),
    errorMessage: "No se pudo cargar la lista de tipos de cliente.",
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


  const [tarifas, setTarifas] = useState<TarifaLookup[]>([]);
  const [contratantes, setContratantes] = useState<ContratanteLookup[]>([]);
  const [iafas, setIafas] = useState<IafaLookup[]>([]);

  const [lookupsLoading, setLookupsLoading] = useState(false);

  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<TipoCliente | null>(null);

  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [tarifaId, setTarifaId] = useState<number>(0);
  const [contratanteId, setContratanteId] = useState<number>(0);

  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    tarifaId: number;
    contratanteId: number;
    estado: RecordStatus;
  } | null>(null);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextTipoClienteCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLookupsLoading(true);
      try {
        const [tRes, cRes, iRes] = await Promise.all([
          listTarifasLookupForTipoCliente(),
          listContratantesLookupActive(),
          listIafasLookupActive(),
        ]);

        if (!alive) return;

        setTarifas(tRes);
        setContratantes(cRes);
        setIafas(iRes);
      } catch {
        if (!alive) return;

        setTarifas([]);
        setContratantes([]);
        setIafas([]);
      } finally {
        if (alive) setLookupsLoading(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (mode === "new") void fetchCodigoPreview();
  }, [mode, fetchCodigoPreview]);

  const selectedTarifa = useMemo(() => {
    if (!tarifaId) return null;
    return tarifas.find((t) => t.id === tarifaId) ?? null;
  }, [tarifaId, tarifas]);

  const iafaIdDerived = useMemo(() => {
    if (selectedTarifa?.iafa_id) return selectedTarifa.iafa_id;
    if (selected?.iafa_id) return selected.iafa_id;
    return 0;
  }, [selectedTarifa, selected]);

  const iafaRazonSocial = useMemo(() => {
    if (!iafaIdDerived) return "";
    const x = iafas.find((a) => a.id === iafaIdDerived);
    return x?.razon_social ?? "";
  }, [iafas, iafaIdDerived]);

  const descripcionPreview = useMemo(() => {
    const c = contratantes.find((x) => x.id === contratanteId) ?? null;
    const t = selectedTarifa;
    const left = (c?.razon_social ?? "").trim();
    const right = (t?.descripcion_tarifa ?? "").trim();
    if (!left || !right) return "";
    return `${left}/${right}`;
  }, [contratantes, contratanteId, selectedTarifa]);

  const isValid = useMemo(() => {
    if (!tarifaId || tarifaId <= 0) return false;
    if (!contratanteId || contratanteId <= 0) return false;
    if (!descripcionPreview.trim() || descripcionPreview.length > 255) return false;
    return true;
  }, [tarifaId, contratanteId, descripcionPreview]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    return o.tarifaId !== tarifaId || o.contratanteId !== contratanteId || o.estado !== estado;
  }, [mode, isValid, tarifaId, contratanteId, estado]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setTarifaId(0);
    setContratanteId(0);

    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: TipoCliente) => {
    setMode("edit");
    setSelected(x);

    setTarifaId(x.tarifa_id);
    setContratanteId(x.contratante_id);

    setEstado(x.estado);

    originalRef.current = {
      tarifaId: x.tarifa_id,
      contratanteId: x.contratante_id,
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

    setTarifaId(o.tarifaId);
    setContratanteId(o.contratanteId);
    setEstado(o.estado);

    setNotice(null);
  }, [mode, resetToNew, selected]);

  const onSave = useCallback(async () => {
    setNotice(null);

    if (!isValid) {
      setNotice({ type: "error", text: "Selecciona una tarifa y un contratante para formar el tipo de cliente." });
      toastService.showError("Selecciona una tarifa y un contratante para formar el tipo de cliente.");
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona un tipo de cliente para editar." });
      toastService.showError("Selecciona un tipo de cliente para editar.");
      return;
    }

    if (!isDirty) {
      setNotice({ type: "error", text: "No hay cambios para guardar." });
      toastService.showError("No hay cambios para guardar.");
      return;
    }

    const payloadBase = {
      tarifa_id: tarifaId,
      contratante_id: contratanteId,
    };

    setSaving(true);
    try {
      if (mode === "new") {
        await createTipoCliente({ ...payloadBase, estado });
        setNotice({ type: "success", text: "Tipo de cliente creado." });
        toastService.showSuccess("Tipo de cliente creado.");

        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
        return;
      }

      const res = await updateTipoCliente(selected!.id, { ...payloadBase, estado });
      setNotice({ type: "success", text: "Cambios guardados." });
      toastService.showSuccess("Cambios guardados.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar el tipo de cliente.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [isValid, mode, selected, isDirty, tarifaId, contratanteId, estado, refresh, loadForEdit, resetToNew]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona un tipo de cliente para desactivar." });
      toastService.showError("Selecciona un tipo de cliente para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona un tipo de cliente para desactivar." });
      toastService.showError("Selecciona un tipo de cliente para desactivar.");
      return;
    }

    setSaving(true);
    try {
      const res = await deactivateTipoCliente(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Tipo de cliente desactivado." });
      toastService.showSuccess("Tipo de cliente desactivado.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar el tipo de cliente.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [loadForEdit, refresh, selected]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO" && !saving;

  const selectedDescripcion = useMemo(() => {
    if (!selected) return "";
    return (selected.descripcion_tipo_cliente ?? "").trim();
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

    tarifas,
    contratantes,
    iafas,
    lookupsLoading,

    mode,
    selected,
    selectedDescripcion,

    codigo,

    tarifaId,
    setTarifaId,

    contratanteId,
    setContratanteId,

    iafaRazonSocial,
    descripcionPreview,

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
