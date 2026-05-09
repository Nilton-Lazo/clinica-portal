import type { Cliente, ClienteTipo } from "../../../../ficheros/types/clientes.types";
import type { AtencionServicioLineaDisplay, PresupuestoPaqueteSnapshot } from "../../agenda/types/atencionCita.types";
import type { PresupuestoPacienteDetalle, PresupuestoPacientePlan } from "../types/presupuesto.types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function hydrateDetalleClienteLineasPaquete(payload: Record<string, unknown>): {
  detalle: PresupuestoPacienteDetalle | null;
  cliente: Cliente | null;
  lineas: AtencionServicioLineaDisplay[];
  presupuestoPaquete: PresupuestoPaqueteSnapshot | null;
  copVarDefault: number;
} {
  const pac = asRecord(payload.paciente);
  const pp = asRecord(payload.paciente_plan);

  if (!pac || typeof pac.id !== "number") {
    return { detalle: null, cliente: null, lineas: [], presupuestoPaquete: null, copVarDefault: 0 };
  }

  const plan: PresupuestoPacientePlan | null = pp
    ? {
        pacientePlanId: Number(pp.paciente_plan_id),
        tipoClienteId: Number(pp.tipo_cliente_id ?? 0),
        label: String(pp.label ?? "—"),
        iafaId: pp.iafa_id != null && pp.iafa_id !== "" ? Number(pp.iafa_id) : null,
        iafaLabel: String(pp.iafa_label ?? ""),
        tarifaId: pp.tarifa_id != null && pp.tarifa_id !== "" ? Number(pp.tarifa_id) : null,
        tarifaCodigo: pp.tarifa_codigo != null ? String(pp.tarifa_codigo) : null,
        tarifaDescripcion: pp.tarifa_descripcion != null ? String(pp.tarifa_descripcion) : null,
        tarifaEsPrecioDirecto: Boolean(pp.tarifa_es_precio_directo),
      }
    : null;

  const strOrNull = (v: unknown): string | null => {
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t ? t : null;
  };

  const detalle: PresupuestoPacienteDetalle = {
    id: Number(pac.id),
    hc: String(pac.hc ?? ""),
    nr: pac.nr != null && String(pac.nr).trim() !== "" ? String(pac.nr) : null,
    nombre_completo: String(pac.nombre_completo ?? ""),
    planes: plan ? [plan] : [],
    medico_tratante_id:
      typeof pac.medico_tratante_id === "number" && Number.isFinite(pac.medico_tratante_id)
        ? pac.medico_tratante_id
        : null,
    tipo_paciente: strOrNull(pac.tipo_paciente),
    parentesco_seguro: strOrNull(pac.parentesco_seguro),
  };

  const cli = asRecord(payload.cliente);
  const tipoCli = cli?.tipo === "ADMINISTRATIVO" ? "ADMINISTRATIVO" : "ASISTENCIAL";
  const cliente: Cliente | null = cli
    ? {
        id: Number(cli.id),
        codigo: String(cli.codigo ?? ""),
        tipo: tipoCli as ClienteTipo,
        nombre: String(cli.nombre ?? ""),
        dni_o_ruc: String(cli.dni_o_ruc ?? ""),
        telefono: cli.telefono != null ? String(cli.telefono) : null,
        direccion: cli.direccion != null ? String(cli.direccion) : null,
        estado: "ACTIVO",
      }
    : null;

  const rawLineas = payload.lineas_servicio;
  const lineas: AtencionServicioLineaDisplay[] = Array.isArray(rawLineas)
    ? (rawLineas as AtencionServicioLineaDisplay[]).filter(Boolean)
    : [];

  const pkg = asRecord(payload.paquete);
  const presupuestoPaquete: PresupuestoPaqueteSnapshot | null = pkg
    ? {
        id: Number(pkg.id),
        codigo: String(pkg.codigo ?? ""),
        descripcion: String(pkg.descripcion ?? ""),
        precio_sin_igv: Number(pkg.precio_sin_igv) || 0,
        precio_con_igv: Number(pkg.precio_con_igv) || 0,
        servicios: Array.isArray(pkg.servicios)
          ? (pkg.servicios as Record<string, unknown>[]).map((s) => ({
              tarifa_servicio_id: Number(s.tarifa_servicio_id),
              codigo: String(s.codigo ?? ""),
              descripcion: String(s.descripcion ?? ""),
            }))
          : [],
      }
    : null;

  const copRaw = payload.cop_var_default;
  const copVarDefault =
    typeof copRaw === "number" && Number.isFinite(copRaw) ? copRaw : Number(copRaw) || 0;

  return { detalle, cliente, lineas, presupuestoPaquete, copVarDefault };
}
