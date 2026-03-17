import * as React from "react";

const LONG_PRESS_MS = 500;

export function MobileEntityList<T>(props: {
  rows: T[];
  loading: boolean;
  selectedId: string | number | null;
  getRowId: (row: T) => string | number;
  onSelect: (row: T) => void;
  renderMain: (row: T) => React.ReactNode;
  renderRight?: (row: T) => React.ReactNode;
  emptyText?: string;
  onLongPress?: (row: T) => void;
}) {
  const { rows, loading, selectedId, getRowId, onSelect, renderMain, renderRight, emptyText, onLongPress } = props;
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressHandledRef = React.useRef(false);

  const clearLongPressTimer = React.useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = React.useCallback(
    (row: T) => {
      if (!onLongPress) return;
      longPressHandledRef.current = false;
      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressHandledRef.current = true;
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
        onLongPress(row);
      }, LONG_PRESS_MS);
    },
    [onLongPress, clearLongPressTimer]
  );

  const handleTouchEnd = React.useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleTouchMove = React.useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  React.useEffect(() => () => clearLongPressTimer(), [clearLongPressTimer]);

  if (loading) {
    return (
      <div className="rounded-lg border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
        Cargando…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
        {emptyText ?? "No hay registros."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const id = getRowId(row);
        const active = selectedId != null && String(selectedId) === String(id);

        return (
          <div
            key={String(id)}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (longPressHandledRef.current) return;
              onSelect(row);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (longPressHandledRef.current) return;
                onSelect(row);
              }
            }}
            onTouchStart={() => handleTouchStart(row)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onTouchMove={handleTouchMove}
            className={[
              "w-full cursor-pointer rounded-lg border border-(--border-color-default) p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
              "transition-transform duration-150 active:scale-[0.99]",
              active ? "bg-(--color-surface-hover)" : "bg-(--color-surface)",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3 min-w-0 w-full">
              <div className="min-w-0 flex-1">{renderMain(row)}</div>
              {renderRight ? <div className="shrink-0">{renderRight(row)}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
