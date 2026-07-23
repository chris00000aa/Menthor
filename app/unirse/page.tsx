// app/unirse/page.tsx
"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket-client";
import Temporizador from "@/components/Temporizador";

interface PreguntaEnVivo {
  id: number;
  numero: number;
  total: number;
  tipo: string;
  enunciado: string;
  opciones: string[];
  tiempoLimiteMs: number;
}

interface RespuestaFeedback {
  correcta: boolean;
  puntosGanados: number;
  puntajeTotal: number;
}

interface ParticipanteRanking {
  id: number;
  alias: string;
  puntaje: number;
}

function UnirseContenido() {
  const searchParams = useSearchParams();
  const [codigo, setCodigo] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");
  const [participanteId, setParticipanteId] = useState<number | null>(null);
  const [unido, setUnido] = useState(false);
  const [pregunta, setPregunta] = useState<PreguntaEnVivo | null>(null);
  const [horaPregunta, setHoraPregunta] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const [feedback, setFeedback] = useState<RespuestaFeedback | null>(null);
  const [ranking, setRanking] = useState<ParticipanteRanking[] | null>(null);

  useEffect(() => {
    const codigoUrl = searchParams.get("codigo");
    if (codigoUrl) setCodigo(codigoUrl);
  }, []);

  useEffect(() => {
    function onError({ mensaje }: { mensaje: string }) {
      setError(mensaje);
    }

    function onUnido(datos: { id: number }) {
      setUnido(true);
      setParticipanteId(datos.id);
    }

    function onPregunta(datos: PreguntaEnVivo) {
      setPregunta(datos);
      setHoraPregunta(Date.now());
      setRespondida(false);
      setFeedback(null);
    }

    function onRespuestaRecibida(datos: RespuestaFeedback) {
      setFeedback(datos);
    }

    function onFinalizado(datos: { ranking: ParticipanteRanking[] }) {
      setPregunta(null);
      setRanking(datos.ranking);
    }

    socket.on("sala:error", onError);
    socket.on("sala:unido", onUnido);
    socket.on("juego:pregunta", onPregunta);
    socket.on("juego:respuesta-recibida", onRespuestaRecibida);
    socket.on("juego:finalizado", onFinalizado);

    return () => {
      socket.off("sala:error", onError);
      socket.off("sala:unido", onUnido);
      socket.off("juego:pregunta", onPregunta);
      socket.off("juego:respuesta-recibida", onRespuestaRecibida);
      socket.off("juego:finalizado", onFinalizado);
    };
  }, []);

  function handleUnirse(e: FormEvent) {
    e.preventDefault();
    setError("");
    socket.emit("sala:unirse", { codigo, alias });
  }

  function handleResponder(opcion: string) {
    if (!pregunta || respondida) return;

    setRespondida(true);
    const tiempoMs = Date.now() - horaPregunta;

    socket.emit("juego:responder", {
      preguntaId: pregunta.id,
      respuestaDada: opcion,
      tiempoMs,
    });
  }

  function handleUnirseOtraSala() {
    setCodigo("");
    setAlias("");
    setParticipanteId(null);
    setUnido(false);
    setPregunta(null);
    setFeedback(null);
    setRanking(null);
  }

  const letras = ["a", "b", "c", "d"] as const;

  if (ranking) {
    const miPosicion = ranking.findIndex((p) => p.id === participanteId);
    const yo = ranking[miPosicion];

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          🏁 ¡Partida terminada!
        </h1>
        {yo && (
          <div className="m-card mt-2 px-8 py-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Tu resultado
            </p>
            <p className="mt-2 text-4xl font-bold text-accent">
              #{miPosicion + 1}
            </p>
            <p className="mt-1 text-lg text-ink">{yo.puntaje} puntos</p>
          </div>
        )}
        <button
          onClick={handleUnirseOtraSala}
          className="m-btn m-btn-primary mt-4 px-6 py-3"
        >
          Unirse a otra sala
        </button>
      </div>
    );
  }

  if (pregunta) {
    return (
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
          <div className="flex items-center justify-center gap-3">
            <p className="text-center text-sm font-semibold uppercase tracking-wide text-brand">
              Pregunta {pregunta.numero} de {pregunta.total}
            </p>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-accent/50 bg-accent/10 text-sm font-bold text-accent">
              <Temporizador
                key={pregunta.id}
                tiempoLimiteMs={pregunta.tiempoLimiteMs}
              />
            </div>
          </div>
          <h1 className="mt-3 text-center font-display text-2xl font-semibold leading-snug text-ink sm:text-3xl">
            {pregunta.enunciado}
          </h1>

          <div className="mt-8 flex-1">
            {feedback ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                {feedback.correcta ? (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-3xl">
                      ✅
                    </div>
                    <p className="text-2xl font-semibold text-success">
                      ¡Correcto! +{feedback.puntosGanados} puntos
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/15 text-3xl">
                      ❌
                    </div>
                    <p className="text-2xl font-semibold text-danger">
                      Incorrecto
                    </p>
                  </>
                )}
                <p className="text-base text-muted">
                  Puntaje total:{" "}
                  <span className="font-semibold text-ink">
                    {feedback.puntajeTotal}
                  </span>
                </p>
              </div>
            ) : (
              <div className="grid gap-3.5">
                {pregunta.opciones.map((op, i) => (
                  <button
                    key={i}
                    onClick={() => handleResponder(op)}
                    disabled={respondida}
                    className={`m-opt-${letras[i % 4]} flex items-center gap-4 px-5 py-5 text-left text-lg font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="m-opt-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (unido) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/15 text-3xl text-brand">
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
            ¡Estás dentro!
          </h1>
          <p className="mt-2 text-base text-muted">
            Esperando a que el profesor inicie la partida...
          </p>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_16px_var(--color-brand)]" />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Menthor
          </span>
        </div>

        <div className="m-card px-6 py-8 sm:px-8">
          <h1 className="text-center text-2xl font-semibold text-ink">
            Unirse a una sala
          </h1>
          <p className="mt-1.5 text-center text-sm text-muted">
            Pide el código a tu profesor.
          </p>

          <form onSubmit={handleUnirse} className="mt-7 space-y-5">
            <div>
              <label className="m-label" htmlFor="codigo">
                Código de sala
              </label>
              <input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                maxLength={6}
                className="m-input py-4 text-center font-display text-3xl font-bold uppercase tracking-[0.3em]"
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className="m-label" htmlFor="alias">
                Tu nombre
              </label>
              <input
                id="alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                maxLength={20}
                className="m-input text-lg"
                autoComplete="nickname"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="m-btn m-btn-primary w-full py-3.5 text-lg"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UnirsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted">Cargando...</p>
        </div>
      }
    >
      <UnirseContenido />
    </Suspense>
  );
}
