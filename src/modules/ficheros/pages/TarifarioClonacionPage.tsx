import * as React from "react";
import { SelectMenu } from "../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/buttons";
import { useTarifario } from "../../facturacion/tarifario/hooks/useTarifario";
import { TarifarioBaseTreeNode } from "../../facturacion/tarifario/components/TarifarioBaseTree";
import { toastService } from "../../../shared/notifications";
import { useRealtimeModuleRefresh } from "../../../shared/realtime/useRealtimeModuleRefresh";

const inputBase =
  "h-10 rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

export default function TarifarioClonacionPage() {
  const vm = useTarifario();

  useRealtimeModuleRefresh({
    module: "facturacion",
    entities: ["tarifa_categoria", "tarifa_subcategoria", "tarifa_servicio", "tarifario_clonacion"],
    onEvent: (event) => {
      if (event.scope && vm.tarifaId && event.scope !== String(vm.tarifaId)) {
        void vm.refreshBaseTree();
        return;
      }
      void vm.refresh({ page: 1, silent: true });
      void vm.refreshBaseTree();
    },
  });

  const lastNoticeRef = React.useRef<typeof vm.notice>(null);
  React.useEffect(() => {
    const n = vm.notice;
    if (!n || n === lastNoticeRef.current) return;
    lastNoticeRef.current = n;
    if (n.type === "success") toastService.showSuccess(n.text);
    else toastService.showError(n.text);
    vm.setNotice(null);
  }, [vm.notice, vm]);

  const cloneTarifaOptions = React.useMemo(() => {
    return vm.tarifas
      .filter((t) => !t.tarifa_base)
      .map((t) => ({
        value: String(t.id),
        label: `${t.codigo} - ${t.descripcion_tarifa}`,
      }));
  }, [vm.tarifas]);

  const selectedCloneTarifaStr = vm.cloneTarifaId ? String(vm.cloneTarifaId) : "";

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div className="text-base font-semibold text-(--color-text-primary)">Clonación de tarifa</div>
      <p className="text-sm text-(--color-text-secondary)">
        Copia categorías, subcategorías y servicios desde el tarifario base hacia la tarifa destino que elijas.
      </p>

      <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:min-h-0 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden">
        <div className="flex flex-col gap-3 lg:max-w-xl">
          <div>
            <label className="block text-xs text-(--color-text-secondary) mb-0.5">Tarifa destino</label>
            <SelectMenu
              value={selectedCloneTarifaStr}
              onChange={(v) => vm.setCloneTarifaId(v ? Number(v) : null)}
              options={cloneTarifaOptions}
              ariaLabel="Tarifa destino"
              disabled={vm.tarifasLoading}
              buttonClassName={`w-full ${inputBase}`}
              menuClassName="min-w-full"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <PrimaryButton className="w-full min-w-0" onClick={vm.onCloneAll}>
              Clonar todo
            </PrimaryButton>
            <SecondaryButton
              className="w-full min-w-0"
              onClick={vm.onCloneSelected}
              disabled={!vm.canCloneSelected}
              title={
                !vm.canCloneSelected ? "Marca categorías, subcategorías o servicios en el árbol" : undefined
              }
            >
              Clonar selección
            </SecondaryButton>
            <SecondaryButton className="w-full min-w-0" onClick={vm.clearSelection}>
              Limpiar selección
            </SecondaryButton>
          </div>
        </div>

        <div className="mt-4 flex-1 min-h-[280px] overflow-auto app-scrollbar app-scrollbar-no-gutter lg:min-h-0">
          {vm.baseTreeLoading ? (
            <div className="text-sm text-(--color-text-secondary)">Cargando árbol base…</div>
          ) : vm.baseTree ? (
            <div className="space-y-2">
              {vm.baseTree.tree.map((cat) => (
                <TarifarioBaseTreeNode
                  key={cat.id}
                  cat={cat}
                  selectedServicios={vm.selectedServicios}
                  expandedCategorias={vm.expandedCategorias}
                  expandedSubcategorias={vm.expandedSubcategorias}
                  onToggleExpandCategoria={vm.toggleExpandCategoria}
                  onToggleExpandSubcategoria={vm.toggleExpandSubcategoria}
                  onToggleCategoria={vm.toggleCategoria}
                  onToggleSubcategoria={vm.toggleSubcategoria}
                  onToggleServicio={vm.toggleServicio}
                  isCatChecked={vm.isCatChecked}
                  isSubChecked={vm.isSubChecked}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-(--color-text-secondary)">No hay árbol base disponible.</div>
          )}
        </div>
      </div>
    </div>
  );
}
