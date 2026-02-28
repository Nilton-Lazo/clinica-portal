import * as React from "react";
import { PrimaryButton } from "../../../shared/ui/buttons";
import { api } from "../../../shared/api";
import { useNoticeToToast, inputBase } from "../utils/crudShared";

export default function ParametrosIgvPage() {
  const [igv, setIgv] = React.useState<string>("18");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  useNoticeToToast(notice);

  React.useEffect(() => {
    setLoading(true);
    api
      .get<{ igv_porcentaje: number }>("/ficheros/parametros/igv")
      .then((res) => {
        setIgv(String(res.igv_porcentaje ?? 18));
      })
      .catch(() => setIgv("18"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = React.useCallback(async () => {
    const num = parseFloat(igv);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      setNotice({ type: "error", text: "El porcentaje debe estar entre 0 y 100." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await api.put("/ficheros/parametros/igv", { igv_porcentaje: num });
      setNotice({ type: "success", text: "IGV actualizado correctamente." });
    } catch {
      setNotice({ type: "error", text: "No se pudo guardar el IGV." });
    } finally {
      setSaving(false);
    }
  }, [igv]);

  if (loading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center">
        <span className="text-sm text-(--color-text-secondary)">Cargando…</span>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div>
        <div className="text-base font-semibold text-(--color-text-primary)">IGV</div>
        <div className="text-sm text-(--color-text-secondary)">
          Configure el porcentaje de IGV aplicable a los servicios
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="text-xs text-(--color-text-secondary)">Porcentaje de IGV (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={igv}
            onChange={(e) => setIgv(e.target.value)}
            className={`mt-1 h-10 w-full ${inputBase}`}
          />
        </div>
        <PrimaryButton className="rounded" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </PrimaryButton>
      </div>
    </div>
  );
}
