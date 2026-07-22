// app/unirse/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { socket } from "@/lib/socket-client";

interface PreguntaEnVivo {
  id: number;
  numero: number;
  total: number;
  tipo: string;
  enunciado: string;
  opciones: string[];
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

export default function UnirsePage() {
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

  if (ranking) {
    const miPosicion = ranking.findIndex((p) => p.id === participanteId);
    const yo = ranking[miPosicion];

    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>🏁 ¡Partida terminada!</h1>
        {yo && (
          <p style={{ fontSize: 22 }}>
            Quedaste en el lugar #{miPosicion + 1} con {yo.puntaje} puntos.
          </p>
        )}
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

        {feedback ? (
          <div style={{ fontSize: 24, marginTop: 20 }}>
            {feedback.correcta ? (
              <p style={{ color: "green" }}>
                ✅ ¡Correcto! +{feedback.puntosGanados} puntos
              </p>
            ) : (
              <p style={{ color: "red" }}>❌ Incorrecto</p>
            )}
            <p>Puntaje total: {feedback.puntajeTotal}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pregunta.opciones.map((op, i) => (
              <button
                key={i}
                onClick={() => handleResponder(op)}
                disabled={respondida}
                style={{ fontSize: 20, padding: 16 }}
              >
                {op}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (unido) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>¡Estás dentro!</h1>
        <p>Esperando a que el profesor inicie la partida...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Unirse a una sala</h1>
      <form onSubmit={handleUnirse}>
        <div style={{ marginBottom: 12 }}>
          <label>Código de sala</label>
          <br />
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            style={{ fontSize: 24, padding: 8, width: 200 }}
            maxLength={6}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Tu nombre</label>
          <br />
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            style={{ fontSize: 18, padding: 8, width: 200 }}
            maxLength={20}
          />
        </div>
        <button type="submit" style={{ padding: "8px 16px", fontSize: 18 }}>
          Entrar
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}