import * as React from "react";
import { useMemo, useReducer } from "react";
import type { PacienteDraft } from "./types";
import { emptyDraft } from "./types";
import { PacienteWizardCtx, type PacienteWizardCtxValue } from "./pacienteWizard.context";

type State = {
  draft: PacienteDraft;
  savedHash: string | null;
  saving: boolean;
  savedDraft: PacienteDraft;
};

type Action =
  | { type: "set"; patch: Partial<PacienteDraft> }
  | { type: "setContacto"; patch: Partial<PacienteDraft["contacto_emergencia"]> }
  | { type: "markSaving"; value: boolean }
  | { type: "markSaved"; draft: PacienteDraft }
  | { type: "resetDraft" };

const hashDraft = (d: PacienteDraft) => JSON.stringify(d);

function reducer(state: State, action: Action): State {
  if (action.type === "set") {
    return { ...state, draft: { ...state.draft, ...action.patch } };
  }
  if (action.type === "setContacto") {
    return { ...state, draft: { ...state.draft, contacto_emergencia: { ...state.draft.contacto_emergencia, ...action.patch } } };
  }
  if (action.type === "markSaving") {
    return { ...state, saving: action.value };
  }
  if (action.type === "markSaved") {
    return { ...state, draft: action.draft, savedHash: hashDraft(action.draft), savedDraft: action.draft };
  }
  if (action.type === "resetDraft") {
    return { ...state, draft: state.savedDraft };
  }
  return state;
}

export function PacienteWizardProvider({ initial, children }: { initial?: PacienteDraft; children: React.ReactNode }) {
  const initDraft = initial ?? emptyDraft();

  const [state, dispatch] = useReducer(reducer, {
    draft: initDraft,
    savedHash: initial ? hashDraft(initDraft) : null,
    saving: false,
    savedDraft: initDraft,
  });

  const derived = useMemo(() => {
    const current = hashDraft(state.draft);
    return { isDirty: state.savedHash !== null ? current !== state.savedHash : true };
  }, [state.draft, state.savedHash]);

  const value: PacienteWizardCtxValue = useMemo(
    () => ({
      state,
      actions: {
        set: (patch) => dispatch({ type: "set", patch }),
        setContacto: (patch) => dispatch({ type: "setContacto", patch }),
        markSaving: (value) => dispatch({ type: "markSaving", value }),
        markSaved: (draft) => dispatch({ type: "markSaved", draft }),
        resetDraft: () => dispatch({ type: "resetDraft" }),
      },
      derived,
    }),
    [state, derived]
  );

  return <PacienteWizardCtx.Provider value={value}>{children}</PacienteWizardCtx.Provider>;
}
