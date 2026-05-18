import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CrudSplitLayout } from "../components/CrudSplitLayout";
import { FicherosCrudPageLayout } from "../components/FicherosCrudPageLayout";
import { useMedicos } from "../medicos/hooks/useMedicos";
import type { StatusFilter } from "../medicos/hooks/useMedicos";
import MedicosToolbar from "../medicos/components/MedicosToolbar";
import MedicosTable from "../medicos/components/MedicosTable";
import MedicosMobileList from "../medicos/components/MedicosMobileList";
import MedicoFormCard from "../medicos/components/MedicoFormCard";
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

export default function MedicosPage() {
  const vm = useMedicos();

  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  useFicherosRealtimeRefresh(vm, ["medico"]);

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
    <>
      <FicherosCrudPageLayout
        toolbar={
          <MedicosToolbar
            q={vm.q}
            onQChange={vm.setQ}
            statusFilter={vm.statusFilter as StatusFilter}
            onStatusChange={vm.setStatusFilter}
            perPage={vm.perPage}
            onPerPageChange={(n) => vm.setPerPage(n)}
            onNew={handleNew}
          />
        }
      >
        <CrudSplitLayout
          formWidth="var(--form-panel-width-xl)"
          rightRef={formRef}
          left={
            <>
              <MedicosTable
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

              <MedicosMobileList
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
            <MedicoFormCard
              mode={vm.mode}
              selected={vm.selected}
              codigo={vm.codigo}
              saving={vm.saving}
              cmp={vm.cmp}
              onCmpChange={vm.setCmp}
              rne={vm.rne}
              onRneChange={vm.setRne}
              dni={vm.dni}
              onDniChange={vm.setDni}
              tipoProfesional={vm.tipoProfesional}
              onTipoProfesionalChange={vm.setTipoProfesional}
              nombres={vm.nombres}
              onNombresChange={vm.setNombres}
              apellidoPaterno={vm.apellidoPaterno}
              onApellidoPaternoChange={vm.setApellidoPaterno}
              apellidoMaterno={vm.apellidoMaterno}
              onApellidoMaternoChange={vm.setApellidoMaterno}
              especialidadId={vm.especialidadId}
              onEspecialidadIdChange={vm.setEspecialidadId}
              especialidades={vm.especialidades}
              especialidadesLoading={vm.especialidadesLoading}
              telefono={vm.telefono}
              onTelefonoChange={vm.setTelefono}
              telefono2={vm.telefono2}
              onTelefono2Change={vm.setTelefono2}
              email={vm.email}
              onEmailChange={vm.setEmail}
              direccion={vm.direccion}
              onDireccionChange={vm.setDireccion}
              centroTrabajo={vm.centroTrabajo}
              onCentroTrabajoChange={vm.setCentroTrabajo}
              fechaNacimiento={vm.fechaNacimiento}
              onFechaNacimientoChange={vm.setFechaNacimiento}
              ruc={vm.ruc}
              onRucChange={vm.setRuc}
              adicionales={vm.adicionales}
              onAdicionalesChange={vm.setAdicionales}
              extras={vm.extras}
              onExtrasChange={vm.setExtras}
              tiempoPromedio={vm.tiempoPromedio}
              onTiempoPromedioChange={vm.setTiempoPromedio}
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
        title="Desactivar médico"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selectedFullName}"?`
            : "Selecciona un médico."
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
