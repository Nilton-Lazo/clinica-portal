import * as React from "react";
import type { Notice } from "../components/NoticeBanner";
import type { PacienteFormCatalogs, PacienteUpsertPayload } from "../types/historiaClinica.types";

export type WizardMode = "create" | "edit";

export type Ctx = {
  ready: boolean;
  saving: boolean;

  notice: Notice;
  setNotice: (n: Notice) => void;
  clearNotice: () => void;

  catalogs: PacienteFormCatalogs | null;
  catalogsLoading: boolean;

  pacienteId: number | null;
  saved: boolean;
  dirty: boolean;
  canGoAcreditacion: boolean;

  draft: PacienteUpsertPayload;
  setField: <K extends keyof PacienteUpsertPayload>(k: K, v: PacienteUpsertPayload[K]) => void;

  save: () => Promise<void>;

  summary: {
    hc: string;
    nombre: string;
    nr: string;
    edad: string;
    sexo: string;
    estado: string;
  };
};

export const WizardContext = React.createContext<Ctx | null>(null);

export function useHistoriaClinicaWizard(): Ctx {
  const ctx = React.useContext(WizardContext);
  if (!ctx) throw new Error("useHistoriaClinicaWizard debe usarse dentro de HistoriaClinicaWizardProvider");
  return ctx;
}
