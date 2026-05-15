import * as React from "react";
import { prepareFormText } from "../../../shared/textInput/uppercaseTextInput";
import { toastService } from "../../../shared/notifications";

export { prepareFormText };

export const inputBase =
  "rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

export type Notice = { type: "success" | "error"; text: string } | null;

export function makeEnterKeySaveHandler(
  saveEnabled: boolean,
  onSave: () => void
): React.KeyboardEventHandler<HTMLDivElement> {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    if (!saveEnabled) return;
    e.preventDefault();
    onSave();
  };
}

export function useNoticeToToast(notice: Notice) {
  const lastKeyRef = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    if (!notice?.text) {
      lastKeyRef.current = null;
      return;
    }
    const key = `${notice.type}:${notice.text}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    if (notice.type === "success") toastService.showSuccess(notice.text);
    else toastService.showError(notice.text);
  }, [notice]);
}
