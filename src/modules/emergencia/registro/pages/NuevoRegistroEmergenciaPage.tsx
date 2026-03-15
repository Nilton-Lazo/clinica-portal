import * as React from "react";
import { useNavigate } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import { toastService } from "../../../../shared/notifications";
import { getPaciente, updatePaciente } from "../../../admision/historia-clinica/services/historiaClinica.service";
import type { PacienteDetail, PacienteUpsertPayload } from "../../../admision/historia-clinica/types/historiaClinica.types";
import PacientePicker from "../../../admision/citas/agenda/components/PacientePicker";
import type { PacienteListItem } from "../../../admision/historia-clinica/types/historiaClinica.types";
import { listPacientePlanes } from "../../../admision/historia-clinica/wizard/acreditacionPlanes.service";
import type { AcreditacionPlan } from "../../../admision/historia-clinica/wizard/acreditacionPlanes.types";
import { listTipoEmergencia } from "../../../ficheros/parametros/emergencia/services/tipoEmergencia.service";
import { listTopico } from "../../../ficheros/parametros/emergencia/services/topico.service";
import { listTipoDocumento } from "../../../ficheros/parametros/emergencia/services/tipoDocumento.service";
import { listDocumentoAtencion } from "../../../ficheros/parametros/emergencia/services/documentoAtencion.service";
import type { ParamOption } from "../../../ficheros/parametros/emergencia/types/paramOption.types";
import { catalogoPacienteService } from "../../../admision/historia-clinica/wizard/catalogoPaciente.service";
import type { UbigeoItem } from "../../../admision/historia-clinica/wizard/types";
import type { Medico } from "../../../ficheros/types/medicos.types";
import MedicoPicker from "../components/MedicoPicker";
import type { NuevoRegistroFormState } from "../../types/nuevoRegistro.types";
import { CONDICION_OPTIONS } from "../../types/nuevoRegistro.types";
import DateInput from "../../../../shared/ui/DateInput";
import TimeInput from "../../../../shared/ui/TimeInput";
import {
  createRegistroEmergencia,
  getNextOrden,
  invalidateRegistroEmergenciaCache,
} from "../../services/registroEmergencia.service";

const inputBase =
  "rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

function nowHhMm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function initialFormState(): NuevoRegistroFormState {
  return {
    numeroReferencia: "",
    numeroHistoria: "",
    hora: nowHhMm(),
    orden: "001",
    apellidosNombres: "",
    fechaNacimiento: "",
    edad: "",
    estadoCivil: "",
    direccion: "",
    sexo: "",
    telefono: "",
    lugarNacimiento: "",
    condicion: "",
    titular: "",
    pacienteId: null,
    tipoEmergenciaId: "",
    topicoId: "",
    medicoEmergenciaId: null,
    medicoEmergenciaCmp: "",
    medicoEmergenciaNombre: "",
    planId: "",
    dxIngreso: "",
    tipoDocumentoId: "",
    soatNumeroDocumento: "",
    soatTitularReferencia: "",
    soatPoliza: "",
    soatPlaca: "",
    soatSiniestro: "",
    soatTipoAccidente: "",
    soatLugarAccidente: "",
    soatDniConductor: "",
    soatApellidoPaternoConductor: "",
    soatApellidoMaternoConductor: "",
    soatContactoConductor: "",
    soatFechaSiniestro: (() => {
      const d = new Date();
      return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })(),
    soatHoraSiniestro: "",
    soatDatosIntervencionAutoridad: "",
    soatDocumentoAtencionId1: "",
    soatNumeroDocumentoAtencion1: "",
    soatDocumentoAtencionId2: "",
    soatNumeroDocumentoAtencion2: "",
  };
}

function pacienteToFormState(p: PacienteDetail): Partial<NuevoRegistroFormState> {
  const nombreCompleto =
    p.nombre_completo?.trim() ||
    [p.apellido_paterno, p.apellido_materno, p.nombres].filter(Boolean).join(" ").trim();
  const isTitular = String(p.parentesco_seguro ?? "").trim().toUpperCase() === "TITULAR";
  return {
    numeroHistoria: p.hc ?? "",
    numeroReferencia: p.nr ?? "",
    apellidosNombres: nombreCompleto,
    fechaNacimiento: p.fecha_nacimiento ?? "",
    edad: p.edad != null ? String(p.edad) : "",
    estadoCivil: p.estado_civil ?? "",
    direccion: p.direccion ?? "",
    sexo: p.sexo ?? "",
    telefono: p.telefono ?? p.celular ?? "",
    lugarNacimiento: p.ubigeo_nacimiento ?? "",
    condicion: p.parentesco_seguro ?? "",
    titular: isTitular ? nombreCompleto : (p.titular_nombre ?? ""),
    pacienteId: p.id,
  };
}

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isLgUp;
}

