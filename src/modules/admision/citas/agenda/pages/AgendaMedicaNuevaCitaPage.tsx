import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { useAgendaMedicaContext } from "../hooks/AgendaMedicaContext";

function formatMedicoLabel(m?: { nombres: string; apellido_paterno: string; apellido_materno: string } | null): string {
  if (!m) return "";
  return `${m.apellido_paterno} ${m.apellido_materno} ${m.nombres}`.trim();
}

export default function AgendaMedicaNuevaCitaPage() {
  const vm = useAgendaMedicaContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initRef = React.useRef(false);

  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const fecha = searchParams.get("fecha");
    const esp = searchParams.get("especialidad_id");
    const med = searchParams.get("medico_id");
    const hora = searchParams.get("hora");
    const pacienteId = searchParams.get("paciente_id");

    if (fecha) vm.setSelectedDateStr(fecha);
    if (esp) vm.setEspecialidadId(Number(esp));
    if (med) vm.setMedicoId(Number(med));
    if (hora) vm.onPickHora(hora);
    if (pacienteId) void vm.onSelectPaciente(Number(pacienteId));
  }, [searchParams, vm]);

  const onBuscarPaciente = React.useCallback(() => {
    vm.saveDraft();
    const params = new URLSearchParams();
    if (vm.selectedDateStr) params.set("fecha", vm.selectedDateStr);
    if (vm.especialidadId) params.set("especialidad_id", String(vm.especialidadId));
    if (vm.medicoId) params.set("medico_id", String(vm.medicoId));
    if (vm.hora) params.set("hora", vm.hora);
    navigate(`/admision/citas/agenda/pacientes?${params.toString()}`);
  }, [navigate, vm]);

  const summaryServicio = vm.programacion?.especialidad
    ? `${vm.programacion.especialidad.codigo} · ${vm.programacion.especialidad.descripcion}`
    : "";
  const summaryMedico = formatMedicoLabel(vm.programacion?.medico);
  const summaryConsultorio = vm.programacion?.consultorio
    ? `${vm.programacion.consultorio.abreviatura} · ${vm.programacion.consultorio.descripcion}`
    : "";

  const iafaOptions: SelectOption[] = React.useMemo(() => {
    if (!vm.paciente || vm.paciente.iafas.length === 0) {
      return [];
    }
    return vm.paciente.iafas.map((i) => ({ value: String(i.id), label: i.descripcion }));
  }, [vm.paciente]);

  const motivoOptions: SelectOption[] = React.useMemo(
    () => [
      { value: "Reevaluacion", label: "Reevaluación" },
      { value: "Consulta externa", label: "Consulta externa" },
      { value: "Interconsulta", label: "Interconsulta" },
      { value: "Urgencia", label: "Urgencia" },
      { value: "Otros", label: "Otros" },
    ],
    []
  );

  const disableAgendar = !vm.programacion || !vm.hora || !vm.paciente;
  const fechaDisplay = vm.selectedDateStr
    ? vm.selectedDateStr.split("-").reverse().join("-")
    : "";

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-4">
      {vm.notice ? (
        <div
          role="status"
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            vm.notice.type === "success"
              ? "border-(--color-success) text-(--color-success)"
              : "border-(--color-danger) text-(--color-danger)",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">{vm.notice.text}</div>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={vm.clearNotice}
              className="text-base font-semibold leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
      {!vm.slotsLoading && vm.selectedDateStr && vm.especialidadId && vm.medicoId && !vm.programacion ? (
        <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 text-sm text-(--color-text-secondary)">
          No hay programación disponible para la fecha, servicio y médico seleccionados.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0">
          <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-(--color-text-primary)">Datos de la cita</div>
                <div className="text-xs text-(--color-text-secondary)">
                  Completa la información para generar la cita.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Fecha</label>
                  <input
                    value={fechaDisplay}
                    readOnly
                    className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
                <div>
                  <label className="text-sm text-(--color-text-primary)">Hora</label>
                  <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <div className="min-w-40">
                      <SelectMenu
                        value={vm.hora}
                        onChange={(v) => vm.onPickHora(v ?? "")}
                        options={vm.availableHoras.map((h) => ({ value: h, label: h }))}
                        ariaLabel="Hora"
                        buttonClassName="w-full"
                        menuClassName="min-w-full"
                        disabled={!vm.programacion}
                      />
                    </div>
                    <SecondaryButton disabled={!vm.canAddAdicional} onClick={vm.onAddAdicional}>
                      Adicional
                    </SecondaryButton>
                    <SecondaryButton disabled={!vm.canAddExtra} onClick={vm.onAddExtra}>
                      Extra
                    </SecondaryButton>
                  </div>
                  {!vm.slotsLoading && vm.programacion && vm.availableHoras.length === 0 ? (
                    <div className="mt-1 text-xs text-(--color-text-secondary)">
                      No hay horas disponibles. Usa Adicional/Extra si aplica.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">N° de orden</label>
                  <input
                    value={vm.orden ? String(vm.orden) : ""}
                    readOnly
                    className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
                <div>
                  <label className="text-sm text-(--color-text-primary)">Consultorio</label>
                  <input
                    value={summaryConsultorio}
                    readOnly
                    className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">Médico</label>
                <input
                  value={summaryMedico}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">Servicio</label>
                <input
                  value={summaryServicio}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">Motivo de atención</label>
                <div className="mt-1">
                  <SelectMenu
                    value={vm.motivo}
                    onChange={(v) => vm.setMotivo(v ?? "")}
                    options={motivoOptions}
                    ariaLabel="Motivo"
                    buttonClassName="w-full"
                    menuClassName="min-w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">Observación</label>
                <textarea
                  value={vm.observacion}
                  onChange={(e) => vm.setObservacion(e.target.value)}
                  className="mt-1 min-h-[96px] w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">N° Autorización SITEDS</label>
                <input
                  value={vm.autorizacion}
                  onChange={(e) => vm.setAutorizacion(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-(--color-text-primary)">Datos del paciente</div>
                <div className="text-xs text-(--color-text-secondary)">
                  Selecciona un paciente para completar los datos.
                </div>
              </div>
              <PrimaryButton onClick={onBuscarPaciente}>Buscar historia clínica</PrimaryButton>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm text-(--color-text-primary)">Apellidos y nombres</label>
                <input
                  value={vm.paciente?.nombre_completo ?? ""}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-(--color-text-primary)">N° Historia</label>
                  <input
                    value={vm.paciente?.hc ?? ""}
                    readOnly
                    className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
                <div>
                  <label className="text-sm text-(--color-text-primary)">N° Referencia</label>
                  <input
                    value={vm.paciente?.nr ?? ""}
                    readOnly
                    className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm text-(--color-text-primary)">Sexo</label>
                  <input
                    value={vm.paciente?.sexo ?? ""}
                    readOnly
                    className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
                <div>
                  <label className="text-sm text-(--color-text-primary)">Edad</label>
                  <input
                    value={vm.paciente?.edad != null ? String(vm.paciente.edad) : ""}
                    readOnly
                    className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
                <div>
                  <label className="text-sm text-(--color-text-primary)">Titular</label>
                  <input
                    value={vm.paciente?.titular_nombre ?? ""}
                    readOnly
                    className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-(--color-text-primary)">IAFA</label>
                <div className="mt-1">
                  <SelectMenu
                    value={vm.iafaId ? String(vm.iafaId) : ""}
                    onChange={(v) => vm.setIafaId(v ? Number(v) : null)}
                    options={iafaOptions}
                    ariaLabel="IAFA"
                    buttonClassName="w-full"
                    menuClassName="min-w-full"
                    disabled={iafaOptions.length === 0}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <SecondaryButton
              onClick={() => {
                vm.clearDraft();
                navigate("/admision/citas/agenda");
              }}
            >
              Volver
            </SecondaryButton>
            <SecondaryButton onClick={vm.clearDraft}>Cancelar</SecondaryButton>
            <PrimaryButton
              onClick={async () => {
                const ok = await vm.onAgendar();
                if (ok) {
                  navigate("/admision/citas/agenda");
                }
              }}
              disabled={disableAgendar}
            >
              Agendar cita
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
