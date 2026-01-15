import * as React from "react";
import type { RecordStatus } from "../../types/especialidades.types";
import type { StatusFilter } from "../hooks/useEspecialidades";
import { ChevronDown } from "lucide-react";

type Opt = { value: string; label: string; disabled?: boolean };

function SelectMenu(props: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  ariaLabel: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const { value, onChange, options, ariaLabel, buttonClassName, menuClassName } = props;
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(() => {
    const i = options.findIndex((o) => o.value === value);
    return i >= 0 ? i : 0;
  });

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

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

  const move = (dir: 1 | -1) => {
    let i = activeIndex;
    for (let k = 0; k < options.length; k++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) {
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
        onClick={() => {
          setOpen((o) => !o);
          const i = options.findIndex((o) => o.value === value);
          setActiveIndex(i >= 0 ? i : 0);
        }}
        onKeyDown={(e) => {
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
          buttonClassName ?? "",
        ].join(" ")}
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
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
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const opt = options[activeIndex];
            if (opt && !opt.disabled) pick(opt.value);
          } else if (e.key === "Tab") {
            setOpen(false);
          }
        }}
      >
        <div className="max-h-60 overflow-auto p-1 app-scrollbar app-scrollbar-no-gutter">
          {options.map((o, idx) => {
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
                  isSelected
                    ? "bg-(--color-primary) text-(--color-text-inverse)"
                    : "text-(--color-text-primary)",
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
      </div>
    </div>
  );
}

export default function EspecialidadesToolbar(props: {
  q: string;
  onQChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  perPage: number;
  onPerPageChange: (v: number) => void;
  onNew: () => void;
}) {
  const { q, onQChange, statusFilter, onStatusChange, perPage, onPerPageChange, onNew } = props;

  const statusOptions: Opt[] = [
    { value: "ALL", label: "Todos" },
    { value: "ACTIVO", label: "Activos" },
    { value: "INACTIVO", label: "Inactivos" },
    { value: "SUSPENDIDO", label: "Suspendidos" },
  ];

  const perPageOptions: Opt[] = [
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Buscar por código o descripción"
          className={[
            "h-10 rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3",
            "text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)",
            "basis-full lg:basis-auto lg:flex-1 min-w-65",
          ].join(" ")}
        />

        <SelectMenu
          value={String(statusFilter)}
          onChange={(v) => onStatusChange(v === "ALL" ? "ALL" : (v as RecordStatus))}
          options={statusOptions}
          ariaLabel="Filtrar por estado"
          buttonClassName="w-full sm:w-auto min-w-[160px]"
          menuClassName="min-w-[120px]"
        />

        <SelectMenu
          value={String(perPage)}
          onChange={(v) => onPerPageChange(Number(v))}
          options={perPageOptions}
          ariaLabel="Registros por página"
          buttonClassName="w-full sm:w-auto min-w-[96px]"
          menuClassName="min-w-[90px]"
        />

        <button
          type="button"
          className="h-10 rounded-xl px-4 text-sm font-medium bg-(--color-primary) text-(--color-text-inverse) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto"
          onClick={onNew}
        >
          Nuevo
        </button>
      </div>
    </div>
  );
}
