// server.mjs

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const TIEMPO_LIMITE_MS = 20000; // 20 segundos por pregunta, usado para el bono de velocidad

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const prisma = new PrismaClient();

const juegosActivos = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  function enviarPreguntaActual(codigo) {
    const juego = juegosActivos.get(codigo);
    if (!juego) return;

    juego.respondieron = new Set();

    const preguntaActual = juego.preguntas[juego.indiceActual];

    io.to(codigo).emit("juego:pregunta", {
      id: preguntaActual.id,
      numero: juego.indiceActual + 1,
      total: juego.preguntas.length,
      tipo: preguntaActual.tipo,
      enunciado: preguntaActual.enunciado,
      opciones: JSON.parse(preguntaActual.opciones),
    });
  }

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("sala:docente-entra", async ({ codigo }) => {
      const sala = await prisma.sala.findUnique({ where: { codigo } });

      if (!sala) {
        socket.emit("sala:error", { mensaje: "Sala no encontrada" });
        return;
      }

      socket.join(codigo);

      const participantes = await prisma.participante.findMany({
        where: { salaId: sala.id },
        orderBy: { id: "asc" },
      });

      socket.emit("sala:participantes", participantes);
    });

    socket.on("sala:unirse", async ({ codigo, alias }) => {
      const codigoNormalizado = (codigo || "").trim().toUpperCase();
      const aliasLimpio = (alias || "").trim();

      if (!codigoNormalizado || !aliasLimpio) {
        socket.emit("sala:error", { mensaje: "Código y nombre son obligatorios" });
        return;
      }

      const sala = await prisma.sala.findUnique({
        where: { codigo: codigoNormalizado },
      });

      if (!sala) {
        socket.emit("sala:error", { mensaje: "Ese código no existe" });
        return;
      }

      if (sala.estado !== "espera") {
        socket.emit("sala:error", {
          mensaje: "Esta sala ya inició, no se puede unir",
        });
        return;
      }

      const participante = await prisma.participante.create({
        data: {
          salaId: sala.id,
          alias: aliasLimpio,
        },
      });

      socket.data.participanteId = participante.id;
      socket.data.salaId = sala.id;
      socket.data.codigo = codigoNormalizado;
      socket.join(codigoNormalizado);

      socket.emit("sala:unido", participante);

      const participantes = await prisma.participante.findMany({
        where: { salaId: sala.id },
        orderBy: { id: "asc" },
      });

      io.to(codigoNormalizado).emit("sala:participantes", participantes);
    });

    socket.on("sala:iniciar", async ({ codigo }) => {
      const codigoNormalizado = (codigo || "").trim().toUpperCase();

      const sala = await prisma.sala.findUnique({
        where: { codigo: codigoNormalizado },
      });

      if (!sala) {
        socket.emit("sala:error", { mensaje: "Sala no encontrada" });
        return;
      }

      if (sala.estado !== "espera") {
        socket.emit("sala:error", { mensaje: "La partida ya inició" });
        return;
      }

      const setPreguntas = await prisma.setPregunta.findMany({
        where: { setId: sala.setId },
        orderBy: { orden: "asc" },
        include: { pregunta: true },
      });

      if (setPreguntas.length === 0) {
        socket.emit("sala:error", { mensaje: "El set no tiene preguntas" });
        return;
      }

      await prisma.sala.update({
        where: { id: sala.id },
        data: { estado: "jugando" },
      });

      juegosActivos.set(codigoNormalizado, {
        salaId: sala.id,
        preguntas: setPreguntas.map((sp) => sp.pregunta),
        indiceActual: 0,
        respondieron: new Set(),
      });

      enviarPreguntaActual(codigoNormalizado);
    });
    // El profesor avanza a la siguiente pregunta, o termina la partida.
    socket.on("sala:siguiente", async ({ codigo }) => {
      const codigoNormalizado = (codigo || "").trim().toUpperCase();
      const juego = juegosActivos.get(codigoNormalizado);

      if (!juego) {
        socket.emit("sala:error", { mensaje: "La partida no está activa" });
        return;
      }

      juego.indiceActual += 1;

      if (juego.indiceActual < juego.preguntas.length) {
        enviarPreguntaActual(codigoNormalizado);
        return;
      }

      await prisma.sala.update({
        where: { id: juego.salaId },
        data: { estado: "finalizada" },
      });

      const ranking = await prisma.participante.findMany({
        where: { salaId: juego.salaId },
        orderBy: { puntaje: "desc" },
      });

      io.to(codigoNormalizado).emit("juego:finalizado", { ranking });

      juegosActivos.delete(codigoNormalizado);
    });
    // Un alumno responde la pregunta activa.
    socket.on("juego:responder", async ({ preguntaId, respuestaDada, tiempoMs }) => {
      const codigo = socket.data.codigo;
      const participanteId = socket.data.participanteId;

      if (!codigo || !participanteId) {
        socket.emit("sala:error", { mensaje: "No estás en una sala" });
        return;
      }

      const juego = juegosActivos.get(codigo);

      if (!juego) {
        socket.emit("sala:error", { mensaje: "La partida no está activa" });
        return;
      }

      const preguntaActual = juego.preguntas[juego.indiceActual];

      if (preguntaActual.id !== preguntaId) {
        socket.emit("sala:error", { mensaje: "Esa pregunta ya no está activa" });
        return;
      }

      if (juego.respondieron.has(participanteId)) {
        socket.emit("sala:error", { mensaje: "Ya respondiste esta pregunta" });
        return;
      }

      juego.respondieron.add(participanteId);

      const correcta = respuestaDada === preguntaActual.respuestaCorrecta;
      let puntos = 0;

      if (correcta) {
        const tiempoRestante = Math.max(0, TIEMPO_LIMITE_MS - tiempoMs);
        puntos = Math.round(500 + 500 * (tiempoRestante / TIEMPO_LIMITE_MS));
      }

      await prisma.respuesta.create({
        data: {
          participanteId,
          preguntaId,
          respuestaDada,
          correcta,
          tiempoMs,
        },
      });

      const participante = await prisma.participante.update({
        where: { id: participanteId },
        data: { puntaje: { increment: puntos } },
      });

      socket.emit("juego:respuesta-recibida", {
        correcta,
        puntosGanados: puntos,
        puntajeTotal: participante.puntaje,
      });

      const totalParticipantes = await prisma.participante.count({
        where: { salaId: juego.salaId },
      });

      io.to(codigo).emit("juego:progreso", {
        respondieron: juego.respondieron.size,
        total: totalParticipantes,
      });
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Listo en http://${hostname}:${port}`);
    });
});