import * as React from "react";
import { useAgendaMedica } from "./useAgendaMedica";

export type AgendaMedicaVm = ReturnType<typeof useAgendaMedica>;

export const AgendaMedicaContext = React.createContext<AgendaMedicaVm | null>(null);
