import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SecondaryButton } from "../../../shared/ui/buttons";

export default function AtencionEmergenciaPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleVolver = React.useCallback(() => {
    navigate("/emergencia/registro");
  }, [navigate]);

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-(--color-text-primary)">
          Atención de Emergencia {id ? `#${id}` : ""}
        </h1>
        <SecondaryButton onClick={handleVolver}>Volver</SecondaryButton>
      </div>
      <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-6 text-(--color-text-secondary)">
        Contenido en desarrollo.
      </div>
    </div>
  );
}
