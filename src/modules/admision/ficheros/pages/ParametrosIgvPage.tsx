import * as React from "react";
import { PrimaryButton } from "../../../../shared/ui/buttons";
import { api } from "../../../../shared/api";

export default function ParametrosIgvPage() {
  const [igv, setIgv] = React.useState<string>("18");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    setLoading(true);
    api
      .get<{ igv_porcentaje: number }>("/admision/ficheros/parametros/igv")
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
      await api.put("/admision/ficheros/parametros/igv", { igv_porcentaje: num });
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

      {notice ? (
        <div
          role="status"
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            notice.type === "success"
              ? "border-(--color-success) text-(--color-success)"
              : "border-(--color-danger) text-(--color-danger)",
          ].join(" ")}
        >
          {notice.text}
        </div>
      ) : null}

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
            className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
        </div>
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </PrimaryButton>
      </div>
    </div>
  );
}
