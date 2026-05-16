import * as React from "react";
import { useSearchParams } from "react-router-dom";
import type { SelectOption } from "../../../../shared/ui/SelectMenu";
import { useTarifasGestionOptions } from "./useTarifasGestionOptions";

export function useTarifarioUrlTarifaPicker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tarifas, loading, error } = useTarifasGestionOptions();

  const tarifaIdRaw = Number(searchParams.get("tarifaId"));
  const tarifaId = Number.isFinite(tarifaIdRaw) && tarifaIdRaw > 0 ? tarifaIdRaw : null;
  const tarifaLabelParam = searchParams.get("tarifaLabel");

  React.useEffect(() => {
    if (!tarifaId || loading) return;
    const t = tarifas.find((x) => x.id === tarifaId);
    if (!t) return;
    if (tarifaLabelParam === t.descripcion_tarifa) return;
    setSearchParams(
      { tarifaId: String(tarifaId), tarifaLabel: t.descripcion_tarifa },
      { replace: true }
    );
  }, [tarifaId, tarifaLabelParam, loading, tarifas, setSearchParams]);

  React.useEffect(() => {
    if (loading) return;
    if (!tarifaId) return;
    if (!tarifas.some((t) => t.id === tarifaId)) {
      setSearchParams({});
    }
  }, [loading, tarifaId, tarifas, setSearchParams]);

  const tarifaMenuOptions = React.useMemo((): SelectOption[] => {
    return [
      { value: "", label: "Seleccione una tarifa" },
      ...tarifas.map((t) => ({
        value: String(t.id),
        label: `${t.codigo} - ${t.descripcion_tarifa}${t.tarifa_base ? " (Base)" : ""}`,
      })),
    ];
  }, [tarifas]);

  const onTarifaMenuChange = React.useCallback(
    (v: string) => {
      if (!v) {
        setSearchParams({});
        return;
      }
      const t = tarifas.find((x) => String(x.id) === v);
      setSearchParams({ tarifaId: v, tarifaLabel: t?.descripcion_tarifa ?? "" });
    },
    [tarifas, setSearchParams]
  );

  return {
    tarifaId,
    tarifaMenuValue: tarifaId ? String(tarifaId) : "",
    tarifaMenuOptions,
    tarifaMenuLoading: loading,
    tarifaMenuError: error,
    onTarifaMenuChange,
  };
}
