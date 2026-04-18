import * as React from "react";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { CrudSplitLayout } from "../../../components/CrudSplitLayout";
import ParamOptionToolbar from "../../emergencia/components/ParamOptionToolbar";
import { useBancoTarjetaCaja } from "../banco-tarjeta/hooks/useBancoTarjetaCaja";
import BancoTarjetaTable from "../components/BancoTarjetaTable";
import BancoTarjetaMobileList from "../components/BancoTarjetaMobileList";
import BancoTarjetaFormCard from "../components/BancoTarjetaFormCard";

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
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

  const handleNew = React.useCallback(() => {
    vm.resetToNew();
    if (!isLgUp) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      });
    }
  }, [vm, isLgUp]);

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-(--color-text-primary)">Banco o tarjeta</div>
          <div className="text-sm text-(--color-text-secondary)">CRUD con paginación, formas y medios de pago</div>
        </div>
      </div>
      <div className="w-full shrink-0">
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
      </div>
      <CrudSplitLayout
        formWidth="600px"
        rightRef={formRef}
        left={
          <>
            <BancoTarjetaTable
              data={vm.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
              onFirst={() => vm.setPage(1)}
              onLast={() => vm.setPage(vm.data.meta.last_page)}
            />
            <BancoTarjetaMobileList
              data={vm.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
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
      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar banco o tarjeta"
        description={
          vm.selected ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?` : "Selecciona un registro."
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
