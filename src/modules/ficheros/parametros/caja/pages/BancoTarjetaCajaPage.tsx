import * as React from "react";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { CrudSplitLayout } from "../../../components/CrudSplitLayout";
import { FicherosCrudPageLayout } from "../../../components/FicherosCrudPageLayout";
import ParamOptionToolbar from "../../emergencia/components/ParamOptionToolbar";
import { useBancoTarjetaCaja } from "../banco-tarjeta/hooks/useBancoTarjetaCaja";
import BancoTarjetaTable from "../components/BancoTarjetaTable";
import BancoTarjetaMobileList from "../components/BancoTarjetaMobileList";
import BancoTarjetaFormCard from "../components/BancoTarjetaFormCard";
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

export default function BancoTarjetaCajaPage() {
  const vm = useBancoTarjetaCaja();
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useFicherosRealtimeRefresh(vm, ["caja_banco_tarjeta"]);

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
            statusFilter={vm.statusFilter}
            onStatusChange={vm.setStatusFilter}
            perPage={vm.perPage}
            onPerPageChange={(n) => vm.setPerPage(n)}
            onNew={handleNew}
            backHref="/ficheros/parametros/caja"
          />
        }
      >
        <CrudSplitLayout
          formWidth="var(--form-panel-width-2xl)"
          rightRef={formRef}
          left={
            <>
              <BancoTarjetaTable
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
              <BancoTarjetaMobileList
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
            <BancoTarjetaFormCard
              mode={vm.mode}
              selected={vm.selected}
              codigo={vm.codigo}
              descripcion={vm.descripcion}
              onDescripcionChange={vm.setDescripcion}
              estado={vm.estado}
              onEstadoChange={vm.setEstado}
              formasPago={vm.formasPago}
              formaPagoIds={vm.formaPagoIds}
              onFormaPagoIdsChange={vm.setFormaPagoIds}
              mediosDisponibles={vm.mediosDisponibles}
              medioPagoIds={vm.medioPagoIds}
              onMedioPagoIdsChange={vm.setMedioPagoIds}
              loadingMedios={vm.loadingMedios}
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
        title="Desactivar banco o tarjeta"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?`
            : "Selecciona un banco o tarjeta."
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
