import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Notice,
  PaginatedResponse,
  RecordStatus,
  TarifaBaseTree,
  TarifaOperativa,
  TarifaServicioListItem,
  TarifaCloneResult,
} from "../types/tarifario.types";
import {
  cloneTarifaFromBase,
  getTarifaBaseTree,
  listTarifaServicios,
  listTarifasParaGestionTarifario,
} from "../services/tarifario.service";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import type { ApiError } from "../../../../shared/api/apiError";

let baseTreeCache: TarifaBaseTree | null = null;

let tarifasCache: TarifaOperativa[] | null = null;

function isApiError(e: unknown): e is ApiError {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return typeof x.kind === "string" && typeof x.message === "string";
}

function normalizeCodigoQuery(raw: string): string {
  const compact = raw.replace(/\./g, "").trim();
  if (!compact) return "";
  if (!/^\d+$/.test(compact)) return raw.trim();
  if (compact.length === 6) {
    return compact.replace(/(\d{2})(\d{2})(\d{2})/, "$1.$2.$3");
  }
  return compact;
}

export function useTarifario() {
  const [tarifas, setTarifas] = useState<TarifaOperativa[]>(() => tarifasCache ?? []);
  const [tarifasLoading, setTarifasLoading] = useState(false);

  const [tarifaId, setTarifaId] = useState<number | null>(null);
  const [cloneTarifaId, setCloneTarifaId] = useState<number | null>(null);

  const [data, setData] = useState<PaginatedResponse<TarifaServicioListItem>>({
    data: [],
    meta: { current_page: 1, per_page: 25, total: 0, last_page: 1 },
  });

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState<"ALL" | RecordStatus>("ALL");

  /** Búsqueda unificada: código, descripción o nomenclador (un solo campo, backend con q). */
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 300);
  const qNormalized = useMemo(() => normalizeCodigoQuery(qDebounced), [qDebounced]);
  const requestIdRef = useRef(0);

  const [selected, setSelected] = useState<TarifaServicioListItem | null>(null);

  const [baseTree, setBaseTree] = useState<TarifaBaseTree | null>(() => baseTreeCache);
  const [baseTreeLoading, setBaseTreeLoading] = useState(() => !baseTreeCache);

  const [selectedCategorias, setSelectedCategorias] = useState<Set<number>>(new Set());
  const [selectedSubcategorias, setSelectedSubcategorias] = useState<Set<number>>(new Set());
  const [selectedServicios, setSelectedServicios] = useState<Set<number>>(new Set());

  const [expandedCategorias, setExpandedCategorias] = useState<Set<number>>(new Set());
  const [expandedSubcategorias, setExpandedSubcategorias] = useState<Set<number>>(new Set());

  const treeMaps = useMemo(() => {
    const subsByCat = new Map<number, number[]>();
    const svcsBySub = new Map<number, number[]>();
    const catBySub = new Map<number, number>();
    const subBySvc = new Map<number, number>();

    if (!baseTree) {
      return { subsByCat, svcsBySub, catBySub, subBySvc };
    }

    baseTree.tree.forEach((cat) => {
      const subIds: number[] = [];
      cat.subcategorias.forEach((sub) => {
        subIds.push(sub.id);
        catBySub.set(sub.id, cat.id);
        const svcIds = sub.servicios.map((s) => s.id);
        svcsBySub.set(sub.id, svcIds);
        svcIds.forEach((sid) => subBySvc.set(sid, sub.id));
      });
      subsByCat.set(cat.id, subIds);
    });

    return { subsByCat, svcsBySub, catBySub, subBySvc };
  }, [baseTree]);

  useEffect(() => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    if (!notice) return;
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 10000);
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = null;
      }
    };
  }, [notice]);

  useEffect(() => {
    let alive = true;
    if (!tarifasCache) setTarifasLoading(true);
    listTarifasParaGestionTarifario()
      .then((items) => {
        if (!alive) return;
        tarifasCache = items;
        setTarifas(items);
      })
      .catch((e) => {
        if (!alive) return;
        const msg = isApiError(e) ? e.message : "No se pudo cargar las tarifas.";
        setNotice({ type: "error", text: msg });
      })
      .finally(() => {
        if (!alive) return;
        setTarifasLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);


  const refresh = useCallback(
    async (next?: { page?: number; silent?: boolean }) => {
      if (!tarifaId) return;
      const requestId = ++requestIdRef.current;
      setLoading(true);
      if (!next?.silent) setNotice(null);
      const searchQ = qNormalized.trim() || undefined;
      try {
        const res = await listTarifaServicios(tarifaId, {
          page: next?.page ?? page,
          per_page: perPage,
          q: searchQ,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });
        if (requestId !== requestIdRef.current) return;
        setData(res);
        if (res.data.length === 0) {
          setSelected(null);
        } else if (selected) {
          const match = res.data.find((x) => x.id === selected.id);
          if (!match) setSelected(null);
        }
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        const msg = isApiError(e) ? e.message : "No se pudo cargar los servicios.";
        setNotice({ type: "error", text: msg });
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [tarifaId, page, perPage, qNormalized, statusFilter, selected]
  );

  const prevFiltersRef = useRef<{ q: string; status: string; perPage: number } | null>(null);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qNormalized, status: statusFilter, perPage };
    const filtersChanged =
      !prev || prev.q !== next.q || prev.status !== next.status || prev.perPage !== next.perPage;
    prevFiltersRef.current = next;
    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }
    void refresh();
  }, [page, refresh, qNormalized, statusFilter, perPage]);

  useEffect(() => {
    let alive = true;
    if (!baseTreeCache) setBaseTreeLoading(true);
    getTarifaBaseTree()
      .then((payload) => {
        if (!alive) return;
        baseTreeCache = payload;
        setBaseTree(payload);
      })
      .catch((e) => {
        if (!alive) return;
        const msg = isApiError(e) ? e.message : "No se pudo cargar el árbol base.";
        setNotice({ type: "error", text: msg });
      })
      .finally(() => {
        if (!alive) return;
        setBaseTreeLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const toggleCategoria = useCallback(
    (id: number) => {
      const isChecked = selectedCategorias.has(id);
      const nextChecked = !isChecked;
      const subIds = treeMaps.subsByCat.get(id) ?? [];
      const svcIds = subIds.flatMap((sid) => treeMaps.svcsBySub.get(sid) ?? []);

      setSelectedCategorias((prev) => {
        const next = new Set(prev);
        if (nextChecked) next.add(id);
        else next.delete(id);
        return next;
      });

      setSelectedSubcategorias((prev) => {
        const next = new Set(prev);
        if (nextChecked) {
          subIds.forEach((sid) => next.add(sid));
        } else {
          subIds.forEach((sid) => next.delete(sid));
        }
        return next;
      });

      setSelectedServicios((prev) => {
        const next = new Set(prev);
        if (nextChecked) {
          svcIds.forEach((sid) => next.add(sid));
        } else {
          svcIds.forEach((sid) => next.delete(sid));
        }
        return next;
      });
    },
    [treeMaps, selectedCategorias]
  );

  const toggleSubcategoria = useCallback(
    (id: number) => {
      const isChecked = selectedSubcategorias.has(id);
      const nextChecked = !isChecked;
      const svcIds = treeMaps.svcsBySub.get(id) ?? [];

      setSelectedSubcategorias((prev) => {
        const next = new Set(prev);
        if (nextChecked) next.add(id);
        else next.delete(id);
        return next;
      });

      setSelectedServicios((prev) => {
        const next = new Set(prev);
        if (nextChecked) {
          svcIds.forEach((sid) => next.add(sid));
        } else {
          svcIds.forEach((sid) => next.delete(sid));
        }
        return next;
      });

    },
    [treeMaps, selectedSubcategorias]
  );

  const toggleServicio = useCallback(
    (id: number) => {
      const isChecked = selectedServicios.has(id);
      const nextChecked = !isChecked;

      setSelectedServicios((prev) => {
        const next = new Set(prev);
        if (nextChecked) next.add(id);
        else next.delete(id);
        return next;
      });
    },
    [selectedServicios]
  );

  const clearSelection = useCallback(() => {
    setSelectedCategorias(new Set());
    setSelectedSubcategorias(new Set());
    setSelectedServicios(new Set());
  }, []);

  const toggleExpandCategoria = useCallback((id: number) => {
    setExpandedCategorias((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleExpandSubcategoria = useCallback((id: number) => {
    setExpandedSubcategorias((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const canCloneSelected = useMemo(() => {
    return (
      selectedCategorias.size > 0 ||
      selectedSubcategorias.size > 0 ||
      selectedServicios.size > 0
    );
  }, [selectedCategorias, selectedSubcategorias, selectedServicios]);

  const isSubChecked = useCallback(
    (subId: number) => {
      if (selectedSubcategorias.has(subId)) return true;
      const svcIds = treeMaps.svcsBySub.get(subId) ?? [];
      return svcIds.some((sid) => selectedServicios.has(sid));
    },
    [selectedSubcategorias, selectedServicios, treeMaps]
  );

  const isCatChecked = useCallback(
    (catId: number) => {
      if (selectedCategorias.has(catId)) return true;
      const subIds = treeMaps.subsByCat.get(catId) ?? [];
      return subIds.some((sid) => isSubChecked(sid));
    },
    [selectedCategorias, treeMaps, isSubChecked]
  );

  const onCloneAll = useCallback(async () => {
    if (!cloneTarifaId) {
      setNotice({ type: "error", text: "Selecciona una tarifa destino." });
      return;
    }
    try {
      const result = await cloneTarifaFromBase(cloneTarifaId, { clone_all: true });
      const applied = result.applied;
      
      let message = "";
      if (applied.categorias === 0 && applied.subcategorias === 0 && applied.servicios === 0) {
        message = "No hay elementos nuevos para clonar.";
      } else {
        const parts = [];
        if (applied.categorias > 0) parts.push(`${applied.categorias} categorías`);
        if (applied.subcategorias > 0) parts.push(`${applied.subcategorias} subcategorías`);
        if (applied.servicios > 0) parts.push(`${applied.servicios} servicios`);
        
        message = `Se clonaron: ${parts.join(", ")}.`;
        
        if (applied.nomencladores_nulled_por_conflicto > 0) {
          message += ` ${applied.nomencladores_nulled_por_conflicto} nomencladores omitidos por conflicto.`;
        }
      }
      
      setNotice({ type: "success", text: message });
      clearSelection();
      if (tarifaId === cloneTarifaId) {
        setPage(1);
        setSelected(null);
        await refresh({ page: 1, silent: true });
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo clonar el tarifario.";
      setNotice({ type: "error", text: msg });
    }
  }, [cloneTarifaId, clearSelection, refresh, tarifaId]);

  const onCloneSelected = useCallback(async () => {
    if (!cloneTarifaId) {
      setNotice({ type: "error", text: "Selecciona una tarifa destino." });
      return;
    }
    if (!canCloneSelected) {
      setNotice({ type: "error", text: "Selecciona al menos una categoría, subcategoría o servicio." });
      return;
    }
    try {
      const result: TarifaCloneResult = await cloneTarifaFromBase(cloneTarifaId, {
        clone_all: false,
        categoria_ids: Array.from(selectedCategorias),
        subcategoria_ids: Array.from(selectedSubcategorias),
        servicio_ids: Array.from(selectedServicios),
      });
      const applied = result.applied;
      
      let message = "";
      if (applied.categorias === 0 && applied.subcategorias === 0 && applied.servicios === 0) {
        message = "No hay elementos nuevos para clonar.";
      } else {
        const parts = [];
        if (applied.categorias > 0) parts.push(`${applied.categorias} categorías`);
        if (applied.subcategorias > 0) parts.push(`${applied.subcategorias} subcategorías`);
        if (applied.servicios > 0) parts.push(`${applied.servicios} servicios`);
        
        message = `Se clonaron: ${parts.join(", ")}.`;
        
        if (applied.nomencladores_nulled_por_conflicto > 0) {
          message += ` ${applied.nomencladores_nulled_por_conflicto} nomencladores omitidos por conflicto.`;
        }
      }
      
      setNotice({ type: "success", text: message });
      clearSelection();
      if (tarifaId === cloneTarifaId) {
        setPage(1);
        setSelected(null);
        await refresh({ page: 1, silent: true });
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo clonar el tarifario.";
      setNotice({ type: "error", text: msg });
    }
  }, [
    cloneTarifaId,
    canCloneSelected,
    clearSelection,
    refresh,
    selectedCategorias,
    selectedSubcategorias,
    selectedServicios,
    tarifaId,
  ]);

  return {
    tarifas,
    tarifasLoading,
    tarifaId,
    setTarifaId,
    cloneTarifaId,
    setCloneTarifaId,
    data,
    loading,
    notice,
    setNotice,
    page,
    setPage,
    perPage,
    setPerPage,
    statusFilter,
    setStatusFilter,
    q,
    setQ,
    selected,
    setSelected,
    baseTree,
    baseTreeLoading,
    selectedCategorias,
    selectedSubcategorias,
    selectedServicios,
    expandedCategorias,
    setExpandedCategorias,
    expandedSubcategorias,
    setExpandedSubcategorias,
    toggleExpandCategoria,
    toggleExpandSubcategoria,
    toggleCategoria,
    toggleSubcategoria,
    toggleServicio,
    clearSelection,
    isSubChecked,
    isCatChecked,
    onCloneAll,
    onCloneSelected,
    canCloneSelected,
  };
}
