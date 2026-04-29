import * as React from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CrudSplitLayout } from "../components/CrudSplitLayout";
import { useRecargoNoche } from "../recargo-noche/hooks/useRecargoNoche";
import RecargoNocheToolbar from "../recargo-noche/components/RecargoNocheToolbar";
import RecargoNocheTable from "../recargo-noche/components/RecargoNocheTable";
import RecargoNocheMobileList from "../recargo-noche/components/RecargoNocheMobileList";
import RecargoNocheFormCard from "../recargo-noche/components/RecargoNocheFormCard";

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

const PER_PAGE = 25;

export default function RecargoNochePage() {
  const title = "Recargo nocturno";
  const vm = useRecargoNoche();
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [vm.tarifaId, vm.statusFilter]);

  const total = vm.reglas.length;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const slicedReglas = vm.reglas.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const paginationMeta = {
    current_page: page,
    per_page: PER_PAGE,
    total,
    last_page: lastPage,
  };

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
            Configure por tarifario qué categorías llevan recargo y desde qué hora.
          </div>
        </div>
      </div>
      <div className="w-full shrink-0">
        <RecargoNocheToolbar
          tarifas={vm.tarifas}
          tarifasLoading={vm.tarifasLoading}
          tarifaId={vm.tarifaId}
          onTarifaChange={vm.setTarifaId}
          statusFilter={vm.statusFilter}
          onStatusChange={vm.setStatusFilter}
          onNew={handleNew}
        />
      </div>

      {vm.tarifaId ? (
        <CrudSplitLayout formWidth="480px" rightRef={formRef} left={<>
            <RecargoNocheTable
              reglas={slicedReglas}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
              paginationMeta={paginationMeta}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(lastPage, p + 1))}
              onFirst={() => setPage(1)}
              onLast={() => setPage(lastPage)}
            />

            <RecargoNocheMobileList
              reglas={slicedReglas}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
              paginationMeta={paginationMeta}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(lastPage, p + 1))}
              onFirst={() => setPage(1)}
              onLast={() => setPage(lastPage)}
            />
          </>} right={<RecargoNocheFormCard
              mode={vm.mode}
              selected={vm.selected}
              categoriasDisponibles={vm.categoriasDisponiblesParaNuevo}
              formCategoriaId={vm.formCategoriaId}
              onFormCategoriaIdChange={vm.setFormCategoriaId}
              formPorcentaje={vm.formPorcentaje}
              onFormPorcentajeChange={vm.setFormPorcentaje}
              formHoraDesde={vm.formHoraDesde}
              onFormHoraDesdeChange={vm.setFormHoraDesde}
              formHoraHasta={vm.formHoraHasta}
              onFormHoraHastaChange={vm.setFormHoraHasta}
              formEstado={vm.formEstado}
              onFormEstadoChange={vm.setFormEstado}
              saving={vm.saving}
              isValid={vm.isValid}
              isDirty={vm.isDirty}
              canDeactivate={vm.canDeactivate}
              onSave={vm.onSave}
              onCancel={vm.cancel}
              onDeactivate={vm.requestDeactivate}
            />} />
      ) : (
        <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-6 text-center text-sm text-(--color-text-secondary)">
          Seleccione un tarifario para gestionar las reglas de recargo nocturno.
        </div>
      )}

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar regla"
        description={
          vm.selected
            ? `¿Deseas desactivar la regla de recargo para "${vm.selected.categoria_nombre ?? vm.selected.categoria_codigo ?? "categoría"}"?`
            : "Selecciona una regla de recargo nocturno."
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
