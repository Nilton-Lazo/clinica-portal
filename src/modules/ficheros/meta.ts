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
};
