import * as React from "react";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { CrudSplitLayout } from "../../../components/CrudSplitLayout";
import ParamOptionToolbar from "../../emergencia/components/ParamOptionToolbar";
import { useNumeracionComprobanteCaja } from "../numeracion-comprobante/hooks/useNumeracionComprobanteCaja";
import NumeracionComprobanteTable from "../components/NumeracionComprobanteTable";
import NumeracionComprobanteMobileList from "../components/NumeracionComprobanteMobileList";
import NumeracionComprobanteFormCard from "../components/NumeracionComprobanteFormCard";

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

export default function NumeracionComprobanteCajaPage() {
  const vm = useNumeracionComprobanteCaja();
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
          <div className="text-base font-semibold text-(--color-text-primary)">Numeración de comprobante</div>
          <div className="text-sm text-(--color-text-secondary)">CRUD con paginación y estados</div>
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
        formWidth="560px"
        rightRef={formRef}
        left={
          <>
            <NumeracionComprobanteTable
              data={vm.data}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
              onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
              onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
              onFirst={() => vm.setPage(1)}
              onLast={() => vm.setPage(vm.data.meta.last_page)}
            />
            <NumeracionComprobanteMobileList
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
          <NumeracionComprobanteFormCard
            mode={vm.mode}
            selected={vm.selected}
            tiposDocumento={vm.tiposDocumento}
            tipoDocumentoId={vm.tipoDocumentoId}
            onTipoDocumentoIdChange={vm.setTipoDocumentoId}
            serie={vm.serie}
            onSerieChange={vm.setSerie}
            numeroText={vm.numeroText}
            onNumeroTextChange={vm.setNumeroText}
            onNumeroBlur={vm.onNumeroBlur}
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
        }
      />
      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar numeración de comprobante"
        description={vm.selected ? `¿Deseas desactivar "${vm.selected.serie} - ${vm.selected.numero_formateado}"?` : "Selecciona una numeración de comprobante."}
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />
    </div>
  );
}
