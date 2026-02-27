import type { SelectOption } from "../../../../../shared/ui/SelectMenu";
import { useMemo } from "react";
import { usePacienteWizard } from "../../wizard/usePacienteWizard";
import type { PacienteFormCatalogos } from "../../wizard/types";
import { FormCard, SelectField, TextField } from "../../wizard/ui/formFields";

function labelEnum(v: string) {
  const x = (v ?? "").toString().trim();
  if (!x) return "—";
  const y = x.replace(/_/g, " ").toLowerCase();
  return y.charAt(0).toUpperCase() + y.slice(1);
}

function optionsFrom(values: string[] | undefined): SelectOption[] {
  if (!values) return [];
  return values.map((v) => ({ value: v, label: labelEnum(v) }));
}

function withPlaceholder(options: SelectOption[], placeholder: string): SelectOption[] {
  return [{ value: "", label: placeholder, disabled: true }, ...options];
}

function ensureSelectedOption(options: SelectOption[], value: string, label?: string): SelectOption[] {
  const v = value.trim();
  if (!v) return options;
  if (options.some((opt) => String(opt.value) === v)) return options;
  return [...options, { value: v, label: label ?? v }];
}

export function DatosAdicionalesStep({ catalog }: { catalog: PacienteFormCatalogos | null }) {
  const { state, actions } = usePacienteWizard();
  const d = state.draft;

  const ocupacionOptions = useMemo(() => {
    const base = withPlaceholder(optionsFrom(catalog?.ocupacion), catalog ? "Selecciona ocupación" : "Cargando ocupación…");
    return ensureSelectedOption(base, d.ocupacion);
  }, [catalog, d.ocupacion]);

  const parentescoEmergenciaOptions = useMemo(() => {
    const base = withPlaceholder(optionsFrom(catalog?.parentesco_emergencia), catalog ? "Selecciona parentesco" : "Cargando parentescos…");
    return ensureSelectedOption(base, d.contacto_emergencia.parentesco_emergencia);
  }, [catalog, d.contacto_emergencia.parentesco_emergencia]);

  const medioInfoOptions = useMemo(() => {
    const base = withPlaceholder(optionsFrom(catalog?.medio_informacion), catalog ? "Selecciona medio" : "Cargando medios…");
    return ensureSelectedOption(base, d.medio_informacion);
  }, [catalog, d.medio_informacion]);

  return (
    <div className="flex flex-col gap-4 lg:gap-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-2">
        <FormCard title="Datos adicionales">
          <div className="space-y-4">
            <SelectField
              label="Ocupación del paciente"
              value={d.ocupacion}
              onChange={(v) => actions.set({ ocupacion: v })}
              options={ocupacionOptions}
              ariaLabel="Ocupación"
              buttonClassName="w-full"
              menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
              disabled={!catalog}
            />

            <TextField
              label="Correo del paciente"
              type="email"
              value={d.email}
              onChange={(v) => actions.set({ email: v })}
            />
          </div>
        </FormCard>

        <FormCard title="Medio de información">
          <div className="space-y-4">
            <SelectField
              label="Medio"
              value={d.medio_informacion}
              onChange={(v) => actions.set({ medio_informacion: v })}
              options={medioInfoOptions}
              ariaLabel="Medio de información"
              buttonClassName="w-full"
              menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
              disabled={!catalog}
            />

            <TextField
              label="Detalles de medio de información"
              value={d.medio_informacion_detalle}
              onChange={(v) => actions.set({ medio_informacion_detalle: v })}
            />
          </div>
        </FormCard>

        <FormCard title="Gestión documental">
          <TextField
            label="Ubicación del Archivo de Historia Clínica"
            value={d.ubicacion_archivo_hc}
            onChange={(v) => actions.set({ ubicacion_archivo_hc: v })}
          />
        </FormCard>
      </div>

      <FormCard title="Contacto de emergencia">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="Nombres"
            value={d.contacto_emergencia.nombres}
            onChange={(v) => actions.setContacto({ nombres: v })}
          />

          <TextField
            label="Apellido paterno"
            value={d.contacto_emergencia.apellido_paterno}
            onChange={(v) => actions.setContacto({ apellido_paterno: v })}
          />

          <TextField
            label="Apellido materno"
            value={d.contacto_emergencia.apellido_materno}
            onChange={(v) => actions.setContacto({ apellido_materno: v })}
          />

          <SelectField
            label="Parentesco"
            value={d.contacto_emergencia.parentesco_emergencia}
            onChange={(v) => actions.setContacto({ parentesco_emergencia: v })}
            options={parentescoEmergenciaOptions}
            ariaLabel="Parentesco emergencia"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />

          <TextField
            label="Celular"
            value={d.contacto_emergencia.celular}
            onChange={(v) => actions.setContacto({ celular: v })}
            inputMode="numeric"
          />

          <TextField
            label="Teléfono"
            value={d.contacto_emergencia.telefono}
            onChange={(v) => actions.setContacto({ telefono: v })}
            inputMode="numeric"
          />

          <div className="md:col-span-3">
            <TextField
              label="Observaciones"
              value={d.contacto_emergencia.observaciones}
              onChange={(v) => actions.setContacto({ observaciones: v })}
            />
          </div>
        </div>
      </FormCard>
    </div>
  );
}
