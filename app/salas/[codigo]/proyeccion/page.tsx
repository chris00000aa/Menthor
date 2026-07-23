// app/salas/[codigo]/proyeccion/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { socket } from "@/lib/socket-client";
import Temporizador from "@/components/Temporizador";

interface Participante {
  id: number;
  alias: string;
  puntaje: number;
}

interface PreguntaEnVivo {
  id: number;
  numero: number;
  total: number;
  tipo: string;
  enunciado: string;
  opciones: string[];
  tiempoLimiteMs: number;
}

interface Progreso {
  respondieron: number;
  total: number;
}

export default function ProyeccionSalaPage() {
  const params = useParams<{ codigo: string }>();
  const codigo = params.codigo;
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [pregunta, setPregunta] = useState<PreguntaEnVivo | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [ranking, setRanking] = useState<Participante[] | null>(null);
  const [error, setError] = useState("");
  const [origen, setOrigen] = useState("");

  useEffect(() => {
    fetch("/api/red")
      .then((res) => res.json())
      .then((datos) => {
        setOrigen(datos.ip ? `http://${datos.ip}:3000` : window.location.origin);
      })
      .catch(() => setOrigen(window.location.origin));
  }, []);

  useEffect(() => {
    function onParticipantes(lista: Participante[]) {
      setParticipantes(lista);
    }

    function onPregunta(datos: PreguntaEnVivo) {
      setPregunta(datos);
      setProgreso(null);
    }

    function onProgreso(datos: Progreso) {
      setProgreso(datos);
    }

    function onFinalizado(datos: { ranking: Participante[] }) {
      setPregunta(null);
      setRanking(datos.ranking);
    }

    function onError({ mensaje }: { mensaje: string }) {
      setError(mensaje);
    }

    socket.on("sala:participantes", onParticipantes);
    socket.on("juego:pregunta", onPregunta);
    socket.on("juego:progreso", onProgreso);
    socket.on("juego:finalizado", onFinalizado);
    socket.on("sala:error", onError);

    socket.emit("sala:docente-entra", { codigo });

    return () => {
      socket.off("sala:participantes", onParticipantes);
      socket.off("juego:pregunta", onPregunta);
      socket.off("juego:progreso", onProgreso);
      socket.off("juego:finalizado", onFinalizado);
      socket.off("sala:error", onError);
    };
  }, [codigo]);

  function handleIniciar() {
    setError("");
    socket.emit("sala:iniciar", { codigo });
  }

  function handleSiguiente() {
    setError("");
    socket.emit("sala:siguiente", { codigo });
  }

  const letras = ["a", "b", "c", "d"] as const;

  if (ranking) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Link
          href="/salas"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-sm font-medium text-faint transition-colors hover:text-muted sm:left-6 sm:top-6"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              d="M12 15.5 7 10l5-5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Volver a salas
        </Link>

        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
          🏆 Ranking final
        </h1>
        <ol className="mt-10 w-full max-w-2xl space-y-3">
          {ranking.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-2xl border px-6 py-4 text-xl font-semibold sm:text-2xl ${
                i === 0
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line bg-surface/60 text-ink"
              }`}
            >
              <span className="flex items-center gap-4">
                <span className="w-9 text-lg sm:text-xl">
                  {i === 0
                    ? "🥇"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : `#${i + 1}`}
                </span>
                {p.alias}
              </span>
              <span>{p.puntaje} pts</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (pregunta) {
    const progresoPct =
      progreso && progreso.total > 0
        ? Math.round((progreso.respondieron / progreso.total) * 100)
        : 0;

    return (
      <div className="flex flex-1 flex-col px-6 py-10 sm:px-12 sm:py-14">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <div className="flex items-center justify-center gap-4">
            <p className="text-lg font-semibold text-brand sm:text-xl">
              Pregunta {pregunta.numero} de {pregunta.total}
            </p>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-accent/50 bg-accent/10 font-display text-lg font-bold text-accent sm:h-16 sm:w-16 sm:text-xl">
              <Temporizador
                key={pregunta.id}
                tiempoLimiteMs={pregunta.tiempoLimiteMs}
              />
            </div>
          </div>
          <h1 className="mt-4 text-center font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
            {pregunta.enunciado}
          </h1>

          <div className="mt-10 grid flex-1 content-start gap-4 sm:grid-cols-2">
            {pregunta.opciones.map((op, i) => (
              <div
                key={i}
                className={`m-opt-${letras[i % 4]} flex items-center gap-4 px-6 py-6 text-xl font-semibold text-ink sm:text-2xl`}
              >
                <span
                  className={`m-opt-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {op}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-5">
            {progreso && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-muted">
                  <span>Respondieron</span>
                  <span>
                    {progreso.respondieron} / {progreso.total}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={handleSiguiente}
              className="m-btn m-btn-primary px-8 py-3.5 text-lg"
            >
              {pregunta.numero === pregunta.total
                ? "Finalizar"
                : "Siguiente pregunta"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <Link
        href="/salas"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-sm font-medium text-faint transition-colors hover:text-muted sm:left-6 sm:top-6"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            d="M12 15.5 7 10l5-5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver a salas
      </Link>

      <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
        <div>
          <p className="text-lg font-medium text-muted sm:text-xl">
            Alumnos: entren a{" "}
            <span className="font-semibold text-ink">/unirse</span> con este
            código
          </p>
          <p className="mt-3 font-display text-7xl font-bold tracking-[0.08em] text-brand [text-shadow:0_0_60px_rgba(38,213,184,0.35)] sm:text-8xl">
            {codigo}
          </p>
        </div>

        {origen && (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl bg-white p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]">
              <QRCodeSVG
                value={`${origen}/unirse?codigo=${codigo}`}
                size={168}
              />
            </div>
            <p className="text-sm text-muted">O escanea para entrar directo</p>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-base text-danger">
          {error}
        </p>
      )}

      <div className="w-full max-w-3xl">
        <h2 className="text-xl font-semibold text-ink sm:text-2xl">
          Alumnos conectados{" "}
          <span className="font-normal text-muted">
            ({participantes.length})
          </span>
        </h2>
        {participantes.length === 0 ? (
          <p className="mt-4 text-base text-muted">
            Esperando a que se conecten...
          </p>
        ) : (
          <ul className="mt-5 flex flex-wrap justify-center gap-3">
            {participantes.map((p) => (
              <li
                key={p.id}
                className="rounded-full border border-line bg-elevated px-5 py-2.5 text-lg font-medium text-ink"
              >
                {p.alias}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleIniciar}
        disabled={participantes.length === 0}
        className="m-btn m-btn-primary px-10 py-4 text-xl"
      >
        Iniciar partida
      </button>
    </div>
  );
}
