import * as React from "react";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { CrudSplitLayout } from "../../../components/CrudSplitLayout";
import { FicherosCrudPageLayout } from "../../../components/FicherosCrudPageLayout";
import { useTipoDocumentoCaja } from "../tipo-documento/hooks/useTipoDocumentoCaja";
import type { StatusFilter } from "../../emergencia/types/paramOption.types";
import ParamOptionToolbar from "../../emergencia/components/ParamOptionToolbar";
import ParamOptionTable from "../../emergencia/components/ParamOptionTable";
import ParamOptionMobileList from "../../emergencia/components/ParamOptionMobileList";
import ParamOptionFormCard from "../../emergencia/components/ParamOptionFormCard";
import { useFicherosRealtimeRefresh } from "../../../realtime/useFicherosRealtimeRefresh";

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true,
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

export default function TipoDocumentoCajaPage() {
  const vm = useTipoDocumentoCaja();
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useFicherosRealtimeRefresh(vm, ["caja_tipo_documento"]);

  const handleNew = React.useCallback(() => {
    vm.resetToNew();
    if (!isLgUp) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() =>
          formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        );
      });
    }
  }, [vm, isLgUp]);

  return (
    <>
      <FicherosCrudPageLayout
        toolbar={
          <ParamOptionToolbar
            q={vm.q}
            onQChange={vm.setQ}
            statusFilter={vm.statusFilter as StatusFilter}
            onStatusChange={vm.setStatusFilter}
            perPage={vm.perPage}
            onPerPageChange={(n) => vm.setPerPage(n)}
            onNew={handleNew}
            backHref="/ficheros/parametros/caja"
          />
        }
      >
        <CrudSplitLayout
          formWidth="var(--form-panel-width-md)"
          rightRef={formRef}
          left={
            <>
              <ParamOptionTable
                data={vm.data}
                loading={vm.loading}
                selectedId={vm.selected?.id ?? null}
                onSelect={vm.loadForEdit}
                onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                onNext={() =>
                  vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))
                }
                onFirst={() => vm.setPage(1)}
                onLast={() => vm.setPage(vm.data.meta.last_page)}
                onRefresh={() => void vm.refresh()}
                sort={vm.sort}
                sortDir={vm.sortDir}
                onToggleSort={vm.toggleSort}
              />
              <ParamOptionMobileList
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
            <ParamOptionFormCard
              entityLabel="tipo de documento"
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
        title="Desactivar tipo de documento"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?`
            : "Selecciona un tipo de documento."
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
