import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useTarifas } from "../tarifas/hooks/useTarifas";
import TarifasToolbar from "../tarifas/components/TarifasToolbar";
import TarifasTable from "../tarifas/components/TarifasTable";
import TarifasMobileList from "../tarifas/components/TarifasMobileList";
import TarifaFormCard from "../tarifas/components/TarifaFormCard";

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

export default function TarifasPage() {
  const title = "Tarifas";
  const vm = useTarifas();

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
          <TarifasToolbar
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
          <TarifasTable
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />

          <TarifasMobileList
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
          <TarifaFormCard
            mode={vm.mode}
            selected={vm.selected ? { codigo: vm.selected.codigo, estado: vm.selected.estado, tarifa_base: vm.selected.tarifa_base } : null}
            codigo={vm.codigo}
            saving={vm.saving}
            descripcionTarifa={vm.descripcionTarifa}
            onDescripcionTarifaChange={vm.setDescripcionTarifa}
            iafaId={vm.iafaId}
            onIafaIdChange={vm.setIafaId}
            iafas={vm.iafas}
            iafasLoading={vm.iafasLoading}
            fechaCreacion={vm.fechaCreacion}
            requiereAcreditacion={vm.requiereAcreditacion}
            onRequiereAcreditacionChange={vm.setRequiereAcreditacion}
            iafaIsParticular={vm.currentIafaIsParticular}
            tarifaBase={vm.tarifaBase}
            onTarifaBaseChange={vm.requestTarifaBaseChange}
            factorClinica={vm.factorClinica}
            onFactorClinicaChange={vm.setFactorClinica}
            factorLaboratorio={vm.factorLaboratorio}
            onFactorLaboratorioChange={vm.setFactorLaboratorio}
            factorEcografia={vm.factorEcografia}
            onFactorEcografiaChange={vm.setFactorEcografia}
            factorProcedimientos={vm.factorProcedimientos}
            onFactorProcedimientosChange={vm.setFactorProcedimientos}
            factorRayosX={vm.factorRayosX}
            onFactorRayosXChange={vm.setFactorRayosX}
            factorTomografia={vm.factorTomografia}
            onFactorTomografiaChange={vm.setFactorTomografia}
            factorPatologia={vm.factorPatologia}
            onFactorPatologiaChange={vm.setFactorPatologia}
            factorMedicinaFisica={vm.factorMedicinaFisica}
            onFactorMedicinaFisicaChange={vm.setFactorMedicinaFisica}
            factorResonancia={vm.factorResonancia}
            onFactorResonanciaChange={vm.setFactorResonancia}
            factorHonorariosMedicos={vm.factorHonorariosMedicos}
            onFactorHonorariosMedicosChange={vm.setFactorHonorariosMedicos}
            factorMedicinas={vm.factorMedicinas}
            onFactorMedicinasChange={vm.setFactorMedicinas}
            factorEquiposOxigeno={vm.factorEquiposOxigeno}
            onFactorEquiposOxigenoChange={vm.setFactorEquiposOxigeno}
            factorBancoSangre={vm.factorBancoSangre}
            onFactorBancoSangreChange={vm.setFactorBancoSangre}
            factorMamografia={vm.factorMamografia}
            onFactorMamografiaChange={vm.setFactorMamografia}
            factorDensitometria={vm.factorDensitometria}
            onFactorDensitometriaChange={vm.setFactorDensitometria}
            factorPsicoprofilaxis={vm.factorPsicoprofilaxis}
            onFactorPsicoprofilaxisChange={vm.setFactorPsicoprofilaxis}
            factorOtrosServicios={vm.factorOtrosServicios}
            onFactorOtrosServiciosChange={vm.setFactorOtrosServicios}
            factorMedicamentosComerciales={vm.factorMedicamentosComerciales}
            onFactorMedicamentosComercialesChange={vm.setFactorMedicamentosComerciales}
            factorMedicamentosGenericos={vm.factorMedicamentosGenericos}
            onFactorMedicamentosGenericosChange={vm.setFactorMedicamentosGenericos}
            factorMaterialMedico={vm.factorMaterialMedico}
            onFactorMaterialMedicoChange={vm.setFactorMaterialMedico}
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
        title="Desactivar tarifario"
        description={vm.selected ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selectedDescripcion}"?` : "Selecciona un registro."}
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />

      <ConfirmDialog
        open={vm.confirmSetBaseOpen}
        title="Cambiar tarifario base"
        description={vm.confirmBaseDescription}
        confirmText="Cambiar"
        cancelText="Cancelar"
        onCancel={() => vm.setConfirmSetBaseOpen(false)}
        onConfirm={vm.onSetBaseConfirmed}
      />
    </div>
  );
}