export default function NuevoRegistroEmergenciaPage() {
  const navigate = useNavigate();
  const isLgUp = useIsLgUp();
  const [form, setForm] = React.useState<NuevoRegistroFormState>(initialFormState);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [medicoPickerOpen, setMedicoPickerOpen] = React.useState(false);
  const [loadingPaciente, setLoadingPaciente] = React.useState(false);
  const [savingActualizar, setSavingActualizar] = React.useState(false);
  const [lastSavedCondicion, setLastSavedCondicion] = React.useState("");
  const [lastSavedTitular, setLastSavedTitular] = React.useState("");
  const [tipoEmergenciaOptions, setTipoEmergenciaOptions] = React.useState<SelectOption[]>([]);
  const [topicoOptions, setTopicoOptions] = React.useState<SelectOption[]>([]);
  const [planOptions, setPlanOptions] = React.useState<SelectOption[]>([]);
  const [tipoDocumentoOptions, setTipoDocumentoOptions] = React.useState<SelectOption[]>([]);
  const [documentoAtencionOptions, setDocumentoAtencionOptions] = React.useState<SelectOption[]>([]);
  const [soatActivo, setSoatActivo] = React.useState(false);
  const [ubigeoOptions, setUbigeoOptions] = React.useState<SelectOption[]>([]);
  const pacienteDetailRef = React.useRef<PacienteDetail | null>(null);
  const plansListRef = React.useRef<AcreditacionPlan[]>([]);

  React.useEffect(() => {
    const today = new Date();
    const fecha =
      String(today.getFullYear()) +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    getNextOrden(fecha)
      .then((res) => setForm((prev) => ({ ...prev, orden: res.orden })))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    catalogoPacienteService.ubigeosFirstPage(500).then((arr: UbigeoItem[]) => {
      const opts: SelectOption[] = arr
        .filter((r) => (r.codigo ?? "").trim() !== "")
        .map((r) => {
          const codigo = (r.codigo ?? "").trim();
          const dist = (r.distrito ?? "").trim();
          return { value: codigo, label: dist ? `${codigo} · ${dist}` : codigo };
        })
        .sort((a, b) => (a.label.localeCompare(b.label, "es", { sensitivity: "base" })));
      setUbigeoOptions(opts);
    });
  }, []);

  React.useEffect(() => {
    listTipoEmergencia({ page: 1, per_page: 100, status: "ACTIVO" }).then((res) => {
      setTipoEmergenciaOptions(
        res.data.map((x: ParamOption) => ({ value: String(x.id), label: `${x.codigo} · ${x.descripcion}` }))
      );
    });
    listTopico({ page: 1, per_page: 100, status: "ACTIVO" }).then((res) => {
      setTopicoOptions(
        res.data.map((x: ParamOption) => ({ value: String(x.id), label: `${x.codigo} · ${x.descripcion}` }))
      );
    });
    listTipoDocumento({ page: 1, per_page: 100, status: "ACTIVO" }).then((res) => {
      setTipoDocumentoOptions(
        res.data.map((x: ParamOption) => ({ value: String(x.id), label: `${x.codigo} · ${x.descripcion}` }))
      );
    });
    listDocumentoAtencion({ page: 1, per_page: 100, status: "ACTIVO" }).then((res) => {
      setDocumentoAtencionOptions(
        res.data.map((x: ParamOption) => ({ value: String(x.id), label: `${x.codigo} · ${x.descripcion}` }))
      );
    });
  }, []);

  React.useEffect(() => {
    if (!form.pacienteId) {
      setPlanOptions([]);
      plansListRef.current = [];
      setForm((prev) => ({ ...prev, planId: "" }));
      return;
    }
    listPacientePlanes(form.pacienteId)
      .then((planes: AcreditacionPlan[]) => {
        plansListRef.current = planes;
        const opts: SelectOption[] = [
          { value: "", label: "Seleccione tipo de cliente" },
          ...planes.map((p) => ({
            value: String(p.id),
            label: p.tipo_cliente
              ? `${p.tipo_cliente.codigo} · ${p.tipo_cliente.descripcion_tipo_cliente}`
              : `Plan ${p.id}`,
          })),
        ];
        setPlanOptions(opts);
        setForm((prev) => ({
          ...prev,
          planId: planes.length > 0 && !prev.planId ? String(planes[0].id) : prev.planId,
        }));
      })
      .catch(() => {
        setPlanOptions([{ value: "", label: "Seleccione tipo de cliente" }]);
        plansListRef.current = [];
      });
  }, [form.pacienteId]);

  const soatDeshabilitado = React.useMemo(() => {
    if (!form.planId) return true;
    const planIdNum = Number(form.planId);
    const plan = plansListRef.current.find((p) => p.id === planIdNum);
    return Boolean(plan?.tarifa_es_precio_directo);
  }, [form.planId]);

  const soatCamposHabilitados = !soatDeshabilitado && soatActivo;

  React.useEffect(() => {
    if (soatDeshabilitado) {
      setSoatActivo(false);
      setForm((prev) => ({
        ...prev,
        tipoDocumentoId: "",
        soatNumeroDocumento: "",
        soatTitularReferencia: "",
        soatPoliza: "",
        soatPlaca: "",
        soatSiniestro: "",
        soatTipoAccidente: "",
        soatLugarAccidente: "",
        soatDniConductor: "",
        soatApellidoPaternoConductor: "",
        soatApellidoMaternoConductor: "",
        soatContactoConductor: "",
        soatFechaSiniestro: "",
        soatHoraSiniestro: "",
        soatDatosIntervencionAutoridad: "",
        soatDocumentoAtencionId1: "",
        soatNumeroDocumentoAtencion1: "",
        soatDocumentoAtencionId2: "",
        soatNumeroDocumentoAtencion2: "",
      }));
    }
  }, [soatDeshabilitado]);

  const onSoatCheckboxChange = React.useCallback(
    (checked: boolean) => {
      setSoatActivo(checked);
      if (checked) {
        const hoy = new Date();
        const fecha =
          String(hoy.getFullYear()) +
          "-" +
          String(hoy.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(hoy.getDate()).padStart(2, "0");
        setForm((prev) => ({ ...prev, soatFechaSiniestro: fecha }));
      } else {
        setForm((prev) => ({
          ...prev,
          tipoDocumentoId: "",
          soatNumeroDocumento: "",
          soatTitularReferencia: "",
          soatPoliza: "",
          soatPlaca: "",
          soatSiniestro: "",
          soatTipoAccidente: "",
          soatLugarAccidente: "",
          soatDniConductor: "",
          soatApellidoPaternoConductor: "",
          soatApellidoMaternoConductor: "",
          soatContactoConductor: "",
          soatFechaSiniestro: "",
          soatHoraSiniestro: "",
          soatDatosIntervencionAutoridad: "",
          soatDocumentoAtencionId1: "",
          soatNumeroDocumentoAtencion1: "",
          soatDocumentoAtencionId2: "",
          soatNumeroDocumentoAtencion2: "",
        }));
      }
    },
    []
  );

  const updateForm = React.useCallback((patch: Partial<NuevoRegistroFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const onBuscarPaciente = React.useCallback(() => {
    setPickerOpen(true);
  }, []);

  const onPacientePicked = React.useCallback(
    async (p: PacienteListItem) => {
      setLoadingPaciente(true);
      try {
        const full = await getPaciente(p.id);
        pacienteDetailRef.current = full;
        const patch = pacienteToFormState(full);
        setForm((prev) => ({ ...prev, ...patch, planId: "" }));
        setLastSavedCondicion(patch.condicion ?? "");
        setLastSavedTitular(patch.titular ?? "");
        setPickerOpen(false);
      } catch {
        toastService.showError("No se pudo cargar los datos del paciente.");
      } finally {
        setLoadingPaciente(false);
      }
    },
    []
  );

  const onMedicoPicked = React.useCallback((m: Medico) => {
    const nombre =
      m.nombre_completo?.trim() ||
      [m.apellido_paterno, m.apellido_materno, m.nombres].filter(Boolean).join(" ").trim();
    const cmp = m.cmp?.trim() ?? m.codigo?.trim() ?? "";
    setForm((prev) => ({
      ...prev,
      medicoEmergenciaId: m.id,
      medicoEmergenciaCmp: cmp,
      medicoEmergenciaNombre: nombre,
    }));
    setMedicoPickerOpen(false);
  }, []);

  const condicionOptions: SelectOption[] = CONDICION_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  const isTitular = form.condicion.trim().toUpperCase() === "TITULAR";

  const hasPendingDataChanges =
    (form.condicion ?? "") !== lastSavedCondicion || (form.titular ?? "") !== lastSavedTitular;

  const onActualizarDatos = React.useCallback(async () => {
    const p = pacienteDetailRef.current;
    if (!form.pacienteId || !p || !hasPendingDataChanges) return;
    const { id: _id, hc: _hc, nr: _nr, created_at: _ca, updated_at: _ua, nombre_completo: _nc, edad: _ed, ...rest } = p;
    const payload: PacienteUpsertPayload = {
      ...rest,
      parentesco_seguro: form.condicion.trim() || null,
      titular_nombre: form.titular.trim() || null,
    };
    setSavingActualizar(true);
    try {
      await updatePaciente(p.id, payload);
      setLastSavedCondicion(form.condicion);
      setLastSavedTitular(form.titular);
      toastService.showSuccess("Datos actualizados.");
    } catch {
      toastService.showError("No se pudieron actualizar los datos.");
    } finally {
      setSavingActualizar(false);
    }
  }, [form.pacienteId, form.condicion, form.titular, hasPendingDataChanges]);

  React.useEffect(() => {
    if (isTitular && form.pacienteId && form.apellidosNombres) {
      updateForm({ titular: form.apellidosNombres });
    }
  }, [isTitular, form.pacienteId, form.apellidosNombres, updateForm]);

  const datosMedicosCompletos =
    Boolean(form.tipoEmergenciaId.trim()) &&
    Boolean(form.topicoId.trim()) &&
    Boolean(form.planId.trim()) &&
    form.medicoEmergenciaId != null &&
    Boolean(form.dxIngreso.trim()) &&
    Boolean(form.condicion.trim()) &&
    (form.condicion.trim().toUpperCase() !== "TITULAR" || Boolean(form.titular.trim()));

  const handleVolver = React.useCallback(() => {
    navigate("/emergencia/registro");
  }, [navigate]);

  const handleRegistrar = React.useCallback(async () => {
    if (!form.pacienteId) {
      toastService.showInfo("Seleccione un paciente con Buscar paciente.");
      return;
    }
    if (!datosMedicosCompletos) {
      toastService.showInfo("Complete todos los campos del contenedor Datos médicos.");
      return;
    }
    const plan = plansListRef.current.find((p) => p.id === Number(form.planId));
    const tipoClienteLabel = plan?.tipo_cliente
      ? `${plan.tipo_cliente.codigo} · ${plan.tipo_cliente.descripcion_tipo_cliente}`
      : "";
    const topicoLabel = topicoOptions.find((o) => o.value === form.topicoId)?.label ?? "";
    const medicoLabel = form.medicoEmergenciaCmp
      ? `${form.medicoEmergenciaCmp} · ${form.medicoEmergenciaNombre}`
      : form.medicoEmergenciaNombre ?? "";
    const hoy = new Date();
    const fecha =
      String(hoy.getFullYear()) +
      "-" +
      String(hoy.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(hoy.getDate()).padStart(2, "0");
    try {
      await createRegistroEmergencia({
        orden: form.orden.trim() || null,
        hora: form.hora.trim() || null,
        numero_hc: form.numeroHistoria.trim(),
        apellidos_nombres: form.apellidosNombres.trim(),
        sexo: form.sexo.trim() || null,
        tipo_cliente: tipoClienteLabel || null,
        fecha,
        cuenta: form.numeroReferencia.trim() || null,
        medico_emergencia: medicoLabel.trim() || null,
        medico_especialista: null,
        topico: topicoLabel || null,
        numero_cuenta: null,
        estado: "ACTIVO",
      });
      invalidateRegistroEmergenciaCache();
      toastService.showSuccess("Registro de emergencia guardado.");
      navigate("/emergencia/registro");
    } catch {
      toastService.showError("No se pudo guardar el registro de emergencia.");
    }
  }, [
    form.pacienteId,
    form.planId,
    form.orden,
    form.hora,
    form.numeroHistoria,
    form.apellidosNombres,
    form.sexo,
    form.numeroReferencia,
    form.medicoEmergenciaCmp,
    form.medicoEmergenciaNombre,
    form.topicoId,
    datosMedicosCompletos,
    topicoOptions,
    navigate,
  ]);

  const tipoEmergenciaSelectOptions: SelectOption[] = [
    { value: "", label: "Seleccione tipo de emergencia" },
    ...tipoEmergenciaOptions,
  ];
  const topicoSelectOptions: SelectOption[] = [
    { value: "", label: "Seleccione tópico" },
    ...topicoOptions,
  ];
  const tipoDocumentoSelectOptions: SelectOption[] = [
    { value: "", label: "Seleccione tipo de documento" },
    ...tipoDocumentoOptions,
  ];
  const documentoAtencionSelectOptions: SelectOption[] = [
    { value: "", label: "Seleccione documento de atención" },
    ...documentoAtencionOptions,
  ];

  const canRegistrar = Boolean(form.pacienteId) && datosMedicosCompletos;

  return (
    <div className="flex w-full min-h-0 flex-col gap-2 pb-2">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="min-w-0">
          <div className="flex min-h-0 flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-(--color-text-primary)">Datos personales</div>
                <div className="text-xs text-(--color-text-secondary)">
                  Busque un paciente y complete los datos para registrar la emergencia.
                </div>
              </div>
              <PrimaryButton onClick={onBuscarPaciente} disabled={loadingPaciente}>
                {form.pacienteId ? "Cambiar paciente" : "Buscar paciente"}
              </PrimaryButton>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">N° de Referencia</label>
                <input
                  value={form.numeroReferencia}
                  onChange={(e) => updateForm({ numeroReferencia: e.target.value })}
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">N° de Historia</label>
                <input
                  value={form.numeroHistoria}
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Hora</label>
                <input
                  type="text"
                  value={form.hora}
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Orden</label>
                <input
                  value={form.orden}
                  readOnly
                  aria-label="Orden del día (asignado automáticamente)"
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Apellidos y nombres</label>
                <input
                  value={form.apellidosNombres}
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Fecha de nacimiento</label>
                <div className="mt-1">
                  <DateInput
                    value={form.fechaNacimiento}
                    onChange={(v) => updateForm({ fechaNacimiento: v })}
                    aria-label="Fecha de nacimiento"
                    className="w-full min-w-0"
                    readOnly
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Edad</label>
                <input
                  value={form.edad}
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Estado civil</label>
                <input
                  value={form.estadoCivil}
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Dirección</label>
                <input
                  value={form.direccion}
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Sexo</label>
                <input
                  value={form.sexo}
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Teléfono</label>
                <input
                  value={form.telefono}
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Distrito de nacimiento</label>
                <input
                  value={
                    form.lugarNacimiento.trim()
                      ? (ubigeoOptions.find((o) => o.value === form.lugarNacimiento)?.label ?? form.lugarNacimiento)
                      : "—"
                  }
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex min-h-0 flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm font-semibold text-(--color-text-primary)">Datos médicos</div>
              <div className="flex flex-wrap items-center gap-2">
                {form.pacienteId ? (
                  <>
                    <SecondaryButton
                      onClick={() => {
                        updateForm({ condicion: lastSavedCondicion, titular: lastSavedTitular });
                      }}
                      disabled={savingActualizar || !hasPendingDataChanges}
                    >
                      Cancelar
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={onActualizarDatos}
                      disabled={savingActualizar || !hasPendingDataChanges}
                    >
                      {savingActualizar ? "Guardando…" : "Actualizar datos"}
                    </SecondaryButton>
                  </>
                ) : null}
                <PrimaryButton type="button" onClick={() => setMedicoPickerOpen(true)}>
                  Buscar médico
                </PrimaryButton>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Tipo de emergencia</label>
                <div className="mt-1">
                  <SelectMenu
                    value={form.tipoEmergenciaId}
                    onChange={(v) => updateForm({ tipoEmergenciaId: v ?? "" })}
                    options={tipoEmergenciaSelectOptions}
                    ariaLabel="Tipo de emergencia"
                    buttonClassName={`w-full h-10 min-w-0 ${inputBase}`}
                    menuClassName="min-w-full"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Tópico</label>
                <div className="mt-1">
                  <SelectMenu
                    value={form.topicoId}
                    onChange={(v) => updateForm({ topicoId: v ?? "" })}
                    options={topicoSelectOptions}
                    ariaLabel="Tópico"
                    buttonClassName={`w-full h-10 min-w-0 ${inputBase}`}
                    menuClassName="min-w-full"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Tipo de cliente</label>
                <div className="mt-1">
                  <SelectMenu
                    value={form.planId}
                    onChange={(v) => updateForm({ planId: v ?? "" })}
                    options={planOptions}
                    ariaLabel="Tipo de cliente"
                    buttonClassName={`w-full h-10 min-w-0 ${inputBase}`}
                    menuClassName="min-w-full"
                    disabled={!form.pacienteId}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Médico de Emergencia</label>
                <input
                  value={
                    form.medicoEmergenciaCmp && form.medicoEmergenciaNombre
                      ? `${form.medicoEmergenciaCmp} · ${form.medicoEmergenciaNombre}`
                      : form.medicoEmergenciaNombre
                  }
                  readOnly
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Condición</label>
                <div className="mt-1">
                  <SelectMenu
                    value={form.condicion}
                    onChange={(v) => updateForm({ condicion: v ?? "" })}
                    options={condicionOptions}
                    ariaLabel="Condición"
                    buttonClassName={`w-full h-10 min-w-0 ${inputBase}`}
                    menuClassName="min-w-full"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="text-sm text-(--color-text-primary)">Titular</label>
                <input
                  value={form.titular}
                  onChange={(e) => !isTitular && updateForm({ titular: e.target.value })}
                  readOnly={isTitular}
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase} ${isTitular ? "opacity-80 cursor-not-allowed" : ""}`}
                />
              </div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-2">
                <label className="text-sm text-(--color-text-primary)">Diagnóstico de Ingreso</label>
                <input
                  value={form.dxIngreso}
                  onChange={(e) => updateForm({ dxIngreso: e.target.value })}
                  className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`min-w-0 rounded border border-(--border-color-default) bg-(--color-surface) p-4 ${soatDeshabilitado ? "opacity-60 pointer-events-none" : ""}`} aria-disabled={soatDeshabilitado}>
          <div className="flex items-center gap-2">
            {!soatDeshabilitado && (
              <input
                type="checkbox"
                id="soat-activo"
                checked={soatActivo}
                onChange={(e) => onSoatCheckboxChange(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border border-(--border-color-default) cursor-pointer"
                aria-label="Habilitar SOAT"
              />
            )}
            <label htmlFor="soat-activo" className={`text-sm font-semibold text-(--color-text-primary) ${soatDeshabilitado ? "cursor-default" : "cursor-pointer"}`}>
              SOAT
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Tipo de documento</label>
              <div className="mt-1">
                <SelectMenu
                  value={form.tipoDocumentoId}
                  onChange={(v) => updateForm({ tipoDocumentoId: v ?? "" })}
                  options={tipoDocumentoSelectOptions}
                  ariaLabel="Tipo de documento"
                  buttonClassName={`w-full h-10 min-w-0 ${inputBase}`}
                  menuClassName="min-w-full"
                  disabled={!soatCamposHabilitados}
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">N° de documento</label>
              <input
                value={form.soatNumeroDocumento}
                onChange={(e) => updateForm({ soatNumeroDocumento: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Titular/Referencia</label>
              <input
                value={form.soatTitularReferencia}
                onChange={(e) => updateForm({ soatTitularReferencia: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Póliza</label>
              <input
                value={form.soatPoliza}
                onChange={(e) => updateForm({ soatPoliza: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Placa</label>
              <input
                value={form.soatPlaca}
                onChange={(e) => updateForm({ soatPlaca: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Siniestro</label>
              <input
                value={form.soatSiniestro}
                onChange={(e) => updateForm({ soatSiniestro: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Tipo de Accidente</label>
              <input
                value={form.soatTipoAccidente}
                onChange={(e) => updateForm({ soatTipoAccidente: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Lugar de accidente</label>
              <input
                value={form.soatLugarAccidente}
                onChange={(e) => updateForm({ soatLugarAccidente: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">DNI del conductor</label>
              <input
                value={form.soatDniConductor}
                onChange={(e) => updateForm({ soatDniConductor: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Apellido paterno del conductor</label>
              <input
                value={form.soatApellidoPaternoConductor}
                onChange={(e) => updateForm({ soatApellidoPaternoConductor: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Apellido materno del conductor</label>
              <input
                value={form.soatApellidoMaternoConductor}
                onChange={(e) => updateForm({ soatApellidoMaternoConductor: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Contacto del conductor</label>
              <input
                value={form.soatContactoConductor}
                onChange={(e) => updateForm({ soatContactoConductor: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Fecha del siniestro</label>
              <div className="mt-1">
                <DateInput
                  value={form.soatFechaSiniestro}
                  onChange={(v) => updateForm({ soatFechaSiniestro: v })}
                  aria-label="Fecha del siniestro"
                  className="w-full min-w-0"
                  disabled={!soatCamposHabilitados}
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Hora del siniestro</label>
              <TimeInput
                value={form.soatHoraSiniestro}
                onChange={(v) => updateForm({ soatHoraSiniestro: v })}
                aria-label="Hora del siniestro"
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0 sm:col-span-2 lg:col-span-2">
              <label className="text-sm text-(--color-text-primary)">Datos de intervención de Autoridad</label>
              <input
                value={form.soatDatosIntervencionAutoridad}
                onChange={(e) => updateForm({ soatDatosIntervencionAutoridad: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Documento de Atención</label>
              <div className="mt-1">
                <SelectMenu
                  value={form.soatDocumentoAtencionId1}
                  onChange={(v) => updateForm({ soatDocumentoAtencionId1: v ?? "" })}
                  options={documentoAtencionSelectOptions}
                  ariaLabel="Documento de Atención"
                  buttonClassName={`w-full h-10 min-w-0 ${inputBase}`}
                  menuClassName="min-w-full"
                  disabled={!soatCamposHabilitados}
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Número de documento</label>
              <input
                value={form.soatNumeroDocumentoAtencion1}
                onChange={(e) => updateForm({ soatNumeroDocumentoAtencion1: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Documento de Atención</label>
              <div className="mt-1">
                <SelectMenu
                  value={form.soatDocumentoAtencionId2}
                  onChange={(v) => updateForm({ soatDocumentoAtencionId2: v ?? "" })}
                  options={documentoAtencionSelectOptions}
                  ariaLabel="Documento de Atención (2)"
                  buttonClassName={`w-full h-10 min-w-0 ${inputBase}`}
                  menuClassName="min-w-full"
                  disabled={!soatCamposHabilitados}
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="text-sm text-(--color-text-primary)">Número de documento</label>
              <input
                value={form.soatNumeroDocumentoAtencion2}
                onChange={(e) => updateForm({ soatNumeroDocumentoAtencion2: e.target.value })}
                className={`mt-1 h-10 w-full min-w-0 ${inputBase}`}
                disabled={!soatCamposHabilitados}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end mb-2">
        <SecondaryButton onClick={handleVolver}>Volver</SecondaryButton>
        <PrimaryButton onClick={handleRegistrar} disabled={!canRegistrar}>
          Registrar
        </PrimaryButton>
      </div>
      <div className="h-2 shrink-0" aria-hidden="true" />

        <PacientePicker
        open={pickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setPickerOpen(false)}
        onPicked={onPacientePicked}
        title="Seleccionar paciente"
        showRegisterButton
        onRegister={() => {
          setPickerOpen(false);
          navigate("/admision/historia-clinica/nuevo/datos-generales");
        }}
        onOpenHistoriaClinica={() => {
          setPickerOpen(false);
          navigate("/admision/historia-clinica");
        }}
      />
      <MedicoPicker
        open={medicoPickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setMedicoPickerOpen(false)}
        onPicked={onMedicoPicked}
        title="Seleccionar médico"
        description="Busca y selecciona el médico (clic en la fila)."
        showRegisterButton
        onRegister={() => {
          setMedicoPickerOpen(false);
          navigate("/ficheros/medicos");
        }}
        onOpenMedicos={() => {
          setMedicoPickerOpen(false);
          navigate("/ficheros/medicos");
        }}
      />
    </div>
  );
}
