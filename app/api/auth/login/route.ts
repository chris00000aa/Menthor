// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { loginDocenteSchema } from "@/lib/validations";

const JWT_SECRET = process.env.JWT_SECRET as string;
const SIETE_DIAS_EN_SEGUNDOS = 60 * 60 * 24 * 7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const datos = loginDocenteSchema.parse(body);

    const docente = await prisma.docente.findUnique({
      where: { correo: datos.correo },
    });

    // Mensaje genérico a propósito: no revelamos si falló el correo o la contraseña.
    if (!docente) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const passwordValida = await bcrypt.compare(
      datos.password,
      docente.passwordHash
    );

    if (!passwordValida) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { docenteId: docente.id, correo: docente.correo },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      docente: {
        id: docente.id,
        nombre: docente.nombre,
        correo: docente.correo,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SIETE_DIAS_EN_SEGUNDOS,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}