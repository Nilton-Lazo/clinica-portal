import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IafaLookup, PaginatedResponse, RecordStatus, Tarifa, TarifasQuery, TipoIafaLookup } from "../../types/tarifas.types";

import {
  createTarifa,
  deactivateTarifa,
  getNextTarifaCodigo,
  listIafasLookupAllActive,
  listTarifas,
  listTiposIafasLookup,
  setBaseTarifa,
  updateTarifa,
} from "../../services/tarifas.service";

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

function localTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeBaseDesc(s: string): string {
  return s.trim().toLowerCase();
}

function isTarifarioBaseDescripcion(s: string): boolean {
  return normalizeBaseDesc(s) === "tarifario base";
}

function toFixed2Min1(v: string): string {
  const t = v.trim();
  const n = Number(t);
  if (!Number.isFinite(n)) return "1.00";
  const clamped = Math.max(1, n);
  return clamped.toFixed(2);
}

function isFactorOk(v: string): boolean {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1;
}

const MSG_BASE_REQUIERE_ACTIVO = "Para cambiar a tarifario base, el tarifario seleccionado debe estar ACTIVO.";

export function useTarifas() {
  const [data, setData] = useState<PaginatedResponse<Tarifa>>({
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

  const [iafas, setIafas] = useState<IafaLookup[]>([]);
  const [iafasLoading, setIafasLoading] = useState(false);

  const [mode, setMode] = useState<Mode>("new");
  const [selected, setSelected] = useState<Tarifa | null>(null);

  const [codigoPreview, setCodigoPreview] = useState("");
  const codigo = mode === "new" ? codigoPreview : (selected?.codigo ?? "");

  const [descripcionTarifa, setDescripcionTarifa] = useState("");
  const [iafaId, setIafaId] = useState<number>(0);

  const [fechaCreacion, setFechaCreacion] = useState<string>(() => localTodayIso());

  const [requiereAcreditacion, setRequiereAcreditacion] = useState(true);
  const [tarifaBase, setTarifaBase] = useState(false);

  const [factorClinica, setFactorClinica] = useState("1.00");
  const [factorLaboratorio, setFactorLaboratorio] = useState("1.00");
  const [factorEcografia, setFactorEcografia] = useState("1.00");
  const [factorProcedimientos, setFactorProcedimientos] = useState("1.00");
  const [factorRayosX, setFactorRayosX] = useState("1.00");
  const [factorTomografia, setFactorTomografia] = useState("1.00");
  const [factorPatologia, setFactorPatologia] = useState("1.00");
  const [factorMedicinaFisica, setFactorMedicinaFisica] = useState("1.00");
  const [factorResonancia, setFactorResonancia] = useState("1.00");
  const [factorHonorariosMedicos, setFactorHonorariosMedicos] = useState("1.00");
  const [factorMedicinas, setFactorMedicinas] = useState("1.00");
  const [factorEquiposOxigeno, setFactorEquiposOxigeno] = useState("1.00");
  const [factorBancoSangre, setFactorBancoSangre] = useState("1.00");
  const [factorMamografia, setFactorMamografia] = useState("1.00");
  const [factorDensitometria, setFactorDensitometria] = useState("1.00");
  const [factorPsicoprofilaxis, setFactorPsicoprofilaxis] = useState("1.00");
  const [factorOtrosServicios, setFactorOtrosServicios] = useState("1.00");

  const [factorMedicamentosComerciales, setFactorMedicamentosComerciales] = useState("1.00");
  const [factorMedicamentosGenericos, setFactorMedicamentosGenericos] = useState("1.00");
  const [factorMaterialMedico, setFactorMaterialMedico] = useState("1.00");

  const [estado, setEstado] = useState<RecordStatus>("ACTIVO");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [confirmSetBaseOpen, setConfirmSetBaseOpen] = useState(false);

  const prevParticularRef = useRef<boolean>(false);

  const currentIafaIsParticular = useMemo(() => {
    const iafa = iafas.find((x) => x.id === iafaId);
    if (!iafa) return false;
    const tipo = tipos.find((t) => t.id === iafa.tipo_iafa_id);
    const desc = (tipo?.descripcion ?? "").trim().toLowerCase();
    return desc === "particular";
  }, [iafas, iafaId, tipos]);

  useEffect(() => {
    if (currentIafaIsParticular) {
      setRequiereAcreditacion(false);
      prevParticularRef.current = true;
      return;
    }

    if (prevParticularRef.current) {
      setRequiereAcreditacion(true);
      prevParticularRef.current = false;
    }
  }, [currentIafaIsParticular]);

  useEffect(() => {
    if (tarifaBase && estado !== "ACTIVO") {
      setEstado("ACTIVO");
    }
  }, [tarifaBase, estado]);

  const fetchCodigoPreview = useCallback(async () => {
    try {
      const res = await getNextTarifaCodigo();
      setCodigoPreview(res.codigo ?? "");
    } catch {
      setCodigoPreview("");
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setTiposLoading(true);
      setIafasLoading(true);

      try {
        const [tiposRes, iafasRes] = await Promise.all([
          listTiposIafasLookup(),
          listIafasLookupAllActive(),
        ]);

        if (!alive) return;

        setTipos(tiposRes);
        setIafas(iafasRes);
      } catch {
        if (!alive) return;

        setTipos([]);
        setIafas([]);
      } finally {
        if (alive) {
          setTiposLoading(false);
          setIafasLoading(false);
        }
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
    const d = descripcionTarifa.trim();
    if (!d || d.length > 255) return false;

    const isBaseDesc = isTarifarioBaseDescripcion(d);

    if (!isBaseDesc) {
      if (!iafaId || iafaId <= 0) return false;
    }

    const factorsOk =
      isFactorOk(factorClinica) &&
      isFactorOk(factorLaboratorio) &&
      isFactorOk(factorEcografia) &&
      isFactorOk(factorProcedimientos) &&
      isFactorOk(factorRayosX) &&
      isFactorOk(factorTomografia) &&
      isFactorOk(factorPatologia) &&
      isFactorOk(factorMedicinaFisica) &&
      isFactorOk(factorResonancia) &&
      isFactorOk(factorHonorariosMedicos) &&
      isFactorOk(factorMedicinas) &&
      isFactorOk(factorEquiposOxigeno) &&
      isFactorOk(factorBancoSangre) &&
      isFactorOk(factorMamografia) &&
      isFactorOk(factorDensitometria) &&
      isFactorOk(factorPsicoprofilaxis) &&
      isFactorOk(factorOtrosServicios) &&
      isFactorOk(factorMedicamentosComerciales) &&
      isFactorOk(factorMedicamentosGenericos) &&
      isFactorOk(factorMaterialMedico);

    if (!factorsOk) return false;

    return true;
  }, [
    descripcionTarifa,
    iafaId,
    factorClinica,
    factorLaboratorio,
    factorEcografia,
    factorProcedimientos,
    factorRayosX,
    factorTomografia,
    factorPatologia,
    factorMedicinaFisica,
    factorResonancia,
    factorHonorariosMedicos,
    factorMedicinas,
    factorEquiposOxigeno,
    factorBancoSangre,
    factorMamografia,
    factorDensitometria,
    factorPsicoprofilaxis,
    factorOtrosServicios,
    factorMedicamentosComerciales,
    factorMedicamentosGenericos,
    factorMaterialMedico,
  ]);

  const originalRef = useRef<{
    descripcionTarifa: string;
    iafaId: number;

    requiereAcreditacion: boolean;
    tarifaBase: boolean;

    factorClinica: string;
    factorLaboratorio: string;
    factorEcografia: string;
    factorProcedimientos: string;
    factorRayosX: string;
    factorTomografia: string;
    factorPatologia: string;
    factorMedicinaFisica: string;
    factorResonancia: string;
    factorHonorariosMedicos: string;
    factorMedicinas: string;
    factorEquiposOxigeno: string;
    factorBancoSangre: string;
    factorMamografia: string;
    factorDensitometria: string;
    factorPsicoprofilaxis: string;
    factorOtrosServicios: string;

    factorMedicamentosComerciales: string;
    factorMedicamentosGenericos: string;
    factorMaterialMedico: string;

    estado: RecordStatus;
  } | null>(null);

  const isDirty = useMemo(() => {
    const o = originalRef.current;
    if (!o) return mode === "new" ? isValid : false;

    return (
      o.descripcionTarifa !== descripcionTarifa.trim() ||
      o.iafaId !== iafaId ||
      o.requiereAcreditacion !== requiereAcreditacion ||
      o.tarifaBase !== tarifaBase ||
      o.factorClinica !== factorClinica ||
      o.factorLaboratorio !== factorLaboratorio ||
      o.factorEcografia !== factorEcografia ||
      o.factorProcedimientos !== factorProcedimientos ||
      o.factorRayosX !== factorRayosX ||
      o.factorTomografia !== factorTomografia ||
      o.factorPatologia !== factorPatologia ||
      o.factorMedicinaFisica !== factorMedicinaFisica ||
      o.factorResonancia !== factorResonancia ||
      o.factorHonorariosMedicos !== factorHonorariosMedicos ||
      o.factorMedicinas !== factorMedicinas ||
      o.factorEquiposOxigeno !== factorEquiposOxigeno ||
      o.factorBancoSangre !== factorBancoSangre ||
      o.factorMamografia !== factorMamografia ||
      o.factorDensitometria !== factorDensitometria ||
      o.factorPsicoprofilaxis !== factorPsicoprofilaxis ||
      o.factorOtrosServicios !== factorOtrosServicios ||
      o.factorMedicamentosComerciales !== factorMedicamentosComerciales ||
      o.factorMedicamentosGenericos !== factorMedicamentosGenericos ||
      o.factorMaterialMedico !== factorMaterialMedico ||
      o.estado !== estado
    );
  }, [
    mode,
    isValid,
    descripcionTarifa,
    iafaId,
    requiereAcreditacion,
    tarifaBase,
    factorClinica,
    factorLaboratorio,
    factorEcografia,
    factorProcedimientos,
    factorRayosX,
    factorTomografia,
    factorPatologia,
    factorMedicinaFisica,
    factorResonancia,
    factorHonorariosMedicos,
    factorMedicinas,
    factorEquiposOxigeno,
    factorBancoSangre,
    factorMamografia,
    factorDensitometria,
    factorPsicoprofilaxis,
    factorOtrosServicios,
    factorMedicamentosComerciales,
    factorMedicamentosGenericos,
    factorMaterialMedico,
    estado,
  ]);

  const resetToNew = useCallback(() => {
    setMode("new");
    setSelected(null);

    setDescripcionTarifa("");
    setIafaId(0);

    setFechaCreacion(localTodayIso());

    setRequiereAcreditacion(true);
    setTarifaBase(false);

    setFactorClinica("1.00");
    setFactorLaboratorio("1.00");
    setFactorEcografia("1.00");
    setFactorProcedimientos("1.00");
    setFactorRayosX("1.00");
    setFactorTomografia("1.00");
    setFactorPatologia("1.00");
    setFactorMedicinaFisica("1.00");
    setFactorResonancia("1.00");
    setFactorHonorariosMedicos("1.00");
    setFactorMedicinas("1.00");
    setFactorEquiposOxigeno("1.00");
    setFactorBancoSangre("1.00");
    setFactorMamografia("1.00");
    setFactorDensitometria("1.00");
    setFactorPsicoprofilaxis("1.00");
    setFactorOtrosServicios("1.00");

    setFactorMedicamentosComerciales("1.00");
    setFactorMedicamentosGenericos("1.00");
    setFactorMaterialMedico("1.00");

    setEstado("ACTIVO");

    originalRef.current = null;
    setNotice(null);

    void fetchCodigoPreview();
  }, [fetchCodigoPreview]);

  const loadForEdit = useCallback((x: Tarifa) => {
    setMode("edit");
    setSelected(x);

    setDescripcionTarifa(x.descripcion_tarifa);
    setIafaId(x.iafa_id ?? 0);

    setFechaCreacion((x.fecha_creacion ?? "").slice(0, 10) || localTodayIso());

    setRequiereAcreditacion(Boolean(x.requiere_acreditacion));
    setTarifaBase(Boolean(x.tarifa_base));

    setFactorClinica(x.factor_clinica);
    setFactorLaboratorio(x.factor_laboratorio);
    setFactorEcografia(x.factor_ecografia);
    setFactorProcedimientos(x.factor_procedimientos);
    setFactorRayosX(x.factor_rayos_x);
    setFactorTomografia(x.factor_tomografia);
    setFactorPatologia(x.factor_patologia);
    setFactorMedicinaFisica(x.factor_medicina_fisica);
    setFactorResonancia(x.factor_resonancia);
    setFactorHonorariosMedicos(x.factor_honorarios_medicos);
    setFactorMedicinas(x.factor_medicinas);
    setFactorEquiposOxigeno(x.factor_equipos_oxigeno);
    setFactorBancoSangre(x.factor_banco_sangre);
    setFactorMamografia(x.factor_mamografia);
    setFactorDensitometria(x.factor_densitometria);
    setFactorPsicoprofilaxis(x.factor_psicoprofilaxis);
    setFactorOtrosServicios(x.factor_otros_servicios);

    setFactorMedicamentosComerciales(x.factor_medicamentos_comerciales);
    setFactorMedicamentosGenericos(x.factor_medicamentos_genericos);
    setFactorMaterialMedico(x.factor_material_medico);

    setEstado(x.estado);

    originalRef.current = {
      descripcionTarifa: x.descripcion_tarifa,
      iafaId: x.iafa_id ?? 0,

      requiereAcreditacion: Boolean(x.requiere_acreditacion),
      tarifaBase: Boolean(x.tarifa_base),

      factorClinica: x.factor_clinica,
      factorLaboratorio: x.factor_laboratorio,
      factorEcografia: x.factor_ecografia,
      factorProcedimientos: x.factor_procedimientos,
      factorRayosX: x.factor_rayos_x,
      factorTomografia: x.factor_tomografia,
      factorPatologia: x.factor_patologia,
      factorMedicinaFisica: x.factor_medicina_fisica,
      factorResonancia: x.factor_resonancia,
      factorHonorariosMedicos: x.factor_honorarios_medicos,
      factorMedicinas: x.factor_medicinas,
      factorEquiposOxigeno: x.factor_equipos_oxigeno,
      factorBancoSangre: x.factor_banco_sangre,
      factorMamografia: x.factor_mamografia,
      factorDensitometria: x.factor_densitometria,
      factorPsicoprofilaxis: x.factor_psicoprofilaxis,
      factorOtrosServicios: x.factor_otros_servicios,

      factorMedicamentosComerciales: x.factor_medicamentos_comerciales,
      factorMedicamentosGenericos: x.factor_medicamentos_genericos,
      factorMaterialMedico: x.factor_material_medico,

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

    setDescripcionTarifa(o.descripcionTarifa);
    setIafaId(o.iafaId);

    setRequiereAcreditacion(o.requiereAcreditacion);
    setTarifaBase(o.tarifaBase);

    setFactorClinica(o.factorClinica);
    setFactorLaboratorio(o.factorLaboratorio);
    setFactorEcografia(o.factorEcografia);
    setFactorProcedimientos(o.factorProcedimientos);
    setFactorRayosX(o.factorRayosX);
    setFactorTomografia(o.factorTomografia);
    setFactorPatologia(o.factorPatologia);
    setFactorMedicinaFisica(o.factorMedicinaFisica);
    setFactorResonancia(o.factorResonancia);
    setFactorHonorariosMedicos(o.factorHonorariosMedicos);
    setFactorMedicinas(o.factorMedicinas);
    setFactorEquiposOxigeno(o.factorEquiposOxigeno);
    setFactorBancoSangre(o.factorBancoSangre);
    setFactorMamografia(o.factorMamografia);
    setFactorDensitometria(o.factorDensitometria);
    setFactorPsicoprofilaxis(o.factorPsicoprofilaxis);
    setFactorOtrosServicios(o.factorOtrosServicios);

    setFactorMedicamentosComerciales(o.factorMedicamentosComerciales);
    setFactorMedicamentosGenericos(o.factorMedicamentosGenericos);
    setFactorMaterialMedico(o.factorMaterialMedico);

    setEstado(o.estado);

    setNotice(null);
  }, [mode, resetToNew, selected]);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      const query: TarifasQuery = {
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() ? qDebounced.trim() : undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      };

      try {
        const res = await listTarifas(query);
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

  const normalizeAllFactors = useCallback(() => {
    setFactorClinica((v) => toFixed2Min1(v));
    setFactorLaboratorio((v) => toFixed2Min1(v));
    setFactorEcografia((v) => toFixed2Min1(v));
    setFactorProcedimientos((v) => toFixed2Min1(v));
    setFactorRayosX((v) => toFixed2Min1(v));
    setFactorTomografia((v) => toFixed2Min1(v));
    setFactorPatologia((v) => toFixed2Min1(v));
    setFactorMedicinaFisica((v) => toFixed2Min1(v));
    setFactorResonancia((v) => toFixed2Min1(v));
    setFactorHonorariosMedicos((v) => toFixed2Min1(v));
    setFactorMedicinas((v) => toFixed2Min1(v));
    setFactorEquiposOxigeno((v) => toFixed2Min1(v));
    setFactorBancoSangre((v) => toFixed2Min1(v));
    setFactorMamografia((v) => toFixed2Min1(v));
    setFactorDensitometria((v) => toFixed2Min1(v));
    setFactorPsicoprofilaxis((v) => toFixed2Min1(v));
    setFactorOtrosServicios((v) => toFixed2Min1(v));

    setFactorMedicamentosComerciales((v) => toFixed2Min1(v));
    setFactorMedicamentosGenericos((v) => toFixed2Min1(v));
    setFactorMaterialMedico((v) => toFixed2Min1(v));
  }, []);

  const onSave = useCallback(async () => {
    setNotice(null);

    normalizeAllFactors();

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

    const desc = descripcionTarifa.trim();
    const isBaseDesc = isTarifarioBaseDescripcion(desc);

    const payloadBase = {
      requiere_acreditacion: currentIafaIsParticular ? false : requiereAcreditacion,
      tarifa_base: tarifaBase,

      descripcion_tarifa: desc,

      iafa_id: !isBaseDesc ? (iafaId > 0 ? iafaId : null) : (iafaId > 0 ? iafaId : null),

      factor_clinica: Number(toFixed2Min1(factorClinica)),
      factor_laboratorio: Number(toFixed2Min1(factorLaboratorio)),
      factor_ecografia: Number(toFixed2Min1(factorEcografia)),
      factor_procedimientos: Number(toFixed2Min1(factorProcedimientos)),
      factor_rayos_x: Number(toFixed2Min1(factorRayosX)),
      factor_tomografia: Number(toFixed2Min1(factorTomografia)),
      factor_patologia: Number(toFixed2Min1(factorPatologia)),
      factor_medicina_fisica: Number(toFixed2Min1(factorMedicinaFisica)),
      factor_resonancia: Number(toFixed2Min1(factorResonancia)),
      factor_honorarios_medicos: Number(toFixed2Min1(factorHonorariosMedicos)),
      factor_medicinas: Number(toFixed2Min1(factorMedicinas)),
      factor_equipos_oxigeno: Number(toFixed2Min1(factorEquiposOxigeno)),
      factor_banco_sangre: Number(toFixed2Min1(factorBancoSangre)),
      factor_mamografia: Number(toFixed2Min1(factorMamografia)),
      factor_densitometria: Number(toFixed2Min1(factorDensitometria)),
      factor_psicoprofilaxis: Number(toFixed2Min1(factorPsicoprofilaxis)),
      factor_otros_servicios: Number(toFixed2Min1(factorOtrosServicios)),

      factor_medicamentos_comerciales: Number(toFixed2Min1(factorMedicamentosComerciales)),
      factor_medicamentos_genericos: Number(toFixed2Min1(factorMedicamentosGenericos)),
      factor_material_medico: Number(toFixed2Min1(factorMaterialMedico)),
    };

    setSaving(true);
    try {
      if (mode === "new") {
        const res = await createTarifa({ ...payloadBase, estado });
        setNotice({ type: "success", text: "Tarifa creada." });

        setPage(1);
        await refresh({ page: 1 });

        loadForEdit(res.data);
        return;
      }

      const res = await updateTarifa(selected!.id, { ...payloadBase, estado });
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
    normalizeAllFactors,
    isValid,
    mode,
    selected,
    isDirty,
    descripcionTarifa,
    iafaId,
    currentIafaIsParticular,
    requiereAcreditacion,
    tarifaBase,
    factorClinica,
    factorLaboratorio,
    factorEcografia,
    factorProcedimientos,
    factorRayosX,
    factorTomografia,
    factorPatologia,
    factorMedicinaFisica,
    factorResonancia,
    factorHonorariosMedicos,
    factorMedicinas,
    factorEquiposOxigeno,
    factorBancoSangre,
    factorMamografia,
    factorDensitometria,
    factorPsicoprofilaxis,
    factorOtrosServicios,
    factorMedicamentosComerciales,
    factorMedicamentosGenericos,
    factorMaterialMedico,
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
    if (selected.tarifa_base) {
      setNotice({ type: "error", text: "No se puede desactivar el tarifario base. Primero marca otra tarifa como base." });
      return;
    }
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
      const res = await deactivateTarifa(selected.id);
      setConfirmDeactivateOpen(false);
      setNotice({ type: "success", text: "Tarifa desactivada." });

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

  const requestTarifaBaseChange = useCallback(
    (nextChecked: boolean) => {
      if (mode === "edit") {
        if (!selected) {
          setNotice({ type: "error", text: "Selecciona un registro." });
          return;
        }

        if (selected.tarifa_base) {
          if (!nextChecked) {
            setNotice({
              type: "error",
              text: 'No se puede desmarcar el tarifario base directamente. Usa "Marcar como base" en otra tarifa.',
            });
          }
          return;
        }

        if (nextChecked) {
          if (selected.estado !== "ACTIVO") {
            setNotice({ type: "error", text: MSG_BASE_REQUIERE_ACTIVO });
            return;
          }
          setConfirmSetBaseOpen(true);
          return;
        }

        setTarifaBase(false);
        return;
      }

      if (nextChecked) {
        setConfirmSetBaseOpen(true);
        return;
      }

      setTarifaBase(false);
    },
    [mode, selected]
  );

  const onSetBaseConfirmed = useCallback(async () => {
    if (mode === "new") {
      setTarifaBase(true);
      setEstado("ACTIVO");
      setConfirmSetBaseOpen(false);
      return;
    }

    if (!selected) {
      setConfirmSetBaseOpen(false);
      setNotice({ type: "error", text: "Selecciona un registro." });
      return;
    }

    if (selected.estado !== "ACTIVO") {
      setConfirmSetBaseOpen(false);
      setNotice({ type: "error", text: MSG_BASE_REQUIERE_ACTIVO });
      return;
    }

    setSaving(true);
    try {
      const res = await setBaseTarifa(selected.id);
      setConfirmSetBaseOpen(false);
      setNotice({ type: "success", text: "Tarifario base actualizado." });

      await refresh();
      loadForEdit(res.data);
    } catch (e) {
      const msg = isApiError(e) ? e.message : "No se pudo cambiar el tarifario base.";
      setConfirmSetBaseOpen(false);
      setNotice({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }, [mode, selected, refresh, loadForEdit]);

  const canDeactivate = Boolean(selected) && selected?.estado !== "INACTIVO" && !selected?.tarifa_base && !saving;

  const selectedDescripcion = useMemo(() => {
    if (!selected) return "";
    return (selected.descripcion_tarifa ?? "").trim();
  }, [selected]);

  const currentBaseDesc = useMemo(() => {
    const x = data.data.find((t) => t.tarifa_base);
    return (x?.descripcion_tarifa ?? "").trim();
  }, [data.data]);

  const confirmBaseDescription = useMemo(() => {
    const target = mode === "new" ? (descripcionTarifa.trim() || "Nuevo tarifario") : (selectedDescripcion || "Tarifario");
    const prev = currentBaseDesc ? `"${currentBaseDesc}"` : "el tarifario base actual";
    return `¿Deseas convertir "${target}" en Tarifario base? ${prev} dejará de ser el tarifario base.`;
  }, [mode, descripcionTarifa, selectedDescripcion, currentBaseDesc]);

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
    iafas,
    iafasLoading,

    mode,
    selected,
    selectedDescripcion,

    codigo,

    descripcionTarifa,
    setDescripcionTarifa,

    iafaId,
    setIafaId,

    fechaCreacion,

    requiereAcreditacion,
    setRequiereAcreditacion,

    currentIafaIsParticular,

    tarifaBase,
    requestTarifaBaseChange,

    factorClinica,
    setFactorClinica,
    factorLaboratorio,
    setFactorLaboratorio,
    factorEcografia,
    setFactorEcografia,
    factorProcedimientos,
    setFactorProcedimientos,
    factorRayosX,
    setFactorRayosX,
    factorTomografia,
    setFactorTomografia,
    factorPatologia,
    setFactorPatologia,
    factorMedicinaFisica,
    setFactorMedicinaFisica,
    factorResonancia,
    setFactorResonancia,
    factorHonorariosMedicos,
    setFactorHonorariosMedicos,
    factorMedicinas,
    setFactorMedicinas,
    factorEquiposOxigeno,
    setFactorEquiposOxigeno,
    factorBancoSangre,
    setFactorBancoSangre,
    factorMamografia,
    setFactorMamografia,
    factorDensitometria,
    setFactorDensitometria,
    factorPsicoprofilaxis,
    setFactorPsicoprofilaxis,
    factorOtrosServicios,
    setFactorOtrosServicios,

    factorMedicamentosComerciales,
    setFactorMedicamentosComerciales,
    factorMedicamentosGenericos,
    setFactorMedicamentosGenericos,
    factorMaterialMedico,
    setFactorMaterialMedico,

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

    confirmSetBaseOpen,
    setConfirmSetBaseOpen,
    onSetBaseConfirmed,
    confirmBaseDescription,
  };
}
