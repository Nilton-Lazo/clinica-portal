import * as React from "react";
import { AgendaMedicaContext } from "./AgendaMedicaContext.shared";

export function useAgendaMedicaContext() {
  const ctx = React.useContext(AgendaMedicaContext);
  if (!ctx) {
    throw new Error("useAgendaMedicaContext debe usarse dentro de AgendaMedicaProvider");
  }
  return ctx;
}
