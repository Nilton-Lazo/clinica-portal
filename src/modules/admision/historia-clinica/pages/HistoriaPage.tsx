import * as React from "react";
import { useNavigate } from "react-router-dom";

import { toastService } from "../../../../shared/notifications";
import { getWizardCatalog } from "../wizard/wizardCatalogCache";
import { useHistoriaClinica } from "../hooks/useHistoriaClinica";
import HistoriaClinicaToolbar from "../components/HistoriaClinicaToolbar";
import HistoriaClinicaTable from "../components/HistoriaClinicaTable";
import HistoriaClinicaMobileList from "../components/HistoriaClinicaMobileList";

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

export default function HistoriaClinicaPage() {
  const vm = useHistoriaClinica();
  const navigate = useNavigate();

  const noticeKeyRef = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    if (!vm.notice?.text) { noticeKeyRef.current = null; return; }
    const key = `${vm.notice.type}:${vm.notice.text}`;
    if (noticeKeyRef.current === key) return;
    noticeKeyRef.current = key;
    if (vm.notice.type === "success") toastService.showSuccess(vm.notice.text);
    else toastService.showError(vm.notice.text);
  }, [vm.notice]);

  React.useEffect(() => {
    void getWizardCatalog();
  }, []);

  const isLgUp = useIsLgUp();
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const handleCreate = React.useCallback(() => {
    vm.clearSelection();
    navigate("/admision/historia-clinica/nuevo/datos-generales");
  }, [navigate, vm]);

  const handleSelect = React.useCallback(
    (x: (typeof vm)["data"]["data"][number]) => {
      vm.onSelect(x);
      navigate(`/admision/historia-clinica/${x.id}/datos-generales`);

      if (!isLgUp) {
        requestAnimationFrame(() => {
          listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    },
    [isLgUp, navigate, vm]
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden lg:gap-2">
      <div ref={listRef} className="shrink-0 w-full">
        <HistoriaClinicaToolbar
          q={vm.q}
          onQChange={vm.setQ}
          filiacionFrom={vm.filiacionFrom}
          filiacionTo={vm.filiacionTo}
          onFiliacionFromChange={vm.setFrom}
          onFiliacionToChange={vm.setTo}
          statusFilter={vm.statusFilter}
          onStatusChange={vm.setStatusFilter}
          perPage={vm.perPage}
          onPerPageChange={(n) => vm.setPerPage(n)}
          onCreate={handleCreate}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <HistoriaClinicaTable
          data={vm.data}
          loading={vm.loading}
          selectedId={vm.selectedId}
          onSelect={handleSelect}
          onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
          onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          onFirst={() => vm.setPage(1)}
          onLast={() => vm.setPage(vm.data.meta.last_page)}
          onRefresh={() => void vm.refresh()}
          sort={vm.sort}
          sortDir={vm.sortDir}
          onToggleSort={vm.toggleSort}
        />

        <HistoriaClinicaMobileList
          data={vm.data}
          loading={vm.loading}
          selectedId={vm.selectedId}
          onSelect={handleSelect}
          page={vm.page}
          onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
          onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
          onFirst={() => vm.setPage(1)}
          onLast={() => vm.setPage(vm.data.meta.last_page)}
        />
      </div>
    </div>
  );
}
