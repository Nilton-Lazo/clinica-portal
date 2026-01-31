import * as React from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../../shared/ui/Input";
import { SelectMenu } from "../../../../shared/ui/SelectMenu";
import { DataTable } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { useTarifario } from "../hooks/useTarifario";
import type { TarifaTreeCategoria } from "../types/tarifario.types";

const gestionOptions = [
  { value: "categorias", label: "Categorías" },
  { value: "subcategorias", label: "Subcategorías" },
  { value: "servicios", label: "Servicios" },
];

function TreeNode({
  cat,
  selectedCategorias,
  selectedSubcategorias,
  selectedServicios,
  onToggleCategoria,
  onToggleSubcategoria,
  onToggleServicio,
}: {
  cat: TarifaTreeCategoria;
  selectedCategorias: Set<number>;
  selectedSubcategorias: Set<number>;
  selectedServicios: Set<number>;
  onToggleCategoria: (id: number) => void;
  onToggleSubcategoria: (id: number) => void;
  onToggleServicio: (id: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={selectedCategorias.has(cat.id)}
          onChange={() => onToggleCategoria(cat.id)}
        />
        <span className="font-semibold">
          {cat.codigo} - {cat.nombre}
        </span>
      </label>

      <div className="pl-6 space-y-2">
        {cat.subcategorias.map((sub) => (
          <div key={sub.id} className="space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedSubcategorias.has(sub.id)}
                onChange={() => onToggleSubcategoria(sub.id)}
              />
              <span>
                {sub.codigo} - {sub.nombre}
              </span>
            </label>

            <div className="pl-6 space-y-1">
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TarifarioPage() {
  const navigate = useNavigate();
  const vm = useTarifario();

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

  return (
    <div className="flex h-full w-full flex-col gap-4">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        {/* ===================== CONTENEDOR 1 ===================== */}
        <section className="min-h-0 rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
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
              />
            </div>

            <div className="flex gap-3">
              <div className="w-40">
                <Input
                  label="Nomenclador:"
                  value={vm.nomenclador}
                  onChange={(e) => vm.setNomenclador(e.target.value)}
                  placeholder="Ej. 102205"
                />
              </div>
              <div className="w-40">
                <Input
                  label="Buscar:"
                  value={vm.codigo}
                  onChange={(e) => vm.setCodigo(e.target.value)}
                  placeholder="Ej. 01.02.03"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Input
              label="Categoría:"
              value={
                vm.selected
                  ? `${vm.selected.categoria_codigo} - ${vm.selected.categoria_nombre}`
                  : ""
              }
              disabled
            />
            <Input
              label="Subcategoría:"
              value={
                vm.selected
                  ? `${vm.selected.subcategoria_codigo} - ${vm.selected.subcategoria_nombre}`
                  : ""
              }
              disabled
            />
          </div>

          <div className="mt-4">
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
                  render: (r) => r.precio_sin_igv,
                },
                { key: "unidad", header: "Unidad", headerClassName: "text-right", cellClassName: "px-3 py-2 text-right", render: (r) => r.unidad },
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
        </section>

        {/* ===================== CONTENEDOR 2 y 3 ===================== */}
        <section className="min-h-0 flex flex-col gap-4">
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
                />
                <button
                  type="button"
                  className="h-10 rounded-xl bg-(--color-primary) text-(--color-text-inverse) font-semibold"
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
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl bg-(--color-primary) text-(--color-text-inverse) font-semibold"
                  onClick={vm.onCloneAll}
                >
                  Clonar todo
                </button>
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl border border-(--border-color-default) bg-(--color-panel-context) text-(--color-base-primary) font-semibold"
                  onClick={vm.onCloneSelected}
                  disabled={!vm.canCloneSelected}
                >
                  Clonar selección
                </button>
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl border border-(--border-color-default) bg-(--color-surface) text-(--color-text-primary) font-semibold"
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
                <div className="space-y-4">
                  {vm.baseTree.tree.map((cat) => (
                    <TreeNode
                      key={cat.id}
                      cat={cat}
                      selectedCategorias={vm.selectedCategorias}
                      selectedSubcategorias={vm.selectedSubcategorias}
                      selectedServicios={vm.selectedServicios}
                      onToggleCategoria={vm.toggleCategoria}
                      onToggleSubcategoria={vm.toggleSubcategoria}
                      onToggleServicio={vm.toggleServicio}
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
