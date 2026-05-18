import type { Paquete, PaginatedResponse } from "../../types/paquetes.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { ficherosCodigoColumn, ficherosEstadoColumn, ficherosMainColumn } from "../../utils/ficherosGridColumns";
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
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  onRefresh?: () => void;
  sort?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (columnId: string) => void;
}) {
  const {
    data,
    loading,
    selectedId,
    onSelect,
    onPrev,
    onNext,
    onFirst,
    onLast,
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
  } = props;

  const columns: DataGridColumnDef<Paquete>[] = [
    ficherosCodigoColumn<Paquete>(),
    ficherosMainColumn<Paquete>({
      id: "descripcion",
      header: "Paquete",
      exportValue: (x) => x.descripcion,
      cell: (x) => {
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
    }),
    ficherosEstadoColumn<Paquete>(),
  ];

  return (
    <CrudListGrid
      rows={data.data}
      columns={columns}
      loading={loading}
      meta={data.meta}
      selectedId={selectedId}
      getRowId={(x) => x.id}
      onSelect={onSelect}
      onPrev={onPrev}
      onNext={onNext}
      onFirst={onFirst}
      onLast={onLast}
      onRefresh={onRefresh}
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      exportFilename="paquetes"
    />
  );
}
