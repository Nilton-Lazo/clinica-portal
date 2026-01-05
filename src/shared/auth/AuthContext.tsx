import * as React from "react";
import type { AuthUser } from "../../modules/login/types/auth.types";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setLoading] = React.useState<boolean>(true);

  const value: AuthContextValue = {
    user,
    isLoading,
    setUser,
    setLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
