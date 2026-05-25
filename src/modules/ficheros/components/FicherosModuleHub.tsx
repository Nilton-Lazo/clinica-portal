import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export type FicherosModuleHubOption = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export function FicherosModuleHub({
  options,
}: {
  options: FicherosModuleHubOption[];
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ to, label, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 rounded border border-(--border-color-default) bg-(--color-surface) p-4 transition-colors hover:border-(--color-primary)/40 hover:bg-(--color-surface-hover)"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--color-primary)/10">
              <Icon
                className="h-6 w-6 text-(--color-primary)"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-(--color-text-primary)">
                {label}
              </div>
              <div className="mt-0.5 text-xs text-(--color-text-secondary)">
                {description}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
