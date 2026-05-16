import { Link } from "react-router-dom";
import type { CajaHubItem } from "../services/cajaHub.registry";

type Props = {
  item: CajaHubItem;
};

export default function CajaHubCard({ item }: Props) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={[
        "block w-full h-full min-h-[4.5rem]",
        "flex items-center gap-4",
        "px-5 py-4",
        "text-left rounded-xl border",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
        "bg-(--color-surface) border-(--color-border)",
        "hover:border-(--color-primary)/40 hover:shadow-sm hover:bg-(--color-surface-hover)",
      ].join(" ")}
    >
      <div
        className={[
          "h-12 w-12 rounded-xl shrink-0",
          "flex items-center justify-center transition-colors",
          "bg-(--color-primary)/10",
        ].join(" ")}
      >
        <Icon className="h-6 w-6 text-(--color-primary)" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <div className="text-base font-bold leading-tight truncate text-(--color-text-primary)">{item.title}</div>
        <div className="mt-1 text-sm leading-snug truncate text-(--color-text-secondary)">{item.description}</div>
      </div>
    </Link>
  );
}
