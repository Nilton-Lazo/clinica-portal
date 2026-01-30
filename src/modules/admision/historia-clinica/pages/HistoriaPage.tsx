import * as React from "react";
import { useNavigate } from "react-router-dom";

import { useHistoriaClinica } from "../hooks/useHistoriaClinica";
import NoticeBanner, { type Notice } from "../components/NoticeBanner";
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

type NoticeController = {
  setNotice?: (n: Notice) => void;
  clearNotice?: () => void;
};

export default function HistoriaClinicaPage() {
  const vm = useHistoriaClinica();
  const navigate = useNavigate();

  const isLgUp = useIsLgUp();
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const handleCreate = React.useCallback(() => {
    vm.clearSelection();
    navigate("/admision/historia-clinica/nuevo/datos-generales");
  }, [navigate, vm]);

  const handleEdit = React.useCallback(() => {
    if (!vm.selected) return;
    navigate(`/admision/historia-clinica/${vm.selected.id}/datos-generales`);
  }, [navigate, vm.selected]);

  const handleSelect = React.useCallback(
    (x: (typeof vm)["data"]["data"][number]) => {
      vm.onSelect(x);

      if (isLgUp) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    },
    [isLgUp, vm]
  );

  const handleCloseNotice = React.useCallback(() => {
    const ctl = vm as unknown as NoticeController;

    if (typeof ctl.clearNotice === "function") {
      ctl.clearNotice();
      return;
    }

    if (typeof ctl.setNotice === "function") {
      ctl.setNotice(null);
    }
  }, [vm]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div ref={listRef} className="w-full">
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
          canEdit={vm.canEdit}
          onCreate={handleCreate}
          onEdit={handleEdit}
        />
      </div>

      <NoticeBanner notice={vm.notice} onClose={handleCloseNotice} />

      <div className="min-w-0">
        <HistoriaClinicaTable
          data={vm.data}
          loading={vm.loading}
          selectedId={vm.selectedId}
          onSelect={handleSelect}
          page={vm.page}
          onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
          onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
        />

        <HistoriaClinicaMobileList
          data={vm.data}
          loading={vm.loading}
          selectedId={vm.selectedId}
          onSelect={handleSelect}
          page={vm.page}
          onPrev={() => vm.setPage((p) => Math.max(1, p - 1))}
          onNext={() => vm.setPage((p) => Math.min(vm.data.meta.last_page, p + 1))}
        />
      </div>
    </div>
  );
}
