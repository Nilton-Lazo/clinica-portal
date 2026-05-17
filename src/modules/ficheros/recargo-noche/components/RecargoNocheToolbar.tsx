import * as React from "react";
import type { StatusFilter } from "../hooks/useRecargoNoche";
import type { TarifaOperativa } from "../../services/recargoNoche.service";
import { SelectMenu } from "../../../../shared/ui/SelectMenu";
import { PrimaryButton } from "../../../../shared/ui/buttons";
import {
  FicherosCrudToolbarActions,
  FicherosCrudToolbarRow,
  ficherosToolbarSelectMdClass,
  ficherosToolbarSelectStatusClass,
} from "../../components/FicherosCrudToolbar";

type Opt = { value: string; label: string };

export default function RecargoNocheToolbar(props: {
  tarifas: TarifaOperativa[];
  tarifasLoading: boolean;
  tarifaId: number | null;
  onTarifaChange: (id: number | null) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  onNew: () => void;
}) {
  const { tarifas, tarifasLoading, tarifaId, onTarifaChange, statusFilter, onStatusChange, onNew } = props;

  const tarifaOptions: Opt[] = React.useMemo(
    () => [
      { value: "", label: "Seleccionar tarifario" },
      ...tarifas.map((t) => ({
        value: String(t.id),
        label: `${t.codigo} · ${t.descripcion_tarifa ?? ""}`.trim() || String(t.id),
      })),
    ],
    [tarifas],
  );

  const statusOptions: Opt[] = [
    { value: "ALL", label: "Todos" },
    { value: "ACTIVO", label: "Activos" },
    { value: "INACTIVO", label: "Inactivos" },
    { value: "SUSPENDIDO", label: "Pendiente" },
  ];

  return (
    <FicherosCrudToolbarRow>
      <SelectMenu
        value={tarifaId != null ? String(tarifaId) : ""}
        onChange={(v) => onTarifaChange(v ? Number(v) : null)}
        options={tarifaOptions}
        ariaLabel="Tarifario"
        disabled={tarifasLoading}
        buttonClassName={`${ficherosToolbarSelectMdClass} min-w-[220px] shrink-0 basis-full sm:basis-auto`}
        menuClassName="min-w-[220px]"
      />
      <FicherosCrudToolbarActions>
        <SelectMenu
          value={String(statusFilter)}
          onChange={(v) => onStatusChange(v as StatusFilter)}
          options={statusOptions}
          ariaLabel="Estado"
          buttonClassName={ficherosToolbarSelectStatusClass}
          menuClassName="min-w-[120px]"
        />
        <PrimaryButton className="w-full shrink-0 sm:w-auto" onClick={onNew} disabled={!tarifaId}>
          Nuevo
        </PrimaryButton>
      </FicherosCrudToolbarActions>
    </FicherosCrudToolbarRow>
  );
}
