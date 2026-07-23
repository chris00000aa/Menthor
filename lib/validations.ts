// lib/validations.ts

import { z } from "zod";

// ---------- Docente (autenticación) ----------

export const registroDocenteSchema = z.object({
  nombre: z.string().min(2, "El nombre es muy corto").max(100),
  correo: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const loginDocenteSchema = z.object({
  correo: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

// ---------- Preguntas ----------
// Nota: MVP solo soporta opción múltiple y verdadero/falso.
// "Respuesta abierta" se descartó: no se puede calificar en tiempo real.

export const tiposPregunta = ["opcion_multiple", "verdadero_falso"] as const;
export const dificultades = ["facil", "media", "dificil"] as const;

export const preguntaSchema = z
  .object({
    materia: z.string().min(1, "La materia es obligatoria"),
    tema: z.string().min(1, "El tema es obligatorio"),
    tipo: z.enum(tiposPregunta),
    enunciado: z.string().min(3, "El enunciado es muy corto"),
    opciones: z.array(z.string().min(1)).min(2, "Se necesitan al menos 2 opciones"),
    respuestaCorrecta: z.string().min(1, "Falta indicar la respuesta correcta"),
    dificultad: z.enum(dificultades).default("media"),
    origen: z.enum(["manual", "ia"]).default("manual"),
    tiempoLimiteMs: z.number().int().min(5000).max(120000).default(30000),
  })
  .refine((datos) => datos.opciones.includes(datos.respuestaCorrecta), {
    message: "La respuesta correcta debe ser una de las opciones",
    path: ["respuestaCorrecta"],
  });
// ---------- Sets ----------

export const setSchema = z.object({
  nombre: z.string().min(1, "El set necesita un nombre"),
  preguntaIds: z
    .array(z.number().int().positive())
    .min(1, "El set necesita al menos una pregunta"),
});

// ---------- Salas ----------

export const crearSalaSchema = z.object({
  setId: z.number().int().positive(),
});

export const unirseSalaSchema = z.object({
  codigo: z.string().length(6, "El código debe tener 6 caracteres"),
  alias: z.string().min(1, "Escribe un nombre").max(20, "Máximo 20 caracteres"),
});

// ---------- Respuestas (juego en vivo) ----------

export const responderPreguntaSchema = z.object({
  participanteId: z.number().int().positive(),
  preguntaId: z.number().int().positive(),
  respuestaDada: z.string().min(1),
  tiempoMs: z.number().int().nonnegative(),
});

// ---------- Asistente de IA ----------

export const sugerenciasIASchema = z.object({
  materia: z.string().min(1, "Indica una materia"),
  tema: z.string().min(2, "Indica un tema"),
  cantidad: z.number().int().min(1).max(10).default(5),
});

// Tipos de TypeScript derivados automáticamente de cada schema
export type RegistroDocenteInput = z.infer<typeof registroDocenteSchema>;
export type LoginDocenteInput = z.infer<typeof loginDocenteSchema>;
export type PreguntaInput = z.infer<typeof preguntaSchema>;
export type SetInput = z.infer<typeof setSchema>;
export type CrearSalaInput = z.infer<typeof crearSalaSchema>;
export type UnirseSalaInput = z.infer<typeof unirseSalaSchema>;
export type ResponderPreguntaInput = z.infer<typeof responderPreguntaSchema>;
export type SugerenciasIAInput = z.infer<typeof sugerenciasIASchema>;