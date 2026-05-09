import type { BancoTarjetaCajaItem } from "../../ficheros/parametros/caja/services/bancoTarjetaCaja.service";
import type { MedioPagoCajaItem } from "../../ficheros/parametros/caja/services/medioPagoCaja.service";

export function mediosForForma(medios: MedioPagoCajaItem[], formaId: number): MedioPagoCajaItem[] {
  if (!Number.isFinite(formaId) || formaId <= 0) return [];
  return medios.filter((m) => m.forma_pago_ids.includes(formaId));
}

export function bancosForFormaMedio(
  bancos: BancoTarjetaCajaItem[],
  formaId: number,
  medioId: number
): BancoTarjetaCajaItem[] {
  if (!Number.isFinite(formaId) || formaId <= 0 || !Number.isFinite(medioId) || medioId <= 0) return [];
  return bancos.filter((b) => b.forma_pago_ids.includes(formaId) && b.medio_pago_ids.includes(medioId));
}
