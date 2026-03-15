# Parámetros Emergencia – Contrato API y enums backend

El frontend consume las siguientes rutas y espera que el backend exponga enums/tablas maestras gestionables desde Ficheros > Parámetros > Emergencia.

## Enums de referencia (valores iniciales)

Pueden implementarse como enums fijos o como tablas CRUD; el portal asume CRUD sobre recursos REST.

### Tipo Emergencia (valores sugeridos)

- Accidental
- Externa
- Médica
- Accidente de trabajo
- Accidente estudiantil
- Accidente de tránsito

### Tópico (valores sugeridos)

- Tópico Emergencia
- Tópico Urgencia

## Endpoints REST

Base: `/ficheros/parametros/emergencia`

### Tipo Emergencia

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/tipo?page=1&per_page=50&q=&status=` | Lista paginada. `q`: búsqueda; `status`: ACTIVO, INACTIVO, SUSPENDIDO |
| GET | `/tipo/next-codigo` | Siguiente código sugerido (opcional) |
| POST | `/tipo` | Crear. Body: `{ "codigo": string, "descripcion": string, "estado"?: "ACTIVO" \| "INACTIVO" \| "SUSPENDIDO" }` |
| PUT | `/tipo/:id` | Actualizar. Body: `{ "codigo", "descripcion", "estado" }` |
| PATCH | `/tipo/:id/desactivar` | Desactivar (estado INACTIVO) |

Respuesta list: `{ "data": Item[], "meta": { "current_page", "per_page", "total", "last_page" } }`  
Item: `{ "id": number, "codigo": string, "descripcion": string, "estado": "ACTIVO"|"INACTIVO"|"SUSPENDIDO", "created_at"?, "updated_at"?: string }`

### Tópico

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/topico?page=1&per_page=50&q=&status=` | Lista paginada |
| GET | `/topico/next-codigo` | Siguiente código sugerido (opcional) |
| POST | `/topico` | Crear. Mismo body que Tipo Emergencia |
| PUT | `/topico/:id` | Actualizar |
| PATCH | `/topico/:id/desactivar` | Desactivar |

Misma forma de ítem y paginación que Tipo Emergencia.

## Escalabilidad

Para añadir más parámetros al módulo Emergencia (p. ej. otro enum/maestra), agregar una nueva opción en el hub de Parámetros > Emergencia, un nuevo recurso bajo `/ficheros/parametros/emergencia/<recurso>` y una página CRUD que reutilice los componentes de este módulo (ParamOptionTable, ParamOptionFormCard, etc.).
