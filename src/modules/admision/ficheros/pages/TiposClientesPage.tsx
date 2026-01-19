import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useTiposClientes } from "../tiposClientes/hooks/useTiposClientes";
import TiposClientesToolbar from "../tiposClientes/components/TiposClientesToolbar";
import TiposClientesTable from "../tiposClientes/components/TiposClientesTable";
import TiposClientesMobileList from "../tiposClientes/components/TiposClientesMobileList";
import TipoClienteFormCard from "../tiposClientes/components/TipoClienteFormCard";

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

export default function TiposClientesPage() {
  const title = "Tipos de cliente";
  const vm = useTiposClientes();

  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

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
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-(--color-text-primary)">{title}</div>
          <div className="text-sm text-(--color-text-secondary)">CRUD con paginación y estados</div>
        </div>

        <div className="w-full lg:max-w-190">
          <TiposClientesToolbar
            q={vm.q}
            onQChange={vm.setQ}
            statusFilter={vm.statusFilter}
            onStatusChange={vm.setStatusFilter}
            perPage={vm.perPage}
            onPerPageChange={(n) => vm.setPerPage(n)}
            onNew={handleNew}
          />
        </div>
      </div>

      {vm.notice ? (
        <div
          role="status"
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            vm.notice.type === "success"
              ? "border-(--color-success) text-(--color-success)"
              : "border-(--color-danger) text-(--color-danger)",
          ].join(" ")}
        >
          {vm.notice.text}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        <div className="min-w-0">
          <TiposClientesTable
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />

          <TiposClientesMobileList
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />
        </div>

        <div ref={formRef} className="min-w-0">
          <TipoClienteFormCard
            mode={vm.mode}
            selected={vm.selected ? { codigo: vm.selected.codigo, estado: vm.selected.estado } : null}
            codigo={vm.codigo}
            saving={vm.saving}
            tarifaId={vm.tarifaId}
            onTarifaIdChange={vm.setTarifaId}
            tarifas={vm.tarifas}
            contratanteId={vm.contratanteId}
            onContratanteIdChange={vm.setContratanteId}
            contratantes={vm.contratantes}
            iafaRazonSocial={vm.iafaRazonSocial}
            descripcionPreview={vm.descripcionPreview}
            lookupsLoading={vm.lookupsLoading}
            estado={vm.estado}
            onEstadoChange={vm.setEstado}
            isValid={vm.isValid}
            isDirty={vm.isDirty}
            canDeactivate={vm.canDeactivate}
            onSave={vm.onSave}
            onCancel={vm.cancel}
            onDeactivate={vm.requestDeactivate}
          />
        </div>
      </div>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar tipo de cliente"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selectedDescripcion}"?`
            : "Selecciona un registro."
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
