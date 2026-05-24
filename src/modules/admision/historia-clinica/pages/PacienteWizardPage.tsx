import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Printer } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import { PacienteWizardProvider } from "../wizard/PacienteWizardProvider";
import { usePacienteWizard } from "../wizard/usePacienteWizard";
import { PacienteSummaryBar } from "../wizard/PacienteSummaryBar";
import { getWizardCatalog, getWizardCatalogSync } from "../wizard/wizardCatalogCache";
import { pacienteService } from "../wizard/paciente.service";
import {
  buildPacientePayload,
  emptyDraft,
  fullNameFromDraft,
  mapPacienteToDraft,
  type PacienteFormCatalogos,
  type PacienteFull,
} from "../wizard/types";
import { toUserFriendlyMessage } from "../utils/userFriendlyError";
import { DatosGeneralesStep } from "./steps/DatosGeneralesStep";
import { DatosAdicionalesStep } from "./steps/DatosAdicionalesStep";
import { AcreditacionStep } from "./steps/AcreditacionStep";
import { toastService } from "../../../../shared/notifications";
import {
  hojaFiliacionFilenameFallback,
  hojaFiliacionReportPath,
} from "../services/hojaFiliacionPaciente.service";
import { ReportPrintPreviewDialog } from "../../../../shared/reporting";
import { useRealtimeModuleRefresh } from "../../../../shared/realtime/useRealtimeModuleRefresh";

type StepKey = "datos-generales" | "datos-adicionales" | "acreditacion";

