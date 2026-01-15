import { ConfirmDialog } from "../components/ConfirmDialog";
import { useEspecialidades } from "../especialidades/hooks/useEspecialidades";
import NoticeBanner from "../especialidades/components/NoticeBanner";
import EspecialidadesToolbar from "../especialidades/components/EspecialidadesToolbar";
import EspecialidadesTable from "../especialidades/components/EspecialidadesTable";
import EspecialidadesMobileList from "../especialidades/components/EspecialidadesMobileList";
import EspecialidadFormCard from "../especialidades/components/EspecialidadFormCard";

export default function EspecialidadesPage() {
  const title = "Especialidades";
  const vm = useEspecialidades();

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-[var(--color-text-primary)]">{title}</div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            Tablas maestras de Admisión · CRUD con paginación y estados
          </div>
        </div>

        <div className="w-full lg:max-w-[760px]">
          <EspecialidadesToolbar
            q={vm.q}
            onQChange={vm.setQ}
            statusFilter={vm.statusFilter}
            onStatusChange={vm.setStatusFilter}
            perPage={vm.perPage}
            onPerPageChange={(n) => vm.setPerPage(n)}
            onNew={vm.resetToNew}
          />
        </div>
      </div>

      <NoticeBanner notice={vm.notice} />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch">
        <div className="min-w-0">
          <EspecialidadesTable
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />

          <EspecialidadesMobileList
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />
        </div>

        <div className="min-w-0">
          <EspecialidadFormCard
            mode={vm.mode}
            selected={vm.selected}
            codigo={vm.codigo}
            saving={vm.saving}
            descripcion={vm.descripcion}
            onDescripcionChange={vm.setDescripcion}
            estado={vm.estado}
            onEstadoChange={vm.setEstado}
            isValid={vm.isValid}
            isDirty={vm.isDirty}
            canDeactivate={vm.canDeactivate}
            onSave={vm.onSave}
            onCancel={vm.cancel}
            onDeactivate={vm.requestDeactivate}
          />
        </div>
      </div>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar especialidad"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?`
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
