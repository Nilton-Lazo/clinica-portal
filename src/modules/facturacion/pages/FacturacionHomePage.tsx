import { useRouteMeta } from "../../../app/router/useRouteMeta";

export default function FacturacionHomePage() {
  const meta = useRouteMeta();

  return (
    <div style={{ padding: 16 }}>
      <h1>{meta?.title}</h1>
      <p>{meta?.subtitle}</p>
      Facturación home
    </div>
  );
}
