import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../shared/auth/useAuth";

export default function RequireGuest() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
}
