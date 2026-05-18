import * as React from "react";

export function SelectAllCheckbox<T extends { id: number }>(props: {
  rows: T[];
  selectedIds: Set<number> | Map<number, unknown>;
  onSelectAll: () => void;
  onClear: () => void;
  ariaLabel?: string;
}) {
  const { rows, selectedIds, onSelectAll, onClear, ariaLabel = "Seleccionar todos en esta página" } = props;
  const ref = React.useRef<HTMLInputElement>(null);
  const has = (id: number) =>
    selectedIds instanceof Map ? selectedIds.has(id) : selectedIds.has(id);
  const allSelected = rows.length > 0 && rows.every((r) => has(r.id));
  const someSelected = rows.length > 0 && rows.some((r) => has(r.id));
  const indeterminate = someSelected && !allSelected;

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allSelected}
      onChange={() => (allSelected ? onClear() : onSelectAll())}
      className="h-4 w-4 shrink-0 rounded border border-(--border-color-default)"
      onClick={(e) => e.stopPropagation()}
      aria-label={ariaLabel}
    />
  );
}
