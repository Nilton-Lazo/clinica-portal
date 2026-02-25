import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Iafa, IafasQuery, PaginatedResponse, RecordStatus, TipoIafaLookup } from "../../types/iafas.types";

import {
  createIafa,
  deactivateIafa,
  getNextIafaCodigo,
  listIafas,
  listTiposIafasLookup,
  updateIafa,
} from "../../services/iafas.service";

import { useDebouncedValue } from "../../../../../shared/hooks/useDebouncedValue";
import type { ApiError } from "../../../../../shared/api/apiError";

export type Mode = "new" | "edit";
export type StatusFilter = "ALL" | RecordStatus;
export type Notice = { type: "success" | "error"; text: string } | null;

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

function isApiError(e: unknown): e is ApiError {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return typeof x.kind === "string" && typeof x.message === "string";
}

function toNullIfBlank(s: string): string | null {
  const x = s.trim();
  return x ? x : null;
}

function isDateIsoRequired(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(t);
}

function isRuc11(s: string): boolean {
  const t = s.trim();
  return /^[0-9]{11}$/.test(t);
}

function localTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useIafas() {
  const [data, setData] = useState<PaginatedResponse<Iafa>>({
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

  const [tipos, setTipos] = useState<TipoIafaLookup[]>([]);
  const [tiposLoading, setTiposLoading] = useState(false);

  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<Iafa | null>(null);

  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [tipoIafaId, setTipoIafaId] = useState<number>(0);

  const [razonSocial, setRazonSocial] = useState("");
  const [descripcionCorta, setDescripcionCorta] = useState("");
  const [ruc, setRuc] = useState("");

  const [direccion, setDireccion] = useState("");
  const [representanteLegal, setRepresentanteLegal] = useState("");
  const [telefono, setTelefono] = useState("");
  const [paginaWeb, setPaginaWeb] = useState("");

  const [fechaInicio, setFechaInicio] = useState<string>(() => localTodayIso());
  const [fechaFin, setFechaFin] = useState("");

  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const originalRef = useRef<{
    tipoIafaId: number;

    razonSocial: string;
    descripcionCorta: string;
    ruc: string;

    direccion: string | null;
    representanteLegal: string | null;
    telefono: string | null;
    paginaWeb: string | null;

    fechaInicio: string;
    fechaFin: string;

    estado: RecordStatus;
  } | null>(null);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextIafaCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setTiposLoading(true);
      try {
        const res = await listTiposIafasLookup();
        if (!alive) return;
        setTipos(res);
      } catch {
        if (!alive) return;
        setTipos([]);
      } finally {
        if (alive) setTiposLoading(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (mode === "new") void fetchCodigoPreview();
  }, [mode, fetchCodigoPreview]);

  const isValid = useMemo(() => {
    if (!tipoIafaId || tipoIafaId <= 0) return false;

    const rs = razonSocial.trim();
    const dc = descripcionCorta.trim();

    if (!rs || rs.length > 255) return false;
    if (!dc || dc.length > 120) return false;

    const r = ruc.trim();
    if (!isRuc11(r)) return false;

    if (direccion.trim().length > 255) return false;
    if (representanteLegal.trim().length > 150) return false;
    if (telefono.trim().length > 30) return false;
    if (paginaWeb.trim().length > 200) return false;

    if (!isDateIsoRequired(fechaInicio)) return false;
    if (!isDateIsoRequired(fechaFin)) return false;

    if (fechaFin < fechaInicio) return false;

    return true;
  }, [
    tipoIafaId,
    razonSocial,
    descripcionCorta,
    ruc,
    direccion,
    representanteLegal,
    telefono,
    paginaWeb,
    fechaInicio,
    fechaFin,
  ]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    return (
      o.tipoIafaId !== tipoIafaId ||
      o.razonSocial !== razonSocial.trim() ||
      o.descripcionCorta !== descripcionCorta.trim() ||
      o.ruc !== ruc.trim() ||
      o.direccion !== toNullIfBlank(direccion) ||
      o.representanteLegal !== toNullIfBlank(representanteLegal) ||
      o.telefono !== toNullIfBlank(telefono) ||
      o.paginaWeb !== toNullIfBlank(paginaWeb) ||
      o.fechaInicio !== fechaInicio.trim() ||
      o.fechaFin !== fechaFin.trim() ||
      o.estado !== estado
    );
  }, [
    mode,
    isValid,
    tipoIafaId,
    razonSocial,
    descripcionCorta,
    ruc,
    direccion,
    representanteLegal,
    telefono,
    paginaWeb,
    fechaInicio,
    fechaFin,
    estado,
  ]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setTipoIafaId(0);

    setRazonSocial("");
    setDescripcionCorta("");
    setRuc("");

    setDireccion("");
    setRepresentanteLegal("");
    setTelefono("");
    setPaginaWeb("");

    setFechaInicio(localTodayIso());
    setFechaFin("");

    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: Iafa) => {
    setMode("edit");
    setSelected(x);

    setTipoIafaId(x.tipo_iafa_id);

    setRazonSocial(x.razon_social);
    setDescripcionCorta(x.descripcion_corta);
    setRuc(x.ruc);

    setDireccion(x.direccion ?? "");
    setRepresentanteLegal(x.representante_legal ?? "");
    setTelefono(x.telefono ?? "");
    setPaginaWeb(x.pagina_web ?? "");

    setFechaInicio((x.fecha_inicio_cobertura ?? "").slice(0, 10));
    setFechaFin((x.fecha_fin_cobertura ?? "").slice(0, 10));

    setEstado(x.estado);

    originalRef.current = {
      tipoIafaId: x.tipo_iafa_id,

      razonSocial: x.razon_social,
      descripcionCorta: x.descripcion_corta,
      ruc: x.ruc,

      direccion: x.direccion ?? null,
      representanteLegal: x.representante_legal ?? null,
      telefono: x.telefono ?? null,
      paginaWeb: x.pagina_web ?? null,

      fechaInicio: (x.fecha_inicio_cobertura ?? "").slice(0, 10),
      fechaFin: (x.fecha_fin_cobertura ?? "").slice(0, 10),

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

    setTipoIafaId(o.tipoIafaId);

    setRazonSocial(o.razonSocial);
    setDescripcionCorta(o.descripcionCorta);
    setRuc(o.ruc);

    setDireccion(o.direccion ?? "");
    setRepresentanteLegal(o.representanteLegal ?? "");
    setTelefono(o.telefono ?? "");
    setPaginaWeb(o.paginaWeb ?? "");

    setFechaInicio(o.fechaInicio);
    setFechaFin(o.fechaFin);

    setEstado(o.estado);

    setNotice(null);
  }, [mode, resetToNew, selected]);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      const query: IafasQuery = {
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() ? qDebounced.trim() : undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      };

      try {
        const res = await listIafas(query);
        setData(res);
      } catch (e) {
        const msg = isApiError(e) ? e.message : "No se pudo cargar la lista.";
        setNotice({ type: "error", text: msg });
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
      setNotice({ type: "error", text: "Datos inválidos." });
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona un registro para editar." });
      return;
    }

    if (!isDirty) {
      setNotice({ type: "error", text: "No hay cambios para guardar." });
      return;
    }

    const payloadBase = {
      tipo_iafa_id: tipoIafaId,

      razon_social: razonSocial.trim(),
      descripcion_corta: descripcionCorta.trim(),
      ruc: ruc.trim(),

      direccion: toNullIfBlank(direccion),
      representante_legal: toNullIfBlank(representanteLegal),
      telefono: toNullIfBlank(telefono),
      pagina_web: toNullIfBlank(paginaWeb),

      fecha_inicio_cobertura: fechaInicio.trim(),
      fecha_fin_cobertura: fechaFin.trim(),
    };

    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createIafa({ ...payloadBase, estado });
        setNotice({ type: "success", text: "IAFAS creada." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateIafa(selected!.id, { ...payloadBase, estado });
      setNotice({ type: "success", text: "Cambios guardados." });

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar.";
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [
    isValid,
    mode,
    selected,
    isDirty,
    tipoIafaId,
    razonSocial,
    descripcionCorta,
    ruc,
    direccion,
    representanteLegal,
    telefono,
    paginaWeb,
    fechaInicio,
    fechaFin,
    estado,
    refresh,
    loadForEdit,
  ]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona un registro para desactivar." });
      return;
    }
    if (selected.estado === "INACTIVO") return;
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona un registro para desactivar." });
      return;
    }

    setSaving(true);
    try {
      const res = await deactivateIafa(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "IAFAS desactivada." });

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [loadForEdit, refresh, selected]);

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

    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPageState(clampPerPage(n)),
    q,
    setQ,
    statusFilter,
    setStatusFilter,

    tipos,
    tiposLoading,

    mode,
    selected,
    selectedRazonSocial,

    codigo,

    tipoIafaId,
    setTipoIafaId,

    razonSocial,
    setRazonSocial,
    descripcionCorta,
    setDescripcionCorta,
    ruc,
    setRuc,

    direccion,
    setDireccion,
    representanteLegal,
    setRepresentanteLegal,
    telefono,
    setTelefono,
    paginaWeb,
    setPaginaWeb,

    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,

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
