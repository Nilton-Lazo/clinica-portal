import { FormCard } from "../../wizard/ui/formFields";

export function AcreditacionStep() {
  return (
    <FormCard title="Acreditación">
      <div className="text-sm text-(--color-text-secondary)">
        Fase 1: bloqueada hasta Guardar (paciente creado/guardado y sin cambios pendientes). En la siguiente fase
        implementamos tabla de planes + CRUD de afiliación/desactivación.
      </div>
    </FormCard>
  );
}
