import { createContext } from "react";
import type { PacienteDraft } from "./types";

export type PacienteWizardCtxValue = {
  state: {
    draft: PacienteDraft;
    savedHash: string | null;
    saving: boolean;
    savedDraft: PacienteDraft;
  };
  actions: {
    set: (patch: Partial<PacienteDraft>) => void;
    setContacto: (patch: Partial<PacienteDraft["contacto_emergencia"]>) => void;
    markSaving: (value: boolean) => void;
    markSaved: (draft: PacienteDraft) => void;
    resetDraft: () => void;
  };
  derived: {
    isDirty: boolean;
  };
};

export const PacienteWizardCtx = createContext<PacienteWizardCtxValue | null>(null);
