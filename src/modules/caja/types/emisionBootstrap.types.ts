import type { ParamOption } from "../../ficheros/parametros/emergencia/types/paramOption.types";
import type { MedioPagoCajaItem } from "../../ficheros/parametros/caja/services/medioPagoCaja.service";
import type { BancoTarjetaCajaItem } from "../../ficheros/parametros/caja/services/bancoTarjetaCaja.service";
import type { NumeracionComprobanteCajaItem } from "../../ficheros/parametros/caja/services/numeracionComprobanteCaja.service";
import type { EmisionComprobantesCatalog } from "./emisionComprobantes.types";

export type EmisionBootstrapBundle = {
  catalog: EmisionComprobantesCatalog;
  formas: ParamOption[];
  medios: MedioPagoCajaItem[];
  bancos: BancoTarjetaCajaItem[];
  numeraciones: NumeracionComprobanteCajaItem[];
  reglas?: {
    recibo_caja_tipo_documento_codigo?: string;
    adelanto_garantia_servicio_codigo?: string;
  };
};
