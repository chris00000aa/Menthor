// app/test-socket/page.tsx
"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket-client";

export default function TestSocketPage() {
  const [conectado, setConectado] = useState(false);
  const [transporte, setTransporte] = useState("N/A");

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setConectado(true);
      setTransporte(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransporte(transport.name);
      });
    }

    function onDisconnect() {
      setConectado(false);
      setTransporte("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Prueba de conexión Socket.IO</h1>
      <p>Estado: {conectado ? "✅ Conectado" : "❌ Desconectado"}</p>
      <p>Transporte: {transporte}</p>
    </div>
  );
}