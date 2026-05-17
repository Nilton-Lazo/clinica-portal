import type { RecordStatus } from "../../types/turnos.types";
import type { StatusFilter } from "../hooks/useTurnos";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { PrimaryButton } from "../../../../shared/ui/buttons";
import {
  FicherosCrudToolbarActions,
  FicherosCrudToolbarRow,
  ficherosToolbarSearchClass,
  ficherosToolbarSelectPerPageClass,
  ficherosToolbarSelectStatusClass,
} from "../../components/FicherosCrudToolbar";

export default function TurnosToolbar(props: {
  q: string;
  onQChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  perPage: number;
  onPerPageChange: (v: number) => void;
  onNew: () => void;
}) {
  const { q, onQChange, statusFilter, onStatusChange, perPage, onPerPageChange, onNew } = props;

  const statusOptions: SelectOption[] = [
    { value: "ALL", label: "Todos" },
    { value: "ACTIVO", label: "Activos" },
    { value: "INACTIVO", label: "Inactivos" },
    { value: "SUSPENDIDO", label: "Suspendidos" },
  ];

  const perPageOptions: SelectOption[] = [
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <FicherosCrudToolbarRow>
      <input
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        placeholder="BUSCAR POR CÓDIGO O DESCRIPCIÓN"
        className={ficherosToolbarSearchClass}
        aria-label="Buscar por código o descripción"
      />
      <FicherosCrudToolbarActions>
        <SelectMenu
          value={String(statusFilter)}
          onChange={(v) => onStatusChange(v === "ALL" ? "ALL" : (v as RecordStatus))}
          options={statusOptions}
          ariaLabel="Estado"
          buttonClassName={ficherosToolbarSelectStatusClass}
          menuClassName="min-w-[120px]"
        />
        <SelectMenu
          value={String(perPage)}
          onChange={(v) => onPerPageChange(Number(v))}
          options={perPageOptions}
          ariaLabel="Registros por página"
          buttonClassName={ficherosToolbarSelectPerPageClass}
          menuClassName="min-w-[80px]"
        />
        <PrimaryButton className="w-full shrink-0 sm:w-auto" onClick={onNew}>
          Nuevo
        </PrimaryButton>
      </FicherosCrudToolbarActions>
    </FicherosCrudToolbarRow>
  );
}
