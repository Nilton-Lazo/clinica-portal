import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormaPagoCajaOption } from "../../services/medioPagoCaja.service";
import { listFormasPagoActivas } from "../../services/medioPagoCaja.service";
import type { RecordStatus, StatusFilter } from "../../../emergencia/types/paramOption.types";
import {
  createBancoTarjetaCaja,
  deactivateBancoTarjetaCaja,
  getNextBancoTarjetaCajaCodigo,
  listBancoTarjetaCaja,
  listMediosDisponiblesBancoTarjeta,
  updateBancoTarjetaCaja,
  type BancoTarjetaCajaItem,
  type BancoTarjetaCajaListResponse,
  type MedioDisponibleBancoTarjeta,
} from "../../services/bancoTarjetaCaja.service";
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

function sortedKey(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(",");
}

export function useBancoTarjetaCaja() {
  const toast = useToast();
  const [data, setData] = useState<BancoTarjetaCajaListResponse>({
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
  const [selected, setSelected] = useState<BancoTarjetaCajaItem | null>(null);
  const selectedRef = useRef<BancoTarjetaCajaItem | null>(null);
  selectedRef.current = selected;

  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");
  const [formaPagoIds, setFormaPagoIds] = useState<number[]>([]);
  const [medioPagoIds, setMedioPagoIds] = useState<number[]>([]);
  const medioPagoIdsRef = useRef<number[]>([]);
  medioPagoIdsRef.current = medioPagoIds;

  const [formasPago, setFormasPago] = useState<FormaPagoCajaOption[]>([]);
  const [mediosDisponibles, setMediosDisponibles] = useState<MedioDisponibleBancoTarjeta[]>([]);
  const [loadingMedios, setLoadingMedios] = useState(false);

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const originalRef = useRef<{
    codigo: string;
    descripcion: string;
    estado: RecordStatus;
    formas: string;
    medios: string;
  } | null>(null);
  const lastToastedErrorRef = useRef<string | null>(null);
  const fetchMediosGen = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listFormasPagoActivas();
        if (!alive) return;
        setFormasPago(rows);
      } catch {
        if (!alive) return;
        setFormasPago([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "new" || codigo.trim()) return;
    let alive = true;
    (async () => {
      try {
        const res = await getNextBancoTarjetaCajaCodigo();
        if (!alive) return;
        if (res.codigo) setCodigo(res.codigo);
      } catch { void 0; }
    })();
    return () => {
      alive = false;
    };
  }, [mode, codigo]);

  useEffect(() => {
    const gen = ++fetchMediosGen.current;
    if (formaPagoIds.length === 0) {
      setMediosDisponibles([]);
      setMedioPagoIds([]);
      setLoadingMedios(false);
      return;
    }

    let alive = true;
    setLoadingMedios(true);
    (async () => {
      try {
        const rows = await listMediosDisponiblesBancoTarjeta(formaPagoIds);
        if (!alive || gen !== fetchMediosGen.current) return;
        const byId = new Map(rows.map((r) => [r.id, r]));
        const extras: MedioDisponibleBancoTarjeta[] = [];
        const sel = selectedRef.current;
        for (const id of medioPagoIdsRef.current) {
          if (!byId.has(id)) {
            if (sel && sel.medio_pago_ids.includes(id)) {
              const ix = sel.medio_pago_ids.indexOf(id);
              extras.push({
                id,
                codigo: "—",
                descripcion: sel.medio_pago_labels[ix] ?? `Medio #${id}`,
                estado: "ACTIVO",
              });
            }
          }
        }
        const merged = [...rows, ...extras];
        setMediosDisponibles(merged);
        const allowed = new Set(merged.map((m) => m.id));
        setMedioPagoIds((prev) => prev.filter((id) => allowed.has(id)));
      } catch (e) {
        if (!alive || gen !== fetchMediosGen.current) return;
        toast.error(getApiErrorMessage(e, "No se pudieron cargar los medios de pago para la forma seleccionada."));
        setMediosDisponibles([]);
      } finally {
        if (alive && gen === fetchMediosGen.current) setLoadingMedios(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [formaPagoIds, mode, selected, toast]);

  const isValid = useMemo(() => {
    const c = codigo.trim();
    const d = prepareFormText(descripcion);
    if (!d || d.length > 255) return false;
    if (!c || c.length > 50) return false;
    if (formaPagoIds.length !== 1) return false;
    if (medioPagoIds.length !== 1) return false;
    const allowed = new Set(mediosDisponibles.map((m) => m.id));
    if (!medioPagoIds.every((id) => allowed.has(id))) return false;
    return true;
  }, [codigo, descripcion, formaPagoIds.length, medioPagoIds, mediosDisponibles]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return (
      o.codigo !== codigo.trim() ||
      o.descripcion !== descripcion.trim() ||
      o.estado !== estado ||
      o.formas !== sortedKey(formaPagoIds) ||
      o.medios !== sortedKey(medioPagoIds)
    );
  }, [codigo, descripcion, estado, formaPagoIds, medioPagoIds, isValid, mode]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);
    setCodigo("");
    setDescripcion("");
    setEstado("ACTIVO");
    setFormaPagoIds([]);
    setMedioPagoIds([]);
    setMediosDisponibles([]);
    originalRef.current = null;
  }, []);

  const loadForEdit = useCallback((x: BancoTarjetaCajaItem) => {
    setMode("edit");
    setSelected(x);
    setCodigo(x.codigo);
    setDescripcion(x.descripcion);
    setEstado(x.estado);
    const formaOne = x.forma_pago_ids.length ? [x.forma_pago_ids[0]] : [];
    const medioOne = x.medio_pago_ids.length ? [x.medio_pago_ids[0]] : [];
    setFormaPagoIds(formaOne);
    setMedioPagoIds(medioOne);
    originalRef.current = {
      codigo: x.codigo,
      descripcion: x.descripcion,
      estado: x.estado,
      formas: sortedKey(formaOne),
      medios: sortedKey(medioOne),
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
    setFormaPagoIds([...selected.forma_pago_ids]);
    setMedioPagoIds([...selected.medio_pago_ids]);
    toast.success("Cambios cancelados.");
  }, [mode, resetToNew, selected, toast]);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;
      try {
        const res = await listBancoTarjetaCaja({
          page: targetPage,
          per_page: targetPerPage,
          q: qDebounced.trim() || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });
        lastToastedErrorRef.current = null;
        setData(res);
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudo cargar la lista de bancos y tarjetas.");
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

  const onSave = useCallback(async () => {
    const c = codigo.trim();
    const d = prepareFormText(descripcion);
    if (!isValid) {
      toast.error("Completa código, descripción, forma de pago y medio de pago.");
      return;
    }
    if (mode === "edit" && !selected) {
      toast.error("Selecciona un banco o tarjeta para editar.");
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
        await createBancoTarjetaCaja({
          codigo: c,
          descripcion: d,
          estado,
          forma_pago_ids: formaPagoIds,
          medio_pago_ids: medioPagoIds,
        });
        toast.success("Banco o tarjeta creado.");
        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
      } else {
        const res = await updateBancoTarjetaCaja(selected!.id, {
          codigo: c,
          descripcion: d,
          estado,
          forma_pago_ids: formaPagoIds,
          medio_pago_ids: medioPagoIds,
        });
        toast.success("Cambios guardados.");
        await refresh();
        loadForEdit(res.data);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudo guardar el banco o tarjeta."));
    } finally {
      setSaving(false);
    }
  }, [
    codigo,
    descripcion,
    estado,
    formaPagoIds,
    isDirty,
    isValid,
    loadForEdit,
    medioPagoIds,
    mode,
    refresh,
    resetToNew,
    saving,
    selected,
    toast,
  ]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      toast.error("Selecciona un banco o tarjeta para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await deactivateBancoTarjetaCaja(selected.id);
      setConfirmDeactivateOpen(false);
      toast.success("Registro desactivado.");
      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      setConfirmDeactivateOpen(false);
      toast.error(getApiErrorMessage(e, "No se pudo desactivar el banco o tarjeta."));
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
    formasPago,
    formaPagoIds,
    setFormaPagoIds,
    mediosDisponibles,
    medioPagoIds,
    setMedioPagoIds,
    loadingMedios,
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
