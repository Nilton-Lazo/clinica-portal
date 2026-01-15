import * as React from "react";

type Props = {
  children: React.ReactNode;
  illustration: string;
  logo: string;
};

export default function AuthLayout({ children, illustration, logo }: Props) {
  return (
    <div className="min-h-dvh bg-(--color-background) flex flex-col">
      {/* Centro vertical del card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-275 rounded-2xl bg-(--color-surface) shadow-lg overflow-hidden">
          {/* Logo centrado global */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
            <img
              src={logo}
              alt="Logo Clínica"
              className="
                h-12
                sm:h-14
                md:h-15
                lg:h-16
              "
            />
          </div>

          {/* Contenido */}
          <div className="grid md:grid-cols-2 pt-24 md:pt-25">
            {/* Columna izquierda */}
            <div className="hidden md:flex flex-col items-center justify-center px-10 pb-12">
              <img
                src={illustration}
                alt="Ilustración médica"
                className="w-full max-w-110"
              />

              <h2 className="mt-6 text-2xl font-bold text-(--color-primary)">
                CLÍNICA VIDA SANA
              </h2>

              <p className="mt-2 text-center text-sm text-(--color-text-secondary) leading-6">
                Bienvenido al Sistema de Gestión Clínica.
                <br />
                Accede con tu cuenta para continuar según tu rol asignado.
              </p>
            </div>

            {/* Columna derecha */}
            <div className="flex items-center justify-center px-10 pb-12">
              <div className="w-full max-w-110">{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer real */}
      <footer className="pb-6 text-center text-xs text-(--color-text-secondary)">
        © 2026 Clínica Vida Sana - Todos los derechos reservados · Soporte TI
      </footer>
    </div>
  );
}