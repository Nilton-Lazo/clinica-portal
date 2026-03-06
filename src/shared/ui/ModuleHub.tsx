import { ChevronRight, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type HubAction = {
  id: string;
  label: string;
  to: string;
};

export type HubItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  actions: HubAction[];
};

type Props = {
  items: HubItem[];
  onNavigate: (to: string) => void;
};

function HubCard({ item, onNavigate }: { item: HubItem; onNavigate: (to: string) => void }) {
  const Icon = item.icon;
  const hasActions = item.actions.length > 0;

  return (
    <div className="flex flex-col rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => onNavigate(item.to)}
        className={[
          "group w-full flex items-center gap-3",
          "px-4 py-4",
          "text-left",
          "bg-(--color-panel-bg)",
          "hover:bg-(--color-surface-hover)",
          "transition-colors",
          hasActions ? "border-b border-(--color-border)" : "",
        ].join(" ")}
      >
        <div
          className={[
            "h-10 w-10 rounded-lg shrink-0",
            "flex items-center justify-center",
            "bg-(--color-primary)/10",
            "group-hover:bg-(--color-primary)/20",
            "transition-colors",
          ].join(" ")}
        >
          <Icon
            className="h-5 w-5 text-(--color-primary)"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-(--color-text-primary) leading-tight truncate">
            {item.title}
          </div>
          <div className="mt-0.5 text-xs text-(--color-text-secondary) leading-snug truncate">
            {item.description}
          </div>
        </div>

        <ExternalLink
          className="h-3.5 w-3.5 shrink-0 text-(--color-text-secondary) opacity-0 group-hover:opacity-60 transition-opacity"
          aria-hidden="true"
        />
      </button>

      {hasActions && (
        <ul className="flex flex-col">
          {item.actions.map((action, idx) => (
            <li key={action.id} className={idx < item.actions.length - 1 ? "border-b border-(--color-border)" : ""}>
              <button
                type="button"
                onClick={() => onNavigate(action.to)}
                className={[
                  "group w-full flex items-center justify-between gap-3",
                  "px-4 py-2.5",
                  "text-sm text-left",
                  "text-(--color-text-primary)",
                  "hover:bg-(--color-surface-hover)",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
                ].join(" ")}
              >
                <span className="min-w-0 truncate">{action.label}</span>
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-(--color-text-secondary) group-hover:text-(--color-primary) transition-colors"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!hasActions && (
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => onNavigate(item.to)}
            className={[
              "w-full h-9 rounded-lg",
              "bg-(--color-primary) text-(--color-text-inverse)",
              "text-xs font-semibold",
              "hover:bg-(--color-primary-hover)",
              "active:bg-(--color-primary-active)",
              "transition-colors",
            ].join(" ")}
          >
            Abrir {item.title}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ModuleHub({ items, onNavigate }: Props) {
  return (
    <div
      className={[
        "w-full h-full",
        "overflow-y-auto app-scrollbar",
        "p-1",
      ].join(" ")}
    >
      <div
        className={[
          "grid gap-3",
          "grid-cols-1",
          "sm:grid-cols-2",
          "lg:grid-cols-3",
          "xl:grid-cols-4",
          "auto-rows-min",
        ].join(" ")}
      >
        {items.map((item) => (
          <HubCard key={item.id} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
