import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { ConfirmDialog } from "../../../ficheros/components/ConfirmDialog";
import { makeEnterKeySaveHandler } from "../../../ficheros/utils/crudShared";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import { toastService } from "../../../../shared/notifications";
import { getApiErrorMessage } from "../../../../shared/api/apiError";
import { useRealtimeModuleRefresh } from "../../../../shared/realtime/useRealtimeModuleRefresh";
import { ReporteSolesAmount } from "../../../caja/components/ReporteSolesAmount";
import {
  formatDecimalFixed,
  parseDecimalInput,
  roundToPrecision,
} from "../../../../shared/constants/decimalPrecision";

const inputBase =
  "rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";
const toolbarFilterSelectBase =
  "h-10 rounded-lg border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) shadow-sm outline-none transition-colors hover:scale-100 active:scale-100 hover:border-(--color-primary)/50 focus:ring-0 focus:border-(--color-primary)";
const tarifaEmptyHighlightTriggerCls =
  "rounded-lg border-2 border-(--color-primary)/70 bg-(--color-surface) px-3 text-sm font-semibold text-(--color-primary) outline-none shadow-md hover:scale-100 active:scale-100 focus:border-(--color-primary) focus:ring-0 tarifario-tarifa-trigger-attn";
const TARIFARIO_ENTITIES = ["tarifa_categoria", "tarifa_subcategoria", "tarifa_servicio", "tarifario_clonacion"];
import type {
  GrupoServicioLookup,
  Notice,
  PaginatedResponse,
  PropagacionResultado,
  RecordStatus,
  TarifarioServiciosCrudListResponse,
  TarifaCategoria,
  TarifaCategoriaLookup,
  TarifaServicioCrud,
  TarifaSubcategoria,
  TarifaSubcategoriaLookup,
} from "../types/tarifario.types";
import {
  createCategoria,
  createServicio,
  createSubcategoria,
  deactivateCategoria,
  deactivateServicio,
  deactivateSubcategoria,
  getNextCategoriaCodigo,
  getNextServicioCodigo,
  getNextSubcategoriaCodigo,
  listCategorias,
  listServiciosCrud,
  listSubcategorias,
  lookupCategorias,
  lookupGruposServicio,
  lookupSubcategorias,
  updateCategoria,
  updateServicio,
  updateSubcategoria,
} from "../services/tarifario.service";

type Mode = "new" | "edit";
type StatusFilter = "ALL" | RecordStatus;

function mensajePropagacion(prop: PropagacionResultado | undefined): string | null {
  if (!prop || !prop.tiene_alertas) return null;
  const parts: string[] = [];
  if (prop.omitidos > 0) {
    const det = prop.detalle.omitidos.map((o) => `${o.tarifa_descripcion}: ${o.mensaje}`).join("; ");
    parts.push(`Omitidos (${prop.omitidos}): ${det}`);
  }
  if (prop.creados_con_codigo_diferente > 0) {
    const det = prop.detalle.creados_con_codigo_diferente
      .map((o) => `${o.tarifa_descripcion}: ${o.mensaje}`)
      .join("; ");
    parts.push(`Código diferente (${prop.creados_con_codigo_diferente}): ${det}`);
  }
  return parts.length > 0 ? parts.join(". ") : null;
}

function normalizeCodigoQuery(raw: string): string {
  const compact = raw.replace(/\./g, "").trim();
  if (!compact) return "";
  if (!/^\d+$/.test(compact)) return raw.trim();
  if (compact.length === 6) {
    return compact.replace(/(\d{2})(\d{2})(\d{2})/, "$1.$2.$3");
  }
  if (compact.length === 4) {
    return compact.replace(/(\d{2})(\d{2})/, "$1.$2");
  }
  return compact;
}

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLgUp;
}

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

function useNoticeToToast(notice: Notice) {
  const lastRef = React.useRef<Notice | null>(null);
  React.useEffect(() => {
    if (!notice?.text) return;
    if (notice === lastRef.current) return;
    lastRef.current = notice;
    if (notice.type === "success") toastService.showSuccess(notice.text);
    else toastService.showError(notice.text);
  }, [notice]);
}

const statusOptions: SelectOption[] = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVO", label: "Activos" },
  { value: "INACTIVO", label: "Inactivos" },
  { value: "SUSPENDIDO", label: "Suspendidos" },
];

const perPageOptions: SelectOption[] = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

