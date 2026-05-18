import * as React from "react";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { CrudSplitLayout } from "../../../components/CrudSplitLayout";
import { FicherosCrudPageLayout } from "../../../components/FicherosCrudPageLayout";
import ParamOptionToolbar from "../../emergencia/components/ParamOptionToolbar";
import { useNumeracionComprobanteCaja } from "../numeracion-comprobante/hooks/useNumeracionComprobanteCaja";
import type { StatusFilter } from "../../emergencia/types/paramOption.types";
import NumeracionComprobanteTable from "../components/NumeracionComprobanteTable";
import NumeracionComprobanteMobileList from "../components/NumeracionComprobanteMobileList";
import NumeracionComprobanteFormCard from "../components/NumeracionComprobanteFormCard";
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

export default function NumeracionComprobanteCajaPage() {
  const vm = useNumeracionComprobanteCaja();
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useFicherosRealtimeRefresh(vm, ["caja_numeracion_comprobante"]);

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
              <NumeracionComprobanteTable
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
              <NumeracionComprobanteMobileList
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
            <NumeracionComprobanteFormCard
              mode={vm.mode}
              selected={vm.selected}
              tiposDocumento={vm.tiposDocumento}
              tipoDocumentoId={vm.tipoDocumentoId}
              onTipoDocumentoIdChange={vm.setTipoDocumentoId}
              serie={vm.serie}
              onSerieChange={vm.setSerie}
              onSerieBlur={vm.onSerieBlur}
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
      </FicherosCrudPageLayout>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar numeración de comprobante"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.serie} - ${vm.selected.numero_formateado}"?`
            : "Selecciona una numeración de comprobante."
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
