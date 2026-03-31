import * as React from "react";
import { SecondaryButton } from "../../../../../shared/ui/buttons";
import { useDebouncedValue } from "../../../../../shared/hooks/useDebouncedValue";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import type { PaqueteLookup } from "../../../../ficheros/types/paqueteServicios.types";
import { listPaquetesByTarifa } from "../../../../ficheros/services/paqueteServicios.service";
import { formatDecimalFixed } from "../../../../../shared/constants/decimalPrecision";
import { getIgvPorcentaje } from "../../agenda/services/atencionCita.service";

type Variant = "drawer" | "fullscreen";

type Props = {
  open: boolean;
  variant: Variant;
  tarifaId: number | null;
  onClose: () => void;
  onPicked: (p: PaqueteLookup) => void;
  title?: string;
  description?: string;
};

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLgUp;
}

export default function PaquetePicker(props: Props) {
  const {
    open,
    variant,
    tarifaId,
    onClose,
    onPicked,
    title = "Seleccionar paquete",
    description = "Paquetes activos de esta tarifa. Elija una fila.",
  } = props;

  const isLgUp = useIsLgUp();
  const [search, setSearch] = React.useState("");
  const q = useDebouncedValue(search, 250);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<PaqueteLookup[]>([]);
  const [selected, setSelected] = React.useState<PaqueteLookup | null>(null);
  const [igvPct, setIgvPct] = React.useState(18);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    getIgvPorcentaje().then(setIgvPct).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!open || tarifaId == null || tarifaId <= 0) {
      return;
    }
    setLoading(true);
    const requestId = ++requestIdRef.current;
    listPaquetesByTarifa(tarifaId)
      .then((rows) => {
        if (requestId !== requestIdRef.current) return;
        setItems(rows);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setItems([]);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [open, tarifaId]);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(null);
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((p) => {
      const c = (p.codigo ?? "").toLowerCase();
      const d = (p.descripcion ?? "").toLowerCase();
      return c.includes(t) || d.includes(t);
    });
  }, [items, q]);

  const columns: DataTableColumn<PaqueteLookup>[] = React.useMemo(
    () => [
      {
        key: "codigo",
        header: "Código",
        headerClassName: "text-center w-28 align-middle",
        cellClassName: "px-3 py-2 text-center tabular-nums align-middle",
        render: (x) => x.codigo || "—",
      },
      {
        key: "descripcion",
        header: "Descripción",
        headerClassName: "text-left min-w-0 align-middle",
        cellClassName: "px-3 py-2 max-w-[280px] align-middle",
        render: (x) => (
          <span className="block wrap-break-word whitespace-normal text-left leading-snug">{x.descripcion || "—"}</span>
        ),
      },
      {
        key: "precio_final",
        header: <span className="whitespace-nowrap">Precio final</span>,
        headerClassName: "text-right w-32 min-w-[7rem] align-middle",
        cellClassName: "px-3 py-2 text-right align-middle",
        render: (x) => {
          const sin = parseFloat(String(x.precio_sin_igv ?? 0)) || 0;
          const conIgv = Math.round((sin + sin * (igvPct / 100)) * 1000) / 1000;
          return (
            <div className="flex w-full justify-end">
              <div className="inline-flex items-baseline gap-0 text-sm">
                <span className="w-8 shrink-0 text-right tabular-nums">S/. </span>
                <span className="min-w-14 text-right tabular-nums">{formatDecimalFixed(conIgv, 2)}</span>
              </div>
            </div>
          );
        },
      },
    ],
    [igvPct]
  );

  const handleRowSelect = React.useCallback(
    (p: PaqueteLookup) => {
      setSelected(p);
      onPicked(p);
      onClose();
    },
    [onPicked, onClose]
  );

  const emptyText =
    tarifaId == null || tarifaId <= 0
      ? "No hay tarifa asignada al plan."
      : loading
        ? "Cargando…"
        : items.length === 0
          ? "No hay paquetes activos para esta tarifa."
          : "Ningún paquete coincide con la búsqueda.";

  const container = (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-(--color-text-primary)">{title}</div>
            <div className="text-xs text-(--color-text-secondary)">{description}</div>
          </div>
          <SecondaryButton type="button" onClick={onClose}>
            Cerrar
          </SecondaryButton>
        </div>

        <div className="mt-3">
          <label className="text-sm text-(--color-text-primary)">Buscar</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código o descripción"
            disabled={tarifaId == null || tarifaId <= 0}
            className="mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        {isLgUp ? (
          <DataTable
            rows={filtered}
            columns={columns}
            loading={loading}
            selectedId={selected?.id ?? null}
            getRowId={(x) => String(x.id)}
            onSelect={handleRowSelect}
            emptyText={emptyText}
          />
        ) : (
          <MobileEntityList
            rows={filtered}
            loading={loading}
            emptyText={emptyText}
            selectedId={selected?.id ?? null}
            getRowId={(x) => x.id}
            onSelect={handleRowSelect}
            renderMain={(x) => {
              const sin = parseFloat(String(x.precio_sin_igv ?? 0)) || 0;
              const conIgv = Math.round((sin + sin * (igvPct / 100)) * 1000) / 1000;
              return (
                <div className="flex flex-col gap-1 text-left">
                  <div className="font-semibold tabular-nums text-(--color-primary)">{x.codigo || "—"}</div>
                  <div className="text-sm text-(--color-text-primary)">{x.descripcion || "—"}</div>
                  <div className="text-sm tabular-nums text-(--color-text-secondary)">
                    Precio final S/. {formatDecimalFixed(conIgv, 2)}
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (variant === "fullscreen") {
    return (
      <div
        className="fixed inset-0 z-40 flex items-stretch justify-center bg-black/40"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex h-full w-full max-w-6xl flex-col bg-(--color-app-bg) p-4" onClick={(e) => e.stopPropagation()}>
          {container}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/40"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex h-full w-full max-w-[720px] flex-col bg-(--color-app-bg) p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {container}
      </div>
    </div>
  );
}
