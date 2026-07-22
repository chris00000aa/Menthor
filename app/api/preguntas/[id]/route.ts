// app/api/preguntas/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getDocenteAutenticado } from "@/lib/auth";
import { preguntaSchema } from "@/lib/validations";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Contexto) {
  try {
    const sesion = getDocenteAutenticado(request);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const preguntaId = Number(id);

    const preguntaExistente = await prisma.pregunta.findUnique({
      where: { id: preguntaId },
    });

    if (!preguntaExistente) {
      return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });
    }

    if (preguntaExistente.docenteId !== sesion.docenteId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const datos = preguntaSchema.parse(body);

    const preguntaActualizada = await prisma.pregunta.update({
      where: { id: preguntaId },
      data: {
        materia: datos.materia,
        tema: datos.tema,
        tipo: datos.tipo,
        enunciado: datos.enunciado,
        opciones: JSON.stringify(datos.opciones),
        respuestaCorrecta: datos.respuestaCorrecta,
        dificultad: datos.dificultad,
      },
    });

    return NextResponse.json({
      pregunta: { ...preguntaActualizada, opciones: datos.opciones },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error actualizando pregunta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Contexto) {
  const sesion = getDocenteAutenticado(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const preguntaId = Number(id);

  const preguntaExistente = await prisma.pregunta.findUnique({
    where: { id: preguntaId },
  });

  if (!preguntaExistente) {
    return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });
  }

  if (preguntaExistente.docenteId !== sesion.docenteId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.pregunta.delete({ where: { id: preguntaId } });

  return NextResponse.json({ mensaje: "Pregunta eliminada" });
}