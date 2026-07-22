// app/api/auth/registro/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registroDocenteSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const datos = registroDocenteSchema.parse(body);

    const existente = await prisma.docente.findUnique({
      where: { correo: datos.correo },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un docente con ese correo" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(datos.password, 10);

    const docente = await prisma.docente.create({
      data: {
        nombre: datos.nombre,
        correo: datos.correo,
        passwordHash,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        creadoEn: true,
      },
    });

    return NextResponse.json({ docente }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}