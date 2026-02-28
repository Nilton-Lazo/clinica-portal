import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { ConfirmDialog } from "../../../ficheros/components/ConfirmDialog";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import { useToast } from "../../../../shared/feedback";
import type { ApiError } from "../../../../shared/api/apiError";

/** Bordes unificados como checkbox: rounded + border, foco sin anillo. */
const inputBase =
  "rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";
import type {
  GrupoServicioLookup,
  Notice,
  PaginatedResponse,
  PropagacionResultado,
  RecordStatus,
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

function isApiError(e: unknown): e is ApiError {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return typeof x.kind === "string" && typeof x.message === "string";
}

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
  const toast = useToast();
  const lastRef = React.useRef<Notice | null>(null);
  React.useEffect(() => {
    if (!notice?.text) return;
    if (notice === lastRef.current) return;
    lastRef.current = notice;
    if (notice.type === "success") toast.success(notice.text);
    else toast.error(notice.text);
  }, [notice, toast]);
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
  const toast = useToast();
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
      .catch(() => {});
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
        const msg = isApiError(e) ? e.message : "No se pudo cargar categorías.";
        setNotice({ type: "error", text: msg });
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [tarifaId, page, perPage, qNormalized, statusFilter, toast]
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
    toast.success("Cambios cancelados.");
  }, [mode, resetToNew, selected, toast]);

  const onSave = React.useCallback(async () => {
    if (!tarifaId) return;
    setNotice(null);
    if (!isValid) {
      const msg = "Completa la descripción correctamente.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (mode === "edit" && !selected) {
      const msg = "Selecciona un registro para editar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (!isDirty) {
      const msg = "No hay cambios para guardar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
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
        toast.success(text);
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
        toast.success("Categoría actualizada.");
        const refreshed = await refresh();
        const updated = refreshed?.data.find((x) => x.id === res.id);
        if (updated) {
          if (updated.estado !== estado) {
            const errMsg = "El servidor no confirmó el cambio de estado.";
            setNotice({ type: "error", text: errMsg });
            toast.error(errMsg);
            return;
          }
          loadForEdit(updated);
        }
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar la categoría.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
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
      const msg = "Selecciona un registro para desactivar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!tarifaId || !selected) {
      setConfirmDeactivateOpen(false);
      const msg = "Selecciona un registro para desactivar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
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
      toast.success("Categoría desactivada.");
      const refreshed = await refresh();
      const updated = refreshed?.data.find((x) => x.id === res.id);
      if (updated) {
        if (updated.estado !== "INACTIVO") {
          const errMsg = "El servidor no confirmó la desactivación.";
          setNotice({ type: "error", text: errMsg });
          toast.error(errMsg);
          return;
        }
        loadForEdit(updated);
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar la categoría.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [tarifaId, selected, refresh, saving, loadForEdit, statusFilter, toast]);

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
  };
}

function useSubcategoriasCrud(tarifaId: number | null) {
  const toast = useToast();
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
      .catch(() => {});
  }, [tarifaId]);

  React.useEffect(() => {
    if (!tarifaId || mode !== "new" || !categoriaId || codigo.trim()) return;
    let alive = true;
    getNextSubcategoriaCodigo(tarifaId, categoriaId)
      .then((res) => {
        if (!alive) return;
        setCodigo(res.codigo);
      })
      .catch(() => {});
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
        const msg = isApiError(e) ? e.message : "No se pudo cargar subcategorías.";
        setNotice({ type: "error", text: msg });
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [tarifaId, page, perPage, qFinal, statusFilter, categoriaIdFinal, toast]
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
    toast.success("Cambios cancelados.");
  }, [mode, resetToNew, selected, toast]);

  const onSave = React.useCallback(async () => {
    if (!tarifaId) return;
    setNotice(null);
    if (!isValid) {
      const msg = "Completa los campos obligatorios.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (mode === "edit" && !selected) {
      const msg = "Selecciona un registro para editar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (!isDirty) {
      const msg = "No hay cambios para guardar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
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
        toast.success(text);
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
        toast.success("Subcategoría actualizada.");
        const refreshed = await refresh();
        const updated = refreshed?.data.find((x) => x.id === res.id);
        if (updated) {
          if (updated.estado !== estado) {
            const errMsg = "El servidor no confirmó el cambio de estado.";
            setNotice({ type: "error", text: errMsg });
            toast.error(errMsg);
            return;
          }
          loadForEdit(updated);
        }
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar la subcategoría.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
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
    toast,
  ]);

  const requestDeactivate = React.useCallback(() => {
    if (!selected) {
      const msg = "Selecciona un registro para desactivar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!tarifaId || !selected) {
      setConfirmDeactivateOpen(false);
      const msg = "Selecciona un registro para desactivar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
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
      toast.success("Subcategoría desactivada.");
      const refreshed = await refresh();
      const updated = refreshed?.data.find((x) => x.id === res.id);
      if (updated) {
        if (updated.estado !== "INACTIVO") {
          const errMsg = "El servidor no confirmó la desactivación.";
          setNotice({ type: "error", text: errMsg });
          toast.error(errMsg);
          return;
        }
        loadForEdit(updated);
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar la subcategoría.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [tarifaId, selected, refresh, saving, loadForEdit, statusFilter, toast]);

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
  };
}

function useServiciosCrud(tarifaId: number | null) {
  const toast = useToast();
  const [data, setData] = React.useState<PaginatedResponse<TarifaServicioCrud>>({
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
  const [precio, setPrecio] = React.useState("");
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
    precio: string;
    unidad: string;
    grupoCodigo: string | null;
    deseaLiberarPrecio: boolean;
  } | null>(null);

  React.useEffect(() => {
    lookupGruposServicio().then(setGrupos).catch(() => {});
  }, []);

  /** Lista para dropdowns: prioridad a grupos_servicio (API); si viene vacía, se completan con los que aparecen en servicios cargados. */
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

  React.useEffect(() => {
    if (!tarifaId) return;
    lookupCategorias(tarifaId, false)
      .then(setCategorias)
      .catch(() => {});
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
      .catch(() => {});
  }, [tarifaId, categoriaId, subcategoriaId]);

  React.useEffect(() => {
    if (!tarifaId || !filterCategoriaId) {
      setSubcategoriasFilter([]);
      return;
    }
    lookupSubcategorias(tarifaId, filterCategoriaId, false)
      .then(setSubcategoriasFilter)
      .catch(() => {});
  }, [tarifaId, filterCategoriaId]);

  React.useEffect(() => {
    if (!tarifaId || mode !== "new" || !categoriaId || !subcategoriaId || codigo.trim()) return;
    let alive = true;
    getNextServicioCodigo(tarifaId, categoriaId, subcategoriaId)
      .then((res) => {
        if (!alive) return;
        setCodigo(res.codigo);
      })
      .catch(() => {});
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
    const p = Number(precio);
    const u = Number(unidad);
    
    if (!categoriaId || !subcategoriaId) return false;
    if (!d) return false;
    if (!Number.isFinite(p) || p < 0) return false;
    if (!Number.isFinite(u) || u < 0) return false; // Cambiado de u <= 0 a u < 0
    if (mode === "new" && !codigo.trim()) return false;
    return true;
  }, [descripcion, precio, unidad, categoriaId, subcategoriaId, codigo, mode]);

  const isDirty = React.useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;
    
    // Normalizar valores para comparación consistente
    const descripcionActual = descripcion.trim();
    const nomencladorActual = nomenclador.trim();
    const precioActual = precio.trim();
    const unidadActual = unidad.trim();
    
    const comparaciones = {
      descripcion: o.descripcion !== descripcionActual,
      estado: o.estado !== estado,
      categoriaId: o.categoriaId !== categoriaId,
      subcategoriaId: o.subcategoriaId !== subcategoriaId,
      nomenclador: o.nomenclador !== nomencladorActual,
      precio: o.precio !== precioActual,
      unidad: o.unidad !== unidadActual,
      grupoCodigo: o.grupoCodigo !== grupoCodigo,
      deseaLiberarPrecio: o.deseaLiberarPrecio !== deseaLiberarPrecio,
    };
    
    const resultado = Object.values(comparaciones).some(Boolean);
    
    return resultado;
  }, [descripcion, estado, categoriaId, subcategoriaId, nomenclador, precio, unidad, grupoCodigo, deseaLiberarPrecio, mode, isValid]);

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
        const msg = isApiError(e) ? e.message : "No se pudo cargar servicios.";
        setNotice({ type: "error", text: msg });
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [tarifaId, page, perPage, qNormalized, statusFilter, filterCategoriaId, filterSubcategoriaId, filterGrupoCodigo, toast]
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
    setPrecio("");
    setUnidad("");
    setGrupoCodigo(null);
    setDeseaLiberarPrecio(false);
    originalRef.current = null;
    setNotice(null);
  }, []);

  const loadForEdit = React.useCallback((x: TarifaServicioCrud) => {
    setMode("edit");
    setSelected(x);
    setCodigo(x.codigo);
    setDescripcion(x.descripcion);
    setEstado(x.estado);
    setCategoriaId(x.categoria_id);
    setSubcategoriaId(x.subcategoria_id);
    setNomenclador(x.nomenclador ?? "");
    const precioNormalizado = x.precio_sin_igv.trim();
    const unidadNormalizada = x.unidad.trim();
    setPrecio(precioNormalizado);
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
      precio: precioNormalizado,
      unidad: unidadNormalizada,
      grupoCodigo: x.grupo_codigo ?? null,
      deseaLiberarPrecio: x.desea_liberar_precio ?? false,
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
    setSubcategoriaId(o.subcategoriaId);
    setNomenclador(o.nomenclador);
    setPrecio(o.precio);
    setUnidad(o.unidad);
    setGrupoCodigo(o.grupoCodigo);
    setDeseaLiberarPrecio(o.deseaLiberarPrecio);
    toast.success("Cambios cancelados.");
  }, [mode, resetToNew, selected, toast]);

  const onSave = React.useCallback(async () => {
    if (!tarifaId) return;
    setNotice(null);
    if (!isValid) {
      const msg = "Completa los campos obligatorios.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (mode === "edit" && !selected) {
      const msg = "Selecciona un registro para editar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (!isDirty) {
      const msg = "No hay cambios para guardar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
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
          precio_sin_igv: Number(precio),
          unidad: Number(unidad),
          grupo_codigo: grupoCodigo ?? undefined,
          desea_liberar_precio: deseaLiberarPrecio,
          estado,
        });
        let text = "Servicio creado.";
        const propMsg = mensajePropagacion(res.propagacion);
        if (propMsg) text += ` Aviso: ${propMsg}`;
        setNotice({ type: "success", text });
        toast.success(text);
        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
      } else if (selected) {
        const res = await updateServicio(tarifaId, selected.id, {
          descripcion: descripcion.trim(),
          nomenclador: nomenclador.trim() ? nomenclador.trim() : null,
          precio_sin_igv: Number(precio),
          unidad: Number(unidad),
          grupo_codigo: grupoCodigo ?? undefined,
          desea_liberar_precio: deseaLiberarPrecio,
          estado,
        });
        if (statusFilter === "ACTIVO" && res.estado !== "ACTIVO") {
          setStatusFilter("ALL");
        }
        setNotice({ type: "success", text: "Servicio actualizado." });
        toast.success("Servicio actualizado.");
        const refreshed = await refresh();
        const updated = refreshed?.data.find((x) => x.id === res.id);
        if (updated) {
          if (updated.estado !== estado) {
            const errMsg = "El servidor no confirmó el cambio de estado.";
            setNotice({ type: "error", text: errMsg });
            toast.error(errMsg);
            return;
          }
          loadForEdit(updated);
        }
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar el servicio.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [
    tarifaId,
    categoriaId,
    subcategoriaId,
    descripcion,
    nomenclador,
    precio,
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
    toast,
  ]);

  const requestDeactivate = React.useCallback(() => {
    if (!selected) {
      const msg = "Selecciona un registro para desactivar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected, toast]);

  const onDeactivateConfirmed = React.useCallback(async () => {
    if (!tarifaId || !selected) {
      setConfirmDeactivateOpen(false);
      const msg = "Selecciona un registro para desactivar.";
      setNotice({ type: "error", text: msg });
      toast.error(msg);
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
      toast.success("Servicio desactivado.");
      const refreshed = await refresh();
      const updated = refreshed?.data.find((x) => x.id === res.id);
      if (updated) {
        if (updated.estado !== "INACTIVO") {
          const errMsg = "El servidor no confirmó la desactivación.";
          setNotice({ type: "error", text: errMsg });
          toast.error(errMsg);
          return;
        }
        loadForEdit(updated);
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar el servicio.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [tarifaId, selected, refresh, saving, loadForEdit, statusFilter, toast]);

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
    precio,
    setPrecio,
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
  };
}

function CrudHeader({
  title,
  onBack,
  tarifaLabel,
}: {
  title: string;
  onBack: () => void;
  tarifaLabel: string;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="text-base font-semibold text-(--color-text-primary)">{title}</div>
        <div className="text-sm text-(--color-text-secondary)">
          CRUD con paginación y estados · {tarifaLabel}
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="h-10 rounded px-4 text-sm font-medium bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
      >
        Volver a Tarifario
      </button>
    </div>
  );
}

function CrudToolbar(props: {
  q: string;
  onQChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  perPage: number;
  onPerPageChange: (v: number) => void;
  onNew: () => void;
}) {
  const { q, onQChange, statusFilter, onStatusChange, perPage, onPerPageChange, onNew } = props;
  return (
    <div className="w-full shrink-0">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Buscar…"
          className={`h-10 basis-full lg:basis-auto lg:flex-1 min-w-65 ${inputBase}`}
          aria-label="Buscar por código o descripción"
        />

        <SelectMenu
          value={String(statusFilter)}
          onChange={(v) => onStatusChange(v === "ALL" ? "ALL" : (v as RecordStatus))}
          options={statusOptions}
          ariaLabel="Filtrar por estado"
          buttonClassName={`w-full sm:w-auto min-w-[160px] h-10 ${inputBase}`}
          menuClassName="min-w-[120px]"
        />

        <SelectMenu
          value={String(perPage)}
          onChange={(v) => onPerPageChange(Number(v))}
          options={perPageOptions}
          ariaLabel="Registros por página"
          buttonClassName={`w-full sm:w-auto min-w-[96px] h-10 ${inputBase}`}
          menuClassName="min-w-[90px]"
        />

        <PrimaryButton className="w-full sm:w-auto" onClick={onNew}>
          Nuevo
        </PrimaryButton>
      </div>
    </div>
  );
}

function CategoriasView({ tarifaId, tarifaLabel }: { tarifaId: number; tarifaLabel: string }) {
  const vm = useCategoriasCrud(tarifaId);
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  useNoticeToToast(vm.notice);

  const handleNew = React.useCallback(() => {
    vm.resetToNew();
    if (isLgUp) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [vm, isLgUp]);

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
      <CrudHeader
        title="Categorías"
        onBack={() => navigate(`/facturacion/tarifario?tarifaId=${tarifaId}`)}
        tarifaLabel={tarifaLabel}
      />
      <CrudToolbar
        q={vm.q}
        onQChange={vm.setQ}
        statusFilter={vm.statusFilter}
        onStatusChange={vm.setStatusFilter}
        perPage={vm.perPage}
        onPerPageChange={vm.setPerPage}
        onNew={handleNew}
      />

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-2 lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:flex-1">
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
            <DataTable
              rows={vm.data.data}
              columns={columns}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={vm.loadForEdit}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="desktop"
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
              onFirst={() => vm.setPage(1)}
              onLast={() => vm.setPage(vm.data.meta.last_page)}
            />
          </div>

          <div className="lg:hidden">
            <MobileEntityList
              rows={vm.data.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={vm.loadForEdit}
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
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
              onFirst={() => vm.setPage(1)}
              onLast={() => vm.setPage(vm.data.meta.last_page)}
            />
          </div>
        </div>

        <div ref={formRef} className="min-w-0 shrink-0">
          <div className="h-full rounded border border-(--border-color-default) bg-(--color-surface) p-4">
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
                  className={`mt-1 h-10 w-full ${inputBase}`}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <PrimaryButton disabled={!vm.isValid || !vm.isDirty || vm.saving} onClick={vm.onSave}>
                {vm.mode === "new" ? (vm.saving ? "Creando..." : "Crear") : vm.saving ? "Guardando..." : "Guardar cambios"}
              </PrimaryButton>
              <SecondaryButton disabled={vm.saving} onClick={vm.cancel}>
                Cancelar
              </SecondaryButton>
              <DangerButton disabled={!vm.canDeactivate || vm.saving} onClick={vm.requestDeactivate}>
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

function SubcategoriasView({ tarifaId, tarifaLabel }: { tarifaId: number; tarifaLabel: string }) {
  const vm = useSubcategoriasCrud(tarifaId);
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  useNoticeToToast(vm.notice);
  const categoriaCodigoById = React.useMemo(() => {
    const map = new Map<number, string>();
    vm.categorias.forEach((c) => map.set(c.id, c.codigo));
    return map;
  }, [vm.categorias]);

  const handleNew = React.useCallback(() => {
    vm.resetToNew();
    if (isLgUp) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [vm, isLgUp]);

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
      <CrudHeader
        title="Subcategorías"
        onBack={() => navigate(`/facturacion/tarifario?tarifaId=${tarifaId}`)}
        tarifaLabel={tarifaLabel}
      />
      <div className="w-full shrink-0">
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <input
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            placeholder="Buscar…"
            className={`h-10 basis-full lg:basis-auto lg:flex-1 min-w-65 ${inputBase}`}
            aria-label="Buscar por código o descripción"
          />

          <SelectMenu
            value={String(vm.statusFilter)}
            onChange={(v) => vm.setStatusFilter(v === "ALL" ? "ALL" : (v as RecordStatus))}
            options={statusOptions}
            ariaLabel="Filtrar por estado"
            buttonClassName={`w-full sm:w-auto min-w-[160px] h-10 ${inputBase}`}
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
            buttonClassName={`w-full sm:w-auto min-w-[220px] h-10 ${inputBase}`}
            menuClassName="min-w-[200px]"
          />

          <SelectMenu
            value={String(vm.perPage)}
            onChange={(v) => vm.setPerPage(Number(v))}
            options={perPageOptions}
            ariaLabel="Registros por página"
            buttonClassName={`w-full sm:w-auto min-w-[96px] h-10 ${inputBase}`}
            menuClassName="min-w-[90px]"
          />

          <PrimaryButton className="w-full sm:w-auto" onClick={handleNew}>
            Nuevo
          </PrimaryButton>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-2 lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:flex-1">
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
            <DataTable
              rows={vm.data.data}
              columns={columns}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={vm.loadForEdit}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="desktop"
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
              onFirst={() => vm.setPage(1)}
              onLast={() => vm.setPage(vm.data.meta.last_page)}
            />
          </div>

          <div className="lg:hidden">
            <MobileEntityList
              rows={vm.data.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={vm.loadForEdit}
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
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
              onFirst={() => vm.setPage(1)}
              onLast={() => vm.setPage(vm.data.meta.last_page)}
            />
          </div>
        </div>

        <div ref={formRef} className="min-w-0 shrink-0">
          <div className="h-full rounded border border-(--border-color-default) bg-(--color-surface) p-4">
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
                  className={`mt-1 h-10 w-full ${inputBase}`}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <PrimaryButton disabled={!vm.isValid || !vm.isDirty || vm.saving} onClick={vm.onSave}>
                {vm.mode === "new" ? (vm.saving ? "Creando..." : "Crear") : vm.saving ? "Guardando..." : "Guardar cambios"}
              </PrimaryButton>
              <SecondaryButton disabled={vm.saving} onClick={vm.cancel}>
                Cancelar
              </SecondaryButton>
              <DangerButton disabled={!vm.canDeactivate || vm.saving} onClick={vm.requestDeactivate}>
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

function ServiciosView({ tarifaId, tarifaLabel }: { tarifaId: number; tarifaLabel: string }) {
  const vm = useServiciosCrud(tarifaId);
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  useNoticeToToast(vm.notice);

  const handleNew = React.useCallback(() => {
    vm.resetToNew();
    if (isLgUp) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [vm, isLgUp]);

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
      <CrudHeader
        title="Servicios"
        onBack={() => navigate(`/facturacion/tarifario?tarifaId=${tarifaId}`)}
        tarifaLabel={tarifaLabel}
      />
      <div className="w-full shrink-0 rounded border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-4">
          {/* Fila 1: Búsqueda, estado, paginación y acción principal */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={vm.q}
              onChange={(e) => vm.setQ(e.target.value)}
              placeholder="Buscar…"
              className={`h-10 min-w-50 flex-1 basis-full sm:basis-0 ${inputBase}`}
              aria-label="Buscar por código, descripción o nomenclador"
            />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <SelectMenu
                value={String(vm.statusFilter)}
                onChange={(v) => vm.setStatusFilter(v === "ALL" ? "ALL" : (v as RecordStatus))}
                options={statusOptions}
                ariaLabel="Filtrar por estado"
                buttonClassName={`h-10 min-w-[120px] ${inputBase}`}
                menuClassName="min-w-[120px]"
              />
              <SelectMenu
                value={String(vm.perPage)}
                onChange={(v) => vm.setPerPage(Number(v))}
                options={perPageOptions}
                ariaLabel="Registros por página"
                buttonClassName={`h-10 min-w-[80px] ${inputBase}`}
                menuClassName="min-w-[80px]"
              />
              <PrimaryButton className="shrink-0" onClick={handleNew}>
                Nuevo
              </PrimaryButton>
            </div>
          </div>
          {/* Fila 2: Filtros por categoría, subcategoría y grupo */}
          <div className="flex flex-wrap items-stretch gap-3 border-t border-(--border-color-default) pt-4">
            <span className="flex items-center text-xs font-medium uppercase tracking-wide text-(--color-text-secondary) shrink-0">
              Filtrar por
            </span>
            <div className="w-full min-w-30 shrink-0 max-w-full sm:w-fit">
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
                buttonClassName={`h-10 w-full min-w-[120px] sm:w-fit ${inputBase}`}
                menuClassName="w-full"
              />
            </div>
            <div className="w-full min-w-30 shrink-0 max-w-full sm:w-fit">
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
                buttonClassName={`h-10 w-full min-w-[120px] sm:w-fit ${inputBase}`}
                menuClassName="w-full"
              />
            </div>
            <div className="w-full min-w-30 shrink-0 max-w-full sm:w-fit">
              <SelectMenu
                value={vm.filterGrupoCodigo ?? ""}
                onChange={(v) => vm.setFilterGrupoCodigo(v ? v : null)}
                options={[
                  { value: "", label: "Todos los grupos" },
                  ...vm.gruposOpciones.map((g) => ({ value: g.codigo, label: g.descripcion })),
                ]}
                ariaLabel="Filtrar por grupo"
                buttonClassName={`h-10 w-full min-w-[120px] sm:w-fit ${inputBase}`}
                menuClassName="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-2 lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:flex-1">
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
            <DataTable
              rows={vm.data.data}
              columns={columns}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={vm.loadForEdit}
            />
            <PaginationFooter
              meta={vm.data.meta}
              variant="desktop"
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
              onFirst={() => vm.setPage(1)}
              onLast={() => vm.setPage(vm.data.meta.last_page)}
            />
          </div>

          <div className="lg:hidden">
            <MobileEntityList
              rows={vm.data.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              getRowId={(x) => x.id}
              onSelect={vm.loadForEdit}
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
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
              onFirst={() => vm.setPage(1)}
              onLast={() => vm.setPage(vm.data.meta.last_page)}
            />
          </div>
        </div>

        <div ref={formRef} className="min-w-0 shrink-0">
          <div className="h-full rounded border border-(--border-color-default) bg-(--color-surface) p-4">
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
                  className={`mt-1 h-10 w-full ${inputBase}`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Nomenclador</label>
                  <input
                    value={vm.nomenclador}
                    onChange={(e) => vm.setNomenclador(e.target.value)}
                    className={`mt-1 h-10 w-full ${inputBase}`}
                  />
                </div>
                  <div>
                    <label className="text-sm text-(--color-text-primary)">Precio</label>
                    <input
                      value={vm.precio}
                      onChange={(e) => vm.setPrecio(e.target.value)}
                      inputMode="decimal"
                      className={`mt-1 h-10 w-full ${inputBase}`}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-(--color-text-primary)">Unidad</label>
                    <input
                      value={vm.unidad}
                      onChange={(e) => vm.setUnidad(e.target.value)}
                      inputMode="decimal"
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
                  className="h-4 w-4 rounded border border-(--border-color-default) accent-(--color-primary)"
                />
                Desea liberar el precio del servicio
              </label>

            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <PrimaryButton disabled={!vm.isValid || !vm.isDirty || vm.saving} onClick={vm.onSave}>
                {vm.mode === "new" ? (vm.saving ? "Creando..." : "Crear") : vm.saving ? "Guardando..." : "Guardar cambios"}
              </PrimaryButton>
              <SecondaryButton disabled={vm.saving} onClick={vm.cancel}>
                Cancelar
              </SecondaryButton>
              <DangerButton disabled={!vm.canDeactivate || vm.saving} onClick={vm.requestDeactivate}>
                Desactivar
              </DangerButton>
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

export default function TarifarioCrudPage() {
  const { tipo } = useParams<{ tipo?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tarifaIdRaw = Number(searchParams.get("tarifaId"));
  const tarifaId = Number.isFinite(tarifaIdRaw) && tarifaIdRaw > 0 ? tarifaIdRaw : null;
  const tarifaLabel = searchParams.get("tarifaLabel") || "Tarifario";

  if (!tarifaId) {
    return (
      <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-6">
        <div className="text-base font-semibold text-(--color-text-primary)">Tarifario</div>
        <div className="mt-2 text-sm text-(--color-text-secondary)">
          Selecciona una tarifa antes de gestionar categorías, subcategorías o servicios.
        </div>
        <button
          type="button"
          className="mt-4 h-10 rounded px-4 text-sm font-medium bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
          onClick={() => navigate("/facturacion/tarifario")}
        >
          Ir a Tarifario
        </button>
      </div>
    );
  }

  if (tipo === "categorias") return <CategoriasView tarifaId={tarifaId} tarifaLabel={tarifaLabel} />;
  if (tipo === "subcategorias")
    return <SubcategoriasView tarifaId={tarifaId} tarifaLabel={tarifaLabel} />;
  return <ServiciosView tarifaId={tarifaId} tarifaLabel={tarifaLabel} />;
}
