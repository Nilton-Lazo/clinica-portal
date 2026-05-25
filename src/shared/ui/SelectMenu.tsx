import * as React from "react";
import { ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

const isSelectPlaceholderLabel = (label: string) => {
  const t = (label ?? "").toString().trim().toLowerCase();
  return t.startsWith("selecciona") || t.startsWith("seleccione");
};

function isScrollableElement(el: HTMLElement): boolean {
  const s = window.getComputedStyle(el);
  return /(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`);
}

function getScrollableAncestors(trigger: HTMLElement | null): HTMLElement[] {
  const chain: HTMLElement[] = [];
  if (!trigger) return chain;
  let cur: HTMLElement | null = trigger.parentElement;
  while (cur) {
    if (isScrollableElement(cur)) chain.push(cur);
    cur = cur.parentElement;
  }
  const root = document.scrollingElement;
  if (root instanceof HTMLElement && !chain.includes(root)) chain.push(root);
  return chain;
}

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
}) {
  const {
    value,
    onChange,
    options,
    ariaLabel,
    buttonClassName,
    menuClassName,
    disabled,
    searchable,
    searchPlaceholder = "Buscar...",
  } = props;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [menuBox, setMenuBox] = React.useState<{
    left: number;
    width: number;
    placement: "below" | "above";
    top?: number;
    bottom?: number;
  } | null>(null);
  const optionsNoPlaceholder = React.useMemo(() => {
    return options.filter((opt) => {
      if (opt.disabled && opt.value === "") return false;
      if (opt.value === "" && isSelectPlaceholderLabel(opt.label)) return false;
      if (isSelectPlaceholderLabel(opt.label)) return false;
      return true;
    });
  }, [options]);

  const [activeIndex, setActiveIndex] = React.useState<number>(() => {
    const i = optionsNoPlaceholder.findIndex((o) => o.value === value);
    return i >= 0 ? i : 0;
  });

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  const selected = options.find((o) => o.value === value);

  const shouldShowSearch = optionsNoPlaceholder.length > 4 && searchable !== false;

  const filteredOptions = React.useMemo(() => {
    if (!shouldShowSearch || !query.trim()) return optionsNoPlaceholder;
    const q = query.trim().toLowerCase();
    return optionsNoPlaceholder.filter((o) => o.label.toLowerCase().includes(q));
  }, [optionsNoPlaceholder, query, shouldShowSearch]);

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

  React.useLayoutEffect(() => {
    if (!open) {
      setQuery("");
      setMenuBox(null);
      return;
    }

    const margin = 8;
    const menuHeightEstimate = shouldShowSearch ? 300 : 260;

    const update = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const spaceBelow = vh - r.bottom - margin;
      const spaceAbove = r.top - margin;
      const placement: "below" | "above" =
        spaceBelow < menuHeightEstimate && spaceAbove >= spaceBelow ? "above" : "below";
      const width = Math.min(r.width, vw - margin * 2);
      const left = Math.max(margin, Math.min(r.left, vw - width - margin));

      if (placement === "below") {
        setMenuBox({
          left,
          width,
          placement,
          top: r.bottom + margin,
        });
      } else {
        setMenuBox({
          left,
          width,
          placement,
          bottom: vh - r.top + margin,
        });
      }
    };

    update();

    const triggerEl = btnRef.current;
    const scrollOpts: AddEventListenerOptions = { passive: true };
    const scrollParents = getScrollableAncestors(triggerEl);
    scrollParents.forEach((el) => el.addEventListener("scroll", update, scrollOpts));
    window.addEventListener("scroll", update, scrollOpts);
    window.addEventListener("resize", update);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && triggerEl) {
      ro = new ResizeObserver(() => {
        requestAnimationFrame(update);
      });
      ro.observe(triggerEl);
      scrollParents.forEach((el) => {
        if (el !== triggerEl) ro!.observe(el);
      });
    }

    return () => {
      scrollParents.forEach((el) => el.removeEventListener("scroll", update));
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [open, shouldShowSearch]);

  React.useEffect(() => {
    if (!open) return;
    if (shouldShowSearch) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, shouldShowSearch]);

  React.useEffect(() => {
    if (!open) return;
    const list = filteredOptions.length ? filteredOptions : optionsNoPlaceholder;
    const i = list.findIndex((o) => o.value === value);
    const next = i >= 0 ? i : 0;
    setActiveIndex(next);
  }, [filteredOptions, open, optionsNoPlaceholder, value]);

  const move = (dir: 1 | -1) => {
    let i = activeIndex;
    const list = filteredOptions.length ? filteredOptions : optionsNoPlaceholder;
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

  const menuPopoverClassName = React.useMemo(() => {
    const raw = (menuClassName ?? "").trim();
    if (!raw) return "";
    return raw
      .split(/\s+/)
      .filter((c) => c && c !== "min-w-full" && c !== "w-full")
      .join(" ");
  }, [menuClassName]);

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
          "h-10 rounded border border-(--border-color-default) bg-(--color-surface)",
          "px-3 text-sm text-(--color-text-primary)",
          "outline-none focus:ring-0 focus:border-(--color-primary)",
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
          "z-200 flex max-w-none min-w-0 flex-col rounded border border-(--border-color-default) bg-(--color-surface) shadow-lg",
          "transition-opacity duration-150",
          open && menuBox ? "fixed opacity-100" : "pointer-events-none fixed opacity-0",
          menuPopoverClassName,
        ].join(" ")}
        style={
          open && menuBox
            ? {
                left: menuBox.left,
                width: menuBox.width,
                minWidth: menuBox.width,
                maxWidth: menuBox.width,
                ...(menuBox.placement === "below"
                  ? { top: menuBox.top }
                  : { bottom: menuBox.bottom }),
              }
            : { left: 0, top: 0, width: 0, minWidth: 0, maxWidth: 0, overflow: "hidden", visibility: "hidden" }
        }
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
        {open && menuBox ? (
          <>
            {shouldShowSearch ? (
              <div className="shrink-0 px-2 pt-2 pb-1">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-2 text-sm outline-none focus:ring-0 focus:border-(--color-primary)"
                  aria-label={searchPlaceholder}
                />
              </div>
            ) : null}
            <div className="max-h-60 min-h-0 flex-1 overflow-y-auto p-1 app-scrollbar app-scrollbar-no-gutter">
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
                      "w-full rounded-md px-3 py-2 text-left text-sm",
                      "transition-colors",
                      "whitespace-normal wrap-break-words leading-5",
                      o.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
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
          </>
        ) : null}
      </div>
    </div>
  );
}
