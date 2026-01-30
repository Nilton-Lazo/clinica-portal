import { useContext } from "react";
import { PacienteWizardCtx } from "./pacienteWizard.context";

export function usePacienteWizard() {
  const v = useContext(PacienteWizardCtx);
  if (!v) throw new Error("PacienteWizardProvider missing");
  return v;
}
