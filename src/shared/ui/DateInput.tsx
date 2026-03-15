import * as React from "react";
import { Calendar } from "lucide-react";

const inputBase =
  "rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

function formatDateForDisplay(iso: string): string {
  const t = (iso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
  const [y, m, d] = t.split("-");
  return `${d}/${m}/${y}`;
}

function useIsTouchUi(): boolean {
  const [isTouch, setIsTouch] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  });

  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const onChange = () => setIsTouch(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isTouch;
}

export type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

export default function DateInput({
  value,
  onChange,
  "aria-label": ariaLabel,
  placeholder = "dd/mm/aaaa",
  className = "",
  inputClassName = "",
  disabled = false,
  readOnly = false,
}: DateInputProps) {
  const isTouchUi = useIsTouchUi();
  const inert = disabled || readOnly;

  if (isTouchUi) {
    return (
      <div
        className={`relative w-full rounded border border-(--border-color-default) bg-(--color-surface) focus-within:ring-0 focus-within:border-(--color-primary) ${className}`}
      >
        <div className="h-10 w-full rounded px-3 pr-10 text-sm flex items-center">
          <span className={value ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
            {value ? formatDateForDisplay(value) : placeholder}
          </span>
        </div>
        <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />
        <input
          type="date"
          value={value}
          onChange={(e) => !inert && onChange(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          tabIndex={inert ? -1 : 0}
          className="absolute inset-0 h-10 w-full cursor-pointer opacity-0 disabled:pointer-events-none read-only:pointer-events-none"
          aria-label={ariaLabel}
        />
      </div>
    );
  }

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      aria-label={ariaLabel}
      className={`h-10 w-full ${inputBase} ${inputClassName} ${className}`.trim()}
    />
  );
}
