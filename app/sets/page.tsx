// app/sets/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import NavHeader from "@/components/NavHeader";

interface Pregunta {
  id: number;
  enunciado: string;
  materia: string;
  tema: string;
}

interface SetConPreguntas {
  id: number;
  nombre: string;
  preguntas: { pregunta: Pregunta }[];
}

export default function SetsPage() {
  const router = useRouter();
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [sets, setSets] = useState<SetConPreguntas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);

  async function cargarDatos() {
    setCargando(true);

    const [resPreguntas, resSets] = await Promise.all([
      fetch("/api/preguntas"),
      fetch("/api/sets"),
    ]);

    if (resPreguntas.status === 401 || resSets.status === 401) {
      router.push("/login");
      return;
    }

    const datosPreguntas = await resPreguntas.json();
    const datosSets = await resSets.json();

    if (resPreguntas.ok) setPreguntas(datosPreguntas.preguntas);
    if (resSets.ok) setSets(datosSets.sets);

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function toggleSeleccion(id: number) {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    const res = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, preguntaIds: seleccionadas }),
    });

    const datos = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setError(datos.error || "Ocurrió un error");
      return;
    }

    setNombre("");
    setSeleccionadas([]);
    cargarDatos();
  }

  if (cargando) {
    return (
      <>
        <NavHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted">Cargando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavHeader />
      <div className="flex-1 px-4 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-4xl space-y-10">
          <div>
            <h1 className="text-3xl font-semibold text-ink">
              Sets de preguntas
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Agrupa preguntas del banco para armar una sala.
            </p>
          </div>

          <section className="m-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink">Nuevo set</h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="m-label" htmlFor="nombre">
                  Nombre del set
                </label>
                <input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="m-input"
                />
              </div>

              <div>
                <label className="m-label">Elige las preguntas</label>
                {preguntas.length === 0 ? (
                  <p className="text-sm text-muted">
                    Aún no tienes preguntas — crea algunas primero en el banco
                    de preguntas.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-line bg-elevated/40 p-2">
                    {preguntas.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-start gap-2.5 rounded-md px-2 py-2 text-sm text-ink hover:bg-elevated"
                      >
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(p.id)}
                          onChange={() => toggleSeleccion(p.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                        />
                        <span>
                          {p.enunciado}{" "}
                          <span className="text-muted">
                            ({p.materia} / {p.tema})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={guardando || seleccionadas.length === 0 || !nombre}
                  className="m-btn m-btn-primary"
                >
                  {guardando ? "Guardando..." : "Crear set"}
                </button>
                {error && (
                  <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}
              </div>
            </form>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">
              Tus sets{" "}
              <span className="font-normal text-muted">({sets.length})</span>
            </h2>
            {sets.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Aún no tienes sets.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {sets.map((s) => (
                  <li key={s.id} className="m-card p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <strong className="text-ink">{s.nombre}</strong>
                      <span className="shrink-0 text-sm text-muted">
                        {s.preguntas.length} pregunta(s)
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                      {s.preguntas.map((sp) => (
                        <li key={sp.pregunta.id} className="text-sm text-muted">
                          {sp.pregunta.enunciado}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
