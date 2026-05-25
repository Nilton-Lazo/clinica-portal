import type { RouteMeta } from "../../app/router/routeMeta.types";

const title = "Ficheros";
const rootSubtitle = "Gestión de tablas maestras y registros configurables del sistema.";
const rootCrumb = { label: "Ficheros", path: "/ficheros" };

function moduleMeta(label: string, subtitle: string): RouteMeta {
    return {
        title,
        subtitle,
        breadcrumb: [rootCrumb, { label }],
    };
}

function childMeta(
    modulePath: string,
    moduleLabel: string,
    label: string,
    subtitle = rootSubtitle,
): RouteMeta {
    return {
        title,
        subtitle,
        breadcrumb: [
            rootCrumb,
            { label: moduleLabel, path: modulePath },
            { label },
        ],
    };
}

export const ficherosMeta: Record<string, RouteMeta> = {
    "/ficheros": {
        title,
        subtitle: rootSubtitle,
        breadcrumb: [{ label: "Ficheros" }],
    },

    "/ficheros/admision": moduleMeta("Admisión", "Catálogos base para admisión y programación médica."),
    "/ficheros/especialidades": childMeta("/ficheros/admision", "Admisión", "Especialidades"),
    "/ficheros/consultorios": childMeta("/ficheros/admision", "Admisión", "Consultorios"),
    "/ficheros/medicos": childMeta("/ficheros/admision", "Admisión", "Médicos"),
    "/ficheros/turnos": childMeta("/ficheros/admision", "Admisión", "Turnos"),

    "/ficheros/facturacion": moduleMeta("Facturación", "Configuración de tarifarios, paquetes e impuestos."),
    "/ficheros/tipos-iafas": childMeta("/ficheros/facturacion", "Facturación", "Tipos de IAFAS"),
    "/ficheros/iafas": childMeta("/ficheros/facturacion", "Facturación", "IAFAS"),
    "/ficheros/contratantes": childMeta("/ficheros/facturacion", "Facturación", "Contratantes"),
    "/ficheros/tarifas": childMeta("/ficheros/facturacion", "Facturación", "Tarifas"),
    "/ficheros/tipos-clientes": childMeta("/ficheros/facturacion", "Facturación", "Tipos de clientes"),
    "/ficheros/clonacion-tarifa": childMeta("/ficheros/facturacion", "Facturación", "Clonación de tarifa", "Clonar estructura y servicios desde el tarifario base."),
    "/ficheros/tarifario-categorias": childMeta("/ficheros/facturacion", "Facturación", "Categorías", "Categorías por tarifa."),
    "/ficheros/tarifario-subcategorias": childMeta("/ficheros/facturacion", "Facturación", "Subcategorías", "Subcategorías por tarifa."),
    "/ficheros/paquetes": childMeta("/ficheros/facturacion", "Facturación", "Paquetes"),
    "/ficheros/paquetes-servicios": childMeta("/ficheros/facturacion", "Facturación", "Servicios por paquete", "Asignación de servicios por paquete."),
    "/ficheros/clientes": childMeta("/ficheros/facturacion", "Facturación", "Clientes"),

    "/ficheros/parametros/emergencia": moduleMeta("Emergencia", "Parámetros del módulo Emergencia."),
    "/ficheros/parametros/emergencia/tipo": childMeta("/ficheros/parametros/emergencia", "Emergencia", "Tipo Emergencia", "Tipo Emergencia."),
    "/ficheros/parametros/emergencia/topico": childMeta("/ficheros/parametros/emergencia", "Emergencia", "Tópico", "Tópico."),
    "/ficheros/parametros/emergencia/tipo-documento": childMeta("/ficheros/parametros/emergencia", "Emergencia", "Tipo Documento", "Tipo Documento."),
    "/ficheros/parametros/emergencia/documento-atencion": childMeta("/ficheros/parametros/emergencia", "Emergencia", "Documento de Atención", "Documento de Atención."),
    "/ficheros/parametros/emergencia/servicios-defaults": childMeta("/ficheros/parametros/emergencia", "Emergencia", "Servicios por defecto", "Servicios precargados por tarifario en Emergencia."),

    "/ficheros/parametros/caja": moduleMeta("Caja", "Parámetros del módulo Caja."),
    "/ficheros/parametros/caja/area-jefatura": childMeta("/ficheros/parametros/caja", "Caja", "Área o Jefatura", "Área o Jefatura."),
    "/ficheros/parametros/caja/tipo-documento": childMeta("/ficheros/parametros/caja", "Caja", "Tipo de documento", "Tipo de documento."),
    "/ficheros/parametros/caja/numeracion-comprobante": childMeta("/ficheros/parametros/caja", "Caja", "Numeración de comprobante", "Numeración de comprobante."),
    "/ficheros/parametros/caja/forma-pago": childMeta("/ficheros/parametros/caja", "Caja", "Forma de pago", "Forma de pago."),
    "/ficheros/parametros/caja/medio-pago": childMeta("/ficheros/parametros/caja", "Caja", "Medio de pago", "Medio de pago."),
    "/ficheros/parametros/caja/banco-tarjeta": childMeta("/ficheros/parametros/caja", "Caja", "Banco o tarjeta", "Banco o tarjeta."),
    "/ficheros/parametros/igv": childMeta("/ficheros/parametros/caja", "Caja", "IGV", "Configuración de parámetros del sistema."),
    "/ficheros/parametros/recargo-noche": childMeta("/ficheros/parametros/caja", "Caja", "Recargo nocturno", "Recargo nocturno por tarifario y categoría."),

    "/ficheros/parametros/hospitalizacion": moduleMeta("Hospitalización", "Parámetros del módulo Hospitalización."),
    "/ficheros/parametros/hospitalizacion/cirugias": childMeta("/ficheros/parametros/hospitalizacion", "Hospitalización", "Cirugías", "Catálogo de cirugías para hospitalización."),
};
