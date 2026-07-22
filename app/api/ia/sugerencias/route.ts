// app/api/ia/sugerencias/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { GoogleGenAI } from "@google/genai";
import { getDocenteAutenticado } from "@/lib/auth";
import { sugerenciasIASchema } from "@/lib/validations";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const sesion = getDocenteAutenticado(request);

    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const datos = sugerenciasIASchema.parse(body);

    const prompt = `Genera ${datos.cantidad} preguntas de opción múltiple sobre el tema "${datos.tema}" de la materia "${datos.materia}", apropiadas para nivel universitario.

Responde ÚNICAMENTE con un arreglo JSON válido, sin texto adicional antes ni después, con este formato exacto:
[
  {
    "enunciado": "texto de la pregunta",
    "opciones": ["opción 1", "opción 2", "opción 3", "opción 4"],
    "respuestaCorrecta": "debe ser idéntico a una de las opciones de arriba"
  }
]`;

    const respuesta = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    const textoRespuesta = respuesta.text ?? "";
    const limpio = textoRespuesta.replace(/```json|```/g, "").trim();
    const preguntasSugeridas = JSON.parse(limpio);

    return NextResponse.json({ preguntas: preguntasSugeridas });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error generando sugerencias:", error);
    return NextResponse.json(
      { error: "No se pudieron generar sugerencias. Intenta de nuevo." },
      { status: 500 }
    );
  }
}