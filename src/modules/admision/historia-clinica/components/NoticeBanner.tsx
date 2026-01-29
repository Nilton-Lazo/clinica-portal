import * as React from "react";
import { X } from "lucide-react";

export type Notice = { type: "success" | "error" | "info"; text: string } | null;

function defaultMs(type: "success" | "error" | "info"): number {
  if (type === "success") return 4000;
  if (type === "info") return 5000;
  return 6000;
}

export default function NoticeBanner(props: {
  notice: Notice;
  onClose: () => void;
  autoHideMs?: number;
}) {
  const { notice, onClose, autoHideMs } = props;

  React.useEffect(() => {
    if (!notice) return;

    const ms = typeof autoHideMs === "number" ? autoHideMs : defaultMs(notice.type);
    const t = window.setTimeout(() => onClose(), ms);

    return () => window.clearTimeout(t);
  }, [notice, onClose, autoHideMs]);

  if (!notice) return null;

  const base =
    "rounded-2xl border px-4 py-3 text-sm flex items-start justify-between gap-3";

  const cls =
    notice.type === "success"
      ? `${base} border-(--color-success) text-(--color-success)`
      : notice.type === "info"
      ? `${base} border-(--color-warning) text-(--color-warning)`
      : `${base} border-(--color-danger) text-(--color-danger)`;

  return (
    <div role="status" className={cls}>
      <div className="min-w-0">{notice.text}</div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-(--color-surface-hover) transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
