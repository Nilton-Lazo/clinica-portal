import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRouteMeta } from "../../../app/router/useRouteMeta";
import { authService } from "../services/auth.service";
import { sessionEvents } from "../../../shared/auth/sessionEvents";
import { useAuth } from "../../../shared/auth/useAuth";

import AuthLayout from "../../../shared/ui/layouts/AuthLayout";
import Input from "../../../shared/ui/Input";
import Button from "../../../shared/ui/Button";

import illustration from "../assets/images/doctor.webp";
import logo from "../assets/images/logo.webp";

type FieldErrors = {
  identifier?: string;
  password?: string;
};

type LocationState = {
  from?: { pathname?: string; search?: string; hash?: string };
};

function buildReturnTo(from: LocationState["from"]): string | null {
  if (!from?.pathname) return null;
  const search = from.search ?? "";
  const hash = from.hash ?? "";
  return `${from.pathname}${search}${hash}`;
}

export default function LoginPage() {
  const meta = useRouteMeta();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  const state = location.state as LocationState | null;
  const returnTo = buildReturnTo(state?.from);

  React.useEffect(() => {
    if (user) {
      navigate("/inicio", { replace: true });
      return;
    }

    const last = sessionEvents.consumeLastUnauthorized();
    if (
      last?.code === "SESSION_EXPIRED_IDLE" ||
      last?.code === "SESSION_EXPIRED_ABSOLUTE"
    ) {
      setFormError("Tu sesión expiró. Por favor, vuelve a iniciar sesión.");
    }
  }, [user, navigate]);

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!identifier.trim()) {
      errors.identifier = "Ingrese su usuario o correo";
    }

    if (!password) {
      errors.password = "Ingrese su contraseña";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      const me = await authService.login({
        identifier: identifier.trim(),
        password,
      });

      setUser(me);
      navigate(returnTo ?? "/inicio", { replace: true });
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "Credenciales inválidas.";

      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout illustration={illustration} logo={logo}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">
          {meta?.title}
        </h1>

        {meta?.subtitle && (
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            {meta.subtitle}
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Usuario o correo"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={loading}
          error={fieldErrors.identifier}
          autoComplete="username"
        />

        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        {formError && (
          <div className="rounded-md border border-(--color-danger) bg-red-50 px-3 py-2 text-sm text-(--color-danger)">
            {formError}
          </div>
        )}

        <Button type="submit" loading={loading}>
          Ingresar
        </Button>
      </form>
    </AuthLayout>
  );
}
