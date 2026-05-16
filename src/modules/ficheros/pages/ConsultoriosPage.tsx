import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CrudSplitLayout } from "../components/CrudSplitLayout";
import { useConsultorios } from "../consultorios/hooks/useConsultorios";
import ConsultoriosToolbar from "../consultorios/components/ConsultoriosToolbar";
import ConsultoriosTable from "../consultorios/components/ConsultoriosTable";
import ConsultoriosMobileList from "../consultorios/components/ConsultoriosMobileList";
import ConsultorioFormCard from "../consultorios/components/ConsultorioFormCard";
import { useFicherosRealtimeRefresh } from "../realtime/useFicherosRealtimeRefresh";

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

export default function ConsultoriosPage() {
  const title = "Consultorios";
  const vm = useConsultorios();

  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useFicherosRealtimeRefresh(vm, ["consultorio"]);

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
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      <div className="shrink-0 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-(--color-text-primary)">{title}</div>
          <div className="text-sm text-(--color-text-secondary)">
            CRUD con paginación y estados
          </div>
        </div>
      </div>
      <div className="w-full shrink-0">
        <ConsultoriosToolbar
          q={vm.q}
          onQChange={vm.setQ}
          statusFilter={vm.statusFilter}
          onStatusChange={vm.setStatusFilter}
          perPage={vm.perPage}
          onPerPageChange={(n) => vm.setPerPage(n)}
          onNew={handleNew}
        />
      </div>

      <CrudSplitLayout formWidth="var(--form-panel-width-md)" rightRef={formRef} left={<>
          <ConsultoriosTable
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
            onFirst={() => vm.setPage(1)}
            onLast={() => vm.setPage(vm.data.meta.last_page)}
          />

          <ConsultoriosMobileList
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
            onFirst={() => vm.setPage(1)}
            onLast={() => vm.setPage(vm.data.meta.last_page)}
          />
        </>} right={<ConsultorioFormCard
            mode={vm.mode}
            selected={vm.selected}
            saving={vm.saving}
            abreviatura={vm.abreviatura}
            onAbreviaturaChange={vm.setAbreviatura}
            descripcion={vm.descripcion}
            onDescripcionChange={vm.setDescripcion}
            estado={vm.estado}
            onEstadoChange={vm.setEstado}
            esTercero={vm.esTercero}
            onEsTerceroChange={vm.setEsTercero}
            isValid={vm.isValid}
            isDirty={vm.isDirty}
            canDeactivate={vm.canDeactivate}
            onSave={vm.onSave}
            onCancel={vm.cancel}
            onDeactivate={vm.requestDeactivate}
          />} />

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar consultorio"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.abreviatura} - ${vm.selected.descripcion}"?`
            : "Selecciona un consultorio."
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
