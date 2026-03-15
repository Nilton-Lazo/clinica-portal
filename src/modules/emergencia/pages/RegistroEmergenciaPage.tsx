import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CrudSplitLayout } from "../../ficheros/components/CrudSplitLayout";
import type { RegistroEmergencia } from "../../types/registroEmergencia.types";
import { useRegistroEmergencia } from "../registro/hooks/useRegistroEmergencia";
import RegistroEmergenciaToolbar from "../registro/components/RegistroEmergenciaToolbar";
import RegistroEmergenciaTable from "../registro/components/RegistroEmergenciaTable";
import RegistroEmergenciaMobileList from "../registro/components/RegistroEmergenciaMobileList";
import RegistroEmergenciaDetailCard from "../registro/components/RegistroEmergenciaDetailCard";

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = React.useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true
  );
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isLgUp;
}

const tableAndPagination = (
  vm: ReturnType<typeof useRegistroEmergencia>,
  onSelectRow: (row: RegistroEmergencia | null) => void
) => (
  <>
    <RegistroEmergenciaTable
      data={vm.data}
      loading={vm.loading}
      selectedId={vm.selected?.id ?? null}
      onSelect={onSelectRow}
      page={vm.page}
      onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
      onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
      onFirst={() => vm.setPage(1)}
      onLast={() => vm.setPage(vm.data.meta.last_page)}
    />
    <RegistroEmergenciaMobileList
      data={vm.data}
      loading={vm.loading}
      selectedId={vm.selected?.id ?? null}
      onSelect={onSelectRow}
      page={vm.page}
      onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
      onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
      onFirst={() => vm.setPage(1)}
      onLast={() => vm.setPage(vm.data.meta.last_page)}
    />
  </>
);

export default function RegistroEmergenciaPage() {
  const vm = useRegistroEmergencia();
  const navigate = useNavigate();
  const isLgUp = useIsLgUp();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  const handleNew = React.useCallback(() => {
    navigate("/emergencia/registro/nuevo");
  }, [navigate]);

  const handleSelectRow = React.useCallback(
    (row: RegistroEmergencia | null) => {
      vm.selectRow(row);
      if (row && !isLgUp) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }
    },
    [vm, isLgUp]
  );

  return (
    <div className="flex w-full flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:gap-2">
      <div className="w-full shrink-0">
        <RegistroEmergenciaToolbar
          q={vm.q}
          onQChange={vm.setQ}
          fechaDesde={vm.fechaDesde}
          onFechaDesdeChange={vm.setFechaDesde}
          fechaHasta={vm.fechaHasta}
          onFechaHastaChange={vm.setFechaHasta}
          perPage={vm.perPage}
          onPerPageChange={(n) => vm.setPerPage(n)}
          onNew={handleNew}
          periodPreset={vm.periodPreset}
          onPeriodPresetChange={vm.setPeriodPreset}
        />
      </div>

      {vm.selected ? (
        <CrudSplitLayout
          formWidth="440px"
          rightColumnMode="fill"
          rightRef={formRef}
          left={tableAndPagination(vm, handleSelectRow)}
          right={
            <RegistroEmergenciaDetailCard
              selected={vm.selected}
              onClose={() => handleSelectRow(null)}
            />
          }
        />
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {tableAndPagination(vm, handleSelectRow)}
        </div>
      )}
    </div>
  );
}
