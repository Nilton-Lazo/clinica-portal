import type { Paquete, PaginatedResponse } from "../../types/paquetes.types";
import { StatusBadge } from "../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { formatDecimalDisplay } from "../../../../shared/constants/decimalPrecision";

function vigenciaDisplay(iso: string): string {
  const t = (iso ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "—";
  const [y, m, d] = t.split("-");
  return `${d}/${m}/${y}`;
}

function diasHospitalizacionDisplay(d: number | null): string {
  if (d === null) return "—";
  return `${d} días`;
}

export default function PaquetesTable(props: {
  data: PaginatedResponse<Paquete>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Paquete) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;

  const columns: DataTableColumn<Paquete>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-24 shrink-0",
      cellClassName: "px-3 py-2 text-center tabular-nums align-middle whitespace-nowrap w-24 max-w-24",
      render: (x) => x.codigo || "—",
    },
    {
      key: "descripcion",
      header: "Paquete",
      headerClassName: "text-left min-w-0 w-[50%]",
      cellClassName: "px-3 py-2 align-top min-w-0",
      render: (x) => {
        const tc = (x.tarifa?.codigo ?? "").trim();
        const td = (x.tarifa?.descripcion_tarifa ?? "").trim();
        const tarifaLine = tc && td ? `${tc} · ${td}` : tc || td || "—";
        return (
          <div className="min-w-0 wrap-anywhere">
            <div className="whitespace-normal text-(--color-text-primary)">{x.descripcion || "—"}</div>
            <div className="mt-0.5 whitespace-normal text-xs text-(--color-text-secondary) wrap-anywhere">
              {tarifaLine}
              {` · S/ ${formatDecimalDisplay(x.precio_sin_igv)} sin IGV · Vig. ${vigenciaDisplay(x.vigencia_actual)} · ${diasHospitalizacionDisplay(x.dias_hospitalizacion)}`}
            </div>
          </div>
        );
      },
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44 shrink-0",
      cellClassName: "px-3 py-2 text-center align-middle whitespace-nowrap w-44",
      render: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
      <DataTable
        rows={data.data}
        columns={columns}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        tableClassName="table-fixed w-full max-w-full"
      />

      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
