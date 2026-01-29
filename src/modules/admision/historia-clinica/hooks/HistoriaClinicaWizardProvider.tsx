import * as React from "react";
import type { ApiError } from "../../../../shared/api/apiError";
import type { Notice } from "../components/NoticeBanner";
import type { PacienteDetail, PacienteUpsertPayload, RecordStatus } from "../types/historiaClinica.types";
import { createPaciente, getPaciente, getPacienteFormCatalogs, updatePaciente } from "../services/historiaClinica.service";
import { WizardContext, type WizardMode, type Ctx } from "./useHistoriaClinicaWizard";

function isApiError(e: unknown): e is ApiError {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return typeof x.kind === "string" && typeof x.message === "string";
}

function toNull(v: string): string | null {
  const x = v.trim();
  return x ? x : null;
}

function fullNameParts(ap: string | null, am: string | null, n: string | null): string {
  const a = (ap ?? "").trim();
  const b = (am ?? "").trim();
  const c = (n ?? "").trim();
  return `${a} ${b} ${c}`.trim();
}

function calcAge(iso: string | null): string {
  if (!iso) return "—";
  const s = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-").map((x) => Number(x));
  if (!y || !m || !d) return "—";
  const born = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const mm = now.getMonth() - born.getMonth();
  if (mm < 0 || (mm === 0 && now.getDate() < born.getDate())) age--;
  return age >= 0 ? String(age) : "—";
}

function normalizePayload(d: PacienteUpsertPayload): PacienteUpsertPayload {
  const ce = d.contacto_emergencia;
  const ceHasAny =
    !!ce &&
    (!!ce.nombres ||
      !!ce.apellido_paterno ||
      !!ce.apellido_materno ||
      !!ce.parentesco_emergencia ||
      !!ce.celular ||
      !!ce.telefono ||
      !!ce.observaciones);

  return {
    ...d,
    tipo_documento: d.tipo_documento.trim(),
    numero_documento: d.numero_documento ? toNull(d.numero_documento) : null,
    nombres: d.nombres ? toNull(d.nombres) : null,
    apellido_paterno: d.apellido_paterno ? toNull(d.apellido_paterno) : null,
    apellido_materno: d.apellido_materno ? toNull(d.apellido_materno) : null,
    direccion: d.direccion ? toNull(d.direccion) : null,
    titular_nombre: d.titular_nombre ? toNull(d.titular_nombre) : null,
    celular: d.celular ? toNull(d.celular) : null,
    telefono: d.telefono ? toNull(d.telefono) : null,
    email: d.email ? toNull(d.email) : null,
    medio_informacion_detalle: d.medio_informacion_detalle ? toNull(d.medio_informacion_detalle) : null,
    ubicacion_archivo_hc: d.ubicacion_archivo_hc ? toNull(d.ubicacion_archivo_hc) : null,
    contacto_emergencia: ceHasAny ? ce : null,
  };
}

function toDraft(p: PacienteDetail): PacienteUpsertPayload {
  return {
    tipo_documento: p.tipo_documento,
    numero_documento: p.numero_documento,

    nombres: p.nombres,
    apellido_paterno: p.apellido_paterno,
    apellido_materno: p.apellido_materno,

    estado_civil: p.estado_civil,
    sexo: p.sexo,
    fecha_nacimiento: p.fecha_nacimiento,

    nacionalidad_iso2: p.nacionalidad_iso2,
    ubigeo_nacimiento: p.ubigeo_nacimiento,
    direccion: p.direccion,
    ubigeo_domicilio: p.ubigeo_domicilio,

    parentesco_seguro: p.parentesco_seguro,
    titular_nombre: p.titular_nombre,

    celular: p.celular,
    telefono: p.telefono,
    email: p.email,

    medico_tratante_id: p.medico_tratante_id,

    tipo_sangre: p.tipo_sangre,
    tipo_paciente: p.tipo_paciente,

    ocupacion: p.ocupacion,

    medio_informacion: p.medio_informacion,
    medio_informacion_detalle: p.medio_informacion_detalle,

    ubicacion_archivo_hc: p.ubicacion_archivo_hc,

    estado: p.estado,

    contacto_emergencia: p.contacto_emergencia ?? null,
  };
}

