import type { ReactNode } from "react";
import { GridCellText } from "../datagrid/GridCellText";
import { formatDecimalFixed } from "../constants/decimalPrecision";
import type { ColumnAlign } from "./columnKinds";
import { EMPTY_CELL, isEmptyValue, formatIsoToDmy, formatTimeHm } from "./cellFormatters";

export function TextCell(props: {
  value: ReactNode;
  align?: ColumnAlign;
  className?: string;
  title?: string;
}) {
  const { value, align = "left", className, title } = props;
  const safeValue = isEmptyValue(value) ? EMPTY_CELL : value;
  return <GridCellText value={safeValue} align={align} className={className} title={title} />;
}

export function NumberCell(props: {
  value: number | string | null | undefined;
  decimals?: number;
  className?: string;
}) {
  const { value, decimals = 0, className } = props;
  const baseClass = "tabular-nums whitespace-nowrap text-sm";
  if (isEmptyValue(value)) {
    return <span className={[baseClass, className ?? ""].filter(Boolean).join(" ")}>{EMPTY_CELL}</span>;
  }
  const numeric = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(numeric)) {
    return <span className={[baseClass, className ?? ""].filter(Boolean).join(" ")}>{EMPTY_CELL}</span>;
  }
  return (
    <span className={[baseClass, className ?? ""].filter(Boolean).join(" ")}>
      {decimals > 0 ? formatDecimalFixed(numeric, decimals) : String(Math.trunc(numeric))}
    </span>
  );
}

export function CurrencyCell(props: {
  value: number | string | null | undefined;
  decimals?: number;
  currencyPrefix?: string;
  muted?: boolean;
  className?: string;
}) {
  const { value, decimals = 2, currencyPrefix = "S/.", muted = false, className } = props;
  const baseClass = [
    "inline-flex w-full items-baseline justify-end gap-0 whitespace-nowrap tabular-nums text-sm",
    muted ? "text-(--color-text-secondary)" : "text-(--color-text-primary)",
  ].join(" ");
  if (isEmptyValue(value)) {
    return (
      <span className={[baseClass, className ?? ""].filter(Boolean).join(" ")}>{EMPTY_CELL}</span>
    );
  }
  const numeric = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) {
    return (
      <span className={[baseClass, className ?? ""].filter(Boolean).join(" ")}>{EMPTY_CELL}</span>
    );
  }
  return (
    <span className={[baseClass, className ?? ""].filter(Boolean).join(" ")}>
      <span className="shrink-0">{currencyPrefix}&nbsp;</span>
      <span>{formatDecimalFixed(numeric, decimals)}</span>
    </span>
  );
}

export function PercentCell(props: {
  value: number | string | null | undefined;
  decimals?: number;
  className?: string;
}) {
  const { value, decimals = 0, className } = props;
  const baseClass = "tabular-nums whitespace-nowrap text-sm";
  if (isEmptyValue(value)) {
    return <span className={[baseClass, "text-(--color-text-secondary)", className ?? ""].filter(Boolean).join(" ")}>{EMPTY_CELL}</span>;
  }
  const numeric = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(numeric) || numeric === 0) {
    return <span className={[baseClass, "text-(--color-text-secondary)", className ?? ""].filter(Boolean).join(" ")}>{EMPTY_CELL}</span>;
  }
  return (
    <span className={[baseClass, className ?? ""].filter(Boolean).join(" ")}>
      {decimals > 0 ? formatDecimalFixed(numeric, decimals) : String(Math.trunc(numeric))}%
    </span>
  );
}

export function DateCell(props: { value?: string | null; className?: string }) {
  const { value, className } = props;
  return (
    <span className={["tabular-nums text-sm whitespace-nowrap", className ?? ""].filter(Boolean).join(" ")}>
      {formatIsoToDmy(value)}
    </span>
  );
}

export function TimeCell(props: { value?: string | null; className?: string }) {
  const { value, className } = props;
  return (
    <span className={["tabular-nums text-sm whitespace-nowrap", className ?? ""].filter(Boolean).join(" ")}>
      {formatTimeHm(value)}
    </span>
  );
}

export function BadgeCell(props: { children: ReactNode; className?: string }) {
  const { children, className } = props;
  return (
    <div className={["flex justify-center", className ?? ""].filter(Boolean).join(" ")}>{children}</div>
  );
}

export function ActionsCell(props: { children: ReactNode; className?: string }) {
  const { children, className } = props;
  return (
    <div
      className={["flex items-center justify-end gap-1", className ?? ""].filter(Boolean).join(" ")}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
