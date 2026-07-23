-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pregunta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materia" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "opciones" TEXT NOT NULL,
    "respuestaCorrecta" TEXT NOT NULL,
    "origen" TEXT NOT NULL DEFAULT 'manual',
    "dificultad" TEXT NOT NULL DEFAULT 'media',
    "tiempoLimiteMs" INTEGER NOT NULL DEFAULT 30000,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docenteId" INTEGER NOT NULL,
    CONSTRAINT "Pregunta_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pregunta" ("creadaEn", "dificultad", "docenteId", "enunciado", "id", "materia", "opciones", "origen", "respuestaCorrecta", "tema", "tipo") SELECT "creadaEn", "dificultad", "docenteId", "enunciado", "id", "materia", "opciones", "origen", "respuestaCorrecta", "tema", "tipo" FROM "Pregunta";
DROP TABLE "Pregunta";
ALTER TABLE "new_Pregunta" RENAME TO "Pregunta";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