export function HistoriaClinicaWizardProvider(props: {
  mode: WizardMode;
  pacienteId: number | null;
  children: React.ReactNode;
}) {
  const { mode, pacienteId: initialPacienteId, children } = props;

  const [catalogs, setCatalogs] = React.useState<Ctx["catalogs"]>(null);
  const [catalogsLoading, setCatalogsLoading] = React.useState(false);

  const [ready, setReady] = React.useState(mode === "create");
  const [saving, setSaving] = React.useState(false);

  const [notice, setNotice] = React.useState<Notice>(null);

  const [pacienteId, setPacienteId] = React.useState<number | null>(mode === "edit" ? initialPacienteId : null);
  const [saved, setSaved] = React.useState(mode === "create" ? false : true);
  const [dirty, setDirty] = React.useState(false);

  const hydratingRef = React.useRef(false);

  const [draft, setDraft] = React.useState<PacienteUpsertPayload>(() => ({
    tipo_documento: "DNI",
    numero_documento: null,

    nombres: null,
    apellido_paterno: null,
    apellido_materno: null,

    estado_civil: null,
    sexo: null,
    fecha_nacimiento: null,

    nacionalidad_iso2: null,
    ubigeo_nacimiento: null,
    direccion: null,
    ubigeo_domicilio: null,

    parentesco_seguro: "NO_DEFINIDO",
    titular_nombre: null,

    celular: null,
    telefono: null,
    email: null,

    medico_tratante_id: null,

    tipo_sangre: null,
    tipo_paciente: null,

    ocupacion: null,

    medio_informacion: null,
    medio_informacion_detalle: null,

    ubicacion_archivo_hc: null,

    estado: "ACTIVO" as RecordStatus,

    contacto_emergencia: null,
  }));

  React.useEffect(() => {
    let alive = true;

    setCatalogsLoading(true);
    getPacienteFormCatalogs()
      .then((c) => {
        if (!alive) return;
        setCatalogs(c);
      })
      .catch(() => {
        if (!alive) return;
        setCatalogs(null);
      })
      .finally(() => {
        if (!alive) return;
        setCatalogsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (mode !== "edit" || !initialPacienteId) return;

    let alive = true;
    hydratingRef.current = true;

    setReady(false);
    setNotice(null);

    getPaciente(initialPacienteId)
      .then((p) => {
        if (!alive) return;

        setPacienteId(p.id);
        setDraft(toDraft(p));
        setSaved(true);
        setDirty(false);
      })
      .catch((e) => {
        if (!alive) return;
        const msg = isApiError(e) ? e.message : "No se pudo cargar el paciente.";
        setNotice({ type: "error", text: msg });
      })
      .finally(() => {
        if (!alive) return;
        hydratingRef.current = false;
        setReady(true);
      });

    return () => {
      alive = false;
    };
  }, [mode, initialPacienteId]);

  const ap = draft.apellido_paterno;
  const am = draft.apellido_materno;
  const nom = draft.nombres;
  const cond = draft.parentesco_seguro;
  const titular = draft.titular_nombre;

  React.useEffect(() => {
    const c = (cond ?? "").trim().toUpperCase();
    if (c !== "TITULAR") return;

    const name = fullNameParts(ap, am, nom);
    if (!name) return;

    if ((titular ?? "").trim() === name) return;

    setDraft((prev) => ({ ...prev, titular_nombre: name }));
  }, [ap, am, nom, cond, titular]);

  const clearNotice = React.useCallback(() => setNotice(null), []);

  const setField = React.useCallback(
    <K extends keyof PacienteUpsertPayload>(k: K, v: PacienteUpsertPayload[K]) => {
      setDraft((prev) => ({ ...prev, [k]: v } as PacienteUpsertPayload));

      if (!hydratingRef.current) {
        setDirty(true);
        setSaved((s) => s);
      }
    },
    []
  );

  const canGoAcreditacion = saved && !dirty && pacienteId !== null;

  const save = React.useCallback(async () => {
    if (saving) return;

    setSaving(true);
    setNotice(null);

    try {
      const payload = normalizePayload(draft);

      if (pacienteId === null) {
        const res = await createPaciente(payload);
        const p = res.data;

        setPacienteId(p.id);
        setDraft(toDraft(p));
        setSaved(true);
        setDirty(false);

        setNotice({ type: "success", text: "Paciente guardado correctamente." });
      } else {
        const res = await updatePaciente(pacienteId, payload);
        const p = res.data;

        setDraft(toDraft(p));
        setSaved(true);
        setDirty(false);

        setNotice({ type: "success", text: "Cambios guardados correctamente." });
      }
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo guardar.";
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [draft, pacienteId, saving]);

  const summary = React.useMemo(() => {
    const hcX = (draft.numero_documento ?? "").trim() ? (draft.numero_documento ?? "").trim() : "—";
    const nombreX = fullNameParts(draft.apellido_paterno, draft.apellido_materno, draft.nombres) || "—";
    const edadX = calcAge(draft.fecha_nacimiento);
    const sexoX = (draft.sexo ?? "").trim() ? (draft.sexo ?? "").trim() : "—";
    const estadoX = (draft.estado ?? "").trim() ? (draft.estado ?? "").trim() : "—";

    return { hc: hcX, nombre: nombreX, nr: "—", edad: edadX, sexo: sexoX, estado: estadoX };
  }, [draft.apellido_materno, draft.apellido_paterno, draft.estado, draft.fecha_nacimiento, draft.nombres, draft.numero_documento, draft.sexo]);

  const value: Ctx = {
    ready,
    saving,

    notice,
    setNotice,
    clearNotice,

    catalogs,
    catalogsLoading,

    pacienteId,
    saved,
    dirty,
    canGoAcreditacion,

    draft,
    setField,

    save,

    summary,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
