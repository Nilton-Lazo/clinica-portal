import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Contratante, ContratantesQuery, PaginatedResponse, RecordStatus } from "../../types/contratantes.types";
import {
  createContratante,
  deactivateContratante,
  getNextContratanteCodigo,
  listContratantes,
  updateContratante,
} from "../../services/contratantes.service";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import { toastService } from "../../../../shared/notifications";
import { getApiErrorMessage } from "../../../../shared/api/apiError";

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

function isRuc11OrEmpty(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  return /^[0-9]{11}$/.test(t);
}

export function useContratantes() {
  const [data, setData] = useState<PaginatedResponse<Contratante>>({
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
  const [selected, setSelected] = useState<Contratante | null>(null);

  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [razonSocial, setRazonSocial] = useState("");
  const [ruc, setRuc] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    razonSocial: string;
    ruc: string | null;
    telefono: string | null;
    direccion: string | null;
    estado: RecordStatus;
  } | null>(null);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextContratanteCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    if (mode === "new") void fetchCodigoPreview();
  }, [mode, fetchCodigoPreview]);

  const isValid = useMemo(() => {
    const rs = razonSocial.trim();
    if (!rs || rs.length > 255) return false;

    if (!isRuc11OrEmpty(ruc)) return false;
    if (telefono.trim().length > 30) return false;
    if (direccion.trim().length > 255) return false;

    return true;
  }, [razonSocial, ruc, telefono, direccion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    return (
      o.razonSocial !== razonSocial.trim() ||
      o.ruc !== toNullIfBlank(ruc) ||
      o.telefono !== toNullIfBlank(telefono) ||
      o.direccion !== toNullIfBlank(direccion) ||
      o.estado !== estado
    );
  }, [mode, isValid, razonSocial, ruc, telefono, direccion, estado]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setRazonSocial("");
    setRuc("");
    setTelefono("");
    setDireccion("");
    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: Contratante) => {
    setMode("edit");
    setSelected(x);

    setRazonSocial(x.razon_social);
    setRuc(x.ruc ?? "");
    setTelefono(x.telefono ?? "");
    setDireccion(x.direccion ?? "");
    setEstado(x.estado);

    originalRef.current = {
      razonSocial: x.razon_social,
      ruc: x.ruc ?? null,
      telefono: x.telefono ?? null,
      direccion: x.direccion ?? null,
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

    setRazonSocial(o.razonSocial);
    setRuc(o.ruc ?? "");
    setTelefono(o.telefono ?? "");
    setDireccion(o.direccion ?? "");
    setEstado(o.estado);

    setNotice(null);
  }, [mode, resetToNew, selected]);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      const query: ContratantesQuery = {
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() ? qDebounced.trim() : undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      };

      try {
        const res = await listContratantes(query);
        setData(res);
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudo cargar la lista de contratantes.");
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
      setNotice({ type: "error", text: "Completa la razón social y los datos del contratante correctamente." });
      toastService.showError("Completa la razón social y los datos del contratante correctamente.");
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona un contratante para editar." });
      toastService.showError("Selecciona un contratante para editar.");
      return;
    }

    if (!isDirty) {
      setNotice({ type: "error", text: "No hay cambios para guardar." });
      toastService.showError("No hay cambios para guardar.");
      return;
    }

    const payloadBase = {
      razon_social: razonSocial.trim(),
      ruc: toNullIfBlank(ruc),
      telefono: toNullIfBlank(telefono),
      direccion: toNullIfBlank(direccion),
    };

    setSaving(true);
    try {
      if (mode === "new") {
        await createContratante({ ...payloadBase, estado });
        setNotice({ type: "success", text: "Contratante creado." });
        toastService.showSuccess("Contratante creado.");

        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
        return;
      }

      const res = await updateContratante(selected!.id, { ...payloadBase, estado });
      setNotice({ type: "success", text: "Cambios guardados." });
      toastService.showSuccess("Cambios guardados.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar el contratante.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [isValid, mode, selected, isDirty, razonSocial, ruc, telefono, direccion, estado, refresh, loadForEdit, resetToNew]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona un contratante para desactivar." });
      toastService.showError("Selecciona un contratante para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona un contratante para desactivar." });
      toastService.showError("Selecciona un contratante para desactivar.");
      return;
    }

    setSaving(true);
    try {
      const res = await deactivateContratante(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Contratante desactivado." });
      toastService.showSuccess("Contratante desactivado.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar el contratante.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [selected, refresh, loadForEdit]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO" && !saving;

  const selectedRazonSocial = useMemo(() => {
    if (!selected) return "";
    return (selected.razon_social ?? "").trim();
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
    setPerPage: (n: number) => setPerPageState(clampPerPage(n)),
    q,
    setQ,
    statusFilter,
    setStatusFilter,

    mode,
    selected,
    selectedRazonSocial,

    codigo,
    razonSocial,
    setRazonSocial,
    ruc,
    setRuc,
    telefono,
    setTelefono,
    direccion,
    setDireccion,
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
