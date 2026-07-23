// components/Temporizador.tsx
"use client";

import { useEffect, useState } from "react";

interface TemporizadorProps {
  tiempoLimiteMs: number;
}

export default function Temporizador({ tiempoLimiteMs }: TemporizadorProps) {
  const [segundosRestantes, setSegundosRestantes] = useState(
    Math.floor(tiempoLimiteMs / 1000)
  );

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundosRestantes((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  return <span>{segundosRestantes}s</span>;
}