function useCategoriasCrud(tarifaId: number | null) {
  const [data, setData] = React.useState<PaginatedResponse<TarifaCategoria>>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(null);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPageState] = React.useState(50);
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const qDebounced = useDebouncedValue(q, 350);
  const qNormalized = React.useMemo(
    () => normalizeCodigoQuery(qDebounced),
    [qDebounced]
  );

  const [mode, setMode] = React.useState<Mode>("new");
  const [selected, setSelected] = React.useState<TarifaCategoria | null>(null);

  const [codigo, setCodigo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [estado, setEstado] = React.useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = React.useState(false);
  const originalRef = React.useRef<{
    codigo: string;
    descripcion: string;
    estado: RecordStatus;
  } | null>(null);

  React.useEffect(() => {
    if (!tarifaId) return;
    if (mode !== "new") return;
    if (codigo.trim()) return;
    let alive = true;
    getNextCategoriaCodigo(tarifaId)
      .then((res) => {
        if (!alive) return;
        setCodigo(res.codigo);
      })
      .catch(() => {
        setCodigo("");
      });
    return () => {
      alive = false;
    };
  }, [tarifaId, mode, codigo]);

  const isValid = React.useMemo(() => {
    const d = descripcion.trim();
    if (!d) return false;
    if (d.length > 255) return false;
    if (mode === "new" && !codigo.trim()) return false;
    return true;
  }, [descripcion, codigo, mode]);

  const isDirty = React.useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return o.descripcion !== descripcion.trim() || o.estado !== estado;
  }, [descripcion, estado, mode, isValid]);

  const refresh = React.useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      if (!tarifaId) return;
      setLoading(true);
      setNotice(null);
      try {
        const res = await listCategorias(tarifaId, {
          page: next?.page ?? page,
          per_page: next?.perPage ?? perPage,
          q: qNormalized.trim() ? qNormalized.trim() : undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });
        setData(res);
        return res;
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudieron cargar las categorías de la tarifa.");
        setNotice({ type: "error", text: msg });
        toastService.showError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [tarifaId, page, perPage, qNormalized, statusFilter]
  );

  const prevFiltersRef = React.useRef<{ q: string; status: StatusFilter; perPage: number } | null>(
    null
  );
  React.useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qNormalized, status: statusFilter, perPage };
    const changed =
      !prev || prev.q !== next.q || prev.status !== next.status || prev.perPage !== next.perPage;
    prevFiltersRef.current = next;
    if (changed && page !== 1) {
      setPage(1);
      return;
    }
    void refresh();
  }, [page, perPage, qNormalized, statusFilter, refresh]);

  const resetToNew = React.useCallback(() => {
    setMode("new");
    setSelected(null);
    setCodigo("");
    setDescripcion("");
    setEstado("ACTIVO");
    originalRef.current = null;
    setNotice(null);
  }, []);

  React.useEffect(() => {
    if (tarifaId) return;
    setData({
      data: [],
      meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
    });
    setLoading(false);
    setNotice(null);
    prevFiltersRef.current = null;
    resetToNew();
    setPage(1);
  }, [tarifaId, resetToNew]);

  React.useEffect(() => {
    if (!tarifaId) return;
    resetToNew();
    setPage(1);
  }, [tarifaId, resetToNew]);

  const loadForEdit = React.useCallback((x: TarifaCategoria) => {
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

  const cancel = React.useCallback(() => {
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
  }, [mode, resetToNew, selected]);

  const onSave = React.useCallback(async () => {
    if (!tarifaId) return;
    setNotice(null);
    if (!isValid) {
      const msg = "Completa la descripción de la categoría correctamente.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (mode === "edit" && !selected) {
      const msg = "Selecciona una categoría para editar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (!isDirty) {
      const msg = "No hay cambios para guardar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createCategoria(tarifaId, { descripcion: descripcion.trim(), estado });
        let text = "Categoría creada.";
        const propMsg = mensajePropagacion(res.propagacion);
        if (propMsg) text += ` Aviso: ${propMsg}`;
        setNotice({ type: "success", text });
        toastService.showSuccess(text);
        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
      } else if (selected) {
        const res = await updateCategoria(tarifaId, selected.id, {
          descripcion: descripcion.trim(),
          estado,
        });
        if (statusFilter === "ACTIVO" && res.estado !== "ACTIVO") {
          setStatusFilter("ALL");
        }
        setNotice({ type: "success", text: "Categoría actualizada." });
        toastService.showSuccess("Categoría actualizada.");
        const refreshed = await refresh();
        const updated = refreshed?.data.find((x) => x.id === res.id);
        if (updated) {
          if (updated.estado !== estado) {
            const errMsg = "El servidor no confirmó el cambio de estado de la categoría.";
            setNotice({ type: "error", text: errMsg });
            toastService.showError(errMsg);
            return;
          }
          loadForEdit(updated);
        }
      }
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar la categoría de la tarifa.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    tarifaId,
    descripcion,
    estado,
    mode,
    selected,
    refresh,
    resetToNew,
    saving,
    isValid,
    isDirty,
    loadForEdit,
    statusFilter,
  ]);

  const requestDeactivate = React.useCallback(() => {
    if (!selected) {
      const msg = "Selecciona una categoría para desactivar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!tarifaId || !selected) {
      setConfirmDeactivateOpen(false);
      const msg = "Selecciona una categoría para desactivar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await deactivateCategoria(tarifaId, selected.id);
      if (statusFilter === "ACTIVO") {
        setStatusFilter("ALL");
      }
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Categoría desactivada." });
      toastService.showSuccess("Categoría desactivada.");
      const refreshed = await refresh();
      const updated = refreshed?.data.find((x) => x.id === res.id);
      if (updated) {
        if (updated.estado !== "INACTIVO") {
          const errMsg = "El servidor no confirmó la desactivación de la categoría.";
          setNotice({ type: "error", text: errMsg });
          toastService.showError(errMsg);
          return;
        }
        loadForEdit(updated);
      }
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar la categoría de la tarifa.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [tarifaId, selected, refresh, saving, loadForEdit, statusFilter]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO";

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
    refresh,
  };
}

function useSubcategoriasCrud(tarifaId: number | null) {
  const [data, setData] = React.useState<PaginatedResponse<TarifaSubcategoria>>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(null);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPageState] = React.useState(50);
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [filterCategoriaId, setFilterCategoriaId] = React.useState<number | null>(null);
  const qDebounced = useDebouncedValue(q, 350);
  const qNormalized = React.useMemo(
    () => normalizeCodigoQuery(qDebounced),
    [qDebounced]
  );

  const [mode, setMode] = React.useState<Mode>("new");
  const [selected, setSelected] = React.useState<TarifaSubcategoria | null>(null);

  const [codigo, setCodigo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [estado, setEstado] = React.useState<RecordStatus>("ACTIVO");
  const [categoriaId, setCategoriaId] = React.useState<number | null>(null);

  const [categorias, setCategorias] = React.useState<TarifaCategoriaLookup[]>([]);
  const categoriasByCodigo = React.useMemo(() => {
    const map = new Map<string, number>();
    categorias.forEach((c) => map.set(c.codigo, c.id));
    return map;
  }, [categorias]);

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = React.useState(false);
  const originalRef = React.useRef<{
    codigo: string;
    descripcion: string;
    estado: RecordStatus;
    categoriaId: number | null;
  } | null>(null);

  React.useEffect(() => {
    if (!tarifaId) return;
    lookupCategorias(tarifaId, true)
      .then(setCategorias)
      .catch(() => {
        setCategorias([]);
      });
  }, [tarifaId]);

  React.useEffect(() => {
    if (!tarifaId || mode !== "new" || !categoriaId || codigo.trim()) return;
    let alive = true;
    getNextSubcategoriaCodigo(tarifaId, categoriaId)
      .then((res) => {
        if (!alive) return;
        setCodigo(res.codigo);
      })
      .catch(() => {
        setCodigo("");
      });
    return () => {
      alive = false;
    };
  }, [tarifaId, categoriaId, mode, codigo]);

  React.useEffect(() => {
    if (mode !== "new") return;
    setCodigo("");
  }, [categoriaId, mode]);

  const isValid = React.useMemo(() => {
    const d = descripcion.trim();
    if (!categoriaId) return false;
    if (!d) return false;
    if (d.length > 255) return false;
    if (mode === "new" && !codigo.trim()) return false;
    return true;
  }, [descripcion, codigo, categoriaId, mode]);

  const isDirty = React.useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    return (
      o.descripcion !== descripcion.trim() ||
      o.estado !== estado ||
      o.categoriaId !== categoriaId
    );
  }, [descripcion, estado, categoriaId, mode, isValid]);

  const { qFinal, categoriaIdFinal } = React.useMemo(() => {
    if (filterCategoriaId) {
      return { qFinal: qNormalized.trim() ? qNormalized.trim() : undefined, categoriaIdFinal: filterCategoriaId };
    }
    if (/^\d{2}\.\d{2}$/.test(qNormalized)) {
      const [catCode, subCode] = qNormalized.split(".");
      const catId = categoriasByCodigo.get(catCode ?? "");
      return {
        qFinal: subCode,
        categoriaIdFinal: catId ?? undefined,
      };
    }
    return { qFinal: qNormalized.trim() ? qNormalized.trim() : undefined, categoriaIdFinal: undefined };
  }, [filterCategoriaId, qNormalized, categoriasByCodigo]);

  const refresh = React.useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      if (!tarifaId) return;
      setLoading(true);
      setNotice(null);
      try {
        const res = await listSubcategorias(tarifaId, {
          page: next?.page ?? page,
          per_page: next?.perPage ?? perPage,
          q: qFinal,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          categoria_id: categoriaIdFinal,
        });
        setData(res);
        return res;
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudieron cargar las subcategorías de la tarifa.");
        setNotice({ type: "error", text: msg });
        toastService.showError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [tarifaId, page, perPage, qFinal, statusFilter, categoriaIdFinal]
  );

  const prevFiltersRef = React.useRef<
    { q: string; status: StatusFilter; perPage: number; categoriaId: number | null } | null
  >(null);
  React.useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qFinal ?? "", status: statusFilter, perPage, categoriaId: categoriaIdFinal ?? null };
    const changed =
      !prev ||
      prev.q !== next.q ||
      prev.status !== next.status ||
      prev.perPage !== next.perPage ||
      prev.categoriaId !== next.categoriaId;
    prevFiltersRef.current = next;
    if (changed && page !== 1) {
      setPage(1);
      return;
    }
    void refresh();
  }, [page, perPage, qFinal, statusFilter, categoriaIdFinal, refresh]);

  const resetToNew = React.useCallback(() => {
    setMode("new");
    setSelected(null);
    setCodigo("");
    setDescripcion("");
    setEstado("ACTIVO");
    setCategoriaId(null);
    originalRef.current = null;
    setNotice(null);
  }, []);

  React.useEffect(() => {
    if (tarifaId) return;
    setData({
      data: [],
      meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
    });
    setLoading(false);
    setNotice(null);
    setCategorias([]);
    prevFiltersRef.current = null;
    resetToNew();
    setPage(1);
  }, [tarifaId, resetToNew]);

  React.useEffect(() => {
    if (!tarifaId) return;
    resetToNew();
    setPage(1);
  }, [tarifaId, resetToNew]);

  const loadForEdit = React.useCallback((x: TarifaSubcategoria) => {
    setMode("edit");
    setSelected(x);
    setCodigo(x.codigo);
    setDescripcion(x.descripcion);
    setEstado(x.estado);
    setCategoriaId(x.categoria_id);
    originalRef.current = {
      codigo: x.codigo,
      descripcion: x.descripcion,
      estado: x.estado,
      categoriaId: x.categoria_id,
    };
    setNotice(null);
  }, []);

  const cancel = React.useCallback(() => {
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
    setCategoriaId(o.categoriaId);
  }, [mode, resetToNew, selected]);

  const onSave = React.useCallback(async () => {
    if (!tarifaId) return;
    setNotice(null);
    if (!isValid) {
      const msg = "Selecciona una categoría y completa la descripción de la subcategoría.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (mode === "edit" && !selected) {
      const msg = "Selecciona una subcategoría para editar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (!isDirty) {
      const msg = "No hay cambios para guardar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createSubcategoria(tarifaId, {
          categoria_id: categoriaId!,
          descripcion: descripcion.trim(),
          estado,
        });
        let text = "Subcategoría creada.";
        const propMsg = mensajePropagacion(res.propagacion);
        if (propMsg) text += ` Aviso: ${propMsg}`;
        setNotice({ type: "success", text });
        toastService.showSuccess(text);
        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
      } else if (selected) {
        const res = await updateSubcategoria(tarifaId, selected.id, {
          descripcion: descripcion.trim(),
          estado,
        });
        if (statusFilter === "ACTIVO" && res.estado !== "ACTIVO") {
          setStatusFilter("ALL");
        }
        setNotice({ type: "success", text: "Subcategoría actualizada." });
        toastService.showSuccess("Subcategoría actualizada.");
        const refreshed = await refresh();
        const updated = refreshed?.data.find((x) => x.id === res.id);
        if (updated) {
          if (updated.estado !== estado) {
            const errMsg = "El servidor no confirmó el cambio de estado de la subcategoría.";
            setNotice({ type: "error", text: errMsg });
            toastService.showError(errMsg);
            return;
          }
          loadForEdit(updated);
        }
      }
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar la subcategoría de la tarifa.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    tarifaId,
    descripcion,
    estado,
    mode,
    selected,
    refresh,
    resetToNew,
    saving,
    isValid,
    isDirty,
    categoriaId,
    loadForEdit,
    statusFilter,
  ]);

  const requestDeactivate = React.useCallback(() => {
    if (!selected) {
      const msg = "Selecciona una subcategoría para desactivar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!tarifaId || !selected) {
      setConfirmDeactivateOpen(false);
      const msg = "Selecciona una subcategoría para desactivar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await deactivateSubcategoria(tarifaId, selected.id);
      if (statusFilter === "ACTIVO") {
        setStatusFilter("ALL");
      }
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Subcategoría desactivada." });
      toastService.showSuccess("Subcategoría desactivada.");
      const refreshed = await refresh();
      const updated = refreshed?.data.find((x) => x.id === res.id);
      if (updated) {
        if (updated.estado !== "INACTIVO") {
          const errMsg = "El servidor no confirmó la desactivación de la subcategoría.";
          setNotice({ type: "error", text: errMsg });
          toastService.showError(errMsg);
          return;
        }
        loadForEdit(updated);
      }
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar la subcategoría de la tarifa.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [tarifaId, selected, refresh, saving, loadForEdit, statusFilter]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO";

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
    codigo,
    descripcion,
    setDescripcion,
    estado,
    setEstado,
    categoriaId,
    setCategoriaId,
    categorias,
    filterCategoriaId,
    setFilterCategoriaId,
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
    refresh,
  };
}

function useServiciosCrud(tarifaId: number | null) {
  const [data, setData] = React.useState<TarifarioServiciosCrudListResponse>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1, igv_porcentaje: 18 },
  });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(null);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPageState] = React.useState(50);
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [filterCategoriaId, setFilterCategoriaId] = React.useState<number | null>(null);
  const [filterSubcategoriaId, setFilterSubcategoriaId] = React.useState<number | null>(null);
  const [filterGrupoCodigo, setFilterGrupoCodigo] = React.useState<string | null>(null);
  const qDebounced = useDebouncedValue(q, 350);
  const qNormalized = React.useMemo(
    () => normalizeCodigoQuery(qDebounced),
    [qDebounced]
  );

  const [mode, setMode] = React.useState<Mode>("new");
  const [selected, setSelected] = React.useState<TarifaServicioCrud | null>(null);

  const [codigo, setCodigo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [estado, setEstado] = React.useState<RecordStatus>("ACTIVO");
  const [categoriaId, setCategoriaId] = React.useState<number | null>(null);
  const [subcategoriaId, setSubcategoriaId] = React.useState<number | null>(null);
  const [nomenclador, setNomenclador] = React.useState("");
  const [precioSinIgv, setPrecioSinIgv] = React.useState("");
  const [precioConIgv, setPrecioConIgv] = React.useState("");
  const [unidad, setUnidad] = React.useState("");
  const [grupoCodigo, setGrupoCodigo] = React.useState<string | null>(null);
  const [deseaLiberarPrecio, setDeseaLiberarPrecio] = React.useState(false);

  const [categorias, setCategorias] = React.useState<TarifaCategoriaLookup[]>([]);
  const [subcategorias, setSubcategorias] = React.useState<TarifaSubcategoriaLookup[]>([]);
  const [subcategoriasFilter, setSubcategoriasFilter] = React.useState<TarifaSubcategoriaLookup[]>([]);
  const [grupos, setGrupos] = React.useState<GrupoServicioLookup[]>([]);

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = React.useState(false);
  const originalRef = React.useRef<{
    codigo: string;
    descripcion: string;
    estado: RecordStatus;
    categoriaId: number | null;
    subcategoriaId: number | null;
    nomenclador: string;
    precioSinIgv: string;
    precioConIgv: string;
    unidad: string;
    grupoCodigo: string | null;
    deseaLiberarPrecio: boolean;
  } | null>(null);

  React.useEffect(() => {
    lookupGruposServicio()
      .then(setGrupos)
      .catch(() => {
        setGrupos([]);
      });
  }, []);

  const gruposOpciones = React.useMemo(() => {
    const byCode = new Map<string, GrupoServicioLookup>();
    grupos.forEach((g) => byCode.set(g.codigo, g));
    if (byCode.size === 0) {
      (data?.data ?? []).forEach((s) => {
        if (s.grupo_codigo && String(s.grupo_codigo).trim() && !byCode.has(s.grupo_codigo)) {
          byCode.set(s.grupo_codigo, {
            id: 0,
            codigo: s.grupo_codigo,
            descripcion: s.grupo_descripcion || s.grupo_codigo,
            abrev: s.grupo_abrev ?? null,
          });
        }
      });
    }
    return Array.from(byCode.values()).sort((a, b) => (a.descripcion || "").localeCompare(b.descripcion || ""));
  }, [grupos, data?.data]);

  const igvPorcentajeLive = data.meta.igv_porcentaje ?? 18;
  const igvRef = React.useRef(igvPorcentajeLive);
  igvRef.current = igvPorcentajeLive;

  const precioSinIgvRef = React.useRef("");
  React.useEffect(() => {
    precioSinIgvRef.current = precioSinIgv;
  }, [precioSinIgv]);

  React.useEffect(() => {
    const n = parseDecimalInput(precioSinIgvRef.current);
    if (n === null) return;
    const con = roundToPrecision(n * (1 + igvPorcentajeLive / 100), 4);
    setPrecioConIgv(formatDecimalFixed(con, 4));
  }, [igvPorcentajeLive]);

  const onPrecioConIgvChange = React.useCallback((v: string) => {
    setPrecioConIgv(v);
    const n = parseDecimalInput(v);
    if (n === null) {
      if (v.trim() === "") setPrecioSinIgv("");
      return;
    }
    const sin = roundToPrecision(n / (1 + igvRef.current / 100), 4);
    setPrecioSinIgv(formatDecimalFixed(sin, 4));
  }, []);

  const onPrecioSinIgvChange = React.useCallback((v: string) => {
    setPrecioSinIgv(v);
    const n = parseDecimalInput(v);
    if (n === null) {
      if (v.trim() === "") setPrecioConIgv("");
      return;
    }
    const con = roundToPrecision(n * (1 + igvRef.current / 100), 4);
    setPrecioConIgv(formatDecimalFixed(con, 4));
  }, []);

  React.useEffect(() => {
    if (!tarifaId) return;
    lookupCategorias(tarifaId, false)
      .then(setCategorias)
      .catch(() => {
        setCategorias([]);
      });
  }, [tarifaId]);

  React.useEffect(() => {
    if (!tarifaId || !categoriaId) {
      setSubcategorias([]);
      return;
    }
    lookupSubcategorias(tarifaId, categoriaId, false)
      .then((items) => {
        setSubcategorias(items);
        if (subcategoriaId && !items.some((x) => x.id === subcategoriaId)) {
          setSubcategoriaId(null);
        }
      })
      .catch(() => {
        setSubcategorias([]);
      });
  }, [tarifaId, categoriaId, subcategoriaId]);

  React.useEffect(() => {
    if (!tarifaId || !filterCategoriaId) {
      setSubcategoriasFilter([]);
      return;
    }
    lookupSubcategorias(tarifaId, filterCategoriaId, false)
      .then(setSubcategoriasFilter)
      .catch(() => {
        setSubcategoriasFilter([]);
      });
  }, [tarifaId, filterCategoriaId]);

  React.useEffect(() => {
    if (!tarifaId || mode !== "new" || !categoriaId || !subcategoriaId || codigo.trim()) return;
    let alive = true;
    getNextServicioCodigo(tarifaId, categoriaId, subcategoriaId)
      .then((res) => {
        if (!alive) return;
        setCodigo(res.codigo);
      })
      .catch(() => {
        setCodigo("");
      });
    return () => {
      alive = false;
    };
  }, [tarifaId, categoriaId, subcategoriaId, mode, codigo]);

  React.useEffect(() => {
    if (mode !== "new") return;
    setCodigo("");
  }, [categoriaId, subcategoriaId, mode]);

  React.useEffect(() => {
    setFilterSubcategoriaId(null);
  }, [filterCategoriaId]);

  const isValid = React.useMemo(() => {
    const d = descripcion.trim();
    const p = parseDecimalInput(precioSinIgv);
    const u = Number(unidad);

    if (!categoriaId || !subcategoriaId) return false;
    if (!d) return false;
    if (p === null || p < 0) return false;
    if (!Number.isFinite(u) || u < 0) return false;
    if (mode === "new" && !codigo.trim()) return false;
    return true;
  }, [descripcion, precioSinIgv, unidad, categoriaId, subcategoriaId, codigo, mode]);

  const isDirty = React.useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    const descripcionActual = descripcion.trim();
    const nomencladorActual = nomenclador.trim();
    const precioSinActual = precioSinIgv.trim();
    const unidadActual = unidad.trim();

    const comparaciones = {
      descripcion: o.descripcion !== descripcionActual,
      estado: o.estado !== estado,
      categoriaId: o.categoriaId !== categoriaId,
      subcategoriaId: o.subcategoriaId !== subcategoriaId,
      nomenclador: o.nomenclador !== nomencladorActual,
      precioSinIgv: o.precioSinIgv !== precioSinActual,
      unidad: o.unidad !== unidadActual,
      grupoCodigo: o.grupoCodigo !== grupoCodigo,
      deseaLiberarPrecio: o.deseaLiberarPrecio !== deseaLiberarPrecio,
    };

    return Object.values(comparaciones).some(Boolean);
  }, [
    descripcion,
    estado,
    categoriaId,
    subcategoriaId,
    nomenclador,
    precioSinIgv,
    unidad,
    grupoCodigo,
    deseaLiberarPrecio,
    mode,
    isValid,
  ]);

  const refresh = React.useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      if (!tarifaId) return;
      setLoading(true);
      setNotice(null);
      try {
        const res = await listServiciosCrud(tarifaId, {
          page: next?.page ?? page,
          per_page: next?.perPage ?? perPage,
          q: qNormalized.trim() ? qNormalized.trim() : undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          categoria_id: filterCategoriaId ?? undefined,
          subcategoria_id: filterSubcategoriaId ?? undefined,
          grupo_codigo: filterGrupoCodigo ?? undefined,
        });
        setData(res);
        return res;
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudieron cargar los servicios de la tarifa.");
        setNotice({ type: "error", text: msg });
        toastService.showError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [tarifaId, page, perPage, qNormalized, statusFilter, filterCategoriaId, filterSubcategoriaId, filterGrupoCodigo]
  );

  const prevFiltersRef = React.useRef<
    {
      q: string;
      status: StatusFilter;
      perPage: number;
      categoriaId: number | null;
      subcategoriaId: number | null;
      grupoCodigo: string | null;
    } | null
  >(null);
  React.useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = {
      q: qNormalized,
      status: statusFilter,
      perPage,
      categoriaId: filterCategoriaId,
      subcategoriaId: filterSubcategoriaId,
      grupoCodigo: filterGrupoCodigo,
    };
    const changed =
      !prev ||
      prev.q !== next.q ||
      prev.status !== next.status ||
      prev.perPage !== next.perPage ||
      prev.categoriaId !== next.categoriaId ||
      prev.subcategoriaId !== next.subcategoriaId ||
      prev.grupoCodigo !== next.grupoCodigo;
    prevFiltersRef.current = next;
    if (changed && page !== 1) {
      setPage(1);
      return;
    }
    void refresh();
  }, [page, perPage, qNormalized, statusFilter, filterCategoriaId, filterSubcategoriaId, filterGrupoCodigo, refresh]);

  const resetToNew = React.useCallback(() => {
    setMode("new");
    setSelected(null);
    setCodigo("");
    setDescripcion("");
    setEstado("ACTIVO");
    setCategoriaId(null);
    setSubcategoriaId(null);
    setNomenclador("");
    setPrecioSinIgv("");
    setPrecioConIgv("");
    setUnidad("");
    setGrupoCodigo(null);
    setDeseaLiberarPrecio(false);
    originalRef.current = null;
    setNotice(null);
  }, []);

  React.useEffect(() => {
    if (tarifaId) return;
    setData({
      data: [],
      meta: { current_page: 1, per_page: 50, total: 0, last_page: 1, igv_porcentaje: 18 },
    });
    setLoading(false);
    setNotice(null);
    prevFiltersRef.current = null;
    resetToNew();
    setPage(1);
  }, [tarifaId, resetToNew]);

  React.useEffect(() => {
    if (!tarifaId) return;
    resetToNew();
    setPage(1);
  }, [tarifaId, resetToNew]);

  const loadForEdit = React.useCallback((x: TarifaServicioCrud) => {
    setMode("edit");
    setSelected(x);
    setCodigo(x.codigo);
    setDescripcion(x.descripcion);
    setEstado(x.estado);
    setCategoriaId(x.categoria_id);
    setSubcategoriaId(x.subcategoria_id);
    setNomenclador(x.nomenclador ?? "");
    const precioSinNormalizado = x.precio_sin_igv.trim();
    const precioConNormalizado = String(x.precio_con_igv ?? "").trim();
    const unidadNormalizada = x.unidad.trim();
    setPrecioSinIgv(precioSinNormalizado);
    setPrecioConIgv(
      precioConNormalizado ||
        formatDecimalFixed(
          roundToPrecision(
            (parseDecimalInput(precioSinNormalizado) ?? 0) * (1 + igvPorcentajeLive / 100),
            4
          ),
          4
        )
    );
    setUnidad(unidadNormalizada);
    setGrupoCodigo(x.grupo_codigo ?? null);
    setDeseaLiberarPrecio(x.desea_liberar_precio ?? false);
    originalRef.current = {
      codigo: x.codigo,
      descripcion: x.descripcion,
      estado: x.estado,
      categoriaId: x.categoria_id,
      subcategoriaId: x.subcategoria_id,
      nomenclador: x.nomenclador ?? "",
      precioSinIgv: precioSinNormalizado,
      precioConIgv:
        precioConNormalizado ||
        formatDecimalFixed(
          roundToPrecision(
            (parseDecimalInput(precioSinNormalizado) ?? 0) * (1 + igvPorcentajeLive / 100),
            4
          ),
          4
        ),
      unidad: unidadNormalizada,
      grupoCodigo: x.grupo_codigo ?? null,
      deseaLiberarPrecio: x.desea_liberar_precio ?? false,
    };
    setNotice(null);
  }, [igvPorcentajeLive]);

  const cancel = React.useCallback(() => {
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
    setCategoriaId(o.categoriaId);
    setSubcategoriaId(o.subcategoriaId);
    setNomenclador(o.nomenclador);
    setPrecioSinIgv(o.precioSinIgv);
    setPrecioConIgv(o.precioConIgv);
    setUnidad(o.unidad);
    setGrupoCodigo(o.grupoCodigo);
    setDeseaLiberarPrecio(o.deseaLiberarPrecio);
  }, [mode, resetToNew, selected]);

  const onSave = React.useCallback(async () => {
    if (!tarifaId) return;
    setNotice(null);
    if (!isValid) {
      const msg = "Selecciona categoría, subcategoría y completa los datos obligatorios del servicio.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (mode === "edit" && !selected) {
      const msg = "Selecciona un servicio para editar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (!isDirty) {
      const msg = "No hay cambios para guardar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createServicio(tarifaId, {
          categoria_id: categoriaId!,
          subcategoria_id: subcategoriaId!,
          descripcion: descripcion.trim(),
          nomenclador: nomenclador.trim() ? nomenclador.trim() : null,
          precio_sin_igv: roundToPrecision(parseDecimalInput(precioSinIgv) ?? 0, 4),
          unidad: Number(unidad),
          grupo_codigo: grupoCodigo ?? undefined,
          desea_liberar_precio: deseaLiberarPrecio,
          estado,
        });
        let text = "Servicio creado.";
        const propMsg = mensajePropagacion(res.propagacion);
        if (propMsg) text += ` Aviso: ${propMsg}`;
        setNotice({ type: "success", text });
        toastService.showSuccess(text);
        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
      } else if (selected) {
        const res = await updateServicio(tarifaId, selected.id, {
          descripcion: descripcion.trim(),
          nomenclador: nomenclador.trim() ? nomenclador.trim() : null,
          precio_sin_igv: roundToPrecision(parseDecimalInput(precioSinIgv) ?? 0, 4),
          unidad: Number(unidad),
          grupo_codigo: grupoCodigo ?? undefined,
          desea_liberar_precio: deseaLiberarPrecio,
          estado,
        });
        if (statusFilter === "ACTIVO" && res.estado !== "ACTIVO") {
          setStatusFilter("ALL");
        }
        setNotice({ type: "success", text: "Servicio actualizado." });
        toastService.showSuccess("Servicio actualizado.");
        const refreshed = await refresh();
        const updated = refreshed?.data.find((x) => x.id === res.id);
        if (updated) {
          if (updated.estado !== estado) {
            const errMsg = "El servidor no confirmó el cambio de estado del servicio.";
            setNotice({ type: "error", text: errMsg });
            toastService.showError(errMsg);
            return;
          }
          loadForEdit(updated);
        }
      }
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar el servicio de la tarifa.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    tarifaId,
    categoriaId,
    subcategoriaId,
    descripcion,
    nomenclador,
    precioSinIgv,
    unidad,
    grupoCodigo,
    deseaLiberarPrecio,
    estado,
    mode,
    selected,
    refresh,
    resetToNew,
    saving,
    isValid,
    isDirty,
    loadForEdit,
    statusFilter,
  ]);

  const requestDeactivate = React.useCallback(() => {
    if (!selected) {
      const msg = "Selecciona un servicio para desactivar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!tarifaId || !selected) {
      setConfirmDeactivateOpen(false);
      const msg = "Selecciona un servicio para desactivar.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await deactivateServicio(tarifaId, selected.id);
      if (statusFilter === "ACTIVO") {
        setStatusFilter("ALL");
      }
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Servicio desactivado." });
      toastService.showSuccess("Servicio desactivado.");
      const refreshed = await refresh();
      const updated = refreshed?.data.find((x) => x.id === res.id);
      if (updated) {
        if (updated.estado !== "INACTIVO") {
          const errMsg = "El servidor no confirmó la desactivación del servicio.";
          setNotice({ type: "error", text: errMsg });
          toastService.showError(errMsg);
          return;
        }
        loadForEdit(updated);
      }
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar el servicio de la tarifa.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
    } finally {
      setSaving(false);
    }
  }, [tarifaId, selected, refresh, saving, loadForEdit, statusFilter]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO";

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
    codigo,
    descripcion,
    setDescripcion,
    estado,
    setEstado,
    categoriaId,
    setCategoriaId,
    subcategoriaId,
    setSubcategoriaId,
    categorias,
    subcategorias,
    subcategoriasFilter,
    filterCategoriaId,
    setFilterCategoriaId,
    filterSubcategoriaId,
    setFilterSubcategoriaId,
    filterGrupoCodigo,
    setFilterGrupoCodigo,
    nomenclador,
    setNomenclador,
    precioSinIgv,
    precioConIgv,
    onPrecioSinIgvChange,
    onPrecioConIgvChange,
    unidad,
    setUnidad,
    grupoCodigo,
    setGrupoCodigo,
    deseaLiberarPrecio,
    setDeseaLiberarPrecio,
    gruposOpciones,
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
    refresh,
  };
}

