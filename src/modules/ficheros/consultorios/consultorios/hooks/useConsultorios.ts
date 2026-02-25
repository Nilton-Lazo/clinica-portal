import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Consultorio, PaginatedResponse, RecordStatus } from "../../types/consultorios.types";

import {
  createConsultorio,
  deactivateConsultorio,
  listConsultorios,
  updateConsultorio,
} from "../../services/consultorios.service";

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

function normalizeAbreviaturaInput(raw: string, prev: string): string {
  const upper = raw.toUpperCase().replace(/\s+/g, "");
  if (!upper) return "";
  if (upper[0] !== "C") return prev ? prev : "";

  const digits = upper
    .slice(1)
    .replace(/[^0-9]/g, "")
    .slice(0, 3);

  return `C${digits}`;
}

function deriveDescripcionFromAbreviatura(a: string): string {
  const m = /^C(\d{1,3})$/.exec(a.trim().toUpperCase());
  if (!m) return "";
  const digits = m[1] ?? "";
  if (!digits) return "";
  return `Consultorio ${digits}`;
}

function isAbreviaturaComplete(a: string): boolean {
  return /^C\d{3}$/.test(a.trim().toUpperCase());
}

export function useConsultorios() {
  const [data, setData] = useState<PaginatedResponse<Consultorio>>({
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
  const [selected, setSelected] = useState<Consultorio | null>(null);

  const [abreviatura, setAbreviaturaState] = useState("");
  const [descripcion, setDescripcionState] = useState("");
  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");
  const [esTercero, setEsTercero] = useState(false);

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const descripcionAutoRef = useRef<{ locked: boolean; lastAuto: string }>({
    locked: true,
    lastAuto: "",
  });

  const originalRef = useRef<{
    abreviatura: string;
    descripcion: string;
    estado: RecordStatus;
    esTercero: boolean;
  } | null>(null);

  const setAbreviatura = useCallback(
    (raw: string) => {
      const next = normalizeAbreviaturaInput(raw, abreviatura);
      if (next === abreviatura) return;

      setAbreviaturaState(next);

      if (descripcionAutoRef.current.locked) {
        const auto = deriveDescripcionFromAbreviatura(next);
        descripcionAutoRef.current.lastAuto = auto;
        setDescripcionState(auto);
      }
    },
    [abreviatura]
  );

  const setDescripcion = useCallback((raw: string) => {
    descripcionAutoRef.current.locked = false;
    setDescripcionState(raw);
  }, []);

  const isValid = useMemo(() => {
    const a = abreviatura.trim().toUpperCase();
    const d = descripcion.trim();

    if (!isAbreviaturaComplete(a)) return false;
    if (!d) return false;
    if (d.length > 255) return false;

    return true;
  }, [abreviatura, descripcion]);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    return (
      o.abreviatura !== abreviatura.trim() ||
      o.descripcion !== descripcion.trim() ||
      o.estado !== estado ||
      o.esTercero !== esTercero
    );
  }, [abreviatura, descripcion, estado, esTercero, mode, isValid]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setAbreviaturaState("");
    setDescripcionState("");
    setEstado("ACTIVO");
    setEsTercero(false);

    descripcionAutoRef.current.locked = true;
    descripcionAutoRef.current.lastAuto = "";

    originalRef.current = null;
    setNotice(null);
  }, []);

  const loadForEdit = useCallback((x: Consultorio) => {
    setMode("edit");
    setSelected(x);

    setAbreviaturaState(x.abreviatura);
    setDescripcionState(x.descripcion);
    setEstado(x.estado);
    setEsTercero(x.es_tercero);

    const auto = deriveDescripcionFromAbreviatura(x.abreviatura);
    descripcionAutoRef.current.locked = Boolean(auto) && x.descripcion.trim() === auto;
    descripcionAutoRef.current.lastAuto = auto;

    originalRef.current = {
      abreviatura: x.abreviatura,
      descripcion: x.descripcion,
      estado: x.estado,
      esTercero: x.es_tercero,
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

    setAbreviaturaState(o.abreviatura);
    setDescripcionState(o.descripcion);
    setEstado(o.estado);
    setEsTercero(o.esTercero);

    const auto = deriveDescripcionFromAbreviatura(o.abreviatura);
    descripcionAutoRef.current.locked = Boolean(auto) && o.descripcion.trim() === auto;
    descripcionAutoRef.current.lastAuto = auto;

    setNotice(null);
  }, [mode, resetToNew, selected]);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      try {
        const res = await listConsultorios({
          page: targetPage,
          per_page: targetPerPage,
          q: qDebounced.trim() ? qDebounced.trim() : undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });
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

    const filtersChanged =
      !prev || prev.q !== next.q || prev.status !== next.status || prev.perPage !== next.perPage;

    prevFiltersRef.current = next;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    void refresh();
  }, [page, perPage, qDebounced, statusFilter, refresh]);

  const onSave = useCallback(async () => {
    setNotice(null);

    const a = abreviatura.trim().toUpperCase();
    const d = descripcion.trim();

    if (!isAbreviaturaComplete(a)) {
      setNotice({ type: "error", text: "Abreviatura debe ser C + 3 números (ej. C101), sin espacios." });
      return;
    }

    if (!d || d.length > 255) {
      setNotice({ type: "error", text: "Completa la Descripción correctamente." });
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

    if (saving) return;
    setSaving(true);

    try {
      if (mode === "new") {
        const res = await createConsultorio({
          abreviatura: a,
          descripcion: d,
          es_tercero: esTercero,
          estado,
        });

        setNotice({ type: "success", text: "Consultorio creado." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateConsultorio(selected!.id, {
        abreviatura: a,
        descripcion: d,
        es_tercero: esTercero,
        estado,
      });

      setNotice({ type: "success", text: "Cambios guardados." });
      await refresh();

      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar.";
      setNotice({ type: "error", text: msg });
      } finally {
          setSaving(false);
        }
  }, [abreviatura, descripcion, esTercero, estado, isDirty, loadForEdit, mode, refresh, selected, saving]);

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

    try {
      const res = await deactivateConsultorio(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Consultorio desactivado." });

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo desactivar.";
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
    }
  }, [loadForEdit, refresh, selected]);

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

    abreviatura,
    setAbreviatura,
    descripcion,
    setDescripcion,
    estado,
    setEstado,
    esTercero,
    setEsTercero,

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
