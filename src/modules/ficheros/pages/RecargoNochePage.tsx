import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CrudSplitLayout } from "../components/CrudSplitLayout";
import { FicherosCrudPageLayout } from "../components/FicherosCrudPageLayout";
import { useRecargoNoche } from "../recargo-noche/hooks/useRecargoNoche";
import type { StatusFilter } from "../recargo-noche/hooks/useRecargoNoche";
import RecargoNocheToolbar from "../recargo-noche/components/RecargoNocheToolbar";
import RecargoNocheTable from "../recargo-noche/components/RecargoNocheTable";
import RecargoNocheMobileList from "../recargo-noche/components/RecargoNocheMobileList";
import RecargoNocheFormCard from "../recargo-noche/components/RecargoNocheFormCard";
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

export default function RecargoNochePage() {
  const vm = useRecargoNoche();
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useFicherosRealtimeRefresh(vm, ["recargo_noche"]);

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
          <RecargoNocheToolbar
            tarifas={vm.tarifas}
            tarifasLoading={vm.tarifasLoading}
            tarifaId={vm.tarifaId}
            onTarifaChange={vm.setTarifaId}
            statusFilter={vm.statusFilter as StatusFilter}
            onStatusChange={vm.setStatusFilter}
            onNew={handleNew}
          />
        }
      >
        {vm.tarifaId ? (
          <CrudSplitLayout
            formWidth="var(--form-panel-width-md)"
            rightRef={formRef}
            left={
              <>
                <RecargoNocheTable
                  reglas={vm.reglas}
                  loading={vm.loading}
                  selectedId={vm.selected?.id ?? null}
                  onSelect={vm.loadForEdit}
                  paginationMeta={vm.paginationMeta}
                  onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                  onNext={() => vm.setPage((p) => Math.min(vm.paginationMeta.last_page, p + 1))}
                  onFirst={() => vm.setPage(1)}
                  onLast={() => vm.setPage(vm.paginationMeta.last_page)}
                  sort={vm.sort}
                  sortDir={vm.sortDir}
                  onToggleSort={vm.toggleSort}
                />

                <RecargoNocheMobileList
                  reglas={vm.reglas}
                  loading={vm.loading}
                  selectedId={vm.selected?.id ?? null}
                  onSelect={vm.loadForEdit}
                  paginationMeta={vm.paginationMeta}
                  onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                  onNext={() => vm.setPage((p) => Math.min(vm.paginationMeta.last_page, p + 1))}
                  onFirst={() => vm.setPage(1)}
                  onLast={() => vm.setPage(vm.paginationMeta.last_page)}
                />
              </>
            }
            right={
              <RecargoNocheFormCard
                mode={vm.mode}
                selected={vm.selected}
                categoriasDisponibles={vm.categoriasDisponiblesParaNuevo}
                formCategoriaId={vm.formCategoriaId}
                onFormCategoriaIdChange={vm.setFormCategoriaId}
                formPorcentaje={vm.formPorcentaje}
                onFormPorcentajeChange={vm.setFormPorcentaje}
                formHoraDesde={vm.formHoraDesde}
                onFormHoraDesdeChange={vm.setFormHoraDesde}
                formHoraHasta={vm.formHoraHasta}
                onFormHoraHastaChange={vm.setFormHoraHasta}
                formEstado={vm.formEstado}
                onFormEstadoChange={vm.setFormEstado}
                saving={vm.saving}
                isValid={vm.isValid}
                isDirty={vm.isDirty}
                canDeactivate={vm.canDeactivate}
                onSave={vm.onSave}
                onCancel={vm.cancel}
                onDeactivate={vm.requestDeactivate}
              />
            }
          />
        ) : (
          <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-6 text-center text-sm text-(--color-text-secondary)">
            Seleccione un tarifario para gestionar las reglas de recargo
            nocturno.
          </div>
        )}
      </FicherosCrudPageLayout>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar regla"
        description={
          vm.selected
            ? `¿Deseas desactivar la regla de recargo para "${vm.selected.categoria_nombre ?? vm.selected.categoria_codigo ?? "categoría"}"?`
            : "Selecciona una regla de recargo nocturno."
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
