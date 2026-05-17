import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CrudSplitLayout } from "../components/CrudSplitLayout";
import { FicherosCrudPageLayout } from "../components/FicherosCrudPageLayout";
import { useEspecialidades } from "../especialidades/hooks/useEspecialidades";
import EspecialidadesToolbar from "../especialidades/components/EspecialidadesToolbar";
import EspecialidadesTable from "../especialidades/components/EspecialidadesTable";
import EspecialidadesMobileList from "../especialidades/components/EspecialidadesMobileList";
import EspecialidadFormCard from "../especialidades/components/EspecialidadFormCard";
import { useRealtimeModuleRefresh } from "../../../shared/realtime/useRealtimeModuleRefresh";

const FICHEROS_ESPECIALIDADES_ENTITIES = ["especialidad"];

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

export default function EspecialidadesPage() {
  const vm = useEspecialidades();

  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useRealtimeModuleRefresh({
    module: "ficheros",
    entities: FICHEROS_ESPECIALIDADES_ENTITIES,
    onEvent: (event) => {
      if (event.action === "created") {
        vm.setPage(1);
        void vm.refresh({ page: 1 });
        return;
      }

      void vm.refresh();
    },
  });

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
    <>
      <FicherosCrudPageLayout
        toolbar={
          <EspecialidadesToolbar
            q={vm.q}
            onQChange={vm.setQ}
            statusFilter={vm.statusFilter}
            onStatusChange={vm.setStatusFilter}
            perPage={vm.perPage}
            onPerPageChange={(n) => vm.setPerPage(n)}
            onNew={handleNew}
          />
        }
      >
        <CrudSplitLayout
          formWidth="var(--form-panel-width-md)"
          rightRef={formRef}
          left={
            <>
              <EspecialidadesTable
                data={vm.data}
                loading={vm.loading}
                selectedId={vm.selected?.id ?? null}
                onSelect={vm.loadForEdit}
                page={vm.page}
                onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                onNext={() =>
                  vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))
                }
                onFirst={() => vm.setPage(1)}
                onLast={() => vm.setPage(vm.data.meta.last_page)}
              />

              <EspecialidadesMobileList
                data={vm.data}
                loading={vm.loading}
                selectedId={vm.selected?.id ?? null}
                onSelect={vm.loadForEdit}
                page={vm.page}
                onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                onNext={() =>
                  vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))
                }
                onFirst={() => vm.setPage(1)}
                onLast={() => vm.setPage(vm.data.meta.last_page)}
              />
            </>
          }
          right={
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
          }
        />
      </FicherosCrudPageLayout>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar especialidad"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?`
            : "Selecciona una especialidad."
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />
    </>
  );
}
