import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Cliente, ClienteTipo, ClientesQuery, PaginatedResponse, RecordStatus } from "../../types/clientes.types";
import {
  createCliente,
  deactivateCliente,
  getNextClienteCodigo,
  listClientes,
  updateCliente,
} from "../../services/clientes.service";
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

function normalizeDni(s: string): string {
  return s.replace(/\s+/g, "").trim();
}

function isDniOrRucValid(s: string): boolean {
  const t = normalizeDni(s);
  return /^[0-9]{8}$/.test(t) || /^[0-9]{11}$/.test(t);
}

export function useClientes() {
  const [data, setData] = useState<PaginatedResponse<Cliente>>({
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
  const [selected, setSelected] = useState<Cliente | null>(null);

  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [tipo, setTipo] = useState<ClienteTipo>("ASISTENCIAL");
  const [nombre, setNombre] = useState("");
  const [dniORuc, setDniORuc] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    tipo: ClienteTipo;
    nombre: string;
    dni_o_ruc: string;
    telefono: string | null;
    direccion: string | null;
    estado: RecordStatus;
  } | null>(null);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextClienteCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    if (mode === "new") void fetchCodigoPreview();
  }, [mode, fetchCodigoPreview]);

  const isValid = useMemo(() => {
    const n = nombre.trim();
    if (!n || n.length > 255) return false;
    if (!isDniOrRucValid(dniORuc)) return false;
    if (telefono.trim().length > 30) return false;
    if (direccion.trim().length > 255) return false;
    return true;
  }, [nombre, dniORuc, telefono, direccion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    const dniNorm = normalizeDni(dniORuc);
    return (
      o.tipo !== tipo ||
      o.nombre !== nombre.trim() ||
      o.dni_o_ruc !== dniNorm ||
      o.telefono !== toNullIfBlank(telefono) ||
      o.direccion !== toNullIfBlank(direccion) ||
      o.estado !== estado
    );
  }, [mode, isValid, tipo, nombre, dniORuc, telefono, direccion, estado]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setTipo("ASISTENCIAL");
    setNombre("");
    setDniORuc("");
    setTelefono("");
    setDireccion("");
    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: Cliente) => {
    setMode("edit");
    setSelected(x);

    setTipo(x.tipo);
    setNombre(x.nombre);
    setDniORuc(x.dni_o_ruc);
    setTelefono(x.telefono ?? "");
    setDireccion(x.direccion ?? "");
    setEstado(x.estado);

    originalRef.current = {
      tipo: x.tipo,
      nombre: x.nombre,
      dni_o_ruc: x.dni_o_ruc,
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

    setTipo(o.tipo);
    setNombre(o.nombre);
    setDniORuc(o.dni_o_ruc);
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

      const query: ClientesQuery = {
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() ? qDebounced.trim() : undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      };

      try {
        const res = await listClientes(query);
        setData(res);
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudo cargar la lista de clientes.");
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
      const msg = !isDniOrRucValid(dniORuc)
        ? "El DNI o RUC es obligatorio (8 dígitos o 11 para RUC)."
        : "Completa los datos del cliente correctamente.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona un cliente para editar." });
      toastService.showError("Selecciona un cliente para editar.");
      return;
    }

    if (!isDirty) {
      setNotice({ type: "error", text: "No hay cambios para guardar." });
      toastService.showError("No hay cambios para guardar.");
      return;
    }

    const payloadBase = {
      tipo,
      nombre: nombre.trim(),
      dni_o_ruc: normalizeDni(dniORuc),
      telefono: toNullIfBlank(telefono),
      direccion: toNullIfBlank(direccion),
    };

    setSaving(true);
    try {
      if (mode === "new") {
        await createCliente({ ...payloadBase, estado });
        setNotice({ type: "success", text: "Cliente creado." });
        toastService.showSuccess("Cliente creado.");

        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
        return;
      }

      const res = await updateCliente(selected!.id, { ...payloadBase, estado });
      setNotice({ type: "success", text: "Cambios guardados." });
      toastService.showSuccess("Cambios guardados.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar el cliente.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [isValid, mode, selected, isDirty, tipo, nombre, dniORuc, telefono, direccion, estado, refresh, loadForEdit, resetToNew]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona un cliente para desactivar." });
      toastService.showError("Selecciona un cliente para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona un cliente para desactivar." });
      toastService.showError("Selecciona un cliente para desactivar.");
      return;
    }

    setSaving(true);
    try {
      const res = await deactivateCliente(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Cliente desactivado." });
      toastService.showSuccess("Cliente desactivado.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar el cliente.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [selected, refresh, loadForEdit]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO" && !saving;

  const selectedNombre = useMemo(() => {
    if (!selected) return "";
    return (selected.nombre ?? "").trim();
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
    selectedNombre,

    codigo,
    tipo,
    setTipo,
    nombre,
    setNombre,
    dniORuc,
    setDniORuc,
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
