import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toastService } from "../../../../../shared/notifications";
import { usePresupuestosLista } from "../hooks/usePresupuestosLista";
import PresupuestosToolbar from "../components/PresupuestosToolbar";
import PresupuestosTable from "../components/PresupuestosTable";
import PresupuestosMobileList from "../components/PresupuestosMobileList";
import { prefetchPresupuestoShow } from "../services/presupuestoShowCache";

export default function PresupuestosPage() {
  const navigate = useNavigate();
  const vm = usePresupuestosLista();

  const noticeKeyRef = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    if (!vm.notice?.text) {
      noticeKeyRef.current = null;
      return;
    }
    const key = `${vm.notice.type}:${vm.notice.text}`;
    if (noticeKeyRef.current === key) return;
    noticeKeyRef.current = key;
    if (vm.notice.type === "success") toastService.showSuccess(vm.notice.text);
    else toastService.showError(vm.notice.text);
  }, [vm.notice]);

  const handleGenerar = React.useCallback(() => {
    navigate("/admision/citas/presupuestos/nuevo");
  }, [navigate]);

  const handleOpenRow = React.useCallback(
    (id: number) => {
      navigate(`/admision/citas/presupuestos/${id}`);
    },
    [navigate]
  );

  const handlePrefetchRow = React.useCallback((id: number) => {
    prefetchPresupuestoShow(id);
  }, []);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden lg:gap-2">
      <div className="w-full shrink-0">
        <PresupuestosToolbar
          q={vm.q}
          onQChange={vm.setQ}
          vigenciaDesde={vm.vigenciaDesde}
          vigenciaHasta={vm.vigenciaHasta}
          onVigenciaDesdeChange={vm.setVigenciaDesde}
          onVigenciaHastaChange={vm.setVigenciaHasta}
          estadoFilter={vm.estadoFilter}
          onEstadoChange={vm.setEstadoFilter}
          perPage={vm.perPage}
          onPerPageChange={vm.setPerPage}
          onGenerar={handleGenerar}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PresupuestosTable
          data={vm.data}
          loading={vm.loading}
          onOpenRow={handleOpenRow}
          onPrefetchRow={handlePrefetchRow}
          onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
          onNext={() => vm.setPage((p) => Math.min(Math.max(1, vm.data.meta.last_page), p + 1))}
          onFirst={() => vm.setPage(1)}
          onLast={() => vm.setPage(Math.max(1, vm.data.meta.last_page))}
        />
        <PresupuestosMobileList
          data={vm.data}
          loading={vm.loading}
          onOpenRow={handleOpenRow}
          onPrefetchRow={handlePrefetchRow}
          onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
          onNext={() => vm.setPage((p) => Math.min(Math.max(1, vm.data.meta.last_page), p + 1))}
          onFirst={() => vm.setPage(1)}
          onLast={() => vm.setPage(Math.max(1, vm.data.meta.last_page))}
        />
      </div>
    </div>
  );
}
