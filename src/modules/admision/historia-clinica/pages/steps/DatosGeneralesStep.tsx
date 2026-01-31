import type { SelectOption } from "../../../../../shared/ui/SelectMenu";
import { useEffect } from "react";
import { usePacienteWizard } from "../../wizard/usePacienteWizard";
import type { PacienteFormCatalogos } from "../../wizard/types";
import { fullNameFromDraft } from "../../wizard/types";
import { DateField, FormCard, SelectField, TextField } from "../../wizard/ui/formFields";

type CatalogRecord = Record<string, unknown>;

type MedicoItem = {
  id: number;
  nombre_completo?: string | null;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  nombre?: string;
  full_name?: string;
};

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

function readArray(src: unknown, keys: string[]): unknown[] {
  if (!src || typeof src !== "object") return [];
  const r = src as CatalogRecord;
  for (const k of keys) {
    const v = r[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function toStringEnumOptions(arr: unknown[]): SelectOption[] {
  const out: SelectOption[] = [];
  for (const it of arr) {
    if (typeof it === "string") {
      const v = it.trim();
      if (v) out.push({ value: v, label: labelEnum(v) });
    }
  }
  return out;
}

function toPaisOptions(arr: unknown[]): SelectOption[] {
  const out: SelectOption[] = [];
  for (const it of arr) {
    if (typeof it === "object" && it !== null) {
      const r = it as Record<string, unknown>;
      const iso2 = typeof r.iso2 === "string" ? r.iso2.trim() : "";
      const nombre = typeof r.nombre === "string" ? r.nombre.trim() : "";
      if (iso2 && nombre) out.push({ value: iso2, label: nombre });
      continue;
    }
    if (typeof it === "string") {
      const v = it.trim();
      if (v) out.push({ value: v, label: v });
    }
  }
  return out;
}

function toUbigeoOptions(arr: unknown[]): SelectOption[] {
  const out: SelectOption[] = [];
  for (const it of arr) {
    if (typeof it !== "object" || it === null) continue;
    const r = it as Record<string, unknown>;
    const codigo = typeof r.codigo === "string" ? r.codigo.trim() : "";
    const dpto = typeof r.departamento === "string" ? r.departamento.trim() : "";
    const prov = typeof r.provincia === "string" ? r.provincia.trim() : "";
    const dist = typeof r.distrito === "string" ? r.distrito.trim() : "";
    if (!codigo) continue;
    const label = [dpto, prov, dist].filter(Boolean).join(" / ").trim();
    out.push({ value: codigo, label: label || codigo });
  }
  return out;
}

function medicoLabel(m: MedicoItem): string {
  const nc = typeof m.nombre_completo === "string" ? m.nombre_completo.trim() : "";
  if (nc) return nc;

  const full = typeof m.full_name === "string" ? m.full_name.trim() : "";
  if (full) return full;

  const nom = typeof m.nombre === "string" ? m.nombre.trim() : "";
  if (nom) return nom;

  const n = typeof m.nombres === "string" ? m.nombres.trim() : "";
  const ap = typeof m.apellido_paterno === "string" ? m.apellido_paterno.trim() : "";
  const am = typeof m.apellido_materno === "string" ? m.apellido_materno.trim() : "";
  const mix = [ap, am, n].filter(Boolean).join(" ").trim();
  return mix || `Médico #${m.id}`;
}

function toMedicoOptions(arr: unknown[]): SelectOption[] {
  const out: SelectOption[] = [];
  for (const it of arr) {
    if (typeof it !== "object" || it === null) continue;
    const r = it as Record<string, unknown>;
    const id = typeof r.id === "number" ? r.id : null;
    if (!id) continue;
    const m: MedicoItem = {
      id,
      nombre_completo: typeof r.nombre_completo === "string" ? r.nombre_completo : null,
      nombres: typeof r.nombres === "string" ? r.nombres : null,
      apellido_paterno: typeof r.apellido_paterno === "string" ? r.apellido_paterno : null,
      apellido_materno: typeof r.apellido_materno === "string" ? r.apellido_materno : null,
      nombre: typeof r.nombre === "string" ? r.nombre : undefined,
      full_name: typeof r.full_name === "string" ? r.full_name : undefined,
    };
    out.push({ value: String(id), label: medicoLabel(m) });
  }
  return out;
}

export function DatosGeneralesStep({
  catalog,
  onAutoTitular,
}: {
  catalog: PacienteFormCatalogos | null;
  onAutoTitular: () => void;
}) {
  const { state, actions } = usePacienteWizard();
  const d = state.draft;

  useEffect(() => {
    const parentesco = d.parentesco_seguro.trim().toUpperCase();
    if (parentesco !== "TITULAR") return;
    const name = fullNameFromDraft(d);
    if (!name) return;
    if (d.titular_nombre.trim() === name) return;
    actions.set({ titular_nombre: name });
  }, [d.parentesco_seguro, d.nombres, d.apellido_paterno, d.apellido_materno, d.titular_nombre, actions]);

  const tipoDocOptions = withPlaceholder(optionsFrom(catalog?.tipo_documento), catalog ? "Selecciona tipo" : "Cargando tipos…");

  const estadoCivilOptions = withPlaceholder(optionsFrom(catalog?.estado_civil), catalog ? "Selecciona estado civil" : "Cargando estados…");

  const sexoOptions = withPlaceholder(optionsFrom(catalog?.sexo), catalog ? "Selecciona sexo" : "Cargando sexos…");

  const parentescoSeguroOptions = withPlaceholder(optionsFrom(catalog?.parentesco_seguro), catalog ? "Selecciona parentesco" : "Cargando parentescos…");

  const catalogRecord: CatalogRecord = (catalog ?? {}) as unknown as CatalogRecord;

  const paisesArr = readArray(catalogRecord, ["paises"]);
  const ubigeosArr = readArray(catalogRecord, ["ubigeos"]);
  const medicosArr = readArray(catalogRecord, ["medicos"]);

  const tipoSangreArr = readArray(catalogRecord, ["tipo_sangre", "tipos_sangre", "tiposSangre"]);
  const tipoPacienteArr = readArray(catalogRecord, ["tipo_paciente", "tipos_paciente", "tiposPaciente"]);

  const paisOptions = withPlaceholder(toPaisOptions(paisesArr), catalog ? "Selecciona nacionalidad" : "Cargando nacionalidades…");

  const ubigeoOptions = withPlaceholder(toUbigeoOptions(ubigeosArr), catalog ? "Selecciona distrito" : "Cargando distritos…");

  const medicoOptions = withPlaceholder(toMedicoOptions(medicosArr), catalog ? "Selecciona médico" : "Cargando médicos…");

  const tipoSangreOptions = withPlaceholder(toStringEnumOptions(tipoSangreArr), catalog ? "Selecciona tipo" : "Cargando…");

  const tipoPacienteOptions = withPlaceholder(toStringEnumOptions(tipoPacienteArr), catalog ? "Selecciona tipo" : "Cargando…");

  const tipo = d.tipo_documento.trim().toUpperCase();
  const requiereDoc = tipo !== "" && tipo !== "SIN_DOCUMENTO";

  const onChangeParentesco = (v: string) => {
    actions.set({ parentesco_seguro: v });
    if (String(v).toUpperCase() === "TITULAR") onAutoTitular();
  };

  const ubNac = String((d as unknown as { ubigeo_nacimiento?: unknown }).ubigeo_nacimiento ?? "").trim();
  const ubDom = String((d as unknown as { ubigeo_domicilio?: unknown }).ubigeo_domicilio ?? "").trim();

  const medicoIdStr = String((d as unknown as { medico_tratante_id?: unknown }).medico_tratante_id ?? "");

  return (
    <div className="space-y-4">
      <FormCard title="Información primaria">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SelectField
            label="Tipo de documento *"
            value={d.tipo_documento}
            onChange={(v) => actions.set({ tipo_documento: v })}
            options={tipoDocOptions}
            ariaLabel="Tipo de documento"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />

          <TextField label={requiereDoc ? "N° de documento *" : "N° de documento"} value={d.numero_documento} onChange={(v) => actions.set({ numero_documento: v })} />

          <TextField label={requiereDoc ? "Nombre(s) *" : "Nombre(s)"} value={d.nombres} onChange={(v) => actions.set({ nombres: v })} />

          <TextField label={requiereDoc ? "Apellido paterno *" : "Apellido paterno"} value={d.apellido_paterno} onChange={(v) => actions.set({ apellido_paterno: v })} />

          <TextField label={requiereDoc ? "Apellido materno *" : "Apellido materno"} value={d.apellido_materno} onChange={(v) => actions.set({ apellido_materno: v })} />

          <SelectField
            label="Estado civil"
            value={d.estado_civil}
            onChange={(v) => actions.set({ estado_civil: v })}
            options={estadoCivilOptions}
            ariaLabel="Estado civil"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />

          <SelectField
            label="Sexo"
            value={d.sexo}
            onChange={(v) => actions.set({ sexo: v })}
            options={sexoOptions}
            ariaLabel="Sexo"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />

          <DateField label="Fecha de nacimiento" value={d.fecha_nacimiento} onChange={(v) => actions.set({ fecha_nacimiento: v })} ariaLabel="Fecha de nacimiento" />
        </div>
      </FormCard>

      <FormCard title="Datos de procedencia">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Nacionalidad"
            value={String((d as unknown as { nacionalidad_iso2?: unknown }).nacionalidad_iso2 ?? "")}
            onChange={(v) => actions.set({ nacionalidad_iso2: v })}
            options={paisOptions}
            ariaLabel="Nacionalidad"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />

          <SelectField
            label="Distrito de nacimiento"
            value={ubNac}
            onChange={(v) => actions.set({ ubigeo_nacimiento: v })}
            options={ubigeoOptions}
            ariaLabel="Distrito de nacimiento"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />

          <div className="md:col-span-2">
            <TextField
              label="Domicilio actual"
              value={String((d as unknown as { direccion?: unknown }).direccion ?? "")}
              onChange={(v) => actions.set({ direccion: v })}
            />
          </div>

          <SelectField
            label="Distrito de domicilio"
            value={ubDom}
            onChange={(v) => actions.set({ ubigeo_domicilio: v })}
            options={ubigeoOptions}
            ariaLabel="Distrito de domicilio"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />
        </div>
      </FormCard>

      <FormCard title="Condición">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Parentesco (seguro) *"
            value={d.parentesco_seguro}
            onChange={onChangeParentesco}
            options={parentescoSeguroOptions}
            ariaLabel="Parentesco seguro"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />

          <TextField label="Titular *" value={d.titular_nombre} onChange={(v) => actions.set({ titular_nombre: v })} />
        </div>
      </FormCard>

      <FormCard title="Contacto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Número de celular" value={d.celular} onChange={(v) => actions.set({ celular: v })} inputMode="numeric" />
          <TextField label="Número de teléfono" value={d.telefono} onChange={(v) => actions.set({ telefono: v })} inputMode="numeric" />
        </div>
      </FormCard>

      <FormCard title="Atención">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Médico tratante"
            value={medicoIdStr}
            onChange={(v) => actions.set({ medico_tratante_id: v })}
            options={medicoOptions}
            ariaLabel="Médico tratante"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />
        </div>
      </FormCard>

      <FormCard title="Sangre">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Tipo de sangre"
            value={String((d as unknown as { tipo_sangre?: unknown }).tipo_sangre ?? "")}
            onChange={(v) => actions.set({ tipo_sangre: v })}
            options={tipoSangreOptions}
            ariaLabel="Tipo de sangre"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />
        </div>
      </FormCard>

      <FormCard title="Paciente">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Tipo de paciente"
            value={String((d as unknown as { tipo_paciente?: unknown }).tipo_paciente ?? "")}
            onChange={(v) => actions.set({ tipo_paciente: v })}
            options={tipoPacienteOptions}
            ariaLabel="Tipo de paciente"
            buttonClassName="w-full"
            menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            disabled={!catalog}
          />
        </div>
      </FormCard>
    </div>
  );
}
