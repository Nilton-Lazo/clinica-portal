import type { EmergenciaHubItem } from "../types/emergenciaHub.types";

type Props = {
  item: EmergenciaHubItem;
  active: boolean;
  onSelect: () => void;
};

export default function EmergenciaHubCard({ item, active, onSelect }: Props) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full h-full min-h-[4.5rem]",
        "flex items-center gap-4",
        "px-5 py-4",
        "text-left rounded-xl border",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
        active
          ? "bg-(--color-primary) border-(--color-primary) shadow-md"
          : "bg-(--color-surface) border-(--color-border) hover:border-(--color-primary)/40 hover:shadow-sm hover:bg-(--color-surface-hover)",
      ].join(" ")}
    >
      <div
        className={[
          "h-12 w-12 rounded-xl shrink-0",
          "flex items-center justify-center transition-colors",
          active ? "bg-white/15" : "bg-(--color-primary)/10",
        ].join(" ")}
      >
        <Icon
          className={["h-6 w-6", active ? "text-white" : "text-(--color-primary)"].join(" ")}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0">
        <div
          className={[
            "text-base font-bold leading-tight truncate",
            active ? "text-white" : "text-(--color-text-primary)",
          ].join(" ")}
        >
          {item.title}
        </div>
        <div
          className={[
            "mt-1 text-sm leading-snug truncate",
            active ? "text-white/75" : "text-(--color-text-secondary)",
          ].join(" ")}
        >
          {item.description}
        </div>
      </div>
    </button>
  );
}
