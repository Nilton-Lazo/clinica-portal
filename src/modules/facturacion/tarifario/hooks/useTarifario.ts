import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Notice,
  PaginatedResponse,
  TarifaBaseTree,
  TarifaOperativa,
  TarifaServicioListItem,
} from "../types/tarifario.types";
import {
  cloneTarifaFromBase,
  getTarifaBaseTree,
  listTarifaServicios,
  listTarifasOperativas,
} from "../services/tarifario.service";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import type { ApiError } from "../../../../shared/api/apiError";

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
  const [tarifas, setTarifas] = useState<TarifaOperativa[]>([]);
  const [tarifasLoading, setTarifasLoading] = useState(false);

  const [tarifaId, setTarifaId] = useState<number | null>(null);
  const [cloneTarifaId, setCloneTarifaId] = useState<number | null>(null);

  const [data, setData] = useState<PaginatedResponse<TarifaServicioListItem>>({
    data: [],
    meta: { current_page: 1, per_page: 25, total: 0, last_page: 1 },
  });

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [page, setPage] = useState(1);
  const [perPage] = useState(25);

  const [codigo, setCodigo] = useState("");
  const [nomenclador, setNomenclador] = useState("");

  const codigoDebounced = useDebouncedValue(codigo, 350);
  const codigoNormalized = useMemo(
    () => normalizeCodigoQuery(codigoDebounced),
    [codigoDebounced]
  );
  const nomencladorDebounced = useDebouncedValue(nomenclador, 350);

  const [selected, setSelected] = useState<TarifaServicioListItem | null>(null);

  const [baseTree, setBaseTree] = useState<TarifaBaseTree | null>(null);
  const [baseTreeLoading, setBaseTreeLoading] = useState(false);

  const [selectedCategorias, setSelectedCategorias] = useState<Set<number>>(new Set());
  const [selectedSubcategorias, setSelectedSubcategorias] = useState<Set<number>>(new Set());
  const [selectedServicios, setSelectedServicios] = useState<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    setTarifasLoading(true);
    listTarifasOperativas()
      .then((items) => {
        if (!alive) return;
        setTarifas(items);
        if (!tarifaId && items.length > 0) {
          setTarifaId(items[0].id);
          setCloneTarifaId(items[0].id);
        }
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
  }, [tarifaId]);

  useEffect(() => {
    if (!tarifaId) return;
    if (cloneTarifaId == null) {
      setCloneTarifaId(tarifaId);
    }
  }, [tarifaId, cloneTarifaId]);

  const refresh = useCallback(
    async (next?: { page?: number }) => {
      if (!tarifaId) return;
      setLoading(true);
      setNotice(null);
      try {
        const res = await listTarifaServicios(tarifaId, {
          page: next?.page ?? page,
          per_page: perPage,
          codigo: codigoNormalized.trim() ? codigoNormalized.trim() : undefined,
          nomenclador: nomencladorDebounced.trim() ? nomencladorDebounced.trim() : undefined,
        });
        setData(res);
        if (res.data.length === 0) {
          setSelected(null);
        } else if (selected) {
          const match = res.data.find((x) => x.id === selected.id);
          if (!match) setSelected(null);
        }
      } catch (e) {
        const msg = isApiError(e) ? e.message : "No se pudo cargar los servicios.";
        setNotice({ type: "error", text: msg });
      } finally {
        setLoading(false);
      }
    },
    [tarifaId, page, perPage, codigoNormalized, nomencladorDebounced, selected]
  );

  const prevFiltersRef = useRef<{ codigo: string; nomenclador: string } | null>(null);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { codigo: codigoNormalized, nomenclador: nomencladorDebounced };
    const filtersChanged = !prev || prev.codigo !== next.codigo || prev.nomenclador !== next.nomenclador;
    prevFiltersRef.current = next;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    void refresh();
  }, [page, refresh, codigoNormalized, nomencladorDebounced]);

  useEffect(() => {
    let alive = true;
    setBaseTreeLoading(true);
    getTarifaBaseTree()
      .then((payload) => {
        if (!alive) return;
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

  const toggleCategoria = useCallback((id: number) => {
    setSelectedCategorias((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSubcategoria = useCallback((id: number) => {
    setSelectedSubcategorias((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleServicio = useCallback((id: number) => {
    setSelectedServicios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCategorias(new Set());
    setSelectedSubcategorias(new Set());
    setSelectedServicios(new Set());
  }, []);

  const canCloneSelected = useMemo(() => {
    return (
      selectedCategorias.size > 0 ||
      selectedSubcategorias.size > 0 ||
      selectedServicios.size > 0
    );
  }, [selectedCategorias, selectedSubcategorias, selectedServicios]);

  const onCloneAll = useCallback(async () => {
    if (!cloneTarifaId) {
      setNotice({ type: "error", text: "Selecciona una tarifa destino." });
      return;
    }
    try {
      await cloneTarifaFromBase(cloneTarifaId, { clone_all: true });
      setNotice({ type: "success", text: "Tarifario clonado correctamente." });
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo clonar el tarifario.";
      setNotice({ type: "error", text: msg });
    }
  }, [cloneTarifaId]);

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
      await cloneTarifaFromBase(cloneTarifaId, {
        clone_all: false,
        categoria_ids: Array.from(selectedCategorias),
        subcategoria_ids: Array.from(selectedSubcategorias),
        servicio_ids: Array.from(selectedServicios),
      });
      setNotice({ type: "success", text: "Clonación parcial completada." });
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo clonar el tarifario.";
      setNotice({ type: "error", text: msg });
    }
  }, [cloneTarifaId, canCloneSelected, selectedCategorias, selectedSubcategorias, selectedServicios]);

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
    codigo,
    setCodigo,
    nomenclador,
    setNomenclador,
    selected,
    setSelected,
    baseTree,
    baseTreeLoading,
    selectedCategorias,
    selectedSubcategorias,
    selectedServicios,
    toggleCategoria,
    toggleSubcategoria,
    toggleServicio,
    clearSelection,
    onCloneAll,
    onCloneSelected,
    canCloneSelected,
  };
}
