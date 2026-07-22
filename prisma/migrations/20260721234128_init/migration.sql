-- CreateTable
CREATE TABLE "Docente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pregunta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materia" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "opciones" TEXT NOT NULL,
    "respuestaCorrecta" TEXT NOT NULL,
    "origen" TEXT NOT NULL DEFAULT 'manual',
    "dificultad" TEXT NOT NULL DEFAULT 'media',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docenteId" INTEGER NOT NULL,
    CONSTRAINT "Pregunta_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Set" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docenteId" INTEGER NOT NULL,
    CONSTRAINT "Set_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SetPregunta" (
    "setId" INTEGER NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("setId", "preguntaId"),
    CONSTRAINT "SetPregunta_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SetPregunta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sala" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'espera',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "setId" INTEGER NOT NULL,
    CONSTRAINT "Sala_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participante" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alias" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL DEFAULT 0,
    "salaId" INTEGER NOT NULL,
    CONSTRAINT "Participante_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Respuesta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "respuestaDada" TEXT NOT NULL,
    "correcta" BOOLEAN NOT NULL,
    "tiempoMs" INTEGER NOT NULL,
    "participanteId" INTEGER NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    CONSTRAINT "Respuesta_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Participante" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Respuesta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Docente_correo_key" ON "Docente"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Sala_codigo_key" ON "Sala"("codigo");
