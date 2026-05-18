import * as React from "react";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { CrudSplitLayout } from "../../../components/CrudSplitLayout";
import { FicherosCrudPageLayout } from "../../../components/FicherosCrudPageLayout";
import ParamOptionToolbar from "../../emergencia/components/ParamOptionToolbar";
import { useMedioPagoCaja } from "../medio-pago/hooks/useMedioPagoCaja";
import type { StatusFilter } from "../../emergencia/types/paramOption.types";
import MedioPagoTable from "../components/MedioPagoTable";
import MedioPagoMobileList from "../components/MedioPagoMobileList";
import MedioPagoFormCard from "../components/MedioPagoFormCard";
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

export default function MedioPagoCajaPage() {
  const vm = useMedioPagoCaja();
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useFicherosRealtimeRefresh(vm, ["caja_medio_pago"]);

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
          formWidth="var(--form-panel-width-lg)"
          rightRef={formRef}
          left={
            <>
              <MedioPagoTable
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
              <MedioPagoMobileList
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
              />
            </>
          }
          right={
            <MedioPagoFormCard
              mode={vm.mode}
              selected={vm.selected}
              codigo={vm.codigo}
              descripcion={vm.descripcion}
              onDescripcionChange={vm.setDescripcion}
              estado={vm.estado}
              onEstadoChange={vm.setEstado}
              formasPago={vm.formasPago}
              formaPagoId={vm.formaPagoId}
              onFormaPagoIdChange={vm.setFormaPagoId}
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
      </FicherosCrudPageLayout>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar medio de pago"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?`
            : "Selecciona un medio de pago."
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
