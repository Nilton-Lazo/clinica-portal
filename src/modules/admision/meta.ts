import type { RouteMeta } from "../../app/router/routeMeta.types";

export const admisionMeta: Record<string, RouteMeta> = {
    "/admision": {
        title: "Admisión",
        subtitle: "Gestión del ingreso del paciente, registro de información clínica, programación de citas y control administrativo.",
        breadcrumb: [{ label: "Admisión" }],
    },
};
