import { formatDecimalFixed } from "../../../shared/constants/decimalPrecision";

export function ReporteSolesAmount(props: { value: string; muted?: boolean }) {
  const raw = String(props.value ?? "").trim();
  const muted = props.muted ?? false;

  if (raw === "—" || raw === "") {
    return <span className="text-(--color-text-secondary)">—</span>;
  }

  const n = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n)) {
    return <span className="text-(--color-text-secondary)">{raw}</span>;
  }

  const numCls = muted
    ? "min-w-14 text-right font-semibold tabular-nums text-(--color-text-secondary)"
    : "min-w-14 text-right font-semibold tabular-nums text-(--color-text-primary)";

  return (
    <div className="inline-flex items-baseline justify-end gap-0 text-sm">
      <span className="w-8 shrink-0 text-right tabular-nums text-(--color-text-secondary)">S/. </span>
      <span className={numCls}>{formatDecimalFixed(n, 2)}</span>
    </div>
  );
}
