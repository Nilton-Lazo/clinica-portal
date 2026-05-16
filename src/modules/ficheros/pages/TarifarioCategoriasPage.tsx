import { TarifarioCategoriasCrudView } from "../../facturacion/tarifario/pages/TarifarioCrudPage";
import { useTarifarioUrlTarifaPicker } from "../../facturacion/tarifario/hooks/useTarifarioUrlTarifaPicker";

export default function TarifarioCategoriasPage() {
  const {
    tarifaId,
    tarifaMenuValue,
    tarifaMenuOptions,
    tarifaMenuLoading,
    tarifaMenuError,
    onTarifaMenuChange,
  } = useTarifarioUrlTarifaPicker();

  return (
    <TarifarioCategoriasCrudView
      tarifaId={tarifaId}
      tarifaMenuValue={tarifaMenuValue}
      tarifaMenuOptions={tarifaMenuOptions}
      tarifaMenuLoading={tarifaMenuLoading}
      tarifaMenuError={tarifaMenuError}
      onTarifaMenuChange={onTarifaMenuChange}
    />
  );
}
