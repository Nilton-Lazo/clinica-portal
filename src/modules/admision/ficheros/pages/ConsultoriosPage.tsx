import { ConfirmDialog } from "../components/ConfirmDialog";
import { useConsultorios } from "../consultorios/hooks/useConsultorios";
import ConsultoriosToolbar from "../consultorios/components/ConsultoriosToolbar";
import ConsultoriosTable from "../consultorios/components/ConsultoriosTable";
import ConsultoriosMobileList from "../consultorios/components/ConsultoriosMobileList";
import ConsultorioFormCard from "../consultorios/components/ConsultorioFormCard";

export default function ConsultoriosPage() {
  const title = "Consultorios";
  const vm = useConsultorios();

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
          <ConsultoriosToolbar
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

      {vm.notice ? (
        <div
          role="status"
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            vm.notice.type === "success"
              ? "border-[var(--color-success)] text-[var(--color-success)]"
              : "border-[var(--color-danger)] text-[var(--color-danger)]",
          ].join(" ")}
        >
          {vm.notice.text}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch">
        <div className="min-w-0">
          <ConsultoriosTable
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />

          <ConsultoriosMobileList
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
          <ConsultorioFormCard
            mode={vm.mode}
            selected={vm.selected}
            abreviatura={vm.abreviatura}
            onAbreviaturaChange={vm.setAbreviatura}
            descripcion={vm.descripcion}
            onDescripcionChange={vm.setDescripcion}
            estado={vm.estado}
            onEstadoChange={vm.setEstado}
            esTerceros={vm.esTerceros}
            onEsTercerosChange={vm.setEsTerceros}
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
        title="Desactivar consultorio"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.abreviatura} - ${vm.selected.descripcion}"?`
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
