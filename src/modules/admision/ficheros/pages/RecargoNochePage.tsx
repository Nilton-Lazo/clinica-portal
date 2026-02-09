import * as React from "react";
import { X } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useRecargoNoche } from "../recargo-noche/hooks/useRecargoNoche";
import RecargoNocheToolbar from "../recargo-noche/components/RecargoNocheToolbar";
import RecargoNocheTable from "../recargo-noche/components/RecargoNocheTable";
import RecargoNocheMobileList from "../recargo-noche/components/RecargoNocheMobileList";
import RecargoNocheFormCard from "../recargo-noche/components/RecargoNocheFormCard";

const NOTICE_AUTO_HIDE_MS = 10_000;

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

export default function RecargoNochePage() {
  const title = "Recargo nocturno";
  const vm = useRecargoNoche();
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  const noticeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!vm.notice) return;
    noticeTimeoutRef.current = setTimeout(() => {
      vm.setNotice(null);
      noticeTimeoutRef.current = null;
    }, NOTICE_AUTO_HIDE_MS);
    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
        noticeTimeoutRef.current = null;
      }
    };
  }, [vm.notice, vm.setNotice]);

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
            Configure por tarifario qué categorías llevan recargo y desde qué hora.
          </div>
        </div>

        <div className="w-full lg:max-w-[420px]">
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
      </div>

      {vm.notice ? (
        <div
          role="status"
          className={[
            "rounded-2xl border px-4 py-3 text-sm flex items-center justify-between gap-3",
            vm.notice.type === "success"
              ? "border-(--color-success) text-(--color-success)"
              : "border-(--color-danger) text-(--color-danger)",
          ].join(" ")}
        >
          <span className="min-w-0">{vm.notice.text}</span>
          <button
            type="button"
            onClick={() => vm.setNotice(null)}
            className="shrink-0 p-1 rounded-lg hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {vm.tarifaId ? (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div className="min-w-0">
            <RecargoNocheTable
              reglas={vm.reglas}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
            />

            <RecargoNocheMobileList
              reglas={vm.reglas}
              loading={vm.loading}
              selectedId={vm.selected?.id ?? null}
              onSelect={vm.loadForEdit}
            />
          </div>

          <div ref={formRef} className="min-w-0">
            <RecargoNocheFormCard
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
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-6 text-center text-sm text-(--color-text-secondary)">
          Seleccione un tarifario para gestionar las reglas de recargo nocturno.
        </div>
      )}

      <ConfirmDialog
        open={vm.confirmDeactivateOpen}
        title="Desactivar regla"
        description={
          vm.selected
            ? `¿Deseas desactivar la regla de recargo para "${vm.selected.categoria_nombre ?? vm.selected.categoria_codigo ?? "categoría"}"?`
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
