import { TarifarioSubcategoriasCrudView } from "../../facturacion/tarifario/pages/TarifarioCrudPage";
import { useTarifarioUrlTarifaPicker } from "../../facturacion/tarifario/hooks/useTarifarioUrlTarifaPicker";

export default function TarifarioSubcategoriasPage() {
  const {
    tarifaId,
    tarifaMenuValue,
    tarifaMenuOptions,
    tarifaMenuLoading,
    tarifaMenuError,
    onTarifaMenuChange,
  } = useTarifarioUrlTarifaPicker();

  return (
    <TarifarioSubcategoriasCrudView
      tarifaId={tarifaId}
      tarifaMenuValue={tarifaMenuValue}
      tarifaMenuOptions={tarifaMenuOptions}
      tarifaMenuLoading={tarifaMenuLoading}
      tarifaMenuError={tarifaMenuError}
      onTarifaMenuChange={onTarifaMenuChange}
    />
  );
}
