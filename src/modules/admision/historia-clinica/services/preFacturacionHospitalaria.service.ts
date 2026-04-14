import { api } from "../../../../shared/api";

export type GuardarPreFacturacionPayload = {
  paciente_id: number;
  paciente_plan_id: number;
  nro_cuenta?: string;
  form: Record<string, unknown>;
};

export type GuardarPreFacturacionResponse = {
  nro_cuenta: string;
};

function unwrapData<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function guardarPreFacturacionHospitalaria(
  body: GuardarPreFacturacionPayload
): Promise<GuardarPreFacturacionResponse> {
  const res = await api.post<unknown>("/admision/pre-facturacion-hospitalaria/registros", body);
  return unwrapData<GuardarPreFacturacionResponse>(res);
}
