import { useHistoriaClinicaWizard } from "../hooks/useHistoriaClinicaWizard";

const inputCls =
  "h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)";

const textareaCls =
  "min-h-24 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)";

export default function HistoriaClinicaDatosAdicionalesPage() {
  const vm = useHistoriaClinicaWizard();
  const c = vm.catalogs;

  if (!vm.ready) {
    return (
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 text-sm text-(--color-text-secondary)">
        Cargando...
      </div>
    );
  }

  const ce = vm.draft.contacto_emergencia ?? {
    nombres: null,
    apellido_paterno: null,
    apellido_materno: null,
    parentesco_emergencia: null,
    celular: null,
    telefono: null,
    observaciones: null,
  };

  const setCE = <K extends keyof typeof ce>(k: K, v: (typeof ce)[K]) => {
    vm.setField("contacto_emergencia", { ...ce, [k]: v });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:col-span-1">
        <div className="text-base font-semibold text-(--color-text-primary)">Datos adicionales</div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-xs text-(--color-text-secondary)">Ocupación</div>
            <select className={inputCls} value={vm.draft.ocupacion ?? ""} onChange={(e) => vm.setField("ocupacion", e.target.value || null)}>
              <option value="">—</option>
              {(c?.ocupaciones ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Correo</div>
            <input className={inputCls} value={vm.draft.email ?? ""} onChange={(e) => vm.setField("email", e.target.value.trim() ? e.target.value : null)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:col-span-1">
        <div className="text-base font-semibold text-(--color-text-primary)">Contacto de emergencia</div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-xs text-(--color-text-secondary)">Nombres</div>
            <input className={inputCls} value={ce.nombres ?? ""} onChange={(e) => setCE("nombres", e.target.value.trim() ? e.target.value : null)} />
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Apellido paterno</div>
            <input
              className={inputCls}
              value={ce.apellido_paterno ?? ""}
              onChange={(e) => setCE("apellido_paterno", e.target.value.trim() ? e.target.value : null)}
            />
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Apellido materno</div>
            <input
              className={inputCls}
              value={ce.apellido_materno ?? ""}
              onChange={(e) => setCE("apellido_materno", e.target.value.trim() ? e.target.value : null)}
            />
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Parentesco</div>
            <select
              className={inputCls}
              value={ce.parentesco_emergencia ?? ""}
              onChange={(e) => setCE("parentesco_emergencia", e.target.value || null)}
            >
              <option value="">—</option>
              {(c?.parentescos_emergencia ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-(--color-text-secondary)">Celular</div>
              <input className={inputCls} value={ce.celular ?? ""} onChange={(e) => setCE("celular", e.target.value.trim() ? e.target.value : null)} />
            </div>
            <div>
              <div className="text-xs text-(--color-text-secondary)">Teléfono</div>
              <input className={inputCls} value={ce.telefono ?? ""} onChange={(e) => setCE("telefono", e.target.value.trim() ? e.target.value : null)} />
            </div>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Observaciones</div>
            <textarea className={textareaCls} value={ce.observaciones ?? ""} onChange={(e) => setCE("observaciones", e.target.value.trim() ? e.target.value : null)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:col-span-1">
        <div className="text-base font-semibold text-(--color-text-primary)">Medio de información</div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-xs text-(--color-text-secondary)">Medio</div>
            <select
              className={inputCls}
              value={vm.draft.medio_informacion ?? ""}
              onChange={(e) => vm.setField("medio_informacion", e.target.value || null)}
            >
              <option value="">—</option>
              {(c?.medios_informacion ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Detalle</div>
            <input
              className={inputCls}
              value={vm.draft.medio_informacion_detalle ?? ""}
              onChange={(e) => vm.setField("medio_informacion_detalle", e.target.value.trim() ? e.target.value : null)}
            />
          </div>

          <div className="pt-4">
            <div className="text-base font-semibold text-(--color-text-primary)">Gestión documental</div>
            <div className="mt-3">
              <div className="text-xs text-(--color-text-secondary)">Ubicación del archivo de HC</div>
              <input
                className={inputCls}
                value={vm.draft.ubicacion_archivo_hc ?? ""}
                onChange={(e) => vm.setField("ubicacion_archivo_hc", e.target.value.trim() ? e.target.value : null)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
