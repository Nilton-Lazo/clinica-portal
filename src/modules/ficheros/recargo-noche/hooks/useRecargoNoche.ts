import * as React from "react";
import { toastService } from "../../../../shared/notifications";
import { getApiErrorMessage } from "../../../../shared/api/apiError";
import {
  getTarifasOperativas,
  getCategoriasLookup,
  listRecargoNoche,
  createRecargoNoche,
  updateRecargoNoche,
  deactivateRecargoNoche,
  type RecargoNocheRegla,
  type TarifaOperativa,
  type CategoriaLookupItem,
} from "../../services/recargoNoche.service";
import type { PaginationMeta } from "../../../../shared/types/pagination";
import type { SortDirection } from "../../../../shared/datagrid";

export type StatusFilter = "ALL" | "ACTIVO" | "INACTIVO" | "SUSPENDIDO";
export type Notice = { type: "success" | "error"; text: string } | null;

const defaultPaginationMeta: PaginationMeta = {
  current_page: 1,
  per_page: 10,
  total: 0,
  last_page: 1,
};

export function useRecargoNoche() {
  const [tarifas, setTarifas] = React.useState<TarifaOperativa[]>([]);
  const [tarifasLoading, setTarifasLoading] = React.useState(true);
  const [tarifaId, setTarifaId] = React.useState<number | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [reglas, setReglas] = React.useState<RecargoNocheRegla[]>([]);
  const [categorias, setCategorias] = React.useState<CategoriaLookupItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(null);
  const [selected, setSelected] = React.useState<RecargoNocheRegla | null>(null);
  const [mode, setMode] = React.useState<"new" | "edit">("new");
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [paginationMeta, setPaginationMeta] = React.useState<PaginationMeta>(defaultPaginationMeta);
  const [activeCategoriaIds, setActiveCategoriaIds] = React.useState<number[]>([]);
  const [sort, setSort] = React.useState<string | null>("codigo");
  const [sortDir, setSortDir] = React.useState<SortDirection>("asc");

  const dispatchRecargoChanged = React.useCallback((nextTarifaId: number | null) => {
    if (typeof window === "undefined") return;
    if (!nextTarifaId) return;

    window.dispatchEvent(
      new CustomEvent("recargoNoche:changed", {
        detail: { tarifaId: nextTarifaId },
      })
    );

    try {
      const channel = new BroadcastChannel("recargo-noche-channel");
      channel.postMessage({ type: "changed", tarifaId: nextTarifaId });
      channel.close();
    } catch {
      void 0;
    }
  }, []);

  const [formCategoriaId, setFormCategoriaId] = React.useState<number | null>(null);
  const [formPorcentaje, setFormPorcentaje] = React.useState("");
  const [formHoraDesde, setFormHoraDesde] = React.useState("");
  const [formHoraHasta, setFormHoraHasta] = React.useState("");
  const [formEstado, setFormEstado] = React.useState<string>("ACTIVO");

  const computeHoraHastaFromDesde = React.useCallback((horaDesde: string): string => {
    const t = horaDesde.trim().slice(0, 5);
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return "";
    const [h, m] = t.split(":").map((x) => parseInt(x, 10) || 0);
    const next = (h + 12) % 24;
    return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, []);

  React.useEffect(() => {
    if (mode === "new" && formHoraDesde.trim()) {
      const hasta = computeHoraHastaFromDesde(formHoraDesde);
      if (hasta) setFormHoraHasta(hasta);
    }
  }, [mode, formHoraDesde, computeHoraHastaFromDesde]);

  React.useEffect(() => {
    setTarifasLoading(true);
    getTarifasOperativas()
      .then(setTarifas)
      .catch((e) => {
        setTarifas([]);
        toastService.showError(getApiErrorMessage(e, "No se pudieron cargar los tarifarios operativos."));
      })
      .finally(() => setTarifasLoading(false));
  }, []);

  const refresh = React.useCallback(async (next?: { page?: number }) => {
    if (!tarifaId) {
      setReglas([]);
      setCategorias([]);
      setPaginationMeta(defaultPaginationMeta);
      setActiveCategoriaIds([]);
      setSelected(null);
      setMode("new");
      return;
    }
    setLoading(true);
    const statusParam = statusFilter === "ALL" ? undefined : statusFilter;
    const targetPage = next?.page ?? page;
    try {
      const [r, c] = await Promise.all([
        listRecargoNoche(tarifaId, {
          page: targetPage,
          per_page: 10,
          status: statusParam,
          sort: sort ?? undefined,
          sort_dir: sortDir,
        }),
        getCategoriasLookup(tarifaId),
      ]);
      setReglas(r.data);
      setPaginationMeta(r.meta);
      setActiveCategoriaIds(
        Array.isArray(r.meta.active_categoria_ids)
          ? r.meta.active_categoria_ids.map((id) => Number(id)).filter(Number.isFinite)
          : []
      );
      setCategorias(c);
    } catch (e) {
      setReglas([]);
      setCategorias([]);
      setPaginationMeta(defaultPaginationMeta);
      setActiveCategoriaIds([]);
      toastService.showError(getApiErrorMessage(e, "No se pudieron cargar las reglas de recargo nocturno."));
    } finally {
      setLoading(false);
    }
  }, [tarifaId, statusFilter, page, sort, sortDir]);

  React.useEffect(() => {
    setPage(1);
  }, [tarifaId, statusFilter, sort, sortDir]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadForEdit = React.useCallback((r: RecargoNocheRegla) => {
    setSelected(r);
    setMode("edit");
    setFormCategoriaId(r.tarifa_categoria_id);
    setFormPorcentaje(String(r.porcentaje));
    setFormHoraDesde(r.hora_desde?.slice(0, 5) ?? "");
    setFormHoraHasta(r.hora_hasta?.slice(0, 5) ?? computeHoraHastaFromDesde(r.hora_desde?.slice(0, 5) ?? "19:00"));
    setFormEstado(r.estado ?? "");
  }, [computeHoraHastaFromDesde]);

  const resetToNew = React.useCallback(() => {
    setSelected(null);
    setMode("new");
    setFormCategoriaId(null);
    setFormPorcentaje("");
    setFormHoraDesde("");
    setFormHoraHasta("");
    setFormEstado("ACTIVO");
  }, []);

  const categoriasDisponiblesParaNuevo = React.useMemo(() => {
    const usados = new Set(activeCategoriaIds);
    return categorias.filter((c) => !usados.has(c.id));
  }, [categorias, activeCategoriaIds]);

  const toggleSort = React.useCallback((columnId: string) => {
    setPage(1);
    setSort((prev) => {
      if (prev !== columnId) {
        setSortDir("asc");
        return columnId;
      }
      setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
      return columnId;
    });
  }, []);

  const isValid = React.useCallback(() => {
    if (mode === "new") {
      if (formCategoriaId == null) return false;
      const pct = parseFloat(formPorcentaje);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) return false;
      return true;
    }
    const pct = parseFloat(formPorcentaje);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return false;
    return true;
  }, [mode, formCategoriaId, formPorcentaje]);

  const isDirty = React.useCallback(() => {
    if (mode === "new") return formCategoriaId != null && formPorcentaje.trim() !== "";
    if (!selected) return false;
    const pct = parseFloat(formPorcentaje);
    if (Number.isNaN(pct)) return false;
    const horaDesde = formHoraDesde.trim().slice(0, 5) || "";
    const horaHasta = formHoraHasta.trim().slice(0, 5) || "";
    const prevHoraDesde = selected.hora_desde?.slice(0, 5) ?? "";
    const prevHoraHasta = selected.hora_hasta?.slice(0, 5) ?? "";
    return (
      selected.porcentaje !== pct ||
      prevHoraDesde !== horaDesde ||
      prevHoraHasta !== horaHasta ||
      (selected.estado ?? "") !== (formEstado ?? "")
    );
  }, [mode, selected, formCategoriaId, formPorcentaje, formHoraDesde, formHoraHasta, formEstado]);

  const onSave = React.useCallback(async () => {
    if (!tarifaId) {
      setNotice({ type: "error", text: "Selecciona un tarifario para configurar el recargo nocturno." });
      toastService.showError("Selecciona un tarifario para configurar el recargo nocturno.");
      return;
    }
    if (!isValid()) {
      const msg = mode === "new"
        ? "Selecciona una categoría e ingresa un porcentaje entre 0 y 100."
        : "Ingresa un porcentaje entre 0 y 100.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      if (mode === "new") {
        const horaDesde = formHoraDesde.trim() || "19:00";
        await createRecargoNoche(tarifaId, {
          tarifa_categoria_id: formCategoriaId!,
          porcentaje: parseFloat(formPorcentaje),
          hora_desde: horaDesde,
          hora_hasta: formHoraHasta.trim() || undefined,
          estado: formEstado && ["ACTIVO", "INACTIVO", "SUSPENDIDO"].includes(formEstado) ? formEstado : "ACTIVO",
        });
        resetToNew();
        setPage(1);
        await refresh({ page: 1 });
        setNotice({ type: "success", text: "Regla creada." });
        toastService.showSuccess("Regla creada.");
        dispatchRecargoChanged(tarifaId);
      } else if (selected) {
        const payload: {
          porcentaje: number;
          hora_desde: string;
          hora_hasta?: string;
          estado?: string;
        } = {
          porcentaje: parseFloat(formPorcentaje),
          hora_desde: formHoraDesde.trim() || (selected.hora_desde?.slice(0, 5) ?? "19:00"),
          hora_hasta: formHoraHasta.trim() || undefined,
        };
        if (formEstado && ["ACTIVO", "INACTIVO", "SUSPENDIDO"].includes(formEstado)) payload.estado = formEstado;
        const updated = await updateRecargoNoche(tarifaId, selected.id, payload);
        setSelected(updated);
        await refresh();
        setNotice({ type: "success", text: "Regla actualizada." });
        toastService.showSuccess("Regla actualizada.");
        dispatchRecargoChanged(tarifaId);
      }
    } catch (e) {
      const msg = getApiErrorMessage(
        e,
        mode === "new" ? "No se pudo crear la regla de recargo nocturno." : "No se pudo actualizar la regla de recargo nocturno."
      );
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [tarifaId, mode, selected, formCategoriaId, formPorcentaje, formHoraDesde, formHoraHasta, formEstado, isValid, resetToNew, refresh, dispatchRecargoChanged]);

  const cancel = React.useCallback(() => {
    if (selected) {
      setFormCategoriaId(selected.tarifa_categoria_id);
      setFormPorcentaje(String(selected.porcentaje));
      setFormHoraDesde(selected.hora_desde?.slice(0, 5) ?? "");
      setFormHoraHasta(selected.hora_hasta?.slice(0, 5) ?? "");
      setFormEstado(selected.estado ?? "");
    } else {
      resetToNew();
    }
  }, [selected, resetToNew]);

  const requestDeactivate = React.useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona una regla de recargo nocturno para desactivar." });
      toastService.showError("Selecciona una regla de recargo nocturno para desactivar.");
      return;
    }
    if (selected.estado !== "ACTIVO") {
      const msg = "La regla de recargo nocturno seleccionada ya está inactiva.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!tarifaId || !selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona una regla de recargo nocturno para desactivar." });
      toastService.showError("Selecciona una regla de recargo nocturno para desactivar.");
      return;
    }
    setConfirmDeactivateOpen(false);
    setSaving(true);
    setNotice(null);
    try {
      const updated = await deactivateRecargoNoche(tarifaId, selected.id);
      setSelected(updated);
      setFormCategoriaId(null);
      setFormPorcentaje("");
      setFormHoraDesde("");
      setFormHoraHasta("");
      setFormEstado("ACTIVO");
      setMode("new");
      await refresh();
      setNotice({ type: "success", text: "Regla desactivada." });
      toastService.showSuccess("Regla desactivada.");
      dispatchRecargoChanged(tarifaId);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar la regla de recargo nocturno.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [tarifaId, selected, refresh, dispatchRecargoChanged]);

  const canDeactivate = Boolean(selected?.estado === "ACTIVO");

  return {
    tarifas,
    tarifasLoading,
    tarifaId,
    setTarifaId,
    statusFilter,
    setStatusFilter,
    reglas,
    paginationMeta,
    page,
    setPage,
    sort,
    sortDir,
    toggleSort,
    categorias,
    categoriasDisponiblesParaNuevo,
    loading,
    saving,
    notice,
    refresh,
    setNotice,
    selected,
    mode,
    loadForEdit,
    resetToNew,
    formCategoriaId,
    setFormCategoriaId,
    formPorcentaje,
    setFormPorcentaje,
    formHoraDesde,
    setFormHoraDesde,
    formHoraHasta,
    setFormHoraHasta,
    formEstado,
    setFormEstado,
    isValid: isValid(),
    isDirty: isDirty(),
    canDeactivate,
    onSave,
    cancel,
    requestDeactivate,
    confirmDeactivateOpen,
    setConfirmDeactivateOpen,
    onDeactivateConfirmed,
  };
}
