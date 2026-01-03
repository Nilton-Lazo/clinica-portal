import { useRouteMeta } from "../../../app/router/useRouteMeta";

export default function LoginPage() {
  const meta = useRouteMeta();

  return (
    <div style={{ padding: 16 }}>
      <h1>{meta?.title}</h1>
      <p>{meta?.subtitle}</p>
      <pre style={{ background: "#f5f5f5", padding: 12 }}>
        {JSON.stringify(meta, null, 2)}
      </pre>
      Login
    </div>
  );
}
