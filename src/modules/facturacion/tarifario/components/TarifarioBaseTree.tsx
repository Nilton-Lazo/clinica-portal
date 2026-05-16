import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TarifaTreeCategoria } from "../types/tarifario.types";

export const TarifarioBaseTreeNode = React.memo(function TarifarioBaseTreeNode({
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