const REPORT_ICON_BTN =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-surface)";
const REPORT_ICON_BTN_DISABLED = "cursor-not-allowed opacity-50 hover:scale-100 active:scale-100";

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

  const [catalog, setCatalog] = useState<PacienteFormCatalogos | null>(() => getWizardCatalogSync());
  const [catalogLoading, setCatalogLoading] = useState(() => getWizardCatalogSync() === null);

  const [initialDraft, setInitialDraft] = useState(() => emptyDraft());
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  const [realtimeReloadKey, setRealtimeReloadKey] = useState(0);

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
    getWizardCatalog()
      .then(setCatalog)
      .catch((e) => {
        setCatalog(null);
        toastService.showError(toUserFriendlyMessage(e, "No se pudieron cargar los catálogos para registrar pacientes."));
      })
      .finally(() => setCatalogLoading(false));
  }, []);

  const reportBusyRef = React.useRef(false);

  useEffect(() => {
    if (!isEdit) {
      setInitialDraft(emptyDraft());
      return;
    }

    const id = Number(pacienteId);
    if (!id || Number.isNaN(id)) return;

    const controller = new AbortController();

    const load = async () => {
      setLoadingPaciente(true);
      try {
        const res = await pacienteService.show(id, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setInitialDraft(mapPacienteToDraft(res.data));
      } catch (e) {
        if (controller.signal.aborted) return;
        toastService.showError(toUserFriendlyMessage(e, "No se pudo cargar la historia clínica del paciente."));
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPaciente(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [isEdit, pacienteId, realtimeReloadKey]);

  useRealtimeModuleRefresh({
    module: "admision",
    entities: ["paciente", "paciente_plan", "paciente_contacto_emergencia"],
    includeOwnEvents: false,
    onEvent: (event) => {
      if (!isEdit) return;
      if (reportBusyRef.current) return;
      if (event.entity === "paciente" && event.id != null && Number(event.id) !== Number(pacienteId)) return;
      setRealtimeReloadKey((key) => key + 1);
    },
  });

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
        reportBusyRef={reportBusyRef}
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
  reportBusyRef,
}: {
  isEdit: boolean;
  pacienteId: number | null;
  step: StepKey;
  catalog: PacienteFormCatalogos | null;
  catalogLoading: boolean;
  loadingPaciente: boolean;
  reportBusyRef: React.MutableRefObject<boolean>;
}) {
  const navigate = useNavigate();
  const { state, actions, derived } = usePacienteWizard();
  const [filiacionPreviewOpen, setFiliacionPreviewOpen] = React.useState(false);

  const base = isEdit && pacienteId ? `/admision/historia-clinica/${pacienteId}` : `/admision/historia-clinica/nuevo`;

  const canGoAcreditacion = Boolean((state.draft as unknown as { id?: unknown })?.id) && !derived.isDirty;

  useEffect(() => {
    if (step === "acreditacion" && !canGoAcreditacion) {
      navigate(`${base}/datos-generales`, { replace: true });
    }
  }, [step, canGoAcreditacion, navigate, base]);

  const requiredOk = useMemo(() => {
    const d = state.draft;
    const tipo = String((d as unknown as { tipo_documento?: unknown })?.tipo_documento ?? "").trim().toUpperCase();
    if (!tipo) return false;

    const parentesco = String((d as unknown as { parentesco_seguro?: unknown })?.parentesco_seguro ?? "").trim();
    const titular = String((d as unknown as { titular_nombre?: unknown })?.titular_nombre ?? "").trim();
    if (!parentesco) return false;
    if (!titular) return false;

    if (tipo === "SIN_DOCUMENTO") return true;

    const nd = String((d as unknown as { numero_documento?: unknown })?.numero_documento ?? "").trim();
    const n = String((d as unknown as { nombres?: unknown })?.nombres ?? "").trim();
    const ap = String((d as unknown as { apellido_paterno?: unknown })?.apellido_paterno ?? "").trim();
    const am = String((d as unknown as { apellido_materno?: unknown })?.apellido_materno ?? "").trim();

    if (!nd) return false;
    if (!n) return false;
    if (!ap) return false;
    if (!am) return false;
    const tipoPaciente = String((d as unknown as { tipo_paciente?: unknown })?.tipo_paciente ?? "").trim().toUpperCase();
    if (tipoPaciente === "PRIVADO") {
      const medicoTratanteId = String((d as unknown as { medico_tratante_id?: unknown })?.medico_tratante_id ?? "").trim();
      if (!medicoTratanteId) return false;
    }
    return true;
  }, [state.draft]);

  const onTab = (k: StepKey) => {
    if (k === "acreditacion" && !canGoAcreditacion) return;
    navigate(`${base}/${k}`);
  };

  const onOpenFiliacionPrintPreview = React.useCallback(() => {
    if (!pacienteId || pacienteId <= 0) {
      toastService.showError("Guarda el paciente antes de imprimir la hoja de filiación.");
      return;
    }
    reportBusyRef.current = true;
    setFiliacionPreviewOpen(true);
  }, [pacienteId, reportBusyRef]);

  const onCloseFiliacionPrintPreview = React.useCallback(() => {
    setFiliacionPreviewOpen(false);
    reportBusyRef.current = false;
  }, [reportBusyRef]);

  const filiacionReportPreview = React.useMemo(() => {
    if (!pacienteId || pacienteId <= 0) return null;
    return {
      path: hojaFiliacionReportPath(pacienteId),
      download: {
        path: hojaFiliacionReportPath(pacienteId),
        format: "pdf" as const,
        filenameFallback: hojaFiliacionFilenameFallback(pacienteId),
      },
    };
  }, [pacienteId]);

  const save = async () => {
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
      actions.markSaved({ ...nextDraft, contacto_emergencia: { ...nextDraft.contacto_emergencia } });

      toastService.showSuccess("Paciente guardado correctamente.");

      if (!((state.draft as unknown as { id?: unknown })?.id)) {
        navigate(`/admision/historia-clinica/${saved.id}/datos-generales`, { replace: true });
      }
    } catch (e) {
      toastService.showError(toUserFriendlyMessage(e, "No se pudo guardar la historia clínica del paciente."));
    } finally {
      actions.markSaving(false);
    }
  };


  return (
    <div className="flex flex-col gap-4 lg:gap-2">
      <div className="rounded-lg border border-(--border-color-default) bg-(--color-surface) p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={step === "datos-generales"} onClick={() => onTab("datos-generales")}>
              Datos generales
            </TabButton>
            <TabButton active={step === "datos-adicionales"} onClick={() => onTab("datos-adicionales")}>
              Datos adicionales
            </TabButton>
            <TabButton active={step === "acreditacion"} disabled={!canGoAcreditacion} onClick={() => onTab("acreditacion")}>
              Acreditación
            </TabButton>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admision/historia-clinica")}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 self-end text-sm font-semibold text-(--color-text-secondary) transition hover:text-(--color-primary) sm:self-auto"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            Volver al listado
          </button>
        </div>

        {(isEdit && pacienteId) || step !== "acreditacion" ? (
          <WizardSummaryToolbar
            showPdf={Boolean(isEdit && pacienteId)}
            showFormActions={step !== "acreditacion"}
            loadingPaciente={loadingPaciente}
            catalogLoading={catalogLoading}
            onPrintFiliacion={onOpenFiliacionPrintPreview}
            onCancel={() => {
              actions.resetDraft();
              toastService.showInfo("Cambios descartados.");
            }}
            onSave={save}
            cancelDisabled={!derived.isDirty || state.saving || loadingPaciente || catalogLoading}
            saveDisabled={!requiredOk || state.saving || loadingPaciente || catalogLoading}
            saving={state.saving}
          />
        ) : (
          <PacienteSummaryBar />
        )}
      </div>

      {catalogLoading || loadingPaciente ? (
        <div className="rounded-lg border border-(--border-color-default) bg-(--color-surface) p-4 text-sm text-(--color-text-secondary)">
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

          {step === "acreditacion" ? (
            <div>
              <AcreditacionStep />
            </div>
          ) : null}

        </>
      ) : null}

      {filiacionReportPreview ? (
        <ReportPrintPreviewDialog
          open={filiacionPreviewOpen}
          onClose={onCloseFiliacionPrintPreview}
          title="Hoja de filiación del paciente"
          subtitle="Revise el documento, imprímalo o descargue el PDF si lo necesita."
          preview={{ path: filiacionReportPreview.path }}
          download={filiacionReportPreview.download}
          onDownloadSuccess={() => toastService.showSuccess("Hoja de filiación descargada.")}
        />
      ) : null}
    </div>
  );
}

function WizardSummaryToolbar({
  showPdf,
  showFormActions,
  loadingPaciente,
  catalogLoading,
  onPrintFiliacion,
  onCancel,
  onSave,
  cancelDisabled,
  saveDisabled,
  saving,
}: {
  showPdf: boolean;
  showFormActions: boolean;
  loadingPaciente: boolean;
  catalogLoading: boolean;
  onPrintFiliacion: () => void;
  onCancel: () => void;
  onSave: () => void;
  cancelDisabled: boolean;
  saveDisabled: boolean;
  saving: boolean;
}) {
  const busy = loadingPaciente || catalogLoading;

  const mobileActionsClass =
    showPdf && showFormActions
      ? "grid w-full grid-cols-[2.5rem_1fr_1fr] gap-2 sm:flex sm:w-auto"
      : showFormActions
        ? "grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto"
        : "flex w-full justify-end gap-2 sm:w-auto";

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
      <PacienteSummaryBar compact className="w-full min-w-0 sm:flex-1" />

      <div className={`shrink-0 items-center ${mobileActionsClass}`}>
        {showPdf ? (
          <button
            type="button"
            onClick={onPrintFiliacion}
            disabled={busy}
            className={`${REPORT_ICON_BTN} ${busy ? REPORT_ICON_BTN_DISABLED : ""}`}
            title="Imprimir hoja de filiación"
            aria-label="Imprimir hoja de filiación"
          >
            <Printer className="h-[18px] w-[18px] shrink-0" aria-hidden />
          </button>
        ) : null}

        {showFormActions ? (
          <>
            <SecondaryButton onClick={onCancel} disabled={cancelDisabled} className="min-w-0 w-full sm:w-auto">
              Cancelar
            </SecondaryButton>
            <PrimaryButton onClick={onSave} disabled={saveDisabled} className="min-w-0 w-full sm:w-auto">
              {saving ? "Guardando…" : "Guardar"}
            </PrimaryButton>
          </>
        ) : null}
      </div>
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
  const base = "h-10 rounded-md border border-(--border-color-default) px-4 text-sm font-semibold transition";
  const cls = active
    ? `${base} bg-(--color-primary) text-(--color-text-inverse)`
    : `${base} bg-(--color-surface) text-(--color-text-primary) hover:bg-(--color-background)`;
  const dis = disabled ? "cursor-not-allowed opacity-50 hover:bg-(--color-surface)" : "";
  return (
    <button type="button" onClick={disabled ? undefined : onClick} className={`${cls} ${dis}`}>
      {children}
    </button>
  );
}
