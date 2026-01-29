import { useHistoriaClinicaWizard } from "../hooks/useHistoriaClinicaWizard";

const inputCls =
  "h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)";

export default function HistoriaClinicaDatosGeneralesPage() {
  const vm = useHistoriaClinicaWizard();

  if (!vm.ready) {
    return (
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 text-sm text-(--color-text-secondary)">
        Cargando...
      </div>
    );
  }

  const c = vm.catalogs;

  const isSinDocumento = (vm.draft.tipo_documento ?? "").toUpperCase() === "SIN_DOCUMENTO";
  const req = !isSinDocumento;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:col-span-1">
        <div className="text-base font-semibold text-(--color-text-primary)">Información primaria</div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-xs text-(--color-text-secondary)">Tipo de documento</div>
            <select
              className={inputCls}
              value={vm.draft.tipo_documento}
              onChange={(e) => vm.setField("tipo_documento", e.target.value)}
            >
              {(c?.tipos_documento ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {!c?.tipos_documento?.length ? <option value={vm.draft.tipo_documento}>{vm.draft.tipo_documento}</option> : null}
            </select>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">N° de documento{req ? " *" : ""}</div>
            <input
              className={inputCls}
              value={vm.draft.numero_documento ?? ""}
              onChange={(e) => vm.setField("numero_documento", e.target.value.trim() ? e.target.value : null)}
              required={req}
              disabled={isSinDocumento}
            />
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Nombre(s){req ? " *" : ""}</div>
            <input
              className={inputCls}
              value={vm.draft.nombres ?? ""}
              onChange={(e) => vm.setField("nombres", e.target.value.trim() ? e.target.value : null)}
              required={req}
            />
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Apellido paterno{req ? " *" : ""}</div>
            <input
              className={inputCls}
              value={vm.draft.apellido_paterno ?? ""}
              onChange={(e) => vm.setField("apellido_paterno", e.target.value.trim() ? e.target.value : null)}
              required={req}
            />
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Apellido materno{req ? " *" : ""}</div>
            <input
              className={inputCls}
              value={vm.draft.apellido_materno ?? ""}
              onChange={(e) => vm.setField("apellido_materno", e.target.value.trim() ? e.target.value : null)}
              required={req}
            />
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Estado civil</div>
            <select className={inputCls} value={vm.draft.estado_civil ?? ""} onChange={(e) => vm.setField("estado_civil", e.target.value || null)}>
              <option value="">—</option>
              {(c?.estados_civiles ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Sexo</div>
            <select className={inputCls} value={vm.draft.sexo ?? ""} onChange={(e) => vm.setField("sexo", e.target.value || null)}>
              <option value="">—</option>
              {(c?.sexos ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Fecha de nacimiento</div>
            <input
              type="date"
              className={inputCls}
              value={vm.draft.fecha_nacimiento ?? ""}
              onChange={(e) => vm.setField("fecha_nacimiento", e.target.value || null)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 lg:col-span-2">
        <div className="text-base font-semibold text-(--color-text-primary)">Condición</div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs text-(--color-text-secondary)">Parentesco (seguro) *</div>
            <select
              className={inputCls}
              value={vm.draft.parentesco_seguro ?? ""}
              onChange={(e) => vm.setField("parentesco_seguro", e.target.value || null)}
            >
              {(c?.parentescos_seguro ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {!c?.parentescos_seguro?.length ? <option value={vm.draft.parentesco_seguro ?? ""}>{vm.draft.parentesco_seguro ?? "—"}</option> : null}
            </select>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Titular *</div>
            <input
              className={inputCls}
              value={vm.draft.titular_nombre ?? ""}
              onChange={(e) => vm.setField("titular_nombre", e.target.value.trim() ? e.target.value : null)}
              disabled={(vm.draft.parentesco_seguro ?? "").toUpperCase() === "TITULAR"}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs text-(--color-text-secondary)">Celular</div>
            <input className={inputCls} value={vm.draft.celular ?? ""} onChange={(e) => vm.setField("celular", e.target.value.trim() ? e.target.value : null)} />
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Teléfono</div>
            <input className={inputCls} value={vm.draft.telefono ?? ""} onChange={(e) => vm.setField("telefono", e.target.value.trim() ? e.target.value : null)} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-(--color-text-secondary)">Tipo de sangre</div>
            <select className={inputCls} value={vm.draft.tipo_sangre ?? ""} onChange={(e) => vm.setField("tipo_sangre", e.target.value || null)}>
              <option value="">—</option>
              {(c?.tipos_sangre ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Tipo de paciente</div>
            <select className={inputCls} value={vm.draft.tipo_paciente ?? ""} onChange={(e) => vm.setField("tipo_paciente", e.target.value || null)}>
              <option value="">—</option>
              {(c?.tipos_paciente ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-(--color-text-secondary)">Estado</div>
            <select className={inputCls} value={vm.draft.estado} onChange={(e) => vm.setField("estado", e.target.value as typeof vm.draft.estado)}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
