import * as React from "react";
import { useToast } from "../../../../shared/feedback";
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

export type StatusFilter = "ALL" | "ACTIVO" | "INACTIVO" | "SUSPENDIDO";
export type Notice = { type: "success" | "error"; text: string } | null;

export function useRecargoNoche() {
  const toast = useToast();
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
      .catch(() => setTarifas([]))
      .finally(() => setTarifasLoading(false));
  }, []);

  React.useEffect(() => {
    if (!tarifaId) {
      setReglas([]);
      setCategorias([]);
      setSelected(null);
      setMode("new");
      return;
    }
    setLoading(true);
    const statusParam = statusFilter === "ALL" ? undefined : statusFilter;
    Promise.all([
      listRecargoNoche(tarifaId, { status: statusParam }),
      getCategoriasLookup(tarifaId),
    ])
      .then(([r, c]) => {
        setReglas(r);
        setCategorias(c);
      })
      .catch(() => {
        setReglas([]);
        setCategorias([]);
      })
      .finally(() => setLoading(false));
  }, [tarifaId, statusFilter]);

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
    const usados = new Set(reglas.filter((x) => x.estado === "ACTIVO").map((x) => x.tarifa_categoria_id));
    return categorias.filter((c) => !usados.has(c.id));
  }, [categorias, reglas]);

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
    if (!tarifaId || !isValid()) return;
    setSaving(true);
    setNotice(null);
    try {
      if (mode === "new") {
        const horaDesde = formHoraDesde.trim() || "19:00";
        const created = await createRecargoNoche(tarifaId, {
          tarifa_categoria_id: formCategoriaId!,
          porcentaje: parseFloat(formPorcentaje),
          hora_desde: horaDesde,
          hora_hasta: formHoraHasta.trim() || undefined,
          estado: formEstado && ["ACTIVO", "INACTIVO", "SUSPENDIDO"].includes(formEstado) ? formEstado : "ACTIVO",
        });
        setReglas((prev) => [...prev, created]);
        resetToNew();
        setNotice({ type: "success", text: "Regla creada." });
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
        setReglas((prev) => prev.map((x) => (x.id === selected.id ? updated : x)));
        setSelected(updated);
        setNotice({ type: "success", text: "Regla actualizada." });
      }
    } catch {
      setNotice({ type: "error", text: mode === "new" ? "No se pudo crear." : "No se pudo actualizar." });
    } finally {
      setSaving(false);
    }
  }, [tarifaId, mode, selected, formCategoriaId, formPorcentaje, formHoraDesde, formHoraHasta, formEstado, isValid, resetToNew]);

  const cancel = React.useCallback(() => {
    if (selected) {
      setFormCategoriaId(selected.tarifa_categoria_id);
      setFormPorcentaje(String(selected.porcentaje));
      setFormHoraDesde(selected.hora_desde?.slice(0, 5) ?? "");
      setFormHoraHasta(selected.hora_hasta?.slice(0, 5) ?? "");
      setFormEstado(selected.estado ?? "");
      toast.success("Cambios cancelados.");
    } else {
      resetToNew();
    }
  }, [selected, resetToNew, toast]);

  const requestDeactivate = React.useCallback(() => {
    if (selected?.estado === "ACTIVO") setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!tarifaId || !selected) return;
    setConfirmDeactivateOpen(false);
    setSaving(true);
    setNotice(null);
    try {
      const updated = await deactivateRecargoNoche(tarifaId, selected.id);
      setReglas((prev) => prev.map((x) => (x.id === selected.id ? updated : x)));
      setSelected(updated);
      setFormCategoriaId(null);
      setFormPorcentaje("");
      setFormHoraDesde("");
      setFormHoraHasta("");
      setFormEstado("ACTIVO");
      setMode("new");
      setNotice({ type: "success", text: "Regla desactivada." });
    } catch {
      setNotice({ type: "error", text: "No se pudo desactivar." });
    } finally {
      setSaving(false);
    }
  }, [tarifaId, selected]);

  const canDeactivate = Boolean(selected?.estado === "ACTIVO");

  return {
    tarifas,
    tarifasLoading,
    tarifaId,
    setTarifaId,
    statusFilter,
    setStatusFilter,
    reglas,
    categorias,
    categoriasDisponiblesParaNuevo,
    loading,
    saving,
    notice,
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
