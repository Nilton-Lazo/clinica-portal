import * as React from "react";
import { useAgendaMedica } from "./useAgendaMedica";
import { AgendaMedicaContext } from "./AgendaMedicaContext.shared";

export function AgendaMedicaProvider({ children }: { children: React.ReactNode }) {
  const vm = useAgendaMedica();
  return <AgendaMedicaContext.Provider value={vm}>{children}</AgendaMedicaContext.Provider>;
}
