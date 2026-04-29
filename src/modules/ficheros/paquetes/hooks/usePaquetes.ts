import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Paquete, PaquetesQuery, PaginatedResponse, RecordStatus, TarifaLookupPaquete } from "../../types/paquetes.types";
import {
  createPaquete,
  deactivatePaquete,
  getNextPaqueteCodigo,
  listPaquetes,
  listTarifasOperativasPaquete,
  updatePaquete,
} from "../../services/paquetes.service";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import { toastService } from "../../../../shared/notifications";
import { getApiErrorMessage } from "../../../../shared/api/apiError";
import { PRECISION_DECIMAL, roundToPrecision } from "../../../../shared/constants/decimalPrecision";

export type Mode = "new" | "edit";
export type StatusFilter = "ALL" | RecordStatus;
export type Notice = { type: "success" | "error"; text: string } | null;

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

function toNullIfBlank(s: string): string | null {
  const x = s.trim();
  return x ? x : null;
}

function normalizeDateForInput(s: string | null | undefined): string {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length >= 10 ? t.slice(0, 10) : "";
}

function isDateIsoRequired(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(t);
}

function parsePrecioInput(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return roundToPrecision(n, PRECISION_DECIMAL);
}

function formatPrecioForInput(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(roundToPrecision(n, PRECISION_DECIMAL));
}

