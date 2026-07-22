// app/salas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SetSimple {
  id: number;
  nombre: string;
  preguntas: unknown[];
}

export default function SalasPage() {
  const router = useRouter();
  const [sets, setSets] = useState<SetSimple[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [creandoId, setCreandoId] = useState<number | null>(null);

  async function cargarSets() {
    setCargando(true);
    const res = await fetch("/api/sets");

    if (res.status === 401) {
      router.push("/login");
      return;
    }

    const datos = await res.json();
    if (res.ok) setSets(datos.sets);
    setCargando(false);
  }

  useEffect(() => {
    cargarSets();
  }, []);

  async function handleCrearSala(setId: number) {
    setError("");
    setCreandoId(setId);

    const res = await fetch("/api/salas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setId }),
    });

    const datos = await res.json();
    setCreandoId(null);

    if (!res.ok) {
      setError(datos.error || "Ocurrió un error");
      return;
    }

    router.push(`/salas/${datos.sala.codigo}/proyeccion`);
  }

  if (cargando) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Crear sala</h1>
          <p className="mt-1.5 text-sm text-muted">
            Elige un set para abrir una sala y proyectarla en clase.
          </p>
        </div>

        {sets.length === 0 ? (
          <p className="text-sm text-muted">
            Aún no tienes sets — crea uno primero en la pantalla de sets.
          </p>
        ) : (
          <ul className="space-y-3">
            {sets.map((s) => (
              <li
                key={s.id}
                className="m-card flex items-center justify-between gap-4 p-5"
              >
                <div>
                  <strong className="text-ink">{s.nombre}</strong>
                  <p className="mt-0.5 text-sm text-muted">
                    {s.preguntas.length} pregunta(s)
                  </p>
                </div>
                <button
                  onClick={() => handleCrearSala(s.id)}
                  disabled={creandoId === s.id}
                  className="m-btn m-btn-primary shrink-0 px-4 py-2 text-sm"
                >
                  {creandoId === s.id ? "Creando..." : "Crear sala"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}