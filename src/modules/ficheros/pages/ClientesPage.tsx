import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CrudSplitLayout } from "../components/CrudSplitLayout";
import { useClientes } from "../clientes/hooks/useClientes";
import ClientesToolbar from "../clientes/components/ClientesToolbar";
import ClientesTable from "../clientes/components/ClientesTable";
import ClientesMobileList from "../clientes/components/ClientesMobileList";
import ClienteFormCard from "../clientes/components/ClienteFormCard";
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

export default function ClientesPage() {
  const title = "Clientes";
  const vm = useClientes();

  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useFicherosRealtimeRefresh(vm, ["cliente"]);

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
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-(--color-text-primary)">{title}</div>
          <div className="text-sm text-(--color-text-secondary)">CRUD con paginación y estados</div>
        </div>
      </div>
      <div className="w-full shrink-0">
        <ClientesToolbar
          q={vm.q}
          onQChange={vm.setQ}
          statusFilter={vm.statusFilter}
          onStatusChange={vm.setStatusFilter}
          perPage={vm.perPage}
          onPerPageChange={(n) => vm.setPerPage(n)}
          onNew={handleNew}
        />
      </div>

      <CrudSplitLayout
        formWidth="var(--form-panel-width-md)"
        rightRef={formRef}
        left={
          <>
            <ClientesTable
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

            <ClientesMobileList
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
          </>
        }
        right={
          <ClienteFormCard
            mode={vm.mode}
            selected={vm.selected ? { codigo: vm.selected.codigo, estado: vm.selected.estado } : null}
            codigo={vm.codigo}
            saving={vm.saving}
            tipo={vm.tipo}
            onTipoChange={vm.setTipo}
            nombre={vm.nombre}
            onNombreChange={vm.setNombre}
            dniORuc={vm.dniORuc}
            onDniORucChange={vm.setDniORuc}
            telefono={vm.telefono}
            onTelefonoChange={vm.setTelefono}
            direccion={vm.direccion}
            onDireccionChange={vm.setDireccion}
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

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar cliente"
        description={
          vm.selected ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selectedNombre}"?` : "Selecciona un cliente."
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