function normalizeDiasPayload(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function isDiasOptionalValid(s: string): boolean {
  const t = s.trim();
  if (t === "") return true;
  if (!/^\d+$/.test(t)) return false;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n >= 0;
}

export function usePaquetes() {
  const [data, setData] = useState<PaginatedResponse<Paquete>>({
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
  const [selected, setSelected] = useState<Paquete | null>(null);

  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [descripcion, setDescripcion] = useState("");
  const [tarifaId, setTarifaId] = useState(0);
  const [precioSinIgv, setPrecioSinIgv] = useState("");
  const [vigenciaActual, setVigenciaActual] = useState("");
  const [diasHospitalizacion, setDiasHospitalizacion] = useState("0");
  const [cuentaContabilidad, setCuentaContabilidad] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [tarifas, setTarifas] = useState<TarifaLookupPaquete[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    descripcion: string;
    tarifaId: number;
    precioSinIgv: number;
    vigenciaActual: string;
    diasHospitalizacion: number | null;
    cuentaContabilidad: string | null;
    estado: RecordStatus;
  } | null>(null);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextPaqueteCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    if (mode === "new") void fetchCodigoPreview();
  }, [mode, fetchCodigoPreview]);

  useEffect(() => {
    let cancelled = false;
    setLookupsLoading(true);
    listTarifasOperativasPaquete()
      .then((rows) => {
        if (!cancelled) setTarifas(rows);
      })
      .catch(() => {
        if (!cancelled) setTarifas([]);
      })
      .finally(() => {
        if (!cancelled) setLookupsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isValid = useMemo(() => {
    const d = descripcion.trim();
    if (!d || d.length > 255) return false;
    if (!tarifaId || tarifaId <= 0) return false;
    const p = parsePrecioInput(precioSinIgv);
    if (p === null || p < 0) return false;
    if (!isDateIsoRequired(vigenciaActual)) return false;
    if (!isDiasOptionalValid(diasHospitalizacion)) return false;
    if (cuentaContabilidad.trim().length > 255) return false;
    return true;
  }, [descripcion, tarifaId, precioSinIgv, vigenciaActual, diasHospitalizacion, cuentaContabilidad]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    const p = parsePrecioInput(precioSinIgv);
    const precioNum = p !== null ? roundToPrecision(p, PRECISION_DECIMAL) : -1;
    return (
      o.descripcion !== descripcion.trim() ||
      o.tarifaId !== tarifaId ||
      o.precioSinIgv !== precioNum ||
      o.vigenciaActual !== vigenciaActual.trim() ||
      o.diasHospitalizacion !== normalizeDiasPayload(diasHospitalizacion) ||
      o.cuentaContabilidad !== toNullIfBlank(cuentaContabilidad) ||
      o.estado !== estado
    );
  }, [mode, isValid, descripcion, tarifaId, precioSinIgv, vigenciaActual, diasHospitalizacion, cuentaContabilidad, estado]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setDescripcion("");
    setTarifaId(0);
    setPrecioSinIgv("");
    setVigenciaActual("");
    setDiasHospitalizacion("0");
    setCuentaContabilidad("");
    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: Paquete) => {
    setMode("edit");
    setSelected(x);

    setDescripcion(x.descripcion);
    setTarifaId(x.tarifa_id);
    setPrecioSinIgv(formatPrecioForInput(x.precio_sin_igv));
    setVigenciaActual(normalizeDateForInput(x.vigencia_actual));
    setDiasHospitalizacion(
      x.dias_hospitalizacion === null || x.dias_hospitalizacion === undefined ? "" : String(x.dias_hospitalizacion)
    );
    setCuentaContabilidad(x.cuenta_contabilidad ?? "");
    setEstado(x.estado);

    const p = roundToPrecision(x.precio_sin_igv, PRECISION_DECIMAL);
    originalRef.current = {
      descripcion: x.descripcion,
      tarifaId: x.tarifa_id,
      precioSinIgv: p,
      vigenciaActual: normalizeDateForInput(x.vigencia_actual),
      diasHospitalizacion: x.dias_hospitalizacion ?? null,
      cuentaContabilidad: x.cuenta_contabilidad ?? null,
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
    setTarifaId(o.tarifaId);
    setPrecioSinIgv(formatPrecioForInput(o.precioSinIgv));
    setVigenciaActual(o.vigenciaActual);
    setDiasHospitalizacion(o.diasHospitalizacion === null ? "" : String(o.diasHospitalizacion));
    setCuentaContabilidad(o.cuentaContabilidad ?? "");
    setEstado(o.estado);

    setNotice(null);
  }, [mode, resetToNew, selected]);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      const query: PaquetesQuery = {
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() ? qDebounced.trim() : undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      };

      try {
        const res = await listPaquetes(query);
        setData(res);
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudo cargar la lista de paquetes.");
        setNotice({ type: "error", text: msg });
        toastService.showError(msg);
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

    const filtersChanged = !prev || prev.q !== next.q || prev.status !== next.status || prev.perPage !== next.perPage;
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
      const msg = !isDateIsoRequired(vigenciaActual)
        ? "Indica una vigencia actual válida (fecha)."
        : "Completa los datos del paquete correctamente.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona un paquete para editar." });
      toastService.showError("Selecciona un paquete para editar.");
      return;
    }

    if (!isDirty) {
      setNotice({ type: "error", text: "No hay cambios para guardar." });
      toastService.showError("No hay cambios para guardar.");
      return;
    }

    const precio = parsePrecioInput(precioSinIgv);
    if (precio === null) {
      setNotice({ type: "error", text: "Precio sin IGV inválido." });
      toastService.showError("Precio sin IGV inválido.");
      return;
    }

    const payloadBase = {
      descripcion: descripcion.trim(),
      tarifa_id: tarifaId,
      precio_sin_igv: precio,
      vigencia_actual: vigenciaActual.trim(),
      dias_hospitalizacion: normalizeDiasPayload(diasHospitalizacion),
      cuenta_contabilidad: toNullIfBlank(cuentaContabilidad),
    };

    setSaving(true);
    try {
      if (mode === "new") {
        await createPaquete({ ...payloadBase, estado });
        setNotice({ type: "success", text: "Paquete creado." });
        toastService.showSuccess("Paquete creado.");

        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
        return;
      }

      const res = await updatePaquete(selected!.id, { ...payloadBase, estado });
      setNotice({ type: "success", text: "Cambios guardados." });
      toastService.showSuccess("Cambios guardados.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar el paquete.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    isValid,
    mode,
    selected,
    isDirty,
    descripcion,
    tarifaId,
    precioSinIgv,
    vigenciaActual,
    diasHospitalizacion,
    cuentaContabilidad,
    estado,
    refresh,
    loadForEdit,
    resetToNew,
  ]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona un paquete para desactivar." });
      toastService.showError("Selecciona un paquete para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona un paquete para desactivar." });
      toastService.showError("Selecciona un paquete para desactivar.");
      return;
    }

    setSaving(true);
    try {
      const res = await deactivatePaquete(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Paquete desactivado." });
      toastService.showSuccess("Paquete desactivado.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar el paquete.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [selected, refresh, loadForEdit]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO" && !saving;

  const selectedDescripcion = useMemo(() => {
    if (!selected) return "";
    return (selected.descripcion ?? "").trim();
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
    tarifaId,
    setTarifaId,
    tarifas,
    lookupsLoading,
    precioSinIgv,
    setPrecioSinIgv,
    vigenciaActual,
    setVigenciaActual,
    diasHospitalizacion,
    setDiasHospitalizacion,
    cuentaContabilidad,
    setCuentaContabilidad,
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
