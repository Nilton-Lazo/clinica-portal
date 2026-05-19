import type { ReactNode } from "react";
import type { DataGridColumnDef } from "../datagrid/types";
import {
  ActionsCell,
  BadgeCell,
  CurrencyCell,
  DateCell,
  NumberCell,
  PercentCell,
  TextCell,
  TimeCell,
} from "./cells";
import { formatIsoToDmy, formatTimeHm } from "./cellFormatters";
import { defaultAlignForKind, type ColumnAlign, type ColumnKind } from "./columnKinds";

type BaseOpts<T> = {
  id: string;
  header: ReactNode;
  columnLabel?: string;
  align?: ColumnAlign;
  size?: number;
  minSize?: number;
  maxSize?: number;
  sortable?: boolean;
  grow?: boolean;
  enableHiding?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  sortValue?: (row: T) => string | number | null | undefined;
  exportValue?: (row: T) => string | number | null | undefined;
};

function applyDefaults<T>(opts: BaseOpts<T>, kind: ColumnKind): DataGridColumnDef<T> {
  return {
    id: opts.id,
    header: opts.header,
    columnLabel: opts.columnLabel,
    align: opts.align ?? defaultAlignForKind(kind),
    size: opts.size,
    minSize: opts.minSize,
    maxSize: opts.maxSize,
    sortable: opts.sortable ?? false,
    grow: opts.grow,
    enableHiding: opts.enableHiding,
    headerClassName: opts.headerClassName,
    cellClassName: opts.cellClassName,
    sortValue: opts.sortValue,
    exportValue: opts.exportValue,
  };
}

export function textColumn<T>(
  opts: BaseOpts<T> & {
    accessor?: keyof T & string;
    cell?: (row: T) => ReactNode;
    title?: (row: T) => string | undefined;
  }
): DataGridColumnDef<T> {
  const base = applyDefaults(opts, "text");
  return {
    ...base,
    accessor: opts.accessor,
    grow: opts.grow ?? true,
    minSize: opts.minSize ?? 120,
    cell: (row) => {
      if (opts.cell) return opts.cell(row);
      const value = opts.accessor ? (row[opts.accessor] as unknown as ReactNode) : null;
      return <TextCell value={value as ReactNode} align={base.align} title={opts.title?.(row)} />;
    },
  };
}

export function codeColumn<T>(
  opts: BaseOpts<T> & {
    accessor?: keyof T & string;
    value?: (row: T) => string | null | undefined;
    accent?: boolean;
  }
): DataGridColumnDef<T> {
  const base = applyDefaults(opts, "code");
  const tone = opts.accent ? "text-(--color-primary)" : "text-(--color-text-primary)";
  return {
    ...base,
    accessor: opts.accessor,
    size: opts.size ?? 88,
    cellClassName: opts.cellClassName ?? "whitespace-nowrap",
    sortable: opts.sortable ?? true,
    cell: (row) => {
      const raw = opts.value ? opts.value(row) : opts.accessor ? (row[opts.accessor] as unknown as string) : null;
      const safe = raw == null || String(raw).trim() === "" ? "—" : String(raw);
      return <span className={`tabular-nums whitespace-nowrap text-sm ${tone}`}>{safe}</span>;
    },
  };
}

export function numberColumn<T>(
  opts: BaseOpts<T> & {
    accessor?: keyof T & string;
    value?: (row: T) => number | string | null | undefined;
    decimals?: number;
  }
): DataGridColumnDef<T> {
  const base = applyDefaults(opts, "number");
  return {
    ...base,
    accessor: opts.accessor,
    size: opts.size ?? 96,
    cellClassName: opts.cellClassName ?? "whitespace-nowrap",
    cell: (row) => {
      const raw = opts.value
        ? opts.value(row)
        : opts.accessor
          ? (row[opts.accessor] as unknown as number | string)
          : null;
      return <NumberCell value={raw} decimals={opts.decimals ?? 0} />;
    },
  };
}

export function currencyColumn<T>(
  opts: BaseOpts<T> & {
    accessor?: keyof T & string;
    value?: (row: T) => number | string | null | undefined;
    decimals?: number;
    currencyPrefix?: string;
    muted?: boolean;
  }
): DataGridColumnDef<T> {
  const base = applyDefaults(opts, "currency");
  return {
    ...base,
    accessor: opts.accessor,
    size: opts.size ?? 120,
    cellClassName: opts.cellClassName ?? "whitespace-nowrap",
    cell: (row) => {
      const raw = opts.value
        ? opts.value(row)
        : opts.accessor
          ? (row[opts.accessor] as unknown as number | string)
          : null;
      return (
        <CurrencyCell
          value={raw}
          decimals={opts.decimals ?? 2}
          currencyPrefix={opts.currencyPrefix}
          muted={opts.muted}
        />
      );
    },
  };
}

