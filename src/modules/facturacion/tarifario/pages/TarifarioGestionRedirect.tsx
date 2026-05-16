import { Navigate, useParams, useSearchParams } from "react-router-dom";

export default function TarifarioGestionRedirect() {
  const { tipo } = useParams<{ tipo: string }>();
  const [searchParams] = useSearchParams();
  const q = searchParams.toString();
  const suffix = q ? `?${q}` : "";

  if (tipo === "categorias") {
    return <Navigate to={`/ficheros/tarifario-categorias${suffix}`} replace />;
  }
  if (tipo === "subcategorias") {
    return <Navigate to={`/ficheros/tarifario-subcategorias${suffix}`} replace />;
  }
  if (tipo === "servicios") {
    return <Navigate to={`/facturacion/tarifario${suffix}`} replace />;
  }

  return <Navigate to="/facturacion/tarifario" replace />;
}
