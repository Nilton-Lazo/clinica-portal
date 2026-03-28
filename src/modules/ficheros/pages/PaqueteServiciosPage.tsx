import * as React from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { SelectMenu } from "../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/buttons";
import type { TreeCategoria } from "../types/paqueteServicios.types";
import { usePaqueteServicios } from "../paquete-servicios/hooks/usePaqueteServicios";

const inputBase =
  "h-10 rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

function TreeSearchInput({
  value,
  onChange,
  isPending,
  placeholder,
  className,
  ariaLabel
}: {
  value: string;
  onChange: (val: string) => void;
  isPending?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [localValue, setLocalValue] = React.useState(value);
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    if (!isTyping) {
      setLocalValue(value);
    }
  }, [value, isTyping]);

  React.useEffect(() => {
    if (!isTyping) return;
    const t = setTimeout(() => {
      onChange(localValue);
      setIsTyping(false);
    }, 300);
    return () => clearTimeout(t);
  }, [localValue, isTyping, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    setIsTyping(true);
  };

  return (
    <div className="w-full">
      <input
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        aria-label={ariaLabel}
        aria-busy={isPending || isTyping}
      />
      {(isPending || isTyping) && (
        <div className="mt-1 text-xs text-(--color-text-secondary)" aria-live="polite">
          Aplicando filtro…
        </div>
      )}
    </div>
  );
}

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
  isCatIndeterminate,
  isSubIndeterminate,
}: {
  cat: TreeCategoria;
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
  isCatIndeterminate: (id: number) => boolean;
  isSubIndeterminate: (id: number) => boolean;
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
          {isCatOpen ? <ChevronDown className="h-4 w-4 text-(--color-text-secondary)" /> : <ChevronRight className="h-4 w-4 text-(--color-text-secondary)" />}
        </button>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            ref={(el) => {
              if (el) el.indeterminate = isCatIndeterminate(cat.id);
            }}
            type="checkbox"
            checked={isCatChecked(cat.id)}
            onChange={() => onToggleCategoria(cat.id)}
            className="h-4 w-4 rounded border border-(--border-color-default)"
          />
          <span className="font-semibold">{cat.codigo} - {cat.nombre}</span>
        </label>
      </div>

      {isCatOpen ? (
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
                    {isSubOpen ? <ChevronDown className="h-4 w-4 text-(--color-text-secondary)" /> : <ChevronRight className="h-4 w-4 text-(--color-text-secondary)" />}
                  </button>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      ref={(el) => {
                        if (el) el.indeterminate = isSubIndeterminate(sub.id);
                      }}
                      type="checkbox"
                      checked={isSubChecked(sub.id)}
                      onChange={() => onToggleSubcategoria(sub.id)}
                      className="h-4 w-4 rounded border border-(--border-color-default)"
                    />
                    <span>{cat.codigo}.{sub.codigo} - {sub.nombre}</span>
                  </label>
                </div>
                {isSubOpen ? (
                  <div className="pl-8 space-y-1">
                    {sub.servicios.map((sv) => (
                      <label key={sv.id} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={selectedServicios.has(sv.id)} onChange={() => onToggleServicio(sv.id)} className="h-4 w-4 rounded border border-(--border-color-default)" />
                        <span className="whitespace-normal wrap-break-word leading-5">{sv.codigo} - {sv.descripcion}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

export default function PaqueteServiciosPage() {
  const vm = usePaqueteServicios();

  const tarifaOptions = React.useMemo(
    () => [{ value: "", label: "Seleccione tarifa" }, ...vm.tarifas.map((t) => ({ value: String(t.id), label: `${t.codigo} - ${t.descripcion_tarifa}` }))],
    [vm.tarifas]
  );
  const paqueteOptions = React.useMemo(
    () => [{ value: "", label: "Seleccione paquete" }, ...vm.paquetes.map((p) => ({ value: String(p.id), label: `${p.codigo} - ${p.descripcion}` }))],
    [vm.paquetes]
  );

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      <div className="min-w-0">
        <div className="text-base font-semibold text-(--color-text-primary)">Servicios por paquete</div>
        <div className="text-sm text-(--color-text-secondary)">Asigna servicios de la tarifa al paquete seleccionado</div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:min-h-0 lg:flex-1">
        <section className="rounded border border-(--border-color-default) bg-(--color-surface) p-3 lg:min-h-0 lg:flex lg:flex-col">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <label className="block text-xs text-(--color-text-secondary) mb-0.5">Tarifa</label>
              <SelectMenu
                value={vm.tarifaId ? String(vm.tarifaId) : ""}
                onChange={(v) => vm.setTarifaId(v ? Number(v) : null)}
                options={tarifaOptions}
                ariaLabel="Tarifa"
                disabled={vm.loadingTarifas}
                buttonClassName={`w-full ${inputBase}`}
              />
            </div>
            <div>
              <label className="block text-xs text-(--color-text-secondary) mb-0.5">Paquete</label>
              <SelectMenu
                value={vm.paqueteId ? String(vm.paqueteId) : ""}
                onChange={(v) => vm.setPaqueteId(v ? Number(v) : null)}
                options={paqueteOptions}
                ariaLabel="Paquete"
                disabled={!vm.tarifaId || vm.loadingPaquetes}
                buttonClassName={`w-full ${inputBase}`}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-(--color-text-secondary)">
            <span>Servicios seleccionados: {vm.selectedCount}</span>
            <span className="text-(--color-success)">Por agregar: +{vm.addedCount}</span>
            <span className="text-(--color-danger)">Por quitar: -{vm.removedCount}</span>
          </div>

          <div className="mt-2 space-y-1">
            <TreeSearchInput
              value={vm.treeQuery}
              onChange={vm.setTreeQuery}
              placeholder="Buscar por código o descripción"
              className={`w-full ${inputBase}`}
              ariaLabel="Buscar en árbol"
              isPending={vm.treeFilterPending}
            />
          </div>

          <div className="mt-3 overflow-auto app-scrollbar app-scrollbar-no-gutter lg:min-h-0 lg:flex-1">
            {vm.loadingTree ? (
              <div className="text-sm text-(--color-text-secondary)">Cargando árbol…</div>
            ) : vm.filteredTree ? (
              <div className="space-y-2">
                {vm.filteredTree.tree.length === 0 ? (
                  <div className="text-sm text-(--color-text-secondary)">
                    {vm.treeQueryDeferred.trim()
                      ? "No se encontraron servicios que coincidan con la búsqueda en el árbol de la tarifa."
                      : "La tarifa seleccionada no tiene servicios activos para mostrar en el árbol."}
                  </div>
                ) : null}
                {vm.filteredTree.tree.map((cat) => (
                  <TreeNode
                    key={cat.id}
                    cat={cat}
                    selectedServicios={vm.workingAssigned}
                    expandedCategorias={vm.expandedCategorias}
                    expandedSubcategorias={vm.expandedSubcategorias}
                    onToggleExpandCategoria={vm.toggleExpandCategoria}
                    onToggleExpandSubcategoria={vm.toggleExpandSubcategoria}
                    onToggleCategoria={vm.toggleCategoria}
                    onToggleSubcategoria={vm.toggleSubcategoria}
                    onToggleServicio={vm.toggleServicio}
                    isCatChecked={vm.isCatChecked}
                    isSubChecked={vm.isSubChecked}
                    isCatIndeterminate={vm.isCatIndeterminate}
                    isSubIndeterminate={vm.isSubIndeterminate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-(--color-text-secondary)">
                {vm.tarifaId
                  ? "La tarifa seleccionada no tiene servicios activos para mostrar en el árbol."
                  : "Seleccione una tarifa para cargar el árbol de servicios."}
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <SecondaryButton className="w-full" onClick={vm.onReset} disabled={!vm.isDirty || vm.saving}>
              Deshacer cambios
            </SecondaryButton>
            <PrimaryButton className="w-full" onClick={vm.onSave} disabled={!vm.paqueteId || !vm.isDirty || vm.saving}>
              {vm.saving ? "Guardando..." : "Guardar cambios"}
            </PrimaryButton>
          </div>
        </section>

        <section className="rounded border border-(--border-color-default) bg-(--color-surface) p-3 lg:min-h-0 lg:flex lg:flex-col">
          <h2 className="text-sm font-semibold text-(--color-text-primary)">Servicios actuales del paquete</h2>
          <p className="mt-1 text-xs text-(--color-text-secondary)">Quita o agrega servicios y guarda.</p>

          <div className="mt-3 overflow-auto app-scrollbar app-scrollbar-no-gutter lg:min-h-0 lg:flex-1">
            {vm.loadingAssigned ? (
              <div className="text-sm text-(--color-text-secondary)">Cargando servicios del paquete…</div>
            ) : vm.workingSelectedRows.length === 0 ? (
              <div className="text-sm text-(--color-text-secondary)">
                No hay servicios seleccionados en este paquete.
              </div>
            ) : (
              <div className="space-y-2">
                {vm.workingSelectedRows.map((x) => (
                  <div key={x.id} className="rounded border border-(--border-color-default) px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium text-(--color-text-primary) whitespace-normal wrap-break-word leading-5">
                        {x.codigo} - {x.descripcion}
                      </div>
                      <button
                        type="button"
                        onClick={() => vm.removeServicio(x.id)}
                        className="inline-flex h-8 w-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md bg-(--color-danger) text-(--color-text-inverse) hover:opacity-90"
                        title="Quitar servicio del paquete"
                        aria-label={`Quitar ${x.codigo}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-0.5 text-xs text-(--color-text-secondary)">
                      {x.categoria_codigo}.{x.subcategoria_codigo} · {x.categoria_nombre} / {x.subcategoria_nombre}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
