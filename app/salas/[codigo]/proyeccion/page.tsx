// app/salas/[codigo]/proyeccion/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/lib/socket-client";

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

  if (ranking) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>🏆 Ranking final</h1>
        <ol style={{ fontSize: 24 }}>
          {ranking.map((p) => (
            <li key={p.id}>
              {p.alias} — {p.puntaje} puntos
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (pregunta) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h2>
          Pregunta {pregunta.numero} de {pregunta.total}
        </h2>
        <h1>{pregunta.enunciado}</h1>
        <ul style={{ fontSize: 24 }}>
          {pregunta.opciones.map((op, i) => (
            <li key={i}>{op}</li>
          ))}
        </ul>
        {progreso && (
          <p style={{ fontSize: 20, marginTop: 20 }}>
            {progreso.respondieron} de {progreso.total} ya respondieron
          </p>
        )}
        <button
          onClick={handleSiguiente}
          style={{ padding: "12px 24px", fontSize: 20, marginTop: 20 }}
        >
          Siguiente pregunta
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Código de sala: {codigo}</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <h2>Alumnos conectados ({participantes.length})</h2>
      <ul>
        {participantes.map((p) => (
          <li key={p.id} style={{ fontSize: 20 }}>
            {p.alias}
          </li>
        ))}
      </ul>
      <button
        onClick={handleIniciar}
        style={{ padding: "12px 24px", fontSize: 20, marginTop: 20 }}
        disabled={participantes.length === 0}
      >
        Iniciar partida
      </button>
    </div>
  );
}