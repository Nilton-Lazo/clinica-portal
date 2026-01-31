import * as React from "react";
import { ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export function SelectMenu(props: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  keepPlaceholder?: boolean;
}) {
  const {
    value,
    onChange,
    options,
    ariaLabel,
    buttonClassName,
    menuClassName,
    disabled,
    searchable = ariaLabel !== "Estado",
    searchPlaceholder = "Buscar...",
    keepPlaceholder = ariaLabel === "Estado",
  } = props;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const optionsNoPlaceholder = React.useMemo(() => {
    if (keepPlaceholder) return options;
    return options.filter((opt) => {
      if (opt.disabled && opt.value === "") return false;
      const label = (opt.label ?? "").toString().trim().toLowerCase();
      if (opt.value === "" && label.startsWith("selecciona")) return false;
      if (label.startsWith("selecciona")) return false;
      return true;
    });
  }, [keepPlaceholder, options]);

  const [activeIndex, setActiveIndex] = React.useState<number>(() => {
    const i = optionsNoPlaceholder.findIndex((o) => o.value === value);
    return i >= 0 ? i : 0;
  });

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  const selected = optionsNoPlaceholder.find((o) => o.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !query.trim()) return optionsNoPlaceholder;
    const q = query.trim().toLowerCase();
    return optionsNoPlaceholder.filter((o) => o.label.toLowerCase().includes(q));
  }, [optionsNoPlaceholder, query, searchable]);

  React.useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!open) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, searchable]);

  React.useEffect(() => {
    if (!open) return;
    const list = filteredOptions.length ? filteredOptions : optionsNoPlaceholder;
    const i = list.findIndex((o) => o.value === value);
    const next = i >= 0 ? i : 0;
    setActiveIndex(next);
  }, [filteredOptions, open, options, value]);

  const move = (dir: 1 | -1) => {
    let i = activeIndex;
    const list = filteredOptions.length ? filteredOptions : options;
    for (let k = 0; k < list.length; k++) {
      i = (i + dir + list.length) % list.length;
      if (!list[i].disabled) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          const i = filteredOptions.findIndex((o) => o.value === value);
          setActiveIndex(i >= 0 ? i : 0);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            move(-1);
          }
        }}
        className={[
          "h-10 rounded-xl border border-(--border-color-default) bg-(--color-surface)",
          "px-3 text-sm text-(--color-text-primary)",
          "outline-none focus:ring-2 focus:ring-(--color-primary)",
          "flex items-center justify-between gap-2",
          "transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]",
          disabled ? "opacity-50 cursor-not-allowed hover:scale-100 active:scale-100" : "",
          buttonClassName ?? "",
        ].join(" ")}
      >
        <span className="min-w-0 truncate">{selected?.label ?? ""}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-(--color-text-secondary)" />
      </button>

      <div
        className={[
          "absolute left-0 mt-2 z-50",
          "rounded-xl border border-(--border-color-default) bg-(--color-surface) shadow-lg",
          "origin-top transition-all duration-150",
          open ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 -translate-y-1 scale-[0.98]",
          menuClassName ?? "min-w-full w-max",
          "max-w-[calc(100vw-2rem)]",
        ].join(" ")}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const opt = (filteredOptions.length ? filteredOptions : optionsNoPlaceholder)[activeIndex];
            if (opt && !opt.disabled) pick(opt.value);
          } else if (e.key === "Tab") {
            setOpen(false);
          }
        }}
      >
        {open ? (
          <div className="max-h-60 overflow-auto p-1 app-scrollbar app-scrollbar-no-gutter">
            {searchable ? (
              <div className="px-2 pt-2 pb-1">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm outline-none focus:ring-2 focus:ring-(--color-primary)"
                  aria-label={searchPlaceholder}
                />
              </div>
            ) : null}
            {(filteredOptions.length ? filteredOptions : optionsNoPlaceholder).map((o, idx) => {
              const isSelected = o.value === value;
              const isActive = idx === activeIndex;

              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={o.disabled}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => !o.disabled && pick(o.value)}
                  className={[
                    "w-full rounded-lg px-3 py-2 text-left text-sm",
                    "transition-colors",
                    "whitespace-normal wrap-break-words leading-5",
                    o.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                    isSelected ? "bg-(--color-primary) text-(--color-text-inverse)" : "text-(--color-text-primary)",
                    !isSelected && isActive ? "bg-(--color-surface-hover)" : "",
                  ].join(" ")}
                  role="option"
                  aria-selected={isSelected}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
