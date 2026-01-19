import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useTurnos } from "../turnos/hooks/useTurnos";
import TurnosToolbar from "../turnos/components/TurnosToolbar";
import TurnosTable from "../turnos/components/TurnosTable";
import TurnosMobileList from "../turnos/components/TurnosMobileList";
import TurnoFormCard from "../turnos/components/TurnoFormCard";

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

export default function TurnosPage() {
  const title = "Turnos";
  const vm = useTurnos();

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
          <TurnosToolbar
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

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="min-w-0">
          <TurnosTable
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />

          <TurnosMobileList
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
          <TurnoFormCard
            mode={vm.mode}
            selected={vm.selected}
            codigo={vm.codigo}
            saving={vm.saving}
            horaInicio={vm.horaInicio}
            onHoraInicioChange={vm.setHoraInicio}
            horaFin={vm.horaFin}
            onHoraFinChange={vm.setHoraFin}
            duracionPreview={vm.duracionPreview}
            descripcionPreview={vm.descripcionPreview}
            descripcion={vm.descripcion}
            onDescripcionChange={vm.setDescripcion}
            tipoTurno={vm.tipoTurno}
            onTipoTurnoChange={vm.setTipoTurno}
            jornada={vm.jornada}
            onJornadaChange={vm.setJornada}
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
        title="Desactivar turno"
        description={vm.selected ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selected.descripcion}"?` : "Selecciona un registro."}
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />
    </div>
  );
}
