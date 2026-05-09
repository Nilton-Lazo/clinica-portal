import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { DataTable } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { useTarifario } from "../hooks/useTarifario";
import type { TarifaTreeCategoria } from "../types/tarifario.types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";
import { formatPrecioUnidad } from "../../../../shared/constants/decimalPrecision";
import { toastService } from "../../../../shared/notifications";
import { PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import { useRealtimeModuleRefresh } from "../../../../shared/realtime/useRealtimeModuleRefresh";

const gestionOptions = [
  { value: "categorias", label: "Categorías" },
  { value: "subcategorias", label: "Subcategorías" },
  { value: "servicios", label: "Servicios" },
];

const statusOptions: SelectOption[] = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVO", label: "Activos" },
  { value: "INACTIVO", label: "Inactivos" },
  { value: "SUSPENDIDO", label: "Suspendidos" },
];

const perPageOptions: SelectOption[] = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

const TreeNode = React.memo(function TreeNode({
  cat,
  selectedServicios,
  expandedCategorias,
  expandedSubcategorias,
  onToggleExpandCategoria,
  onToggleExpandSubcategoria,
  onToggleCategoria,
  onToggleSubcategoria,
  onToggleServicio,
  isCatChecked,
  isSubChecked,
}: {
  cat: TarifaTreeCategoria;
  selectedServicios: Set<number>;
  expandedCategorias: Set<number>;
  expandedSubcategorias: Set<number>;
  onToggleExpandCategoria: (id: number) => void;
  onToggleExpandSubcategoria: (id: number) => void;
  onToggleCategoria: (id: number) => void;
  onToggleSubcategoria: (id: number) => void;
  onToggleServicio: (id: number) => void;
  isCatChecked: (id: number) => boolean;
  isSubChecked: (id: number) => boolean;
}) {
  const isCatOpen = expandedCategorias.has(cat.id);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-(--color-surface-hover)"
          onClick={() => onToggleExpandCategoria(cat.id)}
          aria-label="Expandir categoría"
        >
          {isCatOpen ? (
            <ChevronDown className="h-4 w-4 text-(--color-text-secondary)" />
          ) : (
            <ChevronRight className="h-4 w-4 text-(--color-text-secondary)" />
          )}
        </button>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isCatChecked(cat.id)}
            onChange={() => onToggleCategoria(cat.id)}
            className="h-4 w-4 rounded border border-(--border-color-default)"
          />
          <span className="font-semibold">
            {cat.codigo} - {cat.nombre}
          </span>
        </label>
      </div>

      {isCatOpen && (
        <div className="pl-8 space-y-2">
          {cat.subcategorias.map((sub) => {
            const isSubOpen = expandedSubcategorias.has(sub.id);
            return (
              <div key={sub.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-(--color-surface-hover)"
                    onClick={() => onToggleExpandSubcategoria(sub.id)}
                    aria-label="Expandir subcategoría"
                  >
                    {isSubOpen ? (
                      <ChevronDown className="h-4 w-4 text-(--color-text-secondary)" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-(--color-text-secondary)" />
                    )}
                  </button>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSubChecked(sub.id)}
                      onChange={() => onToggleSubcategoria(sub.id)}
                      className="h-4 w-4 rounded border border-(--border-color-default)"
                    />
                    <span>
                      {cat.codigo}.{sub.codigo} - {sub.nombre}
                    </span>
                  </label>
                </div>

                {isSubOpen && (
                  <div className="pl-8 space-y-1">
                    {sub.servicios.map((sv) => (
                      <label key={sv.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServicios.has(sv.id)}
                          onChange={() => onToggleServicio(sv.id)}
                          className="h-4 w-4 rounded border border-(--border-color-default)"
                        />
                        <span className="truncate">
                          {sv.codigo} - {sv.descripcion}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const inputBase =
  "h-10 rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

export default function TarifarioPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vm = useTarifario();
  const [gestion, setGestion] = React.useState("categorias");
  const setTarifaId = vm.setTarifaId;

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

  const tarifaIdFromUrl = searchParams.get("tarifaId");
  React.useLayoutEffect(() => {
    if (!tarifaIdFromUrl) return;
    const n = Number(tarifaIdFromUrl);
    if (Number.isFinite(n) && n > 0) setTarifaId(n);
  }, [tarifaIdFromUrl, setTarifaId]);

  const lastNoticeRef = React.useRef<typeof vm.notice>(null);
  React.useEffect(() => {
    const n = vm.notice;
    if (!n || n === lastNoticeRef.current) return;
    lastNoticeRef.current = n;
    if (n.type === "success") toastService.showSuccess(n.text);
    else toastService.showError(n.text);
    vm.setNotice(null);
  }, [vm.notice, vm]);

  const tarifaOptions = React.useMemo(() => {
    return vm.tarifas.map((t) => ({
      value: String(t.id),
      label: `${t.codigo} - ${t.descripcion_tarifa}${t.tarifa_base ? " (Base)" : ""}`,
    }));
  }, [vm.tarifas]);

  const cloneTarifaOptions = React.useMemo(() => {
    return vm.tarifas
      .filter((t) => !t.tarifa_base)
      .map((t) => ({
        value: String(t.id),
        label: `${t.codigo} - ${t.descripcion_tarifa}`,
      }));
  }, [vm.tarifas]);

  const selectedTarifaStr = vm.tarifaId ? String(vm.tarifaId) : "";
  const selectedCloneTarifaStr = vm.cloneTarifaId ? String(vm.cloneTarifaId) : "";
  const selectedTarifa = vm.tarifas.find((t) => t.id === vm.tarifaId) ?? null;

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:grid-rows-1 lg:gap-2">
        <section className="flex flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:min-h-0 lg:overflow-hidden lg:p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-2">
            <div className="min-w-0 shrink-0 lg:w-max lg:min-w-40 lg:max-w-[20rem]">
              <label className="block text-xs text-(--color-text-secondary) mb-0.5">Tarifa</label>
              <SelectMenu
                value={selectedTarifaStr}
                onChange={(v) => vm.setTarifaId(v ? Number(v) : null)}
                options={tarifaOptions}
                ariaLabel="Tarifa"
                disabled={vm.tarifasLoading}
                buttonClassName={`w-full lg:w-max lg:min-w-[10rem] lg:max-w-full ${inputBase}`}
                menuClassName="min-w-full"
              />
            </div>
            <div className="min-w-0 flex-1 sm:min-w-48">
              <label className="block text-xs text-(--color-text-secondary) mb-0.5">Buscar</label>
              <input
                value={vm.q}
                onChange={(e) => vm.setQ(e.target.value)}
                placeholder="Buscar por código, descripción o nomenclador"
                className={`w-full ${inputBase}`}
                aria-label="Buscar por código, descripción o nomenclador"
              />
            </div>
            <div className="w-28 shrink-0">
              <label className="block text-xs text-(--color-text-secondary) mb-0.5">Estado</label>
              <SelectMenu
                value={vm.statusFilter}
                onChange={(v) => vm.setStatusFilter(v as typeof vm.statusFilter)}
                options={statusOptions}
                ariaLabel="Filtrar por estado"
                buttonClassName={`w-full ${inputBase}`}
                menuClassName="min-w-full"
              />
            </div>
            <div className="w-24 shrink-0">
              <label className="block text-xs text-(--color-text-secondary) mb-0.5">Registros</label>
              <SelectMenu
                value={String(vm.perPage)}
                onChange={(v) => vm.setPerPage(Number(v))}
                options={perPageOptions}
                ariaLabel="Registros por página"
                buttonClassName={`w-full ${inputBase}`}
                menuClassName="min-w-full"
              />
            </div>
          </div>

          <div className="mt-4 lg:mt-2 grid grid-cols-1 gap-3 lg:gap-2 lg:grid-cols-2">
            <div>
              <label className="block text-xs text-(--color-text-secondary) mb-0.5">Categoría</label>
              <input
                value={
                  vm.selected
                    ? `${vm.selected.categoria_codigo} - ${vm.selected.categoria_nombre}`
                    : ""
                }
                readOnly
                className={`w-full ${inputBase}`}
              />
            </div>
            <div>
              <label className="block text-xs text-(--color-text-secondary) mb-0.5">Subcategoría</label>
              <input
                value={
                  vm.selected
                    ? `${vm.selected.subcategoria_codigo} - ${vm.selected.subcategoria_nombre}`
                    : ""
                }
                readOnly
                className={`w-full ${inputBase}`}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col lg:mt-2 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
            <div className="hidden min-h-0 flex-1 flex-col lg:flex">
              <DataTable
                rows={vm.data.data}
                loading={vm.loading}
                selectedId={vm.selected?.id ?? null}
                getRowId={(row) => row.id}
                onSelect={(row) => vm.setSelected(row)}
                columns={[
                  { key: "codigo", header: "Código", render: (r) => r.codigo },
                  { key: "descripcion", header: "Descripción del servicio", render: (r) => r.descripcion },
                  {
                    key: "precio",
                    header: (
                      <div className="text-right">
                        Precio <span className="text-xs text-(--color-text-inverse)">Sin I.G.V.</span>
                      </div>
                    ),
                    headerClassName: "text-right",
                    cellClassName: "px-3 py-2 text-right",
                    render: (r) => formatPrecioUnidad(r.precio_sin_igv),
                  },
                  {
                    key: "unidad",
                    header: "Unidad",
                    headerClassName: "text-right",
                    cellClassName: "px-3 py-2 text-right",
                    render: (r) => formatPrecioUnidad(r.unidad),
                  },
                  {
                    key: "estado",
                    header: "Estado",
                    headerClassName: "text-center w-36",
                    cellClassName: "px-3 py-2 text-center",
                    render: (r) => (
                      <div className="flex justify-center">
                        <StatusBadge status={r.estado} />
                      </div>
                    ),
                  },
                ]}
                emptyText={vm.tarifaId ? "No hay servicios." : "Selecciona una tarifa."}
              />

              <PaginationFooter
                meta={vm.data.meta}
                variant="desktop"
                onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
                onFirst={() => vm.setPage(1)}
                onLast={() => vm.setPage(vm.data.meta.last_page)}
              />
            </div>

            <div className="lg:hidden">
              <MobileEntityList
                rows={vm.data.data}
                loading={vm.loading}
                selectedId={vm.selected?.id ?? null}
                getRowId={(row) => row.id}
                onSelect={(row) => vm.setSelected(row)}
                renderMain={(r) => (
                  <div className="text-sm font-semibold text-(--color-text-primary)">
                    <span className="tabular-nums">{r.codigo}</span> · {r.descripcion}
                  </div>
                )}
                renderRight={(r) => <StatusBadge status={r.estado} />}
              />
              <PaginationFooter
                meta={vm.data.meta}
                variant="mobile"
                onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
                onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
                onFirst={() => vm.setPage(1)}
                onLast={() => vm.setPage(vm.data.meta.last_page)}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 lg:min-h-0 lg:gap-2 lg:overflow-hidden">
          <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
            <h2 className="text-sm font-semibold text-(--color-text-primary)">Gestionar</h2>
            <div className="mt-3 flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-2">
              <SelectMenu
                value={gestion}
                onChange={setGestion}
                options={gestionOptions}
                ariaLabel="Seleccionar opción de gestión"
                buttonClassName={`w-full ${inputBase}`}
                menuClassName="min-w-full"
              />
              <PrimaryButton
                className="w-full"
                onClick={() => {
                  if (!vm.tarifaId) {
                    toastService.showError("Selecciona una tarifa primero.");
                    return;
                  }
                  const params = new URLSearchParams({
                    tarifaId: String(vm.tarifaId),
                    tarifaLabel: selectedTarifa?.descripcion_tarifa ?? "",
                  });
                  navigate(`/facturacion/tarifario/gestion/${gestion}?${params.toString()}`);
                }}
              >
                Ir a gestionar
              </PrimaryButton>
            </div>
          </div>

          <div className="flex flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:min-h-0 lg:flex-1 lg:p-3">
            <h2 className="text-sm font-semibold text-(--color-text-primary)">Clonación de tarifario</h2>
            <p className="mt-1 text-xs text-(--color-text-secondary)">
              Elija tarifa destino. «Clonar todo» o marque en el árbol y «Clonar selección».
            </p>

            <div className="mt-3 flex flex-col gap-3">
              <SelectMenu
                value={selectedCloneTarifaStr}
                onChange={(v) => vm.setCloneTarifaId(v ? Number(v) : null)}
                options={cloneTarifaOptions}
                ariaLabel="Tarifa destino"
                buttonClassName={`w-full ${inputBase}`}
                menuClassName="min-w-full"
              />
              <div className="grid grid-cols-3 gap-2">
                <PrimaryButton className="w-full min-w-0" onClick={vm.onCloneAll}>
                  Clonar todo
                </PrimaryButton>
                <SecondaryButton
                  className="w-full min-w-0"
                  onClick={vm.onCloneSelected}
                  disabled={!vm.canCloneSelected}
                  title={!vm.canCloneSelected ? "Marque categorías, subcategorías o servicios en el árbol" : undefined}
                >
                  Clonar selección
                </SecondaryButton>
                <SecondaryButton className="w-full min-w-0" onClick={vm.clearSelection}>
                  Limpiar selección
                </SecondaryButton>
              </div>
            </div>

            <div className="mt-4 overflow-auto app-scrollbar app-scrollbar-no-gutter lg:min-h-0 lg:flex-1">
              {vm.baseTreeLoading ? (
                <div className="text-sm text-(--color-text-secondary)">Cargando árbol base…</div>
              ) : vm.baseTree ? (
                <div className="space-y-2">
                  {vm.baseTree.tree.map((cat) => (
                    <TreeNode
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
        </section>
      </div>
      
    </div>
  );
}
