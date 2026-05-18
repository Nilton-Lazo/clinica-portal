import { useCallback, useEffect, useRef, useState } from "react";
import { useCrudListQuery } from "../../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../../shared/datagrid";
import { listPresupuestos } from "../services/presupuestoLista.service";
import type {
  PresupuestoDocumentoEstado,
  PresupuestoListItem,
} from "../types/presupuestoLista.types";

export type PresupuestoListaNotice = { type: "success" | "error"; text: string } | null;
export type EstadoPresupuestoFiltro = "ALL" | PresupuestoDocumentoEstado;

function toIsoDateOrNull(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export function usePresupuestosLista() {
  const [vigenciaDesde, setVigenciaDesde] = useState("");
  const [vigenciaHasta, setVigenciaHasta] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoPresupuestoFiltro>("ALL");

  const vigenciaDesdeRef = useRef(vigenciaDesde);
  const vigenciaHastaRef = useRef(vigenciaHasta);
  const estadoFilterRef = useRef(estadoFilter);
  vigenciaDesdeRef.current = vigenciaDesde;
  vigenciaHastaRef.current = vigenciaHasta;
  estadoFilterRef.current = estadoFilter;

  const list = useCrudListQuery<PresupuestoListItem>({
    listFn: useCallback((params: DataGridFetchParams) => {
      const desdeIso = toIsoDateOrNull(vigenciaDesdeRef.current);
      const hastaIso = toIsoDateOrNull(vigenciaHastaRef.current);
      const estado =
        estadoFilterRef.current === "ALL" ? undefined : estadoFilterRef.current;
      return listPresupuestos({
        page: params.page,
        per_page: params.per_page,
        q: params.q,
        sort: params.sort,
        sort_dir: params.sort_dir,
        vigencia_desde: desdeIso ?? undefined,
        vigencia_hasta: hastaIso ?? undefined,
        estado,
      });
    }, []),
    errorMessage: "No se pudo cargar la lista de presupuestos de admisión.",
    initialSort: "created_at",
    initialSortDir: "desc",
  });

  const {
    data,
    loading,
    listError,
    page,
    setPage,
    perPage,
    setPerPage,
    q,
    setQ,
    sort,
    sortDir,
    toggleSort,
    refresh,
  } = list;

  const [notice, setNotice] = useState<PresupuestoListaNotice>(null);

  useEffect(() => {
    if (listError) {
      setNotice({ type: "error", text: listError });
    }
  }, [listError]);

  const setDesde = useCallback(
    (v: string) => {
      setVigenciaDesde(v);
      const a = toIsoDateOrNull(v);
      const b = toIsoDateOrNull(vigenciaHasta);
      if (a && b && a > b) setVigenciaHasta(v);
    },
    [vigenciaHasta]
  );

  const setHasta = useCallback(
    (v: string) => {
      setVigenciaHasta(v);
      const a = toIsoDateOrNull(vigenciaDesde);
      const b = toIsoDateOrNull(v);
      if (a && b && b < a) setVigenciaDesde(v);
    },
    [vigenciaDesde]
  );

  const prevExtraRef = useRef<{ desde: string; hasta: string; estado: EstadoPresupuestoFiltro } | null>(null);
  useEffect(() => {
    const prev = prevExtraRef.current;
    const next = { desde: vigenciaDesde, hasta: vigenciaHasta, estado: estadoFilter };
    if (prev && (prev.desde !== next.desde || prev.hasta !== next.hasta || prev.estado !== next.estado)) {
      if (page !== 1) {
        setPage(1);
      } else {
        void refresh();
      }
    }
    prevExtraRef.current = next;
  }, [vigenciaDesde, vigenciaHasta, estadoFilter, page, refresh, setPage]);

  return {
    data,
    loading,
    notice,
    page,
    setPage,
    perPage,
    setPerPage,
    q,
    setQ,
    vigenciaDesde,
    vigenciaHasta,
    setVigenciaDesde: setDesde,
    setVigenciaHasta: setHasta,
    estadoFilter,
    setEstadoFilter,
    sort,
    sortDir,
    toggleSort,
    refresh,
  };
}
