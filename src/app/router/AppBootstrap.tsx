import { Outlet } from "react-router-dom";
import { useBootstrapAuth } from "../../shared/hooks/useBootstrapAuth";
import { useAuth } from "../../shared/auth/useAuth";

export default function AppBootstrap() {
  const { isLoading } = useAuth();

  useBootstrapAuth();

  if (isLoading) {
    return <div className="min-h-dvh bg-zinc-100" />;
  }

  return <Outlet />;
}
