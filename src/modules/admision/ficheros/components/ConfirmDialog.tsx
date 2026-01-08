import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  destructive,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const cancelBtn =
    "h-10 rounded-xl px-4 text-sm font-medium bg-[var(--color-panel-context)] text-[var(--color-base-primary)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

  const confirmBtn = [
    "h-10 rounded-xl px-4 text-sm font-medium text-[var(--color-text-inverse)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]",
    destructive ? "bg-[var(--color-danger)]" : "bg-[var(--color-primary)]",
  ].join(" ");

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[var(--color-overlay)]"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="w-full max-w-md rounded-2xl border border-[var(--border-color-default)] bg-[var(--color-surface)] shadow-lg"
        >
          <div className="p-5">
            <div className="text-base font-semibold text-[var(--color-text-primary)]">
              {title}
            </div>
            {description ? (
              <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {description}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-color-default)] p-4">
            <button type="button" className={cancelBtn} onClick={onCancel}>
              {cancelText}
            </button>
            <button type="button" className={confirmBtn} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
