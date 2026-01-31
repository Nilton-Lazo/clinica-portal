import * as React from "react";
import { Calendar } from "lucide-react";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";

type BaseFieldProps = {
  label: string;
  disabled?: boolean;
};

const inputBase =
  "mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)";

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

function formatDateForDisplay(iso: string): string {
  const t = (iso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
  const [y, m, d] = t.split("-");
  return `${d}/${m}/${y}`;
}

export function FormCard(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  const { title, subtitle, children } = props;

  return (
    <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-(--color-text-primary)">{title}</div>
        {subtitle ? <div className="text-xs text-(--color-text-secondary)">{subtitle}</div> : null}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

export function TextField(
  props: BaseFieldProps & {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
    readOnly?: boolean;
  }
) {
  const { label, value, onChange, placeholder, inputMode, disabled, type = "text", readOnly } = props;

  return (
    <div>
      <label className="text-sm text-(--color-text-primary)">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
        readOnly={readOnly}
        className={inputBase}
      />
    </div>
  );
}

export function NumberField(
  props: BaseFieldProps & {
    value: string;
    onChange: (v: string) => void;
    min?: number;
    step?: number;
    placeholder?: string;
  }
) {
  const { label, value, onChange, min, step, disabled, placeholder } = props;

  return (
    <div>
      <label className="text-sm text-(--color-text-primary)">{label}</label>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputBase}
      />
    </div>
  );
}

export function SelectField(
  props: BaseFieldProps & {
    value: string;
    onChange: (v: string) => void;
    options: SelectOption[];
    ariaLabel: string;
    buttonClassName?: string;
    menuClassName?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
  }
) {
  const { label, value, onChange, options, ariaLabel, disabled, buttonClassName, menuClassName, searchable, searchPlaceholder } = props;

  return (
    <div>
      <label className="text-sm text-(--color-text-primary)">{label}</label>
      <div className="mt-1">
        <SelectMenu
          value={value}
          onChange={onChange}
          options={options}
          ariaLabel={ariaLabel}
          disabled={disabled}
          buttonClassName={buttonClassName ?? "w-full"}
          menuClassName={menuClassName ?? "min-w-full"}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
        />
      </div>
    </div>
  );
}

export function DateField(
  props: BaseFieldProps & {
    value: string;
    onChange: (v: string) => void;
    ariaLabel: string;
    placeholder?: string;
  }
) {
  const { label, value, onChange, ariaLabel, disabled, placeholder } = props;

  const isTouchUi = useIsTouchUi();

  if (!isTouchUi) {
    return (
      <div>
        <label className="text-sm text-(--color-text-primary)">{label}</label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={ariaLabel}
          className={inputBase}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm text-(--color-text-primary)">{label}</label>

      <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
        <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
          <span className={value ? "text-(--color-text-primary)" : "text-(--color-text-secondary)"}>
            {value ? formatDateForDisplay(value) : placeholder ?? "dd/mm/aaaa"}
          </span>
        </div>

        <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
          aria-label={ariaLabel}
        />
      </div>
    </div>
  );
}