export function percentColumn<T>(
  opts: BaseOpts<T> & {
    accessor?: keyof T & string;
    value?: (row: T) => number | string | null | undefined;
    decimals?: number;
  }
): DataGridColumnDef<T> {
  const base = applyDefaults(opts, "percent");
  return {
    ...base,
    accessor: opts.accessor,
    size: opts.size ?? 80,
    cellClassName: opts.cellClassName ?? "whitespace-nowrap",
    cell: (row) => {
      const raw = opts.value
        ? opts.value(row)
        : opts.accessor
          ? (row[opts.accessor] as unknown as number | string)
          : null;
      return <PercentCell value={raw} decimals={opts.decimals ?? 0} />;
    },
  };
}

export function dateColumn<T>(
  opts: BaseOpts<T> & {
    accessor?: keyof T & string;
    value?: (row: T) => string | null | undefined;
  }
): DataGridColumnDef<T> {
  const base = applyDefaults(opts, "date");
  return {
    ...base,
    accessor: opts.accessor,
    size: opts.size ?? 96,
    cellClassName: opts.cellClassName ?? "whitespace-nowrap",
    sortable: opts.sortable ?? true,
    exportValue:
      opts.exportValue ??
      ((row: T) => {
        const raw = opts.value
          ? opts.value(row)
          : opts.accessor
            ? (row[opts.accessor] as unknown as string)
            : null;
        return formatIsoToDmy(raw);
      }),
    cell: (row) => {
      const raw = opts.value
        ? opts.value(row)
        : opts.accessor
          ? (row[opts.accessor] as unknown as string)
          : null;
      return <DateCell value={raw} />;
    },
  };
}

export function timeColumn<T>(
  opts: BaseOpts<T> & {
    accessor?: keyof T & string;
    value?: (row: T) => string | null | undefined;
  }
): DataGridColumnDef<T> {
  const base = applyDefaults(opts, "time");
  return {
    ...base,
    accessor: opts.accessor,
    size: opts.size ?? 72,
    cellClassName: opts.cellClassName ?? "whitespace-nowrap",
    sortable: opts.sortable ?? true,
    exportValue:
      opts.exportValue ??
      ((row: T) => {
        const raw = opts.value
          ? opts.value(row)
          : opts.accessor
            ? (row[opts.accessor] as unknown as string)
            : null;
        return formatTimeHm(raw);
      }),
    cell: (row) => {
      const raw = opts.value
        ? opts.value(row)
        : opts.accessor
          ? (row[opts.accessor] as unknown as string)
          : null;
      return <TimeCell value={raw} />;
    },
  };
}

export function badgeColumn<T>(
  opts: BaseOpts<T> & {
    render: (row: T) => ReactNode;
  }
): DataGridColumnDef<T> {
  const base = applyDefaults(opts, "badge");
  return {
    ...base,
    size: opts.size ?? 112,
    cellClassName: opts.cellClassName ?? "whitespace-nowrap",
    sortable: opts.sortable ?? true,
    cell: (row) => <BadgeCell>{opts.render(row)}</BadgeCell>,
  };
}

export function actionsColumn<T>(opts: {
  id?: string;
  header?: ReactNode;
  size?: number;
  render: (row: T) => ReactNode;
}): DataGridColumnDef<T> {
  return {
    id: opts.id ?? "actions",
    header: opts.header ?? "",
    align: defaultAlignForKind("actions"),
    size: opts.size ?? 72,
    sortable: false,
    enableHiding: false,
    cellClassName: "whitespace-nowrap",
    cell: (row) => <ActionsCell>{opts.render(row)}</ActionsCell>,
  };
}

export function selectionColumn<T>(opts: {
  id?: string;
  header?: ReactNode;
  render: (row: T) => ReactNode;
}): DataGridColumnDef<T> {
  return {
    id: opts.id ?? "check",
    header: opts.header ?? "",
    align: defaultAlignForKind("selection"),
    size: 40,
    minSize: 40,
    maxSize: 40,
    sortable: false,
    enableHiding: false,
    cellClassName: "px-0 whitespace-nowrap",
    cell: (row) => <div className="flex items-center justify-center">{opts.render(row)}</div>,
  };
}
