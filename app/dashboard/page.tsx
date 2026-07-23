// app/dashboard/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import NavHeader from "@/components/NavHeader";

interface Pregunta {
  id: number;
  materia: string;
  tema: string;
  tipo: string;
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: string;
  origen: string;
}

interface SugerenciaIA {
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [error, setError] = useState("");

  const [materia, setMateria] = useState("");
  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState("opcion_multiple");
  const [enunciado, setEnunciado] = useState("");
  const [opcionesMultiple, setOpcionesMultiple] = useState(["", "", "", ""]);
  const [respuestaCorrecta, setRespuestaCorrecta] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [iaMateria, setIaMateria] = useState("");
  const [iaTema, setIaTema] = useState("");
  const [iaCantidad, setIaCantidad] = useState(5);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState("");
  const [sugerenciasIA, setSugerenciasIA] = useState<SugerenciaIA[]>([]);

  async function cargarPreguntas() {
    setCargandoLista(true);
    const res = await fetch("/api/preguntas");

    if (res.status === 401) {
      router.push("/login");
      return;
    }

    const datos = await res.json();
    if (res.ok) {
      setPreguntas(datos.preguntas);
    }
    setCargandoLista(false);
  }

  useEffect(() => {
    cargarPreguntas();
  }, []);

  function handleOpcionChange(indice: number, valor: string) {
    const nuevas = [...opcionesMultiple];
    nuevas[indice] = valor;
    setOpcionesMultiple(nuevas);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const opciones =
      tipo === "verdadero_falso" ? ["Verdadero", "Falso"] : opcionesMultiple;

    setGuardando(true);

    const res = await fetch("/api/preguntas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materia,
        tema,
        tipo,
        enunciado,
        opciones,
        respuestaCorrecta,
      }),
    });

    const datos = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setError(datos.error || "Ocurrió un error");
      return;
    }

    setMateria("");
    setTema("");
    setEnunciado("");
    setOpcionesMultiple(["", "", "", ""]);
    setRespuestaCorrecta("");
    cargarPreguntas();
  }

  const opcionesParaElegir =
    tipo === "verdadero_falso" ? ["Verdadero", "Falso"] : opcionesMultiple;

  async function handleGenerarIA(e: FormEvent) {
    e.preventDefault();
    setErrorIA("");
    setGenerandoIA(true);

    const res = await fetch("/api/ia/sugerencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materia: iaMateria,
        tema: iaTema,
        cantidad: iaCantidad,
      }),
    });

    const datos = await res.json();
    setGenerandoIA(false);

    if (!res.ok) {
      setErrorIA(datos.error || "Ocurrió un error");
      return;
    }

    setSugerenciasIA(datos.preguntas);
  }

  function actualizarSugerencia(
    indice: number,
    cambios: Partial<SugerenciaIA>,
  ) {
    setSugerenciasIA((prev) =>
      prev.map((s, i) => (i === indice ? { ...s, ...cambios } : s)),
    );
  }

  function actualizarOpcionSugerencia(
    indiceSugerencia: number,
    indiceOpcion: number,
    valor: string,
  ) {
    setSugerenciasIA((prev) =>
      prev.map((s, i) => {
        if (i !== indiceSugerencia) return s;
        const nuevasOpciones = [...s.opciones];
        nuevasOpciones[indiceOpcion] = valor;
        return { ...s, opciones: nuevasOpciones };
      }),
    );
  }

  function descartarSugerencia(indice: number) {
    setSugerenciasIA((prev) => prev.filter((_, i) => i !== indice));
  }

  async function guardarSugerencia(indice: number) {
    const sugerencia = sugerenciasIA[indice];

    const res = await fetch("/api/preguntas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materia: iaMateria,
        tema: iaTema,
        tipo: "opcion_multiple",
        enunciado: sugerencia.enunciado,
        opciones: sugerencia.opciones,
        respuestaCorrecta: sugerencia.respuestaCorrecta,
        origen: "ia",
      }),
    });

    const datos = await res.json();

    if (!res.ok) {
      setErrorIA(datos.error || "No se pudo guardar esa pregunta");
      return;
    }

    descartarSugerencia(indice);
    cargarPreguntas();
  }

  return (
    <>
      <NavHeader />
      <div className="flex-1 px-4 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-4xl space-y-10">
          <div>
            <h1 className="text-3xl font-semibold text-ink">
              Banco de preguntas
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Crea preguntas a mano o genera sugerencias con IA.
            </p>
          </div>

          <section className="m-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink">
              Nueva pregunta (manual)
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="m-label" htmlFor="materia">
                    Materia
                  </label>
                  <input
                    id="materia"
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    className="m-input"
                  />
                </div>
                <div>
                  <label className="m-label" htmlFor="tema">
                    Tema
                  </label>
                  <input
                    id="tema"
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    className="m-input"
                  />
                </div>
              </div>

              <div>
                <label className="m-label" htmlFor="tipo">
                  Tipo
                </label>
                <div className="relative">
                  <select
                    id="tipo"
                    value={tipo}
                    onChange={(e) => {
                      setTipo(e.target.value);
                      setRespuestaCorrecta("");
                    }}
                    className="m-input appearance-none pr-9"
                  >
                    <option value="opcion_multiple">Opción múltiple</option>
                    <option value="verdadero_falso">Verdadero / Falso</option>
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      d="m5 7.5 5 5 5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label className="m-label" htmlFor="enunciado">
                  Enunciado
                </label>
                <textarea
                  id="enunciado"
                  value={enunciado}
                  onChange={(e) => setEnunciado(e.target.value)}
                  className="m-input resize-none"
                  rows={2}
                />
              </div>

              {tipo === "opcion_multiple" && (
                <div>
                  <label className="m-label">Opciones</label>
                  <div className="space-y-2">
                    {opcionesMultiple.map((op, i) => (
                      <input
                        key={i}
                        value={op}
                        onChange={(e) => handleOpcionChange(i, e.target.value)}
                        placeholder={`Opción ${i + 1}`}
                        className="m-input"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="m-label">Respuesta correcta</label>
                <div className="space-y-2">
                  {opcionesParaElegir
                    .filter((op) => op.trim() !== "")
                    .map((op, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <input
                          type="radio"
                          name="respuestaCorrecta"
                          checked={respuestaCorrecta === op}
                          onChange={() => setRespuestaCorrecta(op)}
                          className="h-4 w-4 accent-brand"
                        />
                        {op}
                      </label>
                    ))}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={guardando}
                  className="m-btn m-btn-primary"
                >
                  {guardando ? "Guardando..." : "Guardar pregunta"}
                </button>
                {error && (
                  <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}
              </div>
            </form>
          </section>

          <section className="m-card border-l-4 border-accent p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-base text-accent">
                ✨
              </span>
              <h2 className="text-lg font-semibold text-ink">Sugerir con IA</h2>
            </div>

            <form onSubmit={handleGenerarIA} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="m-label" htmlFor="ia-materia">
                    Materia
                  </label>
                  <input
                    id="ia-materia"
                    value={iaMateria}
                    onChange={(e) => setIaMateria(e.target.value)}
                    className="m-input"
                  />
                </div>
                <div>
                  <label className="m-label" htmlFor="ia-tema">
                    Tema
                  </label>
                  <input
                    id="ia-tema"
                    value={iaTema}
                    onChange={(e) => setIaTema(e.target.value)}
                    className="m-input"
                  />
                </div>
              </div>

              <div className="max-w-[8rem]">
                <label className="m-label" htmlFor="ia-cantidad">
                  Cantidad (1-10)
                </label>
                <input
                  id="ia-cantidad"
                  type="number"
                  min={1}
                  max={10}
                  value={iaCantidad}
                  onChange={(e) => setIaCantidad(Number(e.target.value))}
                  className="m-input"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={generandoIA}
                  className="m-btn m-btn-primary"
                >
                  {generandoIA ? "Generando..." : "Generar sugerencias"}
                </button>
                {errorIA && (
                  <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {errorIA}
                  </p>
                )}
              </div>
            </form>

            {sugerenciasIA.length > 0 && (
              <div className="mt-7 space-y-4 border-t border-line pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Revisa y aprueba cada una
                </h3>
                {sugerenciasIA.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-line bg-elevated/60 p-4 sm:p-5"
                  >
                    <textarea
                      value={s.enunciado}
                      onChange={(e) =>
                        actualizarSugerencia(i, { enunciado: e.target.value })
                      }
                      className="m-input resize-none"
                      rows={2}
                    />

                    <div className="mt-3 space-y-2">
                      {s.opciones.map((op, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correcta-${i}`}
                            checked={s.respuestaCorrecta === op}
                            onChange={() =>
                              actualizarSugerencia(i, { respuestaCorrecta: op })
                            }
                            className="h-4 w-4 shrink-0 accent-brand"
                          />
                          <input
                            value={op}
                            onChange={(e) =>
                              actualizarOpcionSugerencia(i, j, e.target.value)
                            }
                            className="m-input"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => guardarSugerencia(i)}
                        disabled={!s.respuestaCorrecta}
                        className="m-btn border border-success/30 bg-success/15 px-3 py-1.5 text-sm text-success hover:bg-success/25 disabled:opacity-50"
                      >
                        ✅ Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => descartarSugerencia(i)}
                        className="m-btn m-btn-ghost px-3 py-1.5 text-sm"
                      >
                        ❌ Descartar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">
              Tus preguntas{" "}
              <span className="font-normal text-muted">
                ({preguntas.length})
              </span>
            </h2>
            {cargandoLista ? (
              <p className="mt-4 text-sm text-muted">Cargando...</p>
            ) : preguntas.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Aún no tienes preguntas.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
                {preguntas.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-4 bg-surface/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink">{p.enunciado}</p>
                      <p className="mt-0.5 text-sm text-muted">
                        {p.materia} / {p.tema}
                      </p>
                    </div>
                    {p.origen === "ia" && (
                      <span
                        title="Generada por IA"
                        className="shrink-0 text-accent"
                      >
                        ✨
                      </span>
                    )}
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
