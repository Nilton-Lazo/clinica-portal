import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RecordStatus, StatusFilter } from "../../../emergencia/types/paramOption.types";
import {
  createNumeracionComprobanteCaja,
  deactivateNumeracionComprobanteCaja,
  listNumeracionComprobanteCaja,
  listTiposDocumentoCajaActivos,
  updateNumeracionComprobanteCaja,
  type NumeracionComprobanteCajaItem,
  type NumeracionComprobanteCajaListResponse,
  type TipoDocumentoCajaOption,
} from "../../services/numeracionComprobanteCaja.service";
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
  const [data, setData] = useState<NumeracionComprobanteCajaListResponse>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoCajaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(50);
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
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
  const lastToastedErrorRef = useRef<string | null>(null);

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
    const s = serie.trim();
    if (!s || s.length > 20) return false;
    const n = parseNumero(numeroText);
    if (n < 1 || n > 9999999) return false;
    return true;
  }, [tipoDocumentoId, serie, numeroText]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return (
      o.tipo_documento_id !== Number(tipoDocumentoId) ||
      o.serie !== serie.trim().toUpperCase() ||
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
    setSerie(x.serie);
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

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;
      try {
        const res = await listNumeracionComprobanteCaja({
          page: targetPage,
          per_page: targetPerPage,
          q: qDebounced.trim() || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });
        lastToastedErrorRef.current = null;
        setData(res);
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudo cargar la lista de numeraciones de comprobante.");
        if (lastToastedErrorRef.current !== msg) {
          lastToastedErrorRef.current = msg;
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, qDebounced, statusFilter, toast]
  );

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

  const onNumeroBlur = useCallback(() => {
    setNumeroText(formatNumero(parseNumero(numeroText)));
  }, [numeroText]);

  const onSave = useCallback(async () => {
    const td = Number(tipoDocumentoId);
    const s = serie.trim().toUpperCase();
    const n = parseNumero(numeroText);

    if (!isValid) {
      toast.error("Completa tipo de documento, serie y número.");
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
        await refresh({ page: 1 });
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
    tipoDocumentoId,
    setTipoDocumentoId,
    serie,
    setSerie,
    numeroText,
    setNumeroText,
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
