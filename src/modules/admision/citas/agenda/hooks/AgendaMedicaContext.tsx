import * as React from "react";
import { useAgendaMedica } from "./useAgendaMedica";

type AgendaMedicaVm = ReturnType<typeof useAgendaMedica>;

const AgendaMedicaContext = React.createContext<AgendaMedicaVm | null>(null);

export function AgendaMedicaProvider({ children }: { children: React.ReactNode }) {
  const vm = useAgendaMedica();
  return <AgendaMedicaContext.Provider value={vm}>{children}</AgendaMedicaContext.Provider>;
}

export function useAgendaMedicaContext() {
  const ctx = React.useContext(AgendaMedicaContext);
  if (!ctx) {
    throw new Error("useAgendaMedicaContext debe usarse dentro de AgendaMedicaProvider");
  }
  return ctx;
}
