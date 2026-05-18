import * as React from "react";
import { FormCard } from "../../wizard/ui/formFields";
import { usePacienteWizard } from "../../wizard/usePacienteWizard";
import { useAcreditacionPlanes } from "../../wizard/useAcreditacionPlanes";

import AcreditacionPlanesToolbar from "../../wizard/ui/AcreditacionPlanesToolbar";
import AcreditacionPlanesTable from "../../wizard/ui/AcreditacionPlanesTable";
import AcreditacionPlanesMobileList from "../../wizard/ui/AcreditacionPlanesMobileList";
import AcreditacionPlanFormCard from "../../wizard/ui/AcreditacionPlanFormCard";
import { ConfirmDialog } from "../../../../ficheros/components/ConfirmDialog";

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

export function AcreditacionStep() {
  const { state } = usePacienteWizard();

  const pacienteId = React.useMemo(() => {
    const id = Number((state.draft as unknown as { id?: unknown })?.id ?? 0);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [state.draft]);

  const parentescoSeguro = React.useMemo(() => {
    const raw = String((state.draft as unknown as { parentesco_seguro?: unknown })?.parentesco_seguro ?? "").trim();
    return raw ? raw : null;
  }, [state.draft]);

  const vm = useAcreditacionPlanes(pacienteId, parentescoSeguro);

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

  const emptyText = pacienteId ? "No hay planes afiliados." : "Guarda el paciente para habilitar acreditación.";

  const lastPage = vm.data.meta.last_page;

  const handlePrev = React.useCallback(() => {
    vm.setPage((p) => Math.max(1, p - 1));
  }, [vm]);

  const handleNext = React.useCallback(() => {
    vm.setPage((p) => Math.min(lastPage, p + 1));
  }, [vm, lastPage]);

  const handleFirst = React.useCallback(() => vm.setPage(1), [vm]);
  const handleLast = React.useCallback(() => vm.setPage(lastPage), [vm, lastPage]);

  return (
    <FormCard title="Acreditación">
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-(--color-text-secondary)">Afiliación de planes del paciente</div>
          </div>

          <div className="w-full lg:max-w-190">
            <AcreditacionPlanesToolbar
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

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_571px] lg:items-start">
          <div className="min-w-0">
            <div className="hidden lg:block">
              <AcreditacionPlanesTable
                data={vm.data}
                loading={vm.loading}
                selectedId={vm.selected?.id ?? null}
                onSelect={vm.loadForEdit}
                onPrev={handlePrev}
                onNext={handleNext}
                onFirst={handleFirst}
                onLast={handleLast}
                emptyText={emptyText}
                iafaById={vm.iafaById}
                contratanteById={vm.contratanteById}
              />
            </div>

            <div className="lg:hidden">
              <AcreditacionPlanesMobileList
                data={vm.data}
                loading={vm.loading}
                selectedId={vm.selected?.id ?? null}
                onSelect={vm.loadForEdit}
                page={vm.page}
                onPrev={handlePrev}
                onNext={handleNext}
                onFirst={handleFirst}
                onLast={handleLast}
                emptyText={emptyText}
                iafaById={vm.iafaById}
                contratanteById={vm.contratanteById}
              />
            </div>
          </div>

          <div ref={formRef} className="min-w-0">
            <AcreditacionPlanFormCard
              mode={vm.mode}
              selected={vm.selected}
              saving={vm.saving}
              tiposClientes={vm.tiposClientes}
              tiposClientesLoading={vm.tiposClientesLoading}
              tipoClienteId={vm.tipoClienteId}
              onTipoClienteIdChange={vm.setTipoClienteId}
              condicionLabel={vm.condicionLabel}
              iafaLabel={vm.iafaLabel}
              contratanteLabel={vm.contratanteLabel}
              fechaAfiliacion={vm.fechaAfiliacion}
              onFechaAfiliacionChange={vm.setFechaAfiliacion}
              estado={vm.estado}
              onEstadoChange={vm.setEstado}
              isValid={vm.isValid}
              isDirty={vm.isDirty}
              canDeactivate={vm.canDeactivate}
              onSave={vm.onSave}
              onCancel={vm.cancel}
              onDeactivate={vm.requestDeactivate}
              disabled={!pacienteId}
            />
          </div>
        </div>

        <ConfirmDialog
          open={vm.confirmDeactivateOpen}
          title="Desactivar plan afiliado"
          description={vm.selected ? `¿Deseas desactivar "${vm.selectedLabel}"?` : "Selecciona un plan afiliado."}
          confirmText="Desactivar"
          cancelText="Cancelar"
          destructive
          onCancel={() => vm.setConfirmDeactivateOpen(false)}
          onConfirm={vm.onDeactivateConfirmed}
        />
      </div>
    </FormCard>
  );
}
