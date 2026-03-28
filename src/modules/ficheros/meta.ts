import type { RouteMeta } from "../../app/router/routeMeta.types";

export const ficherosMeta: Record<string, RouteMeta> = {
    "/ficheros": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros" }],
    },

    "/ficheros/especialidades": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Especialidades" },
        ],
    },
    "/ficheros/consultorios": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Consultorios" }],
    },
    "/ficheros/medicos": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Médicos" }],
    },
    "/ficheros/turnos": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Turnos" }],
    },
    "/ficheros/clientes": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Clientes" }],
    },
    "/ficheros/paquetes": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Paquetes" }],
    },
    "/ficheros/paquetes-servicios": {
        title: "Ficheros",
        subtitle: "Asignación de servicios por paquete.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Servicios por paquete" }],
    },
    "/ficheros/parametros/hospitalizacion": {
        title: "Ficheros",
        subtitle: "Parámetros del módulo Hospitalización.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Hospitalización" },
        ],
    },
    "/ficheros/parametros/hospitalizacion/cirugias": {
        title: "Ficheros",
        subtitle: "Catálogo de cirugías para hospitalización.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Hospitalización", path: "/ficheros/parametros/hospitalizacion" },
            { label: "Cirugías" },
        ],
    },
    "/ficheros/tipos-iafas": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Tipos de IAFAS" }],
    },
    "/ficheros/iafas": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "IAFAS" }],
    },
    "/ficheros/contratantes": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Contratantes" }],
    },
    "/ficheros/tarifas": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Tarifas" }],
    },
    "/ficheros/tipos-clientes": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [{ label: "Ficheros", path: "/ficheros" }, { label: "Tipos de clientes" }],
    },

    "/ficheros/parametros/igv": {
        title: "Ficheros",
        subtitle: "Configuración de parámetros del sistema.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "IGV" },
        ],
    },
    "/ficheros/parametros/recargo-noche": {
        title: "Ficheros",
        subtitle: "Recargo nocturno por tarifario y categoría.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Recargo nocturno" },
        ],
    },
    "/ficheros/parametros/emergencia": {
        title: "Ficheros",
        subtitle: "Parámetros del módulo Emergencia.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Emergencia" },
        ],
    },
    "/ficheros/parametros/emergencia/tipo": {
        title: "Ficheros",
        subtitle: "Tipo Emergencia.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Emergencia", path: "/ficheros/parametros/emergencia" },
            { label: "Tipo Emergencia" },
        ],
    },
    "/ficheros/parametros/emergencia/topico": {
        title: "Ficheros",
        subtitle: "Tópico.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Emergencia", path: "/ficheros/parametros/emergencia" },
            { label: "Tópico" },
        ],
    },
    "/ficheros/parametros/emergencia/tipo-documento": {
        title: "Ficheros",
        subtitle: "Tipo Documento.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Emergencia", path: "/ficheros/parametros/emergencia" },
            { label: "Tipo Documento" },
        ],
    },
    "/ficheros/parametros/emergencia/documento-atencion": {
        title: "Ficheros",
        subtitle: "Documento de Atención.",
        breadcrumb: [
            { label: "Ficheros", path: "/ficheros" },
            { label: "Emergencia", path: "/ficheros/parametros/emergencia" },
            { label: "Documento de Atención" },
        ],
    },
};
