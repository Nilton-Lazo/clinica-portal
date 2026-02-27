# Sistema de notificaciones (Toast)

Las notificaciones usan **React-Toastify** con una API unificada vía `useToast()`. Toda la retroalimentación (éxito, error, info, warning) pasa por este hook.

## Uso

```tsx
import { useToast } from "../shared/feedback";

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await api.save();
      toast.success("Guardado correctamente.");
    } catch (e) {
      toast.error("No se pudo guardar.");
    }
  };
}
```

## Configuración (enterprise)

- **Posición:** top-right.
- **Límite:** 4 toasts apilados.
- **Duración:** 4s éxito/info/warning; 6s error.
- **Tema:** colores del sistema de diseño (`--color-success`, `--color-danger`, etc.) en `global.css`.
- **Opciones:** barra de progreso, pausa al hover, arrastrable, botón cerrar.

Los estilos se ajustan en `src/assets/styles/global.css` (variables `--toastify-*` y clases `.Toastify__toast--*`).
