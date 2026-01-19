import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useIafas } from "../iafas/hooks/useIafas";
import IafasToolbar from "../iafas/components/IafasToolbar";
import IafasTable from "../iafas/components/IafasTable";
import IafasMobileList from "../iafas/components/IafasMobileList";
import IafaFormCard from "../iafas/components/IafaFormCard";

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

export default function IafasPage() {
  const title = "IAFAS";
  const vm = useIafas();

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
          <IafasToolbar
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
          <IafasTable
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          />

          <IafasMobileList
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
          <IafaFormCard
            mode={vm.mode}
            selected={vm.selected ? { codigo: vm.selected.codigo, estado: vm.selected.estado } : null}
            codigo={vm.codigo}
            saving={vm.saving}
            tipoIafaId={vm.tipoIafaId}
            onTipoIafaIdChange={vm.setTipoIafaId}
            tipos={vm.tipos}
            tiposLoading={vm.tiposLoading}
            razonSocial={vm.razonSocial}
            onRazonSocialChange={vm.setRazonSocial}
            descripcionCorta={vm.descripcionCorta}
            onDescripcionCortaChange={vm.setDescripcionCorta}
            ruc={vm.ruc}
            onRucChange={vm.setRuc}
            direccion={vm.direccion}
            onDireccionChange={vm.setDireccion}
            representanteLegal={vm.representanteLegal}
            onRepresentanteLegalChange={vm.setRepresentanteLegal}
            telefono={vm.telefono}
            onTelefonoChange={vm.setTelefono}
            paginaWeb={vm.paginaWeb}
            onPaginaWebChange={vm.setPaginaWeb}
            fechaInicio={vm.fechaInicio}
            onFechaInicioChange={vm.setFechaInicio}
            fechaFin={vm.fechaFin}
            onFechaFinChange={vm.setFechaFin}
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
        title="Desactivar IAFAS"
        description={vm.selected ? `¿Deseas desactivar "${vm.selected.codigo} - ${vm.selectedRazonSocial}"?` : "Selecciona un registro."}
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onCancel={() => vm.setConfirmDeactivateOpen(false)}
        onConfirm={vm.onDeactivateConfirmed}
      />
    </div>
  );
}
