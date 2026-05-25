import { useCrudListQuery } from "../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../shared/datagrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Iafa, RecordStatus, TipoIafaLookup } from "../../types/iafas.types";

import {
  createIafa,
  deactivateIafa,
  getNextIafaCodigo,
  listIafas,
  listTiposIafasLookup,
  updateIafa,
} from "../../services/iafas.service";

import { toastService } from "../../../../shared/notifications";
import { getApiErrorMessage } from "../../../../shared/api/apiError";
import { formatActionIssues } from "../../utils/actionFeedback";

export type Mode = "new" | "edit";
export type StatusFilter = "ALL" | RecordStatus;
export type Notice = { type: "success" | "error"; text: string } | null;


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
  const list = useCrudListQuery<Iafa>({
    listFn: useCallback(
      (params: DataGridFetchParams) =>
        listIafas({
          page: params.page,
          per_page: params.per_page,
          q: params.q,
          status: params.status as RecordStatus | undefined,
          sort: params.sort,
          sort_dir: params.sort_dir,
        }),
      []
    ),
    errorMessage: "No se pudo cargar la lista de IAFAS.",
    initialSort: "codigo",
  });

  const {
    data,
    loading,
    page,
    setPage,
    perPage,
    setPerPage,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    sort,
    sortDir,
    toggleSort,
    refresh,
  } = list;

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);


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

  const onSave = useCallback(async () => {
    setNotice(null);

    if (!isValid) {
      const issues: string[] = [];
      if (!tipoIafaId || tipoIafaId <= 0) issues.push("selecciona el tipo de IAFAS");
      const rs = razonSocial.trim();
      if (!rs) issues.push("ingresa la razón social");
      else if (rs.length > 255) issues.push("la razón social no debe superar 255 caracteres");
      const dc = descripcionCorta.trim();
      if (!dc) issues.push("ingresa la descripción corta");
      else if (dc.length > 120) issues.push("la descripción corta no debe superar 120 caracteres");
      if (!isRuc11(ruc)) issues.push("el RUC debe tener exactamente 11 dígitos numéricos");
      if (direccion.trim().length > 255) issues.push("la dirección no debe superar 255 caracteres");
      if (representanteLegal.trim().length > 150) issues.push("el representante legal no debe superar 150 caracteres");
      if (telefono.trim().length > 30) issues.push("el teléfono no debe superar 30 caracteres");
      if (paginaWeb.trim().length > 200) issues.push("la página web no debe superar 200 caracteres");
      if (!isDateIsoRequired(fechaInicio)) issues.push("ingresa una fecha de inicio de cobertura válida");
      if (!isDateIsoRequired(fechaFin)) issues.push("ingresa una fecha de fin de cobertura válida");
      if (isDateIsoRequired(fechaInicio) && isDateIsoRequired(fechaFin) && fechaFin < fechaInicio) {
        issues.push("la fecha de fin de cobertura no puede ser anterior al inicio");
      }
      const msg = formatActionIssues(
        mode === "new" ? "No se puede crear la IAFAS" : "No se puede guardar la IAFAS",
        issues
      );
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }

    if (mode === "edit" && !selected) {
      setNotice({ type: "error", text: "Selecciona una IAFAS para editar." });
      toastService.showError("Selecciona una IAFAS para editar.");
      return;
    }

    if (!isDirty) {
      const msg = "No hay cambios para guardar en esta IAFAS.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
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
        await createIafa({ ...payloadBase, estado });
        setNotice({ type: "success", text: "IAFAS creada." });
        toastService.showSuccess("IAFAS creada.");

        setPage(1);
        await refresh({ page: 1 });
        resetToNew();
        return;
      }

      const res = await updateIafa(selected!.id, { ...payloadBase, estado });
      setNotice({ type: "success", text: "Cambios guardados." });
      toastService.showSuccess("Cambios guardados.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo guardar la IAFAS.");
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
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
    resetToNew,
  ]);

  const requestDeactivate = useCallback(() => {
    if (!selected) {
      setNotice({ type: "error", text: "Selecciona una IAFAS para desactivar." });
      toastService.showError("Selecciona una IAFAS para desactivar.");
      return;
    }
    if (selected.estado === "INACTIVO") {
      const msg = "La IAFAS seleccionada ya está inactiva.";
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
      return;
    }
    setConfirmDeactivateOpen(true);
  }, [selected]);

  const onDeactivateConfirmed = useCallback(async () => {
    if (!selected) {
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: "Selecciona una IAFAS para desactivar." });
      toastService.showError("Selecciona una IAFAS para desactivar.");
      return;
    }

    setSaving(true);
    try {
      const res = await deactivateIafa(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "IAFAS desactivada." });
      toastService.showSuccess("IAFAS desactivada.");

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = getApiErrorMessage(e, "No se pudo desactivar la IAFAS.");
      setConfirmDeactivateOpen(false);
      setNotice({ type: "error", text: msg });
      toastService.showError(msg);
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
    refresh,

    page,
    setPage,
    perPage,
    setPerPage,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    sort,
    sortDir,
    toggleSort,

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
