// app/api/preguntas/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getDocenteAutenticado } from "@/lib/auth";
import { preguntaSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const sesion = getDocenteAutenticado(request);

  if (!sesion) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const materia = searchParams.get("materia") ?? undefined;
  const tema = searchParams.get("tema") ?? undefined;
  const tipo = searchParams.get("tipo") ?? undefined;

  const preguntas = await prisma.pregunta.findMany({
    where: {
      docenteId: sesion.docenteId,
      ...(materia && { materia }),
      ...(tema && { tema }),
      ...(tipo && { tipo }),
    },
    orderBy: { creadaEn: "desc" },
  });

  // "opciones" se guarda como texto JSON en la base; lo devolvemos como arreglo.
  const preguntasFormateadas = preguntas.map((p) => ({
    ...p,
    opciones: JSON.parse(p.opciones),
  }));

  return NextResponse.json({ preguntas: preguntasFormateadas });
}

export async function POST(request: NextRequest) {
  try {
    const sesion = getDocenteAutenticado(request);

    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const datos = preguntaSchema.parse(body);

    const pregunta = await prisma.pregunta.create({
      data: {
        materia: datos.materia,
        tema: datos.tema,
        tipo: datos.tipo,
        enunciado: datos.enunciado,
        opciones: JSON.stringify(datos.opciones),
        respuestaCorrecta: datos.respuestaCorrecta,
        dificultad: datos.dificultad,
        origen: datos.origen,
        docenteId: sesion.docenteId,
        tiempoLimiteMs: datos.tiempoLimiteMs,
      },
    });

    return NextResponse.json(
      { pregunta: { ...pregunta, opciones: datos.opciones } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error creando pregunta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}