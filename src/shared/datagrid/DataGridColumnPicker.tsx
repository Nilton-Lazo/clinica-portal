import * as React from "react";
import { createPortal } from "react-dom";
import type { DataGridColumnDef } from "./types";
import { getColumnDisplayLabel } from "./gridHeader";

const MENU_MIN_WIDTH = 176;
const VIEWPORT_PAD = 8;

export function DataGridColumnPicker<T>(props: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  columns: DataGridColumnDef<T>[];
  hiddenColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onClose: () => void;
}) {
  const { open, anchorRef, columns, hiddenColumnIds, onToggleColumn, onClose } = props;
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number; openAbove: boolean } | null>(
    null
  );

  const updatePosition = React.useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const menuWidth = Math.max(MENU_MIN_WIDTH, menuRef.current?.offsetWidth ?? MENU_MIN_WIDTH);
    const menuHeight = menuRef.current?.offsetHeight ?? 240;

    let left = rect.left;
    if (left + menuWidth > window.innerWidth - VIEWPORT_PAD) {
      left = rect.right - menuWidth;
    }
    left = Math.max(VIEWPORT_PAD, left);

    const openAbove = rect.top - menuHeight >= VIEWPORT_PAD;
    const top = openAbove ? rect.top - 4 : rect.bottom + 4;

    setPosition({ top, left, openAbove });
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    const frame = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(frame);
  }, [open, columns, hiddenColumnIds, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const onResize = () => updatePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panel = (
    <div
      ref={menuRef}
      role="dialog"
      aria-label="Columnas visibles"
      data-datagrid-column-picker=""
      className="fixed z-200 max-h-64 min-w-44 overflow-y-auto rounded-md border border-(--border-color-default) bg-(--color-surface) p-2 shadow-lg app-scrollbar"
      style={
        position
          ? {
              top: position.top,
              left: position.left,
              transform: position.openAbove ? "translateY(-100%)" : undefined,
              minWidth: MENU_MIN_WIDTH,
            }
          : { visibility: "hidden", top: 0, left: 0, minWidth: MENU_MIN_WIDTH }
      }
      onMouseDown={(e) => e.stopPropagation()}
    >
      {columns
        .filter((c) => {
          if (c.enableHiding === false) return false;
          if (c.id === "actions" || c.id === "check") return false;
          return Boolean(getColumnDisplayLabel(c));
        })
        .map((col) => {
          const label = getColumnDisplayLabel(col);
          return (
            <label
              key={col.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-(--color-surface-hover)"
            >
              <input
                type="checkbox"
                checked={!hiddenColumnIds.includes(col.id)}
                onChange={() => onToggleColumn(col.id)}
                className="accent-(--color-primary)"
              />
              <span className="min-w-0 truncate">{label}</span>
            </label>
          );
        })}
    </div>
  );

  return createPortal(panel, document.body);
}
