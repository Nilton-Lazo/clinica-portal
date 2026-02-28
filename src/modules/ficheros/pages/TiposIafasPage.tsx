import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CrudSplitLayout } from "../components/CrudSplitLayout";
import { useTiposIafas } from "../tipos-iafas/hooks/useTiposIafas";
import { useNoticeToToast } from "../utils/crudShared";
import TiposIafasToolbar from "../tipos-iafas/components/TiposIafasToolbar";
import TiposIafasTable from "../tipos-iafas/components/TiposIafasTable";
import TiposIafasMobileList from "../tipos-iafas/components/TiposIafasMobileList";
import TipoIafaFormCard from "../tipos-iafas/components/TipoIafaFormCard";

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

export default function TiposIafasPage() {
  const title = "Tipos de IAFAS";
  const vm = useTiposIafas();
  useNoticeToToast(vm.notice);

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
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-(--color-text-primary)">{title}</div>
          <div className="text-sm text-(--color-text-secondary)">
            CRUD con paginación y estados
          </div>
        </div>
      </div>
      <div className="w-full shrink-0">
        <TiposIafasToolbar
          q={vm.q}
          onQChange={vm.setQ}
          statusFilter={vm.statusFilter}
          onStatusChange={vm.setStatusFilter}
          perPage={vm.perPage}
          onPerPageChange={(n) => vm.setPerPage(n)}
          onNew={handleNew}
        />
      </div>

      <CrudSplitLayout formWidth="480px" rightRef={formRef} left={<> <TiposIafasTable
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

          <TiposIafasMobileList
            data={vm.data}
            loading={vm.loading}
            selectedId={vm.selected?.id ?? null}
            onSelect={vm.loadForEdit}
            page={vm.page}
            onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
            onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
            onFirst={() => vm.setPage(1)}
            onLast={() => vm.setPage(vm.data.meta.last_page)}
          /> </>} right={<TipoIafaFormCard
            mode={vm.mode}
            selected={vm.selected}
            codigo={vm.codigo}
            saving={vm.saving}
            descripcion={vm.descripcion}
            onDescripcionChange={vm.setDescripcion}
            estado={vm.estado}
            onEstadoChange={vm.setEstado}
            isValid={vm.isValid}
            isDirty={vm.isDirty}
            canDeactivate={vm.canDeactivate}
            onSave={vm.onSave}
            onCancel={vm.cancel}
            onDeactivate={vm.requestDeactivate}
          />} />

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar tipo de IAFAS"
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
