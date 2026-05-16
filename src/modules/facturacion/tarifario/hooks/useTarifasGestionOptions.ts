import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../../shared/api/apiError";
import { listTarifasParaGestionTarifario } from "../services/tarifario.service";
import type { TarifaOperativa } from "../types/tarifario.types";

export function useTarifasGestionOptions() {
  const [tarifas, setTarifas] = useState<TarifaOperativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listTarifasParaGestionTarifario()
      .then((items) => {
        if (alive) setTarifas(items);
      })
      .catch((e) => {
        if (alive) setError(getApiErrorMessage(e, "No se pudieron cargar las tarifas."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { tarifas, loading, error };
}
