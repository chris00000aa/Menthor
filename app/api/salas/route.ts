// app/api/salas/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getDocenteAutenticado } from "@/lib/auth";
import { crearSalaSchema } from "@/lib/validations";

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I) para que sea fácil de leer en voz alta o proyectado.
const generarCodigo = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function POST(request: NextRequest) {
  try {
    const sesion = getDocenteAutenticado(request);

    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const datos = crearSalaSchema.parse(body);

    const set = await prisma.set.findUnique({
      where: { id: datos.setId },
    });

    if (!set) {
      return NextResponse.json({ error: "Set no encontrado" }, { status: 404 });
    }

    if (set.docenteId !== sesion.docenteId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Reintentamos si el código generado ya existiera (extremadamente improbable, pero gratis de cubrir).
    let codigo = generarCodigo();
    let intentos = 0;

    while (intentos < 5) {
      const existente = await prisma.sala.findUnique({ where: { codigo } });
      if (!existente) break;
      codigo = generarCodigo();
      intentos++;
    }

    const sala = await prisma.sala.create({
      data: {
        codigo,
        setId: datos.setId,
        estado: "espera",
      },
    });

    return NextResponse.json({ sala }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error creando sala:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}