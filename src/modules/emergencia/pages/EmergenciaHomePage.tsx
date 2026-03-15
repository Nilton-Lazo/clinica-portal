import * as React from "react";
import { useNavigate } from "react-router-dom";
import { EMERGENCIA_HUB } from "../services/emergenciaHub.registry";
import EmergenciaHubCard from "../components/EmergenciaHubCard";
import EmergenciaActionsPanel from "../components/EmergenciaActionsPanel";

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

export default function EmergenciaHomePage() {
  const navigate = useNavigate();
  const isLgUp = useIsLgUp();

  const [selectedId, setSelectedId] = React.useState(EMERGENCIA_HUB[0].id);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const selected = React.useMemo(
    () => EMERGENCIA_HUB.find((x) => x.id === selectedId) ?? EMERGENCIA_HUB[0],
    [selectedId]
  );

  React.useEffect(() => {
    if (isLgUp) setSheetOpen(false);
    else setSheetOpen(true);
  }, [selectedId, isLgUp]);

  const go = React.useCallback((to: string) => {
    navigate(to);
  }, [navigate]);

  type HubItem = (typeof EMERGENCIA_HUB)[number];
  const GRID_SLOTS = 8;
  const slots = React.useMemo((): (HubItem | null)[] => {
    const items: (HubItem | null)[] = [...EMERGENCIA_HUB];
    while (items.length < GRID_SLOTS) items.push(null);
    return items.slice(0, GRID_SLOTS);
  }, []);

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="hidden lg:grid gap-3 lg:grid-cols-[1fr_1fr_minmax(320px,400px)] lg:grid-rows-4 h-full min-h-0">
        <div className="grid grid-cols-1 grid-rows-4 gap-3 min-h-0 lg:row-span-4">
          {slots.slice(0, 4).map((item: HubItem | null, i: number) =>
            item ? (
              <EmergenciaHubCard
                key={item.id}
                item={item}
                active={item.id === selectedId}
                onSelect={() => setSelectedId(item.id)}
              />
            ) : (
              <div key={`empty-1-${i}`} className="min-h-0" aria-hidden />
            )
          )}
        </div>

        <div className="grid grid-cols-1 grid-rows-4 gap-3 min-h-0 lg:row-span-4">
          {slots.slice(4, 8).map((item: HubItem | null, i: number) =>
            item ? (
              <EmergenciaHubCard
                key={item.id}
                item={item}
                active={item.id === selectedId}
                onSelect={() => setSelectedId(item.id)}
              />
            ) : (
              <div key={`empty-2-${i}`} className="min-h-0" aria-hidden />
            )
          )}
        </div>

        <div className="min-h-0 flex flex-col lg:row-span-4">
          <EmergenciaActionsPanel
            item={selected}
            onEnter={() => go(selected.to)}
            onAction={(to) => go(to)}
          />
        </div>
      </div>

      <div
        className={[
          "lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 content-start overflow-y-auto overflow-x-hidden app-scrollbar p-1",
          sheetOpen ? "pb-[calc(60vh+24px)]" : "pb-4",
        ].join(" ")}
      >
        {EMERGENCIA_HUB.map((item) => (
          <EmergenciaHubCard
            key={item.id}
            item={item}
            active={item.id === selectedId}
            onSelect={() => {
              setSelectedId(item.id);
              setSheetOpen(true);
            }}
          />
        ))}
      </div>

      <EmergenciaActionsPanel
        mode="sheet"
        isOpen={sheetOpen && !isLgUp}
        onClose={() => setSheetOpen(false)}
        item={selected}
        onEnter={() => go(selected.to)}
        onAction={(to) => go(to)}
      />
    </div>
  );
}
