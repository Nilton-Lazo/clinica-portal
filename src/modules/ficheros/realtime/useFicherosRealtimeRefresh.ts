import * as React from "react";
import { useRealtimeModuleRefresh } from "../../../shared/realtime/useRealtimeModuleRefresh";

type RefreshableFicherosViewModel = {
  refresh: (next?: { page?: number; perPage?: number }) => void | Promise<unknown>;
  setPage?: (page: number | ((current: number) => number)) => void;
};

export function useFicherosRealtimeRefresh(
  vm: RefreshableFicherosViewModel,
  entities: string[]
): void {
  const entitiesKey = entities.join("|");
  const stableEntities = React.useMemo(() => entitiesKey.split("|"), [entitiesKey]);

  useRealtimeModuleRefresh({
    module: "ficheros",
    entities: stableEntities,
    onEvent: (event) => {
      if (event.action === "created") {
        vm.setPage?.(1);
        void vm.refresh({ page: 1 });
        return;
      }

      void vm.refresh();
    },
  });
}
