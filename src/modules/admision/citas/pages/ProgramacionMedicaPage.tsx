import * as React from "react";
import { ConfirmDialog } from "../../ficheros/components/ConfirmDialog";
import NoticeBanner from "../programacion/components/NoticeBanner";
import ProgramacionCalendarCard from "../programacion/components/ProgramacionCalendarCard";
import ProgramacionMedicaFormCard from "../programacion/components/ProgramacionMedicaFormCard";
import ProgramacionMedicaListBar from "../programacion/components/ProgramacionMedicaListBar";
import ProgramacionMedicaTable from "../programacion/components/ProgramacionMedicaTable";
import ProgramacionMedicaMobileList from "../programacion/components/ProgramacionMedicaMobileList";
import { useProgramacionMedica } from "../programacion/hooks/useProgramacionMedica";

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLgUp;
}

export default function ProgramacionMedicaPage() {
  const vm = useProgramacionMedica();

  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  
  const handleNew = React.useCallback(() => {
    vm.resetToNew();
  
    if (isLgUp) return;
  
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [vm, isLgUp]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-4">
      <NoticeBanner notice={vm.notice} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 h-full">
          <ProgramacionCalendarCard
            modalidad={vm.modalidad}
            onModalidadChange={vm.onModalidadChange}
            enabledEditModalidad={vm.enabledEditModalidad}
            selectedDate={vm.selectedDate}
            selectedDates={vm.selectedDates}
            rangeStart={vm.rangeStart}
            rangeEnd={vm.rangeEnd}
            onPickDaily={vm.onPickDaily}
            onToggleRandom={vm.onToggleRandom}
            onPickRange={vm.onPickRange}
          />
        </div>

        <div ref={formRef} className="min-w-0">
          <ProgramacionMedicaFormCard
            mode={vm.mode}
            codigo={vm.codigoDisplay}
            fechaDisplay={vm.fechaDisplay}
            medicoId={vm.medicoId}
            onMedicoChange={vm.setMedicoId}
            medicoOptions={vm.medicoOptions}
            especialidadId={vm.especialidadId}
            onEspecialidadChange={vm.setEspecialidadId}
            especialidadOptions={vm.especialidadOptions}
            consultorioId={vm.consultorioId}
            onConsultorioChange={vm.setConsultorioId}
            consultorioOptions={vm.consultorioOptions}
            turnoId={vm.turnoId}
            onTurnoChange={vm.setTurnoId}
            turnoOptions={vm.turnoOptions}
            cupos={vm.cupos}
            tipo={vm.tipo}
            onTipoChange={vm.setTipo}
            estado={vm.estado}
            onEstadoChange={vm.setEstado}
            saving={vm.saving}
            isValid={vm.isValid}
            isDirty={vm.isDirty}
            canDeactivate={vm.canDeactivate}
            onSave={vm.onSave}
            onCancel={vm.cancel}
            onDeactivate={vm.requestDeactivate}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-(--color-text-primary)">Listado</div>
              <div className="text-xs text-(--color-text-secondary)">
                Usa los filtros para controlar qué se muestra en la tabla.
              </div>
            </div>

            <div className="w-full sm:max-w-none sm:flex-1 sm:ml-4">
              <ProgramacionMedicaListBar
                q={vm.q}
                onQChange={vm.setQ}
                from={vm.from}
                to={vm.to}
                onFromChange={vm.setFrom}
                onToChange={vm.setTo}
                statusFilter={vm.statusFilter}
                onStatusChange={vm.setStatusFilter}
                perPage={vm.perPage}
                onPerPageChange={(n) => vm.setPerPage(n)}
                onNew={handleNew}
              />
            </div>
          </div>

          <div className="min-w-0">
            <ProgramacionMedicaTable
              data={vm.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
            />

            <ProgramacionMedicaMobileList
              data={vm.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar programación"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} · ${vm.selected.fecha}"?`
            : "Selecciona un registro."
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />
    </div>
  );
}
