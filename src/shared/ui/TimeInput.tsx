import * as React from "react";
import { Clock } from "lucide-react";

const inputBase =
  "rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function clampHourDigits(h: string): string {
  const d = (h ?? "").replace(/\D/g, "").slice(0, 2);
  if (!d) return "";
  if (d.length === 1) {
    const a = d.charCodeAt(0) - 48;
    if (a < 0) return "";
    return String(Math.min(2, Math.max(0, a)));
  }
  const a = d.charCodeAt(0) - 48;
  const b = d.charCodeAt(1) - 48;
  if (a < 0 || b < 0) return "";
  if (a > 2) return "23";
  if (a === 2 && b > 3) return "23";
  return `${a}${b}`;
}

function clampMinuteDigits(m: string): string {
  const d = (m ?? "").replace(/\D/g, "").slice(0, 2);
  if (!d) return "";
  if (d.length === 1) {
    const a = d.charCodeAt(0) - 48;
    if (a < 0) return "";
    return String(Math.min(5, Math.max(0, a)));
  }
  const a = d.charCodeAt(0) - 48;
  const b = d.charCodeAt(1) - 48;
  if (a < 0 || b < 0) return "";
  if (a > 5) return "59";
  return `${a}${b}`;
}

function normalizeTimeOnBlur(input: string): string {
  const t = (input ?? "").trim();
  if (!t) return "";
  const hasColon = t.includes(":");
  let hRaw = "";
  let mRaw = "";
  if (hasColon) {
    const [a, b] = t.split(":");
    hRaw = (a ?? "").replace(/\D/g, "");
    mRaw = (b ?? "").replace(/\D/g, "");
  } else {
    const d = t.replace(/\D/g, "").slice(0, 4);
    if (!d) return "";
    if (d.length === 1) {
      hRaw = d;
      mRaw = "";
    } else if (d.length === 2) {
      hRaw = d;
      mRaw = "";
    } else if (d.length === 3) {
      hRaw = d.slice(0, 2);
      mRaw = `${d.slice(2, 3)}0`;
    } else {
      hRaw = d.slice(0, 2);
      mRaw = d.slice(2, 4);
    }
  }
  if (!hRaw) return "";
  const hh0 = Number(hRaw);
  const mm0 = mRaw ? Number(mRaw.padEnd(2, "0").slice(0, 2)) : 0;
  const hh = Number.isFinite(hh0) ? Math.min(23, Math.max(0, Math.trunc(hh0))) : 0;
  const mm = Number.isFinite(mm0) ? Math.min(59, Math.max(0, Math.trunc(mm0))) : 0;
  return `${pad2(hh)}:${pad2(mm)}`;
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

export type TimeInputProps = {
  value: string;
  onChange: (v: string) => void;
  "aria-label": string;
  disabled?: boolean;
  className?: string;
};

export default function TimeInput({
  value,
  onChange,
  "aria-label": ariaLabel,
  disabled = false,
  className = "",
}: TimeInputProps) {
  const isTouchUi = useIsTouchUi();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const selectMinutesNextRef = React.useRef(false);
  const lastKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!selectMinutesNextRef.current) return;
    selectMinutesNextRef.current = false;
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      try {
        el.setSelectionRange(3, 5);
      } catch {
        void 0;
      }
    });
  }, [value]);

  const normalized = value ? normalizeTimeOnBlur(value) : "";

  if (isTouchUi) {
    return (
      <div
        className={`relative mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center text-(--color-text-primary) focus-within:ring-0 focus-within:border-(--color-primary) ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}
      >
        <span className={value ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
          {value ? normalized : "HH:MM"}
        </span>
        <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />
        <input
          type="time"
          step={60}
          value={normalized}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0 rounded"
          aria-label={ariaLabel}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      aria-label={ariaLabel}
      value={value}
      inputMode="numeric"
      placeholder="HH:MM"
      disabled={disabled}
      onKeyDown={(e) => {
        lastKeyRef.current = e.key;
      }}
      onChange={(e) => {
        const lastKey = lastKeyRef.current;
        lastKeyRef.current = null;
        const raw0 = (e.target.value ?? "").replace(/[^\d:]/g, "");
        if (raw0.includes(":")) {
          const [h0, m0] = raw0.split(":");
          const h = clampHourDigits(h0 ?? "");
          const m = clampMinuteDigits(m0 ?? "");
          if (!h && !m) {
            onChange("");
            return;
          }
          onChange(`${h}:${m}`);
          return;
        }
        const d0 = raw0.replace(/\D/g, "").slice(0, 4);
        if (!d0) {
          onChange("");
          return;
        }
        if (d0.length === 1) {
          onChange(clampHourDigits(d0));
          return;
        }
        if (d0.length === 2) {
          const h2 = clampHourDigits(d0);
          if (lastKey === "Backspace" || lastKey === "Delete") {
            onChange(h2);
            return;
          }
          onChange(`${h2}:00`);
          selectMinutesNextRef.current = true;
          return;
        }
        if (d0.length === 3) {
          const h2 = clampHourDigits(d0.slice(0, 2));
          const m1 = clampMinuteDigits(d0.slice(2, 3));
          onChange(`${h2}:${m1}`);
          return;
        }
        const h2 = clampHourDigits(d0.slice(0, 2));
        const m2 = clampMinuteDigits(d0.slice(2, 4));
        onChange(`${h2}:${m2}`);
      }}
      onBlur={() => onChange(normalizeTimeOnBlur(value))}
      className={`mt-1 h-10 w-full ${inputBase} ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
    />
  );
}
