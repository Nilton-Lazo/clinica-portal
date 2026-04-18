import * as React from "react";
import { CAJA_HUB_ITEMS, type CajaHubItem } from "../services/cajaHub.registry";
import CajaHubCard from "../components/CajaHubCard";

const GRID_SLOTS = 8;

export default function CajaHomePage() {
  const slots = React.useMemo((): (CajaHubItem | null)[] => {
    const items: (CajaHubItem | null)[] = [...CAJA_HUB_ITEMS];
    while (items.length < GRID_SLOTS) items.push(null);
    return items.slice(0, GRID_SLOTS);
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="hidden h-full min-h-0 grid-cols-2 grid-rows-4 gap-3 lg:grid">
        {slots.map((item, i) =>
          item ? (
            <CajaHubCard key={item.id} item={item} />
          ) : (
            <div key={`empty-${i}`} className="min-h-0" aria-hidden />
          )
        )}
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-3 overflow-y-auto overflow-x-hidden p-1 content-start app-scrollbar sm:grid-cols-2 lg:hidden">
        {CAJA_HUB_ITEMS.map((item) => (
          <CajaHubCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
