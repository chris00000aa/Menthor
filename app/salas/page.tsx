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
    return <div style={{ padding: 40 }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 700 }}>
      <h1>Crear sala</h1>

      {sets.length === 0 && (
        <p style={{ color: "gray" }}>
          Aún no tienes sets — crea uno primero en la pantalla de sets.
        </p>
      )}

      <ul>
        {sets.map((s) => (
          <li key={s.id} style={{ marginBottom: 12 }}>
            <strong>{s.nombre}</strong> — {s.preguntas.length} pregunta(s){" "}
            <button
              onClick={() => handleCrearSala(s.id)}
              disabled={creandoId === s.id}
              style={{ padding: "6px 12px", fontSize: 14, marginLeft: 8 }}
            >
              {creandoId === s.id ? "Creando..." : "Crear sala"}
            </button>
          </li>
        ))}
      </ul>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}