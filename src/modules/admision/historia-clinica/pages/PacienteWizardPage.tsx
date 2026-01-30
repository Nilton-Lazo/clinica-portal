import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PrimaryButton } from "../../../../shared/ui/buttons";
import { PacienteWizardProvider } from "../wizard/PacienteWizardProvider";
import { usePacienteWizard } from "../wizard/usePacienteWizard";
import { PacienteSummaryBar } from "../wizard/PacienteSummaryBar";
import { catalogoPacienteService } from "../wizard/catalogoPaciente.service";
import { pacienteService } from "../wizard/paciente.service";
import {
  buildPacientePayload,
  emptyDraft,
  fullNameFromDraft,
  mapPacienteToDraft,
  type PacienteFormCatalogos,
  type PacienteFull,
} from "../wizard/types";
import { DatosGeneralesStep } from "./steps/DatosGeneralesStep";
import { DatosAdicionalesStep } from "./steps/DatosAdicionalesStep";
import { AcreditacionStep } from "./steps/AcreditacionStep";

import type { ApiError } from "../../../../shared/api/apiError";

type Notice = { type: "success" | "error"; text: string } | null;

function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e;
}

function errorText(e: unknown): string {
  if (isApiError(e)) {
    const maybeErrors = (e as unknown as { errors?: unknown }).errors;

    if (e.status === 422 && maybeErrors && typeof maybeErrors === "object") {
      const entries = Object.entries(maybeErrors as Record<string, unknown>)
        .map(([k, v]) => {
          if (Array.isArray(v)) return `${k}: ${v.map(String).join(", ")}`;
          return `${k}: ${String(v)}`;
        });

      if (entries.length) return `${e.message}\n${entries.join("\n")}`;
    }

    return e.message;
  }

  if (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }

  return "No se pudo guardar. Revisa Network y logs del backend.";
}

type StepKey = "datos-generales" | "datos-adicionales" | "acreditacion";

const STEP_ORDER: StepKey[] = ["datos-generales", "datos-adicionales", "acreditacion"];

function stepFromPath(pathname: string): StepKey | null {
  if (pathname.includes("/datos-generales")) return "datos-generales";
  if (pathname.includes("/datos-adicionales")) return "datos-adicionales";
  if (pathname.includes("/acreditacion")) return "acreditacion";
  return null;
}

