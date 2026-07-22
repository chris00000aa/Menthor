// app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password }),
    });

    const datos = await res.json();
    setCargando(false);

    if (!res.ok) {
      setError(datos.error || "Ocurrió un error");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_16px_var(--color-brand)]" />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Menthor
          </span>
        </div>

        <div className="m-card px-7 py-8 sm:px-9 sm:py-10">
          <h1 className="text-2xl font-semibold text-ink">Iniciar sesión</h1>
          <p className="mt-1.5 text-sm text-muted">
            Ingresa para gestionar tus preguntas y salas.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="m-label" htmlFor="correo">
                Correo
              </label>
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="m-input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="m-label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="m-input"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="m-btn m-btn-primary w-full"
            >
              {cargando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <a href="/registro" className="m-link">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}