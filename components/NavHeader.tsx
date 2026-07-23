// components/NavHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";

const ENLACES = [
  { href: "/dashboard", label: "Banco de preguntas" },
  { href: "/sets", label: "Sets" },
  { href: "/salas", label: "Salas" },
];

export default function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_16px_var(--color-brand)]" />
            <span className="font-display text-base font-semibold tracking-tight text-ink">
              Menthor
            </span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {ENLACES.map((enlace) => {
              const activo = pathname === enlace.href;
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activo
                      ? "bg-elevated text-brand"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {enlace.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0">
          <BotonCerrarSesion />
        </div>
      </div>
    </header>
  );
}
