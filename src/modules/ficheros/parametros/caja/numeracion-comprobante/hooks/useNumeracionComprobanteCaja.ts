import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RecordStatus, StatusFilter } from "../../../emergencia/types/paramOption.types";
import {
  createNumeracionComprobanteCaja,
  deactivateNumeracionComprobanteCaja,
  listNumeracionComprobanteCaja,
  listTiposDocumentoCajaActivos,
  updateNumeracionComprobanteCaja,
  type NumeracionComprobanteCajaItem,
  type TipoDocumentoCajaOption,
} from "../../services/numeracionComprobanteCaja.service";
import { useCrudListQuery } from "../../../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../../../shared/datagrid";
import { useToast } from "../../../../../../shared/feedback";
import { getApiErrorMessage } from "../../../../../../shared/api/apiError";
import {
  formatSerieNumeracion,
  isValidSerieNumeracion,
  parseSerieNumeracionInput,
  serieNumeracionFromStored,
} from "../serieNumeracion";

export type Mode = "new" | "edit";
export type { StatusFilter };

function formatNumero(n: number): string {
  const safe = Math.max(1, Math.min(9999999, Number.isFinite(n) ? Math.trunc(n) : 1));
  return String(safe).padStart(7, "0");
}

function parseNumero(v: string): number {
  const digits = (v ?? "").replace(/\D/g, "");
  if (!digits) return 1;
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(9999999, Math.trunc(n));
}

export function useNumeracionComprobanteCaja() {
  const toast = useToast();
  const list = useCrudListQuery<NumeracionComprobanteCajaItem>({
    listFn: useCallback(
      (params: DataGridFetchParams) =>
        listNumeracionComprobanteCaja({
          page: params.page,
          per_page: params.per_page,
          q: params.q,
          status: params.status as RecordStatus | undefined,
          sort: params.sort,
          sort_dir: params.sort_dir,
        }),
      []
    ),
    errorMessage: "No se pudo cargar la lista de numeraciones de comprobante.",
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

  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoCajaOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<NumeracionComprobanteCajaItem | null>(null);
  const [tipoDocumentoId, setTipoDocumentoId] = useState("");
  const [serie, setSerie] = useState("");
  const [numeroText, setNumeroText] = useState("0000001");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const originalRef = useRef<{
    tipo_documento_id: number;
    serie: string;
    numero: number;
    estado: RecordStatus;
  } | null>(null);
  const loadTiposDocumento = useCallback(async () => {
    try {
      const items = await listTiposDocumentoCajaActivos();
      setTiposDocumento(items);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudieron cargar los tipos de documento activos."));
    }
  }, [toast]);

  useEffect(() => {
    void loadTiposDocumento();
  }, [loadTiposDocumento]);

  const isValid = useMemo(() => {
    const td = Number(tipoDocumentoId);
    if (!tipoDocumentoId || !Number.isFinite(td) || td <= 0) return false;
    if (!isValidSerieNumeracion(serie)) return false;
    const n = parseNumero(numeroText);
    if (n < 1 || n > 9999999) return false;
    return true;
  }, [tipoDocumentoId, serie, numeroText]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return (
      o.tipo_documento_id !== Number(tipoDocumentoId) ||
      o.serie !== formatSerieNumeracion(serie) ||
      o.numero !== parseNumero(numeroText) ||
      o.estado !== estado
    );
  }, [tipoDocumentoId, serie, numeroText, estado, mode, isValid]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);
    setTipoDocumentoId("");
    setSerie("");
    setNumeroText("0000001");
    setEstado("ACTIVO");
    originalRef.current = null;
  }, []);

  const loadForEdit = useCallback((x: NumeracionComprobanteCajaItem) => {
    setMode("edit");
    setSelected(x);
    setTipoDocumentoId(String(x.tipo_documento_id));
    setSerie(serieNumeracionFromStored(x.serie));
    setNumeroText(formatNumero(x.numero));
    setEstado(x.estado);
    originalRef.current = {
      tipo_documento_id: x.tipo_documento_id,
      serie: x.serie,
      numero: x.numero,
      estado: x.estado,
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
    setTipoDocumentoId(String(o.tipo_documento_id));
    setSerie(o.serie);
    setNumeroText(formatNumero(o.numero));
    setEstado(o.estado);
    toast.success("Cambios cancelados.");
  }, [mode, resetToNew, selected, toast]);

  const onNumeroBlur = useCallback(() => {
    setNumeroText(formatNumero(parseNumero(numeroText)));
  }, [numeroText]);

  const onSerieBlur = useCallback(() => {
    setSerie((prev) => formatSerieNumeracion(prev));
  }, []);

  const onSave = useCallback(async () => {
    const td = Number(tipoDocumentoId);
    const s = formatSerieNumeracion(serie);
    const n = parseNumero(numeroText);

    if (!isValid || !s) {
      toast.error("Completa tipo de documento, serie (1 a 3 dígitos) y número.");
      return;
    }
    if (mode === "edit" && !selected) {
      toast.error("Selecciona una numeración de comprobante para editar.");
      return;
    }
    if (!isDirty) {
      toast.error("No hay cambios para guardar.");
      return;
    }
    if (saving) return;

    setSerie(s);
    setNumeroText(formatNumero(n));
    setSaving(true);
    try {
      if (mode === "new") {
        await createNumeracionComprobanteCaja({
          tipo_documento_id: td,
          serie: s,
          numero: n,
          estado,
        });
        toast.success("Numeración de comprobante creada.");
        setPage(1);
        await refresh();
        resetToNew();
      } else {
        const res = await updateNumeracionComprobanteCaja(selected!.id, {
          tipo_documento_id: td,
          serie: s,
          numero: n,
          estado,
        });
        toast.success("Cambios guardados.");
        await refresh();
        loadForEdit(res.data);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudo guardar la numeración de comprobante."));
    } finally {
      setSaving(false);
    }
  }, [tipoDocumentoId, serie, numeroText, isValid, mode, selected, isDirty, saving, estado, toast, refresh, resetToNew, loadForEdit]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      toast.error("Selecciona una numeración de comprobante para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await deactivateNumeracionComprobanteCaja(selected.id);
      setConfirmDeactivateOpen(false);
      toast.success("Numeración de comprobante desactivada.");
      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      setConfirmDeactivateOpen(false);
      toast.error(getApiErrorMessage(e, "No se pudo desactivar la numeración de comprobante."));
    } finally {
      setSaving(false);
    }
  }, [selected, saving, toast, refresh, loadForEdit]);

  return {
    data,
    tiposDocumento,
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
    tipoDocumentoId,
    setTipoDocumentoId,
    serie,
    setSerie: (v: string) => setSerie(parseSerieNumeracionInput(v)),
    numeroText,
    setNumeroText,
    onSerieBlur,
    onNumeroBlur,
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
