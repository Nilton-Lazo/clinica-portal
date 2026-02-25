import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useMedicos } from "../medicos/hooks/useMedicos";
import MedicosToolbar from "../medicos/components/MedicosToolbar";
import MedicosTable from "../medicos/components/MedicosTable";
import MedicosMobileList from "../medicos/components/MedicosMobileList";
import MedicoFormCard from "../medicos/components/MedicoFormCard";

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
  const title = "Médicos";
  const vm = useMedicos();

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
          <div className="text-sm text-(--color-text-secondary)">
            CRUD con paginación y estados
          </div>
        </div>

        <div className="w-full lg:max-w-190">
          <MedicosToolbar
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

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_571px] lg:items-start">
        <div className="min-w-0">
          <MedicosTable
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />

          <MedicosMobileList
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
        </div>
      </div>

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar médico"
        description={
          vm.selected
            ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selectedFullName}"?`
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
