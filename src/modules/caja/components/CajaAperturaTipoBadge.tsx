import { Briefcase, PiggyBank } from "lucide-react";

export function CajaAperturaTipoBadge({ value }: { value: string }) {
  const v = String(value).trim().toUpperCase();
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";

  if (v === "NORMAL") {
    return (
      <span className={`${base} border-(--color-primary) text-(--color-primary)`}>
        <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
        Normal
      </span>
    );
  }
  if (v === "CHICA") {
    return (
      <span className={`${base} border-(--color-warning) text-(--color-warning)`}>
        <PiggyBank className="h-4 w-4 shrink-0" aria-hidden="true" />
        Chica
      </span>
    );
  }

  return (
    <span className={`${base} border-(--color-text-secondary) text-(--color-text-secondary)`}>
      {String(value).trim() || "—"}
    </span>
  );
}
