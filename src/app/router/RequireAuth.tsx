import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/auth/useAuth";

export default function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
