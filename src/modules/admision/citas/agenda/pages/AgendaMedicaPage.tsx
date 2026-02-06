import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton } from "../../../../../shared/ui/buttons";
import { ConfirmDialog } from "../../../ficheros/components/ConfirmDialog";
import AgendaMedicaCalendarCard from "../components/AgendaMedicaCalendarCard";
import AgendaMedicaTable from "../components/AgendaMedicaTable";
import AgendaMedicaMobileList from "../components/AgendaMedicaMobileList";
import AgendaServicioProgramadoList from "../components/AgendaServicioProgramadoList";
import AgendaMedicoProgramadoList from "../components/AgendaMedicoProgramadoList";
import { useAgendaMedicaContext } from "../hooks/AgendaMedicaContext";

const perPageOptions: SelectOption[] = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

const estadoAtencionOptions: SelectOption[] = [
  { value: "ALL", label: "Todos" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "ATENDIDO", label: "Atendido" },
];

function formatMedicoLabel(m?: { nombres: string; apellido_paterno: string; apellido_materno: string } | null): string {
  if (!m) return "";
  return `${m.apellido_paterno} ${m.apellido_materno} ${m.nombres}`.trim();
}

export default function AgendaMedicaPage() {
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
    if (fecha) vm.setSelectedDateStr(fecha);
    if (esp) vm.setEspecialidadId(Number(esp));
    if (med) vm.setMedicoId(Number(med));
  }, [searchParams, vm]);

  const onPickDate = React.useCallback(
    (d: Date) => {
      vm.setSelectedDate(d);
      vm.setEspecialidadId(null);
      vm.setMedicoId(null);
      vm.setNotice(null);
    },
    [vm]
  );

  const onNuevaCita = React.useCallback(() => {
    const params = new URLSearchParams();
    if (vm.selectedDateStr) params.set("fecha", vm.selectedDateStr);
    if (vm.especialidadId) params.set("especialidad_id", String(vm.especialidadId));
    if (vm.medicoId) params.set("medico_id", String(vm.medicoId));
    navigate(`/admision/citas/agenda/nueva?${params.toString()}`);
  }, [navigate, vm.selectedDateStr, vm.especialidadId, vm.medicoId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!vm.confirmEliminarOpen && vm.selectedCita) vm.setConfirmEliminarOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vm.confirmEliminarOpen, vm.selectedCita, vm.setConfirmEliminarOpen]);

  const summaryServicio = vm.programacion?.especialidad
    ? `${vm.programacion.especialidad.descripcion}`
    : "—";
  const summaryMedico = formatMedicoLabel(vm.programacion?.medico) || "—";
  const summaryConsultorio = vm.programacion?.consultorio
    ? `${vm.programacion.consultorio.abreviatura} · ${vm.programacion.consultorio.descripcion}`
    : "—";

  return (
    <div className="flex w-full min-w-0 flex-col space-y-4">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0">
          <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 space-y-4">
            <AgendaMedicaCalendarCard
              selectedDate={vm.selectedDate}
              onPick={onPickDate}
              variant="embedded"
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-(--color-text-primary)">Programación seleccionada</div>
                <button
                  type="button"
                  onClick={() => {
                    vm.setEspecialidadId(null);
                    vm.setMedicoId(null);
                  }}
                  disabled={!vm.selectedDateStr}
                  className="text-xs text-(--color-text-secondary) hover:text-(--color-text-primary) hover:underline disabled:opacity-50 disabled:pointer-events-none"
                >
                  Limpiar selección
                </button>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium text-(--color-text-primary)">Lista de servicios:</div>
                <AgendaServicioProgramadoList
                  list={vm.especialidadesList}
                  selectedId={vm.especialidadId}
                  onSelect={(id) => {
                    vm.setMedicoId(null);
                    vm.setEspecialidadId(id);
                  }}
                  loading={vm.opcionesLoading}
                  emptyMessage={vm.selectedDateStr ? "Sin servicios programados para esta fecha" : "Seleccione una fecha"}
                />
              </div>
              <div>
                <div className="mb-1 text-sm font-medium text-(--color-text-primary)">Lista de médicos:</div>
                <AgendaMedicoProgramadoList
                  list={vm.medicosList}
                  selectedId={vm.medicoId}
                  onSelect={(id) => vm.setMedicoId(id)}
                  loading={vm.medicosLoading}
                  emptyMessage={
                    !vm.selectedDateStr
                      ? "Seleccione una fecha"
                      : vm.especialidadId === null
                        ? "Seleccione un servicio"
                        : "Sin médicos programados para este servicio"
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 h-full">
          <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-(--color-text-primary)">Agenda médica</div>
                <div className="text-xs text-(--color-text-secondary)">
                  Selecciona fecha, servicio y médico para ver las citas.
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-36">
                  <SelectMenu
                    value={vm.estadoAtencionFilter}
                    onChange={(v) => vm.setEstadoAtencionFilter(v === "ALL" ? "ALL" : v === "PENDIENTE" ? "PENDIENTE" : "ATENDIDO")}
                    options={estadoAtencionOptions}
                    ariaLabel="Filtrar por estado"
                    buttonClassName="w-full"
                    menuClassName="min-w-full"
                  />
                </div>
                <div className="w-28">
                  <SelectMenu
                    value={String(vm.perPage)}
                    onChange={(v) => vm.setPerPage(Number(v))}
                    options={perPageOptions}
                    ariaLabel="Registros por página"
                    buttonClassName="w-full"
                    menuClassName="min-w-full"
                  />
                </div>
                <PrimaryButton onClick={onNuevaCita} disabled={!vm.programacion || vm.slotsLoading}>
                  Generar cita
                </PrimaryButton>
              </div>
            </div>

            {vm.selectedDateStr && vm.especialidadId && vm.medicoId ? (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
                  <div>
                    <span className="text-(--color-text-secondary)">Servicio:</span>{" "}
                    <span className="text-(--color-text-primary) font-medium">{summaryServicio}</span>
                  </div>
                  <div>
                    <span className="text-(--color-text-secondary)">Médico:</span>{" "}
                    <span className="text-(--color-text-primary) font-medium">{summaryMedico}</span>
                  </div>
                  <div>
                    <span className="text-(--color-text-secondary)">Consultorio:</span>{" "}
                    <span className="text-(--color-text-primary) font-medium">{summaryConsultorio}</span>
                  </div>
                </div>

                <AgendaMedicaTable
                  data={vm.data}
                  loading={vm.loading}
                  page={vm.page}
                  onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                  onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
                  selectedId={vm.selectedCita?.id ?? null}
                  onSelect={(row) => vm.setSelectedCita(row)}
                  onDoubleClick={(row) => navigate(`/admision/citas/agenda/${row.id}/atencion`)}
                />
                <AgendaMedicaMobileList
                  data={vm.data}
                  loading={vm.loading}
                  page={vm.page}
                  onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                  onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
                  selectedId={vm.selectedCita?.id ?? null}
                  onSelect={(row) => {
                    vm.setSelectedCita(row);
                    navigate(`/admision/citas/agenda/${row.id}/atencion`);
                  }}
                  onLongPress={(row) => {
                    vm.setSelectedCita(row);
                    vm.setConfirmEliminarOpen(true);
                  }}
                />
              </>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-(--border-color-default) bg-(--color-surface) py-8 text-center">
                <p className="text-sm text-(--color-text-secondary)">
                  {!vm.selectedDateStr
                    ? "Seleccione una fecha en el calendario para cargar la programación."
                    : !vm.especialidadId
                      ? "Seleccione un servicio programado."
                      : "Seleccione un médico programado."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={vm.confirmEliminarOpen}
        title="Eliminar cita"
        description={
          vm.selectedCita
            ? "¿Estás seguro de eliminar esta cita? La hora quedará libre para otra cita. El registro se conservará en el sistema."
            : "Selecciona una cita."
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmEliminarOpen(false)}
        onConfirm={vm.onEliminarCitaConfirmed}
      />
    </div>
  );
}