export default function PacienteWizardPage() {
  const { pacienteId } = useParams<{ pacienteId?: string }>();
  const navigate = useNavigate();
  const loc = useLocation();
  const step = stepFromPath(loc.pathname);

  const isEdit = useMemo(() => Boolean(pacienteId && String(pacienteId).trim()), [pacienteId]);

  const [catalog, setCatalog] = useState<PacienteFormCatalogos | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [initialDraft, setInitialDraft] = useState(() => emptyDraft());
  const [loadingPaciente, setLoadingPaciente] = useState(false);

  useEffect(() => {
    const s = stepFromPath(loc.pathname);
    if (!s) {
      if (isEdit) {
        navigate(`/admision/historia-clinica/${pacienteId}/datos-generales`, { replace: true });
      } else {
        navigate(`/admision/historia-clinica/nuevo/datos-generales`, { replace: true });
      }
    }
  }, [loc.pathname, isEdit, pacienteId, navigate]);

  useEffect(() => {
    const load = async () => {
      setCatalogLoading(true);
      try {
        const res = await catalogoPacienteService.pacienteForm();
        setCatalog(res.data);
      } finally {
        setCatalogLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setInitialDraft(emptyDraft());
      return;
    }

    const id = Number(pacienteId);
    if (!id || Number.isNaN(id)) return;

    const load = async () => {
      setLoadingPaciente(true);
      try {
        const res = await pacienteService.show(id);
        setInitialDraft(mapPacienteToDraft(res.data));
      } finally {
        setLoadingPaciente(false);
      }
    };

    void load();
  }, [isEdit, pacienteId]);

  const providerKey = useMemo(() => {
    if (!isEdit) return "new";
    return `edit-${String(pacienteId ?? "")}-${String((initialDraft as unknown as { id?: unknown })?.id ?? "")}`;
  }, [isEdit, pacienteId, initialDraft]);

  return (
    <PacienteWizardProvider key={providerKey} initial={initialDraft}>
      <WizardInner
        isEdit={isEdit}
        pacienteId={pacienteId ? Number(pacienteId) : null}
        step={step ?? "datos-generales"}
        catalog={catalog}
        catalogLoading={catalogLoading}
        loadingPaciente={loadingPaciente}
      />
    </PacienteWizardProvider>
  );
}

function WizardInner({
  isEdit,
  pacienteId,
  step,
  catalog,
  catalogLoading,
  loadingPaciente,
}: {
  isEdit: boolean;
  pacienteId: number | null;
  step: StepKey;
  catalog: PacienteFormCatalogos | null;
  catalogLoading: boolean;
  loadingPaciente: boolean;
}) {
  const navigate = useNavigate();
  const { state, actions, derived } = usePacienteWizard();

  const [notice, setNotice] = useState<Notice>(null);

  const base = isEdit && pacienteId ? `/admision/historia-clinica/${pacienteId}` : `/admision/historia-clinica/nuevo`;

  const canGoAcreditacion = Boolean((state.draft as unknown as { id?: unknown })?.id) && !derived.isDirty;

  useEffect(() => {
    if (step === "acreditacion" && !canGoAcreditacion) {
      navigate(`${base}/datos-generales`, { replace: true });
    }
  }, [step, canGoAcreditacion, navigate, base]);

  const requiredOk = useMemo(() => {
    const d = state.draft;
    const tipo = String((d as unknown as { tipo_documento?: unknown })?.tipo_documento ?? "")
      .trim()
      .toUpperCase();
    if (!tipo) return false;
    if (tipo === "SIN_DOCUMENTO") return true;

    const nd = String((d as unknown as { numero_documento?: unknown })?.numero_documento ?? "").trim();
    const n = String((d as unknown as { nombres?: unknown })?.nombres ?? "").trim();
    const ap = String((d as unknown as { apellido_paterno?: unknown })?.apellido_paterno ?? "").trim();
    const am = String((d as unknown as { apellido_materno?: unknown })?.apellido_materno ?? "").trim();

    if (!nd) return false;
    if (!n) return false;
    if (!ap) return false;
    if (!am) return false;
    return true;
  }, [state.draft]);

  const onTab = (k: StepKey) => {
    if (k === "acreditacion" && !canGoAcreditacion) return;
    navigate(`${base}/${k}`);
  };

  const save = async () => {
    setNotice(null);
    actions.markSaving(true);
    try {
      const payload = buildPacientePayload(state.draft);
  
      let res: { data: PacienteFull };
      if ((state.draft as unknown as { id?: unknown })?.id) {
        res = await pacienteService.update((state.draft as unknown as { id: number }).id, payload);
      } else {
        res = await pacienteService.create(payload);
      }
  
      const saved = res.data;
      const nextDraft = mapPacienteToDraft(saved);
      actions.markSaved(nextDraft);
  
      setNotice({ type: "success", text: "Guardado correctamente." });
  
      if (!((state.draft as unknown as { id?: unknown })?.id)) {
        navigate(`/admision/historia-clinica/${saved.id}/datos-generales`, { replace: true });
      }
    } catch (e) {
      setNotice({ type: "error", text: errorText(e) });
    } finally {
      actions.markSaving(false);
    }
  };  

  const idx = STEP_ORDER.indexOf(step);
  const prevStep = idx > 0 ? STEP_ORDER[idx - 1] : null;
  const nextStep = idx >= 0 && idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;

  const canNext =
    nextStep === null ? false : nextStep === "acreditacion" ? canGoAcreditacion : true;

  const goPrev = () => {
    if (!prevStep) return;
    navigate(`${base}/${prevStep}`);
  };

  const goNext = () => {
    if (!nextStep) return;
    if (nextStep === "acreditacion" && !canGoAcreditacion) return;
    navigate(`${base}/${nextStep}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={step === "datos-generales"} onClick={() => onTab("datos-generales")}>
              Datos generales
            </TabButton>
            <TabButton active={step === "datos-adicionales"} onClick={() => onTab("datos-adicionales")}>
              Datos adicionales
            </TabButton>
            <TabButton
              active={step === "acreditacion"}
              disabled={!canGoAcreditacion}
              onClick={() => onTab("acreditacion")}
            >
              Acreditación
            </TabButton>
          </div>

          <div className="flex justify-end">
            <PrimaryButton
              onClick={save}
              disabled={!requiredOk || state.saving || loadingPaciente || catalogLoading}
              className="w-full sm:w-auto"
            >
              Guardar
            </PrimaryButton>
          </div>

          {notice ? (
            <div className="rounded-xl border border-(--border-color-default) bg-(--color-surface) px-4 py-3 text-sm text-(--color-text-primary) whitespace-pre-line">
                <span className="font-semibold">{notice.type === "success" ? "✅ " : "⚠️ "}</span>
                {notice.text}
            </div>
            ) : null}
        </div>

        <PacienteSummaryBar />
      </div>

      {catalogLoading || loadingPaciente ? (
        <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 text-sm text-(--color-text-secondary)">
          Cargando...
        </div>
      ) : null}

      {!catalogLoading && !loadingPaciente ? (
        <>
          {step === "datos-generales" ? (
            <DatosGeneralesStep
              catalog={catalog}
              onAutoTitular={() => {
                const name = fullNameFromDraft(state.draft);
                if (name) actions.set({ titular_nombre: name });
              }}
            />
          ) : null}

          {step === "datos-adicionales" ? <DatosAdicionalesStep catalog={catalog} /> : null}

          {step === "acreditacion" ? <AcreditacionStep /> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={!prevStep}
              className={`h-10 px-4 rounded-xl border border-(--border-color-default) bg-(--color-surface) text-sm font-medium text-(--color-text-primary) transition ${
                !prevStep ? "opacity-50 cursor-not-allowed" : "hover:bg-(--color-background)"
              }`}
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={!nextStep || !canNext}
              className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                !nextStep || !canNext
                  ? "opacity-50 cursor-not-allowed bg-(--color-surface) text-(--color-text-secondary) border border-(--border-color-default)"
                  : "bg-(--color-primary) text-(--color-text-inverse) hover:brightness-110"
              }`}
            >
              Siguiente
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base = "h-10 px-4 rounded-xl text-sm font-semibold transition border border-(--border-color-default)";
  const cls = active
    ? `${base} bg-(--color-primary) text-(--color-text-inverse)`
    : `${base} bg-(--color-surface) text-(--color-text-primary) hover:bg-(--color-background)`;
  const dis = disabled ? "opacity-50 cursor-not-allowed hover:bg-(--color-surface)" : "";
  return (
    <button type="button" onClick={disabled ? undefined : onClick} className={`${cls} ${dis}`}>
      {children}
    </button>
  );
}