export function TarifarioCategoriasCrudView({
  tarifaId,
  tarifaMenuValue,
  tarifaMenuOptions,
  tarifaMenuLoading,
  tarifaMenuError,
  onTarifaMenuChange,
}: {
  tarifaId: number | null;
  tarifaMenuValue: string;
  tarifaMenuOptions: SelectOption[];
  tarifaMenuLoading: boolean;
  tarifaMenuError: string | null;
  onTarifaMenuChange: (value: string) => void;
}) {
  const vm = useCategoriasCrud(tarifaId);
  const tarifaReady = Boolean(tarifaId);
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  useNoticeToToast(vm.notice);

  useRealtimeModuleRefresh({
    module: "facturacion",
    entities: TARIFARIO_ENTITIES,
    onEvent: (event) => {
      if (!tarifaId || event.scope !== String(tarifaId)) return;
      void vm.refresh();
    },
  });

  const handleNew = React.useCallback(() => {
    if (!tarifaReady) return;
    vm.resetToNew();
    if (isLgUp) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [vm, isLgUp, tarifaReady]);

  const columns: DataTableColumn<TarifaCategoria>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.codigo,
    },
    { key: "descripcion", header: "Descripción", render: (x) => x.descripcion },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      {tarifaMenuError ? (
        <div className="text-sm text-(--color-danger)">{tarifaMenuError}</div>
      ) : null}
      <div className="w-full shrink-0 rounded border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SelectMenu
            value={tarifaMenuValue}
            onChange={onTarifaMenuChange}
            options={tarifaMenuOptions}
            ariaLabel="Tarifa"
            disabled={tarifaMenuLoading}
            buttonClassName={`h-10 min-w-[220px] shrink-0 basis-full sm:basis-auto ${inputBase}`}
            menuClassName="min-w-[220px]"
          />
          <input
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            placeholder="BUSCAR…"
            disabled={!tarifaReady}
            className={`h-10 min-w-50 flex-1 basis-full sm:basis-0 ${inputBase}`}
            aria-label="Buscar por código o descripción"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SelectMenu
              value={String(vm.statusFilter)}
              onChange={(v) => vm.setStatusFilter(v === "ALL" ? "ALL" : (v as RecordStatus))}
              options={statusOptions}
              ariaLabel="Filtrar por estado"
              disabled={!tarifaReady}
              buttonClassName={`h-10 min-w-[120px] ${inputBase}`}
              menuClassName="min-w-[120px]"
            />
            <SelectMenu
              value={String(vm.perPage)}
              onChange={(v) => vm.setPerPage(Number(v))}
              options={perPageOptions}
              ariaLabel="Registros por página"
              disabled={!tarifaReady}
              buttonClassName={`h-10 min-w-[80px] ${inputBase}`}
              menuClassName="min-w-[80px]"
            />
            <PrimaryButton className="shrink-0" disabled={!tarifaReady} onClick={handleNew}>
              Nuevo
            </PrimaryButton>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-2 lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:flex-1">
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
            <DataTable
              rows={vm.data.data}
              columns={columns}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={tarifaReady ? vm.loadForEdit : () => {}}
              emptyText={tarifaReady ? undefined : ""}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="desktop"
              onPrev={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.max(1, p - 1));
              }}
              onNext={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1));
              }}
              onFirst={() => {
                if (!tarifaReady) return;
                vm.setPage(1);
              }}
              onLast={() => {
                if (!tarifaReady) return;
                vm.setPage(vm.data.meta.last_page);
              }}
            />
          </div>

          <div className="lg:hidden">
            <MobileEntityList
              rows={vm.data.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={tarifaReady ? vm.loadForEdit : () => {}}
              emptyText={tarifaReady ? undefined : ""}
              renderMain={(x) => (
                <div className="text-sm font-semibold text-(--color-text-primary)">
                  <span className="tabular-nums">{x.codigo}</span> · {x.descripcion}
                </div>
              )}
              renderRight={(x) => <StatusBadge status={x.estado} />}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="mobile"
              onPrev={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.max(1, p - 1));
              }}
              onNext={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1));
              }}
              onFirst={() => {
                if (!tarifaReady) return;
                vm.setPage(1);
              }}
              onLast={() => {
                if (!tarifaReady) return;
                vm.setPage(vm.data.meta.last_page);
              }}
            />
          </div>
        </div>

        <div ref={formRef} className="min-w-0 shrink-0">
          <div
            className="h-full rounded border border-(--border-color-default) bg-(--color-surface) p-4"
            onKeyDown={makeEnterKeySaveHandler(
              Boolean(tarifaReady && vm.isValid && vm.isDirty && !vm.saving),
              vm.onSave
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-(--color-text-primary)">
                  {vm.mode === "new" ? "Nuevo registro" : `Editando: ${vm.selected?.codigo ?? ""}`}
                </div>
                <div className="text-xs text-(--color-text-secondary)">
                  {vm.mode === "new" ? "Crea una categoría." : "Modifica campos y guarda cambios."}
                </div>
              </div>
              {vm.selected ? <StatusBadge status={vm.selected.estado} /> : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Código</label>
                  <input
                    value={vm.codigo}
                    readOnly
                    disabled={!tarifaReady}
                    placeholder={vm.mode === "new" ? "Generando" : ""}
                    className={`mt-1 h-10 w-full ${inputBase}`}
                  />
                </div>

                <div>
                  <label className="text-sm text-(--color-text-primary)">Estado</label>
                  <div className="mt-1">
                    <SelectMenu
                      value={vm.estado}
                      onChange={(v) => vm.setEstado(v as RecordStatus)}
                      options={[
                        { value: "ACTIVO", label: "Activo" },
                        { value: "INACTIVO", label: "Inactivo" },
                        { value: "SUSPENDIDO", label: "Suspendido" },
                      ]}
                      ariaLabel="Estado"
                      disabled={!tarifaReady}
                      buttonClassName={`w-full h-10 ${inputBase}`}
                      menuClassName="min-w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">Descripción</label>
                <input
                  value={vm.descripcion}
                  onChange={(e) => vm.setDescripcion(e.target.value)}
                  disabled={!tarifaReady}
                  className={`mt-1 h-10 w-full ${inputBase}`}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <PrimaryButton
                className="w-full min-w-0"
                disabled={!tarifaReady || !vm.isValid || !vm.isDirty || vm.saving}
                onClick={vm.onSave}
              >
                {vm.mode === "new" ? (vm.saving ? "Creando..." : "Crear") : vm.saving ? "Guardando..." : "Guardar"}
              </PrimaryButton>
              <SecondaryButton className="w-full min-w-0" disabled={vm.saving || !tarifaReady} onClick={vm.cancel}>
                Cancelar
              </SecondaryButton>
              <DangerButton
                className="w-full min-w-0"
                disabled={!tarifaReady || !vm.canDeactivate || vm.saving}
                onClick={vm.requestDeactivate}
              >
                Desactivar
              </DangerButton>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar categoría"
        description={
          vm.selected ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?` : ""
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />
    </div>
  );
}

export function TarifarioSubcategoriasCrudView({
  tarifaId,
  tarifaMenuValue,
  tarifaMenuOptions,
  tarifaMenuLoading,
  tarifaMenuError,
  onTarifaMenuChange,
}: {
  tarifaId: number | null;
  tarifaMenuValue: string;
  tarifaMenuOptions: SelectOption[];
  tarifaMenuLoading: boolean;
  tarifaMenuError: string | null;
  onTarifaMenuChange: (value: string) => void;
}) {
  const vm = useSubcategoriasCrud(tarifaId);
  const tarifaReady = Boolean(tarifaId);
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  useNoticeToToast(vm.notice);
  const categoriaCodigoById = React.useMemo(() => {
    const map = new Map<number, string>();
    vm.categorias.forEach((c) => map.set(c.id, c.codigo));
    return map;
  }, [vm.categorias]);

  useRealtimeModuleRefresh({
    module: "facturacion",
    entities: TARIFARIO_ENTITIES,
    onEvent: (event) => {
      if (!tarifaId || event.scope !== String(tarifaId)) return;
      void vm.refresh();
    },
  });

  const handleNew = React.useCallback(() => {
    if (!tarifaReady) return;
    vm.resetToNew();
    if (isLgUp) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [vm, isLgUp, tarifaReady]);

  const columns: DataTableColumn<TarifaSubcategoria>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => {
        const catCode = categoriaCodigoById.get(x.categoria_id);
        return catCode ? `${catCode}.${x.codigo}` : x.codigo;
      },
    },
    { key: "descripcion", header: "Descripción", render: (x) => x.descripcion },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      {tarifaMenuError ? (
        <div className="text-sm text-(--color-danger)">{tarifaMenuError}</div>
      ) : null}
      <div className="w-full shrink-0 rounded border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SelectMenu
            value={tarifaMenuValue}
            onChange={onTarifaMenuChange}
            options={tarifaMenuOptions}
            ariaLabel="Tarifa"
            disabled={tarifaMenuLoading}
            buttonClassName={`h-10 min-w-[220px] shrink-0 basis-full sm:basis-auto ${inputBase}`}
            menuClassName="min-w-[220px]"
          />
          <input
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            placeholder="BUSCAR…"
            disabled={!tarifaReady}
            className={`h-10 min-w-50 flex-1 basis-full sm:basis-0 ${inputBase}`}
            aria-label="Buscar por código o descripción"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SelectMenu
              value={String(vm.statusFilter)}
              onChange={(v) => vm.setStatusFilter(v === "ALL" ? "ALL" : (v as RecordStatus))}
              options={statusOptions}
              ariaLabel="Filtrar por estado"
              disabled={!tarifaReady}
              buttonClassName={`h-10 min-w-[120px] ${inputBase}`}
              menuClassName="min-w-[120px]"
            />
            <SelectMenu
              value={vm.filterCategoriaId ? String(vm.filterCategoriaId) : ""}
              onChange={(v) => vm.setFilterCategoriaId(v ? Number(v) : null)}
              options={[
                { value: "", label: "Todas las categorías" },
                ...vm.categorias.map((c) => ({
                  value: String(c.id),
                  label: `${c.codigo} - ${c.descripcion}`,
                })),
              ]}
              ariaLabel="Categoría filtro"
              disabled={!tarifaReady}
              buttonClassName={`h-10 min-w-[220px] ${inputBase}`}
              menuClassName="min-w-[200px]"
            />
            <SelectMenu
              value={String(vm.perPage)}
              onChange={(v) => vm.setPerPage(Number(v))}
              options={perPageOptions}
              ariaLabel="Registros por página"
              disabled={!tarifaReady}
              buttonClassName={`h-10 min-w-[80px] ${inputBase}`}
              menuClassName="min-w-[80px]"
            />
            <PrimaryButton className="shrink-0" disabled={!tarifaReady} onClick={handleNew}>
              Nuevo
            </PrimaryButton>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-2 lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:flex-1">
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
            <DataTable
              rows={vm.data.data}
              columns={columns}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={tarifaReady ? vm.loadForEdit : () => {}}
              emptyText={tarifaReady ? undefined : ""}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="desktop"
              onPrev={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.max(1, p - 1));
              }}
              onNext={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1));
              }}
              onFirst={() => {
                if (!tarifaReady) return;
                vm.setPage(1);
              }}
              onLast={() => {
                if (!tarifaReady) return;
                vm.setPage(vm.data.meta.last_page);
              }}
            />
          </div>

          <div className="lg:hidden">
            <MobileEntityList
              rows={vm.data.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={tarifaReady ? vm.loadForEdit : () => {}}
              emptyText={tarifaReady ? undefined : ""}
              renderMain={(x) => {
                const catCode = categoriaCodigoById.get(x.categoria_id);
                const codigoFull = catCode ? `${catCode}.${x.codigo}` : x.codigo;
                return (
                  <div className="text-sm font-semibold text-(--color-text-primary)">
                    <span className="tabular-nums">{codigoFull}</span> · {x.descripcion}
                  </div>
                );
              }}
              renderRight={(x) => <StatusBadge status={x.estado} />}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="mobile"
              onPrev={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.max(1, p - 1));
              }}
              onNext={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1));
              }}
              onFirst={() => {
                if (!tarifaReady) return;
                vm.setPage(1);
              }}
              onLast={() => {
                if (!tarifaReady) return;
                vm.setPage(vm.data.meta.last_page);
              }}
            />
          </div>
        </div>

        <div ref={formRef} className="min-w-0 shrink-0">
          <div
            className="h-full rounded border border-(--border-color-default) bg-(--color-surface) p-4"
            onKeyDown={makeEnterKeySaveHandler(
              Boolean(tarifaReady && vm.isValid && vm.isDirty && !vm.saving),
              vm.onSave
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-(--color-text-primary)">
                  {vm.mode === "new"
                    ? "Nuevo registro"
                    : `Editando: ${vm.selected ? (categoriaCodigoById.get(vm.selected.categoria_id) ? `${categoriaCodigoById.get(vm.selected.categoria_id)}.${vm.selected.codigo}` : vm.selected.codigo) : ""}`}
                </div>
                <div className="text-xs text-(--color-text-secondary)">
                  {vm.mode === "new" ? "Crea una subcategoría." : "Modifica campos y guarda cambios."}
                </div>
              </div>
              {vm.selected ? <StatusBadge status={vm.selected.estado} /> : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm text-(--color-text-primary)">Categoría</label>
                <div className="mt-1">
                  <SelectMenu
                    value={vm.categoriaId ? String(vm.categoriaId) : ""}
                    onChange={(v) => vm.setCategoriaId(v ? Number(v) : null)}
                    options={[
                      { value: "", label: "Elegir categoría" },
                      ...vm.categorias.map((c) => ({
                        value: String(c.id),
                        label: `${c.codigo} - ${c.descripcion}`,
                      })),
                    ]}
                    ariaLabel="Categoría"
                    disabled={!tarifaReady}
                    buttonClassName={`w-full h-10 ${inputBase}`}
                    menuClassName="min-w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Código</label>
                  <input
                    value={
                      vm.categoriaId
                        ? `${categoriaCodigoById.get(vm.categoriaId) ?? ""}.${vm.codigo}`.replace(/^\./, "")
                        : vm.codigo
                    }
                    readOnly
                    disabled={!tarifaReady}
                    placeholder={vm.mode === "new" ? "Generando" : ""}
                    className={`mt-1 h-10 w-full ${inputBase}`}
                  />
                </div>

                <div>
                  <label className="text-sm text-(--color-text-primary)">Estado</label>
                  <div className="mt-1">
                    <SelectMenu
                      value={vm.estado}
                      onChange={(v) => vm.setEstado(v as RecordStatus)}
                      options={[
                        { value: "ACTIVO", label: "Activo" },
                        { value: "INACTIVO", label: "Inactivo" },
                        { value: "SUSPENDIDO", label: "Suspendido" },
                      ]}
                      ariaLabel="Estado"
                      disabled={!tarifaReady}
                      buttonClassName={`w-full h-10 ${inputBase}`}
                      menuClassName="min-w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">Descripción</label>
                <input
                  value={vm.descripcion}
                  onChange={(e) => vm.setDescripcion(e.target.value)}
                  disabled={!tarifaReady}
                  className={`mt-1 h-10 w-full ${inputBase}`}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <PrimaryButton
                className="w-full min-w-0"
                disabled={!tarifaReady || !vm.isValid || !vm.isDirty || vm.saving}
                onClick={vm.onSave}
              >
                {vm.mode === "new" ? (vm.saving ? "Creando..." : "Crear") : vm.saving ? "Guardando..." : "Guardar"}
              </PrimaryButton>
              <SecondaryButton className="w-full min-w-0" disabled={vm.saving || !tarifaReady} onClick={vm.cancel}>
                Cancelar
              </SecondaryButton>
              <DangerButton
                className="w-full min-w-0"
                disabled={!tarifaReady || !vm.canDeactivate || vm.saving}
                onClick={vm.requestDeactivate}
              >
                Desactivar
              </DangerButton>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar subcategoría"
        description={
          vm.selected
            ? `¿Deseas desactivar "${categoriaCodigoById.get(vm.selected.categoria_id) ? `${categoriaCodigoById.get(vm.selected.categoria_id)}.${vm.selected.codigo}` : vm.selected.codigo} - ${vm.selected.descripcion}"?`
            : ""
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />
    </div>
  );
}

export function TarifarioServiciosCrudView({
  tarifaId,
  tarifaMenuValue,
  tarifaMenuOptions,
  tarifaMenuLoading,
  tarifaMenuError,
  onTarifaMenuChange,
}: {
  tarifaId: number | null;
  tarifaMenuValue: string;
  tarifaMenuOptions: SelectOption[];
  tarifaMenuLoading: boolean;
  tarifaMenuError: string | null;
  onTarifaMenuChange: (value: string) => void;
}) {
  const vm = useServiciosCrud(tarifaId);
  const tarifaReady = Boolean(tarifaId);
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  useNoticeToToast(vm.notice);

  useRealtimeModuleRefresh({
    module: "facturacion",
    entities: TARIFARIO_ENTITIES,
    onEvent: (event) => {
      if (!tarifaId || event.scope !== String(tarifaId)) return;
      void vm.refresh();
    },
  });

  useRealtimeModuleRefresh({
    module: "ficheros",
    entities: ["parametro_igv"],
    onEvent: () => {
      if (!tarifaId) return;
      void vm.refresh();
    },
  });

  const handleNew = React.useCallback(() => {
    if (!tarifaReady) return;
    vm.resetToNew();
    if (isLgUp) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [vm, isLgUp, tarifaReady]);

  const [serviciosDeskPairH, setServiciosDeskPairH] = React.useState(0);
  React.useLayoutEffect(() => {
    if (!isLgUp || typeof ResizeObserver === "undefined") {
      setServiciosDeskPairH(0);
      return;
    }
    const sync = () => {
      const el = formRef.current;
      setServiciosDeskPairH(el ? Math.round(el.getBoundingClientRect().height) : 0);
    };
    const el = formRef.current;
    if (!el) {
      sync();
      return;
    }
    const ro = new ResizeObserver(() => sync());
    ro.observe(el);
    sync();
    return () => ro.disconnect();
  }, [isLgUp]);

  const columns: DataTableColumn<TarifaServicioCrud>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-36",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.codigo,
    },
    {
      key: "descripcion",
      header: "Descripción",
      headerClassName: "min-w-[200px]",
      cellClassName: "px-3 py-2 min-w-[200px]",
      render: (x) => x.descripcion,
    },
    {
      key: "precio_con_igv",
      header: "Precio",
      headerClassName: "text-center min-w-[8.5rem]",
      cellClassName: "px-3 py-2 align-middle text-sm",
      render: (x) => (
        <div className="flex w-full justify-center">
          <ReporteSolesAmount
            boldAmount={false}
            value={String(x.precio_con_igv ?? "").trim()}
          />
        </div>
      ),
    },
    {
      key: "unidad",
      header: "Unidad",
      headerClassName: "text-center w-24",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => String(x.unidad ?? "").trim(),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      {tarifaMenuError ? (
        <div className="text-sm text-(--color-danger)">{tarifaMenuError}</div>
      ) : null}
      <div className="w-full shrink-0 rounded border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SelectMenu
              value={tarifaMenuValue}
              onChange={onTarifaMenuChange}
              options={tarifaMenuOptions}
              ariaLabel="Seleccione una tarifa para cargar el listado de servicios."
              disabled={tarifaMenuLoading}
              buttonClassName={`h-10 min-w-[220px] shrink-0 basis-full sm:basis-auto ${tarifaReady ? `w-full sm:w-auto ${inputBase}` : `w-full sm:w-auto ${tarifaEmptyHighlightTriggerCls}`}`}
              menuClassName="min-w-[220px]"
            />
            <input
              value={vm.q}
              onChange={(e) => vm.setQ(e.target.value)}
              placeholder="BUSCAR…"
              disabled={!tarifaReady}
              className={`h-10 min-w-50 flex-1 basis-full sm:basis-0 ${inputBase}`}
              aria-label="Buscar por código, descripción o nomenclador"
            />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <SelectMenu
                value={String(vm.statusFilter)}
                onChange={(v) => vm.setStatusFilter(v === "ALL" ? "ALL" : (v as RecordStatus))}
                options={statusOptions}
                ariaLabel="Filtrar por estado"
                disabled={!tarifaReady}
                buttonClassName={`h-10 min-w-[120px] ${inputBase}`}
                menuClassName="min-w-[120px]"
              />
              <SelectMenu
                value={String(vm.perPage)}
                onChange={(v) => vm.setPerPage(Number(v))}
                options={perPageOptions}
                ariaLabel="Registros por página"
                disabled={!tarifaReady}
                buttonClassName={`h-10 min-w-[80px] ${inputBase}`}
                menuClassName="min-w-[80px]"
              />
              <PrimaryButton className="shrink-0" disabled={!tarifaReady} onClick={handleNew}>
                Nuevo
              </PrimaryButton>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-(--border-color-default) bg-(--color-panel-bg) px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="flex flex-wrap items-stretch gap-x-6 gap-y-3.5">
              <span className="inline-flex max-w-full items-center gap-2 self-center pr-1 text-[11px] font-semibold uppercase tracking-wider text-(--color-text-secondary)">
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-surface) text-(--color-primary) shadow-sm"
                  aria-hidden
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                Filtrar por
              </span>
              <div className="w-full min-w-[12rem] shrink-0 sm:w-auto sm:min-w-[11rem]">
                <SelectMenu
                  value={vm.filterCategoriaId ? String(vm.filterCategoriaId) : ""}
                  onChange={(v) => vm.setFilterCategoriaId(v ? Number(v) : null)}
                  options={[
                    { value: "", label: "Todas las categorías" },
                    ...vm.categorias.map((c) => ({
                      value: String(c.id),
                      label: `${c.codigo} - ${c.descripcion}`,
                    })),
                  ]}
                  ariaLabel="Categoría"
                  disabled={!tarifaReady}
                  buttonClassName={`w-full min-w-0 sm:min-w-[13rem] ${toolbarFilterSelectBase}`}
                  menuClassName="w-full sm:min-w-[16rem]"
                />
              </div>
              <div className="w-full min-w-[12rem] shrink-0 sm:w-auto sm:min-w-[11rem]">
                <SelectMenu
                  value={vm.filterSubcategoriaId ? String(vm.filterSubcategoriaId) : ""}
                  onChange={(v) => vm.setFilterSubcategoriaId(v ? Number(v) : null)}
                  options={[
                    { value: "", label: "Todas las subcategorías" },
                    ...vm.subcategoriasFilter.map((s) => ({
                      value: String(s.id),
                      label: `${s.codigo} - ${s.descripcion}`,
                    })),
                  ]}
                  ariaLabel="Subcategoría"
                  disabled={!tarifaReady}
                  buttonClassName={`w-full min-w-0 sm:min-w-[13rem] ${toolbarFilterSelectBase}`}
                  menuClassName="w-full sm:min-w-[16rem]"
                />
              </div>
              <div className="w-full min-w-[12rem] shrink-0 sm:w-auto sm:min-w-[11rem]">
                <SelectMenu
                  value={vm.filterGrupoCodigo ?? ""}
                  onChange={(v) => vm.setFilterGrupoCodigo(v ? v : null)}
                  options={[
                    { value: "", label: "Todos los grupos" },
                    ...vm.gruposOpciones.map((g) => ({ value: g.codigo, label: g.descripcion })),
                  ]}
                  ariaLabel="Filtrar por grupo"
                  disabled={!tarifaReady}
                  buttonClassName={`w-full min-w-0 sm:min-w-[13rem] ${toolbarFilterSelectBase}`}
                  menuClassName="w-full sm:min-w-[16rem]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-2 lg:items-start">
        <div
          className="flex min-h-0 min-w-0 flex-col overflow-hidden max-lg:flex-1 lg:shrink-0"
          style={isLgUp && serviciosDeskPairH > 0 ? { height: serviciosDeskPairH } : undefined}
        >
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
            <DataTable
              rows={vm.data.data}
              columns={columns}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={tarifaReady ? vm.loadForEdit : () => {}}
              emptyText={tarifaReady ? undefined : ""}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="desktop"
              onPrev={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.max(1, p - 1));
              }}
              onNext={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1));
              }}
              onFirst={() => {
                if (!tarifaReady) return;
                vm.setPage(1);
              }}
              onLast={() => {
                if (!tarifaReady) return;
                vm.setPage(vm.data.meta.last_page);
              }}
            />
          </div>

          <div className="lg:hidden">
            <MobileEntityList
              rows={vm.data.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={tarifaReady ? vm.loadForEdit : () => {}}
              emptyText={tarifaReady ? undefined : ""}
              renderMain={(x) => (
                <div className="text-sm font-semibold text-(--color-text-primary)">
                  <span className="tabular-nums">{x.codigo}</span> · {x.descripcion}
                </div>
              )}
              renderRight={(x) => <StatusBadge status={x.estado} />}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="mobile"
              onPrev={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.max(1, p - 1));
              }}
              onNext={() => {
                if (!tarifaReady) return;
                vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1));
              }}
              onFirst={() => {
                if (!tarifaReady) return;
                vm.setPage(1);
              }}
              onLast={() => {
                if (!tarifaReady) return;
                vm.setPage(vm.data.meta.last_page);
              }}
            />
          </div>
        </div>

        <div ref={formRef} className="min-h-0 min-w-0 w-full shrink-0 lg:self-start">
          <div
            className="flex min-w-0 flex-col overflow-hidden rounded border border-(--border-color-default) bg-(--color-surface) lg:h-auto lg:min-h-0 lg:shrink-0"
            onKeyDown={makeEnterKeySaveHandler(
              Boolean(tarifaReady && vm.isValid && vm.isDirty && !vm.saving),
              vm.onSave
            )}
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-4 app-scrollbar-thin app-scrollbar-no-gutter lg:flex-none lg:min-h-0 lg:overflow-visible">
              <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-(--color-text-primary)">
                  {vm.mode === "new" ? "Nuevo registro" : `Editando: ${vm.selected?.codigo ?? ""}`}
                </div>
                <div className="text-xs text-(--color-text-secondary)">
                  {vm.mode === "new" ? "Crea un servicio." : "Modifica campos y guarda cambios."}
                </div>
              </div>
              {vm.selected ? <StatusBadge status={vm.selected.estado} /> : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Categoría</label>
                  <div className="mt-1">
                    <SelectMenu
                      value={vm.categoriaId ? String(vm.categoriaId) : ""}
                      onChange={(v) => vm.setCategoriaId(v ? Number(v) : null)}
                      options={[
                        { value: "", label: "Elegir categoría" },
                        ...vm.categorias.map((c) => ({
                          value: String(c.id),
                          label: `${c.codigo} - ${c.descripcion}`,
                        })),
                      ]}
                      ariaLabel="Categoría"
                      disabled={!tarifaReady}
                      buttonClassName={`w-full h-10 ${inputBase}`}
                      menuClassName="min-w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-(--color-text-primary)">Subcategoría</label>
                  <div className="mt-1">
                    <SelectMenu
                      value={vm.subcategoriaId ? String(vm.subcategoriaId) : ""}
                      onChange={(v) => vm.setSubcategoriaId(v ? Number(v) : null)}
                      options={[
                        { value: "", label: "Elegir subcategoría" },
                        ...vm.subcategorias.map((s) => ({
                          value: String(s.id),
                          label: `${s.codigo} - ${s.descripcion}`,
                        })),
                      ]}
                      ariaLabel="Subcategoría"
                      disabled={!tarifaReady}
                      buttonClassName={`w-full h-10 ${inputBase}`}
                      menuClassName="min-w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Código</label>
                  <input
                    value={vm.codigo}
                    readOnly
                    disabled={!tarifaReady}
                    placeholder={vm.mode === "new" ? "Generando" : ""}
                    className={`mt-1 h-10 w-full ${inputBase}`}
                  />
                </div>

                <div>
                  <label className="text-sm text-(--color-text-primary)">Estado</label>
                  <div className="mt-1">
                    <SelectMenu
                      value={vm.estado}
                      onChange={(v) => vm.setEstado(v as RecordStatus)}
                      options={[
                        { value: "ACTIVO", label: "Activo" },
                        { value: "INACTIVO", label: "Inactivo" },
                        { value: "SUSPENDIDO", label: "Suspendido" },
                      ]}
                      ariaLabel="Estado"
                      disabled={!tarifaReady}
                      buttonClassName={`w-full h-10 ${inputBase}`}
                      menuClassName="min-w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">Descripción</label>
                <input
                  value={vm.descripcion}
                  onChange={(e) => vm.setDescripcion(e.target.value)}
                  disabled={!tarifaReady}
                  className={`mt-1 h-10 w-full ${inputBase}`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Precio con IGV</label>
                  <input
                    value={vm.precioConIgv}
                    onChange={(e) => vm.onPrecioConIgvChange(e.target.value)}
                    inputMode="decimal"
                    disabled={!tarifaReady}
                    className={`mt-1 h-10 w-full ${inputBase}`}
                  />
                </div>
                <div>
                  <label className="text-sm text-(--color-text-primary)">Precio sin IGV</label>
                  <input
                    value={vm.precioSinIgv}
                    onChange={(e) => vm.onPrecioSinIgvChange(e.target.value)}
                    inputMode="decimal"
                    disabled={!tarifaReady}
                    className={`mt-1 h-10 w-full ${inputBase}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Nomenclador</label>
                  <input
                    value={vm.nomenclador}
                    onChange={(e) => vm.setNomenclador(e.target.value)}
                    disabled={!tarifaReady}
                    className={`mt-1 h-10 w-full ${inputBase}`}
                  />
                </div>
                <div>
                  <label className="text-sm text-(--color-text-primary)">Unidad</label>
                  <input
                    value={vm.unidad}
                    onChange={(e) => vm.setUnidad(e.target.value)}
                    inputMode="decimal"
                    disabled={!tarifaReady}
                    className={`mt-1 h-10 w-full ${inputBase}`}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">Grupo</label>
                <div className="mt-1">
                  <SelectMenu
                    value={vm.grupoCodigo ?? ""}
                    onChange={(v) => vm.setGrupoCodigo(v ? v : null)}
                    options={[
                      { value: "", label: "Sin grupo" },
                      ...vm.gruposOpciones.map((g) => ({ value: g.codigo, label: g.descripcion })),
                    ]}
                    ariaLabel="Grupo del servicio"
                    disabled={!tarifaReady}
                    buttonClassName={`w-full h-10 ${inputBase}`}
                    menuClassName="min-w-[260px]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-(--color-text-primary) select-none">
                <input
                  type="checkbox"
                  checked={vm.deseaLiberarPrecio}
                  onChange={(e) => vm.setDeseaLiberarPrecio(e.target.checked)}
                  disabled={!tarifaReady}
                  className="h-4 w-4 rounded border border-(--border-color-default) accent-(--color-primary)"
                />
                Desea liberar el precio del servicio
              </label>

              <div className="mt-6 grid grid-cols-3 gap-2">
                <PrimaryButton
                  className="w-full min-w-0"
                  disabled={!tarifaReady || !vm.isValid || !vm.isDirty || vm.saving}
                  onClick={vm.onSave}
                >
                  {vm.mode === "new" ? (vm.saving ? "Creando..." : "Crear") : vm.saving ? "Guardando..." : "Guardar"}
                </PrimaryButton>
                <SecondaryButton className="w-full min-w-0" disabled={vm.saving || !tarifaReady} onClick={vm.cancel}>
                  Cancelar
                </SecondaryButton>
                <DangerButton
                  className="w-full min-w-0"
                  disabled={!tarifaReady || !vm.canDeactivate || vm.saving}
                  onClick={vm.requestDeactivate}
                >
                  Desactivar
                </DangerButton>
              </div>

            </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar servicio"
        description={
          vm.selected ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?` : ""
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />
    </div>
  );
}

