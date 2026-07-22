// app/api/sets/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getDocenteAutenticado } from "@/lib/auth";
import { setSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const sesion = getDocenteAutenticado(request);

  if (!sesion) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sets = await prisma.set.findMany({
    where: { docenteId: sesion.docenteId },
    orderBy: { creadoEn: "desc" },
    include: {
      preguntas: {
        orderBy: { orden: "asc" },
        include: { pregunta: true },
      },
    },
  });

  return NextResponse.json({ sets });
}

export async function POST(request: NextRequest) {
  try {
    const sesion = getDocenteAutenticado(request);

    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const datos = setSchema.parse(body);

    // Verificamos que TODAS las preguntas existan y le pertenezcan al docente.
    const preguntasValidas = await prisma.pregunta.findMany({
      where: {
        id: { in: datos.preguntaIds },
        docenteId: sesion.docenteId,
      },
      select: { id: true },
    });

    if (preguntasValidas.length !== datos.preguntaIds.length) {
      return NextResponse.json(
        { error: "Una o más preguntas no existen o no te pertenecen" },
        { status: 403 }
      );
    }

    const set = await prisma.set.create({
      data: {
        nombre: datos.nombre,
        docenteId: sesion.docenteId,
        preguntas: {
          create: datos.preguntaIds.map((preguntaId, index) => ({
            preguntaId,
            orden: index,
          })),
        },
      },
      include: {
        preguntas: {
          orderBy: { orden: "asc" },
          include: { pregunta: true },
        },
      },
    });

    return NextResponse.json({ set }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error creando set:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}