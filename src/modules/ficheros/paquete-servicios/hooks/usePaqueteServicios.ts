import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toastService } from "../../../../shared/notifications";
import { getApiErrorMessage } from "../../../../shared/api/apiError";
import type {
  PaqueteLookup,
  PaqueteServicioItem,
  TarifaLookup,
  TarifaServiciosTree,
} from "../../types/paqueteServicios.types";
import {
  getPaqueteServicios,
  getTarifaServiciosTree,
  listPaquetesByTarifa,
  listTarifasOperativas,
  syncPaqueteServicios,
} from "../../services/paqueteServicios.service";

function toUserMessage(e: unknown, fallback: string): string {
  const message = getApiErrorMessage(e, fallback);
  const msg = message.trim().toLowerCase();
  if (msg.includes("servicio_ids") || msg.includes("no pertenecen") || msg.includes("activos")) {
    return "Algunos servicios ya no son válidos para este paquete. Actualiza la pantalla e intenta otra vez.";
  }
  return message;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

export function usePaqueteServicios() {
  const [tarifas, setTarifas] = useState<TarifaLookup[]>([]);
  const [paquetes, setPaquetes] = useState<PaqueteLookup[]>([]);
  const [tree, setTree] = useState<TarifaServiciosTree | null>(null);
  const [assignedRows, setAssignedRows] = useState<PaqueteServicioItem[]>([]);

  const [tarifaId, setTarifaId] = useState<number | null>(null);
  const [paqueteId, setPaqueteId] = useState<number | null>(null);

  const [loadingTarifas, setLoadingTarifas] = useState(false);
  const [loadingPaquetes, setLoadingPaquetes] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [expandedCategorias, setExpandedCategorias] = useState<Set<number>>(new Set());
  const [expandedSubcategorias, setExpandedSubcategorias] = useState<Set<number>>(new Set());

  const [baseAssigned, setBaseAssigned] = useState<Set<number>>(new Set());
  const [workingAssigned, setWorkingAssigned] = useState<Set<number>>(new Set());
  const [treeQuery, setTreeQueryValue] = useState("");
  const [treeQueryDeferred, setTreeQueryDeferred] = useState("");
  const [treeFilterPending, startTransition] = useTransition();

  const setTreeQuery = useCallback((val: string) => {
    setTreeQueryValue(val);
    startTransition(() => {
      setTreeQueryDeferred(val);
    });
  }, []);

  const normalizeSearch = useCallback((s: string) => s.toLowerCase().replace(/\./g, "").trim(), []);

  useEffect(() => {
    let alive = true;
    setLoadingTarifas(true);
    listTarifasOperativas()
      .then((rows) => {
        if (!alive) return;
        setTarifas(rows);
      })
      .catch((e) => {
        if (!alive) return;
        toastService.showError(toUserMessage(e, "No se pudieron cargar las tarifas."));
      })
      .finally(() => {
        if (alive) setLoadingTarifas(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!tarifaId) {
      setPaquetes([]);
      setPaqueteId(null);
      setTree(null);
      setAssignedRows([]);
      setBaseAssigned(new Set());
      setWorkingAssigned(new Set());
      return;
    }

    let alive = true;
    setLoadingPaquetes(true);
    setLoadingTree(true);

    Promise.all([listPaquetesByTarifa(tarifaId), getTarifaServiciosTree(tarifaId)])
      .then(([paq, t]) => {
        if (!alive) return;
        setPaquetes(paq);
        setTree(t);
        if (!paq.some((x) => x.id === paqueteId)) {
          setPaqueteId(null);
        }
      })
      .catch((e) => {
        if (!alive) return;
        const msg = toUserMessage(e, "No se pudieron cargar los paquetes y servicios de la tarifa.");
        toastService.showError(msg);
      })
      .finally(() => {
        if (!alive) return;
        setLoadingPaquetes(false);
        setLoadingTree(false);
      });

    return () => {
      alive = false;
    };
  }, [tarifaId, paqueteId, reloadKey]);

  useEffect(() => {
    if (!paqueteId) {
      setAssignedRows([]);
      setBaseAssigned(new Set());
      setWorkingAssigned(new Set());
      return;
    }

    let alive = true;
    setLoadingAssigned(true);
    getPaqueteServicios(paqueteId)
      .then((rows) => {
        if (!alive) return;
        setAssignedRows(rows);
        const s = new Set(rows.map((x) => x.id));
        setBaseAssigned(s);
        setWorkingAssigned(new Set(s));
      })
      .catch((e) => {
        if (!alive) return;
        toastService.showError(toUserMessage(e, "No se pudieron cargar los servicios del paquete."));
      })
      .finally(() => {
        if (alive) setLoadingAssigned(false);
      });

    return () => {
      alive = false;
    };
  }, [paqueteId, reloadKey]);

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const treeMaps = useMemo(() => {
    const subsByCat = new Map<number, number[]>();
    const svcsBySub = new Map<number, number[]>();

    if (!tree) return { subsByCat, svcsBySub };

    tree.tree.forEach((cat) => {
      const subs: number[] = [];
      cat.subcategorias.forEach((sub) => {
        subs.push(sub.id);
        svcsBySub.set(sub.id, sub.servicios.map((x) => x.id));
      });
      subsByCat.set(cat.id, subs);
    });

    return { subsByCat, svcsBySub };
  }, [tree]);

  const treeSearchIndex = useMemo(() => {
    if (!tree) return null;
    const cats = new Map<number, { normCode: string; text: string }>();
    const subs = new Map<number, { normCode: string; text: string }>();
    const svcs = new Map<number, { normCode: string; text: string }>();

    for (const cat of tree.tree) {
      cats.set(cat.id, {
        normCode: normalizeSearch(cat.codigo),
        text: `${cat.codigo} ${cat.nombre}`.toLowerCase(),
      });
      for (const sub of cat.subcategorias) {
        subs.set(sub.id, {
          normCode: normalizeSearch(`${cat.codigo}.${sub.codigo}`),
          text: `${cat.codigo}.${sub.codigo} ${sub.nombre}`.toLowerCase(),
        });
        for (const sv of sub.servicios) {
          svcs.set(sv.id, {
            normCode: normalizeSearch(sv.codigo),
            text: `${sv.codigo} ${sv.descripcion}`.toLowerCase(),
          });
        }
      }
    }
    return { cats, subs, svcs };
  }, [tree, normalizeSearch]);

  const selectedCount = workingAssigned.size;
  const addedCount = useMemo(
    () => Array.from(workingAssigned).filter((id) => !baseAssigned.has(id)).length,
    [workingAssigned, baseAssigned]
  );
  const removedCount = useMemo(
    () => Array.from(baseAssigned).filter((id) => !workingAssigned.has(id)).length,
    [workingAssigned, baseAssigned]
  );
  const isDirty = addedCount > 0 || removedCount > 0;

  const filteredTree = useMemo(() => {
    if (!tree || !treeSearchIndex) return tree;
    const qRaw = treeQueryDeferred.trim().toLowerCase();
    const q = normalizeSearch(treeQueryDeferred);
    if (!q) return tree;

    const { cats: catIdx, subs: subIdx, svcs: svcIdx } = treeSearchIndex;

    const nextTree = tree.tree
      .map((cat) => {
        const ci = catIdx.get(cat.id);
        if (!ci) return null;
        const catMatch = ci.normCode.includes(q) || ci.text.includes(qRaw);

        const subcategorias = cat.subcategorias
          .map((sub) => {
            const si = subIdx.get(sub.id);
            if (!si) return null;
            const subMatch = si.normCode.includes(q) || si.text.includes(qRaw);
            const servicios = sub.servicios.filter((sv) => {
              const vi = svcIdx.get(sv.id);
              if (!vi) return false;
              return vi.normCode.includes(q) || vi.text.includes(qRaw);
            });
            if (catMatch || subMatch) return { ...sub, servicios: sub.servicios };
            if (servicios.length > 0) return { ...sub, servicios };
            return null;
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x));

        if (catMatch) return { ...cat, subcategorias: cat.subcategorias };
        if (subcategorias.length > 0) return { ...cat, subcategorias };
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return { ...tree, tree: nextTree };
  }, [tree, treeSearchIndex, treeQueryDeferred, normalizeSearch]);

  useEffect(() => {
    if (!filteredTree) return;
    if (!treeQueryDeferred.trim()) return;

    const catIds = new Set<number>();
    const subIds = new Set<number>();
    filteredTree.tree.forEach((cat) => {
      catIds.add(cat.id);
      cat.subcategorias.forEach((sub) => subIds.add(sub.id));
    });
    setExpandedCategorias((prev) => (setsEqual(prev, catIds) ? prev : catIds));
    setExpandedSubcategorias((prev) => (setsEqual(prev, subIds) ? prev : subIds));
  }, [filteredTree, treeQueryDeferred]);

  const toggleServicio = useCallback((id: number) => {
    setWorkingAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSubcategoria = useCallback(
    (subId: number) => {
      const ids = treeMaps.svcsBySub.get(subId) ?? [];
      const allChecked = ids.length > 0 && ids.every((id) => workingAssigned.has(id));
      setWorkingAssigned((prev) => {
        const next = new Set(prev);
        if (allChecked) ids.forEach((id) => next.delete(id));
        else ids.forEach((id) => next.add(id));
        return next;
      });
    },
    [treeMaps, workingAssigned]
  );

  const toggleCategoria = useCallback(
    (catId: number) => {
      const subIds = treeMaps.subsByCat.get(catId) ?? [];
      const ids = subIds.flatMap((sid) => treeMaps.svcsBySub.get(sid) ?? []);
      const allChecked = ids.length > 0 && ids.every((id) => workingAssigned.has(id));
      setWorkingAssigned((prev) => {
        const next = new Set(prev);
        if (allChecked) ids.forEach((id) => next.delete(id));
        else ids.forEach((id) => next.add(id));
        return next;
      });
    },
    [treeMaps, workingAssigned]
  );

  const isSubChecked = useCallback(
    (subId: number) => {
      const ids = treeMaps.svcsBySub.get(subId) ?? [];
      if (!ids.length) return false;
      return ids.some((id) => workingAssigned.has(id));
    },
    [treeMaps, workingAssigned]
  );

  const isCatChecked = useCallback(
    (catId: number) => {
      const subIds = treeMaps.subsByCat.get(catId) ?? [];
      const ids = subIds.flatMap((sid) => treeMaps.svcsBySub.get(sid) ?? []);
      if (!ids.length) return false;
      return ids.some((id) => workingAssigned.has(id));
    },
    [treeMaps, workingAssigned]
  );

  const isSubIndeterminate = useCallback(
    (subId: number) => {
      const ids = treeMaps.svcsBySub.get(subId) ?? [];
      if (!ids.length) return false;
      const selected = ids.filter((id) => workingAssigned.has(id)).length;
      return selected > 0 && selected < ids.length;
    },
    [treeMaps, workingAssigned]
  );

  const isCatIndeterminate = useCallback(
    (catId: number) => {
      const subIds = treeMaps.subsByCat.get(catId) ?? [];
      const ids = subIds.flatMap((sid) => treeMaps.svcsBySub.get(sid) ?? []);
      if (!ids.length) return false;
      const selected = ids.filter((id) => workingAssigned.has(id)).length;
      return selected > 0 && selected < ids.length;
    },
    [treeMaps, workingAssigned]
  );

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

  const workingSelectedRows = useMemo(() => {
    const fromAssigned = new Map(assignedRows.map((x) => [x.id, x]));
    const fromTree = new Map<number, PaqueteServicioItem>();

    if (tree) {
      tree.tree.forEach((cat) => {
        cat.subcategorias.forEach((sub) => {
          sub.servicios.forEach((sv) => {
            fromTree.set(sv.id, {
              id: sv.id,
              codigo: sv.codigo,
              descripcion: sv.descripcion,
              precio_sin_igv: sv.precio_sin_igv,
              unidad: sv.unidad,
              categoria_codigo: cat.codigo,
              categoria_nombre: cat.nombre,
              subcategoria_codigo: sub.codigo,
              subcategoria_nombre: sub.nombre,
            });
          });
        });
      });
    }

    return Array.from(workingAssigned)
      .map((id) => fromAssigned.get(id) ?? fromTree.get(id))
      .filter((x): x is PaqueteServicioItem => Boolean(x));
  }, [assignedRows, tree, workingAssigned]);

  const removeServicio = useCallback((id: number) => {
    setWorkingAssigned((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const onReset = useCallback(() => {
    setWorkingAssigned(new Set(baseAssigned));
    toastService.showSuccess("Cambios locales descartados.");
  }, [baseAssigned]);

  const onSave = useCallback(async () => {
    if (!paqueteId) {
      toastService.showError("Selecciona un paquete antes de guardar sus servicios.");
      return;
    }
    if (!isDirty) {
      toastService.showError("No hay cambios para guardar.");
      return;
    }

    setSaving(true);
    try {
      const rows = await syncPaqueteServicios(paqueteId, Array.from(workingAssigned));
      setAssignedRows(rows);
      const saved = new Set(rows.map((x) => x.id));
      setBaseAssigned(saved);
      setWorkingAssigned(new Set(saved));
      refresh();
      toastService.showSuccess("Los servicios del paquete se actualizaron correctamente.");
    } catch (e) {
      toastService.showError(toUserMessage(e, "No se pudieron guardar los servicios del paquete. Intenta otra vez."));
    } finally {
      setSaving(false);
    }
  }, [isDirty, paqueteId, refresh, workingAssigned]);

  return {
    tarifas,
    paquetes,
    tree,
    tarifaId,
    setTarifaId,
    paqueteId,
    setPaqueteId,
    loadingTarifas,
    loadingPaquetes,
    loadingTree,
    loadingAssigned,
    saving,
    refresh,
    expandedCategorias,
    expandedSubcategorias,
    filteredTree,
    treeQuery,
    treeQueryDeferred,
    treeFilterPending,
    setTreeQuery,
    toggleExpandCategoria,
    toggleExpandSubcategoria,
    toggleCategoria,
    toggleSubcategoria,
    toggleServicio,
    isSubChecked,
    isCatChecked,
    isSubIndeterminate,
    isCatIndeterminate,
    workingAssigned,
    workingSelectedRows,
    removeServicio,
    selectedCount,
    addedCount,
    removedCount,
    isDirty,
    onReset,
    onSave,
  };
}
