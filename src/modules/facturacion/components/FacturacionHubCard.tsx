import type { FacturacionHubItem } from "../types/facturacionHub.types";

type Props = {
  item: FacturacionHubItem;
  active: boolean;
  onSelect: () => void;
};

export default function FacturacionHubCard({ item, active, onSelect }: Props) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full h-full",
        "flex items-center gap-5",
        "px-4 py-4 sm:px-6 sm:py-5",
        "text-left",
        "border transition-transform duration-150 ease-out",
        "hover:scale-[1.015]",
        "rounded-lg",
        active
          ? "bg-(--color-primary) border-(--color-primary)"
          : "bg-(--color-surface) border-(--color-panel-context)",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-9 w-9 sm:h-10 sm:w-10 shrink-0",
          active ? "text-(--color-text-inverse)" : "text-(--color-primary)",
        ].join(" ")}
        strokeWidth={1.4}
        aria-hidden
      />

      <div className="min-w-0">
        <div
          className={[
            "text-lg sm:text-xl font-bold leading-tight truncate",
            active ? "text-(--color-text-inverse)" : "text-(--color-text-primary)",
          ].join(" ")}
        >
          {item.title}
        </div>

        <div
          className={[
            "mt-1 text-sm font-normal leading-snug truncate",
            active ? "text-(--color-text-inverse)/85" : "text-(--color-text-secondary)",
          ].join(" ")}
        >
          {item.description}
        </div>
      </div>
    </button>
  );
}
