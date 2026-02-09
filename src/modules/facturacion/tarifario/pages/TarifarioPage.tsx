import * as React from "react";
import { useNavigate } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { DataTable } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { useTarifario } from "../hooks/useTarifario";
import type { TarifaTreeCategoria } from "../types/tarifario.types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StatusBadge } from "../../../admision/ficheros/components/StatusBadge";
import { formatPrecioUnidad } from "../../../../shared/constants/decimalPrecision";

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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isCatChecked(cat.id)}
            onChange={() => onToggleCategoria(cat.id)}
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
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isSubChecked(sub.id)}
                      onChange={() => onToggleSubcategoria(sub.id)}
                    />
                    <span>
                      {cat.codigo}.{sub.codigo} - {sub.nombre}
                    </span>
                  </label>
                </div>

                {isSubOpen && (
                  <div className="pl-8 space-y-1">
                    {sub.servicios.map((sv) => (
                      <label key={sv.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedServicios.has(sv.id)}
                          onChange={() => onToggleServicio(sv.id)}
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

export default function TarifarioPage() {
  const navigate = useNavigate();
  const vm = useTarifario();
  const leftRef = React.useRef<HTMLDivElement | null>(null);
  const [leftHeight, setLeftHeight] = React.useState<number | null>(null);
  const rightHeight = leftHeight ? Math.max(leftHeight, 800) : 800;

  const [gestion, setGestion] = React.useState("categorias");

  const tarifaOptions = React.useMemo(() => {
    return vm.tarifas.map((t) => ({
      value: String(t.id),
      label: `${t.codigo} - ${t.descripcion_tarifa}`,
    }));
  }, [vm.tarifas]);

  const selectedTarifaStr = vm.tarifaId ? String(vm.tarifaId) : "";
  const selectedCloneTarifaStr = vm.cloneTarifaId ? String(vm.cloneTarifaId) : "";
  const selectedTarifa = vm.tarifas.find((t) => t.id === vm.tarifaId) ?? null;

  React.useLayoutEffect(() => {
    const el = leftRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let rafId = 0;
    let lastHeight = 0;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const rect = (entry.target as HTMLElement).getBoundingClientRect();
      const nextHeight = Math.round(rect.height);
      if (nextHeight === lastHeight) return;
      lastHeight = nextHeight;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setLeftHeight(nextHeight);
      });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {vm.notice ? (
        <div
          role="status"
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            "flex items-start justify-between gap-4",
            vm.notice.type === "success"
              ? "border-(--color-success) text-(--color-success)"
              : "border-(--color-danger) text-(--color-danger)",
          ].join(" ")}
        >
          <span>{vm.notice.text}</span>
          <button
            type="button"
            onClick={() => vm.setNotice(null)}
            className="rounded-md px-2 text-base leading-none text-(--color-text-secondary) hover:text-(--color-text-primary)"
            aria-label="Cerrar notificación"
            title="Cerrar"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] items-start">
        {/* ===================== CONTENEDOR 1 ===================== */}
        <section
          ref={leftRef}
          className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-(--color-text-primary) mb-1">
                Seleccione una tarifa:
              </label>
              <SelectMenu
                value={selectedTarifaStr}
                onChange={(v) => vm.setTarifaId(v ? Number(v) : null)}
                options={tarifaOptions}
                ariaLabel="Tarifa"
                disabled={vm.tarifasLoading}
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="w-full sm:w-40">
                <label className="text-sm text-(--color-text-primary)">Nomenclador:</label>
                <input
                  value={vm.nomenclador}
                  onChange={(e) => vm.setNomenclador(e.target.value)}
                  placeholder="Ej. 102205"
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="text-sm text-(--color-text-primary)">Buscar:</label>
                <input
                  value={vm.codigo}
                  onChange={(e) => vm.setCodigo(e.target.value)}
                  placeholder="Ej. 01.02.03"
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="text-sm text-(--color-text-primary)">Estado:</label>
                <div className="mt-1">
                  <SelectMenu
                    value={vm.statusFilter}
                    onChange={(v) => vm.setStatusFilter(v as typeof vm.statusFilter)}
                    options={statusOptions}
                    ariaLabel="Filtrar por estado"
                    buttonClassName="w-full"
                    menuClassName="min-w-full"
                  />
                </div>
              </div>
              <div className="w-full sm:w-28">
                <label className="text-sm text-(--color-text-primary)">Registros:</label>
                <div className="mt-1">
                  <SelectMenu
                    value={String(vm.perPage)}
                    onChange={(v) => vm.setPerPage(Number(v))}
                    options={perPageOptions}
                    ariaLabel="Registros por página"
                    buttonClassName="w-full"
                    menuClassName="min-w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <label className="text-sm text-(--color-text-primary)">Categoría:</label>
              <input
                value={
                  vm.selected
                    ? `${vm.selected.categoria_codigo} - ${vm.selected.categoria_nombre}`
                    : ""
                }
                readOnly
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            </div>
            <div>
              <label className="text-sm text-(--color-text-primary)">Subcategoría:</label>
              <input
                value={
                  vm.selected
                    ? `${vm.selected.subcategoria_codigo} - ${vm.selected.subcategoria_nombre}`
                    : ""
                }
                readOnly
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="hidden h-full min-h-0 flex-col lg:flex">
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
              />
            </div>
          </div>
        </section>

        {/* ===================== CONTENEDOR 2 y 3 ===================== */}
        <section
          className="flex flex-col gap-4 box-border self-stretch"
          style={{ height: rightHeight, minHeight: rightHeight }}
        >
          {/* Contenedor 2 */}
          <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex flex-col gap-4">
              <div className="text-sm font-semibold text-(--color-text-primary)">
                Seleccione una opción:
              </div>
              <div className="flex flex-col gap-3">
                <SelectMenu
                  value={gestion}
                  onChange={setGestion}
                  options={gestionOptions}
                  ariaLabel="Seleccionar opción de gestión"
                  buttonClassName="w-full"
                  menuClassName="min-w-full"
                />
                <button
                  type="button"
                  className="h-10 rounded-xl px-4 text-sm font-medium bg-(--color-primary) text-(--color-text-inverse) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
                  onClick={() => {
                    if (!vm.tarifaId) {
                      vm.setNotice({ type: "error", text: "Selecciona una tarifa primero." });
                      return;
                    }
                    const params = new URLSearchParams({
                      tarifaId: String(vm.tarifaId),
                      tarifaLabel: selectedTarifa?.descripcion_tarifa ?? "",
                    });
                    navigate(`/facturacion/tarifario/gestion/${gestion}?${params.toString()}`);
                  }}
                >
                  Gestionar
                </button>
              </div>
            </div>
          </div>

          {/* Contenedor 3 */}
          <div className="flex-1 min-h-0 rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 flex flex-col">
            <div className="text-sm font-semibold text-(--color-text-primary)">
              ¿Hacia qué tarifa desea clonar?
            </div>

            <div className="mt-3 flex flex-col gap-3">
              <SelectMenu
                value={selectedCloneTarifaStr}
                onChange={(v) => vm.setCloneTarifaId(v ? Number(v) : null)}
                options={tarifaOptions}
                ariaLabel="Tarifa destino"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl text-sm font-medium bg-(--color-primary) text-(--color-text-inverse) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
                  onClick={vm.onCloneAll}
                >
                  Clonar todo
                </button>
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl text-sm font-medium bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  onClick={vm.onCloneSelected}
                  disabled={!vm.canCloneSelected}
                >
                  Clonar selección
                </button>
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl text-sm font-medium bg-(--color-surface) text-(--color-text-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
                  onClick={vm.clearSelection}
                >
                  Limpiar selección
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm font-semibold text-(--color-text-primary)">
              Clonación de tarifario
            </div>

            <div className="mt-3 flex-1 min-h-0 overflow-auto app-scrollbar app-scrollbar-no-gutter">
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
