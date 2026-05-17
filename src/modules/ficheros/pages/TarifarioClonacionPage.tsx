import * as React from "react";
import { SelectMenu } from "../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/buttons";
import { useTarifario } from "../../facturacion/tarifario/hooks/useTarifario";
import { TarifarioBaseTreeNode } from "../../facturacion/tarifario/components/TarifarioBaseTree";
import { toastService } from "../../../shared/notifications";
import { useRealtimeModuleRefresh } from "../../../shared/realtime/useRealtimeModuleRefresh";
import { CrudSplitLayout } from "../components/CrudSplitLayout";

const inputBase =
  "h-10 rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";
const tarifaEmptyHighlightTriggerCls =
  "h-10 rounded-lg border-2 border-(--color-primary)/70 bg-(--color-surface) px-3 text-sm font-semibold text-(--color-primary) outline-none shadow-md hover:scale-100 active:scale-100 focus:border-(--color-primary) focus:ring-0 tarifario-tarifa-trigger-attn";

export default function TarifarioClonacionPage() {
  const vm = useTarifario();

  useRealtimeModuleRefresh({
    module: "facturacion",
    entities: [
      "tarifa_categoria",
      "tarifa_subcategoria",
      "tarifa_servicio",
      "tarifario_clonacion",
    ],
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

  const cloneTarifaReady = Boolean(vm.cloneTarifaId);

  const cloneTarifaOptions = React.useMemo(() => {
    return [
      { value: "", label: "Seleccione una tarifa" },
      ...vm.tarifas
        .filter((t) => !t.tarifa_base)
        .map((t) => ({
          value: String(t.id),
          label: `${t.codigo} - ${t.descripcion_tarifa}`,
        })),
    ];
  }, [vm.tarifas]);

  const selectedCloneTarifaStr = vm.cloneTarifaId
    ? String(vm.cloneTarifaId)
    : "";

  const selectionCounts = React.useMemo(
    () => ({
      categorias: vm.selectedCategorias.size,
      subcategorias: vm.selectedSubcategorias.size,
      servicios: vm.selectedServicios.size,
    }),
    [vm.selectedCategorias, vm.selectedSubcategorias, vm.selectedServicios],
  );

  const hasSelection =
    selectionCounts.categorias > 0 ||
    selectionCounts.subcategorias > 0 ||
    selectionCounts.servicios > 0;

  const treePanel = (
    <div className="flex min-h-[min(420px,55vh)] min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-(--border-color-default) bg-(--color-surface) lg:min-h-0">
      <div className="shrink-0 border-b border-(--border-color-default) px-3 py-2.5">
        <div className="text-sm font-semibold text-(--color-text-primary)">
          Tarifario base
        </div>
        <p className="mt-0.5 text-xs text-(--color-text-secondary)">
          Expande y marca categorías, subcategorías o servicios a copiar.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 app-scrollbar app-scrollbar-no-gutter">
        {vm.baseTreeLoading ? (
          <div className="text-sm text-(--color-text-secondary)">
            Cargando árbol base…
          </div>
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
          <div className="text-sm text-(--color-text-secondary)">
            No hay árbol base disponible.
          </div>
        )}
      </div>
    </div>
  );

  const actionsPanel = (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="text-sm font-semibold text-(--color-text-primary)">
        Destino de la clonación
      </div>

      <div className="mt-3">
        <SelectMenu
          value={selectedCloneTarifaStr}
          onChange={(v) => vm.setCloneTarifaId(v ? Number(v) : null)}
          options={cloneTarifaOptions}
          ariaLabel="Seleccione una tarifa para clonar hacia la tarifa destino."
          disabled={vm.tarifasLoading}
          buttonClassName={`w-full ${cloneTarifaReady ? inputBase : tarifaEmptyHighlightTriggerCls}`}
          menuClassName="min-w-full"
        />
      </div>

      <div className="mt-4 rounded-md border border-(--border-color-default) bg-(--color-panel-bg) px-3 py-3">
        <div className="text-sm font-semibold text-(--color-text-primary)">
          Selección en el árbol
        </div>
        {hasSelection ? (
          <ul className="mt-2 space-y-1.5 text-sm text-(--color-text-secondary)">
            {selectionCounts.categorias > 0 ? (
              <li>
                <span className="font-medium text-(--color-text-primary)">
                  {selectionCounts.categorias}
                </span>{" "}
                {selectionCounts.categorias === 1 ? "categoría" : "categorías"}
              </li>
            ) : null}
            {selectionCounts.subcategorias > 0 ? (
              <li>
                <span className="font-medium text-(--color-text-primary)">
                  {selectionCounts.subcategorias}
                </span>{" "}
                {selectionCounts.subcategorias === 1
                  ? "subcategoría"
                  : "subcategorías"}
              </li>
            ) : null}
            {selectionCounts.servicios > 0 ? (
              <li>
                <span className="font-medium text-(--color-text-primary)">
                  {selectionCounts.servicios}
                </span>{" "}
                {selectionCounts.servicios === 1 ? "servicio" : "servicios"}
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Aún no hay ítems marcados. Usa los checkboxes del tarifario base.
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <PrimaryButton
          className="w-full min-w-0"
          onClick={vm.onCloneAll}
          disabled={!cloneTarifaReady}
        >
          Clonar todo
        </PrimaryButton>
        <SecondaryButton
          className="w-full min-w-0"
          onClick={vm.onCloneSelected}
          disabled={!cloneTarifaReady || !vm.canCloneSelected}
          title={
            !cloneTarifaReady
              ? "Selecciona una tarifa destino"
              : !vm.canCloneSelected
                ? "Marca categorías, subcategorías o servicios en el árbol"
                : undefined
          }
        >
          Clonar selección
        </SecondaryButton>
        <SecondaryButton
          className="w-full min-w-0"
          onClick={vm.clearSelection}
          disabled={!hasSelection}
        >
          Limpiar selección
        </SecondaryButton>
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      <div className="shrink-0 text-base font-semibold text-(--color-text-primary)">
        Clonación de tarifa
      </div>

      <CrudSplitLayout
        formWidth="var(--form-panel-width-md)"
        rightColumnMode="fill"
        left={treePanel}
        right={actionsPanel}
      />
    </div>
  );
}
