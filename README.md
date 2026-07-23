# Menthor

Plataforma educativa gamificada, estilo Kahoot, con salas en tiempo real, banco de preguntas y un asistente de IA para generar sugerencias — construida como Proyecto Integrador.

El docente crea preguntas (a mano o con ayuda de IA), las agrupa en sets, lanza una sala con un código y un QR, y los alumnos se unen desde su celular sin necesidad de cuenta. Todo corre en tiempo real: la pregunta, el temporizador, las respuestas y el ranking se sincronizan al instante entre la pantalla proyectada y cada celular conectado.

## Índice

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Modelo de datos](#modelo-de-datos)
- [Rutas de API](#rutas-de-api)
- [Eventos de Socket.IO](#eventos-de-socketio)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Documentación](#documentación)

## Características

- Registro e inicio de sesión de docentes, con sesión protegida (JWT en cookie `httpOnly`).
- Banco de preguntas: opción múltiple y verdadero/falso, creadas a mano o sugeridas por IA (Gemini) y aprobadas una por una antes de guardarse.
- Sets reutilizables que agrupan preguntas del banco.
- Salas con código único de 6 caracteres y código QR de acceso directo.
- Alumnos se unen sin cuenta, desde el celular, por código o QR.
- Motor de juego en tiempo real (Socket.IO): pregunta sincronizada, temporizador con avance manual o automático, puntaje por acierto y velocidad, retroalimentación inmediata, ranking en vivo y final.
- Aislamiento de datos por docente en cada operación del banco de preguntas, sets y salas.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router) · React · TypeScript · Tailwind CSS |
| Backend REST | Rutas de API integradas de Next.js |
| Tiempo real | Node.js + Socket.IO (servidor personalizado `server.mjs`) |
| Base de datos | SQLite vía Prisma ORM |
| Validación | Zod |
| Autenticación | bcryptjs + jsonwebtoken |
| IA | API de Gemini (Google AI Studio) vía `@google/genai` |
| Otros | nanoid (códigos de sala) · qrcode.react (QR de acceso) |

## Arquitectura

Arquitectura cliente-servidor. El frontend consume las rutas de API de Next.js para las operaciones convencionales (autenticación, banco de preguntas, sets, salas) y se conecta a Socket.IO para toda la sincronización en tiempo real dentro de una sala. Ambas piezas corren dentro del mismo servidor personalizado de Node.js, sobre el mismo puerto, ya que el modelo de servidor estándar de Next.js no admite conexiones persistentes. El acceso a datos se centraliza con Prisma sobre SQLite. El módulo de IA llama a Gemini únicamente cuando el docente solicita sugerencias, nunca de forma automática.

```
Cliente (navegador)                 Servidor (server.mjs)
┌──────────────────────┐            ┌────────────────────────────┐
│ Panel del docente     │──REST────▶│ Rutas de API de Next.js     │──▶ Prisma ──▶ SQLite
│ Pantalla del alumno   │──WS───────▶│ Socket.IO (juego en vivo)   │──▶ Prisma ──▶ SQLite
│ Pantalla de proyección│──WS───────▶│                              │
└──────────────────────┘            └───────────────┬──────────────┘
                                                      └──▶ API de Gemini (sugerencias)
```

## Estructura del proyecto

```
menthor/
├── app/
│   ├── api/
│   │   ├── auth/         # registro, login, logout
│   │   ├── preguntas/    # CRUD del banco de preguntas
│   │   ├── sets/         # crear y listar sets
│   │   ├── salas/        # crear salas
│   │   └── ia/           # sugerencias con Gemini
│   ├── login/  registro/  dashboard/  sets/  salas/  unirse/
│   └── salas/[codigo]/proyeccion/
├── components/            # NavHeader, BotonCerrarSesion, Temporizador
├── lib/                    # prisma.ts, auth.ts, validations.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── server.mjs              # servidor personalizado: Next.js + Socket.IO
```

## Puesta en marcha

Requiere Node.js v22 o superior.

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo .env (ver sección de abajo)

# 3. Aplicar las migraciones de la base de datos
npx prisma migrate dev

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Por default corre en `http://localhost:3000`. Para que los alumnos se conecten desde su celular, usa la IP local de tu red (por ejemplo `http://192.168.1.124:3000`) y agrégala en `allowedDevOrigins` dentro de `next.config.ts`.

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="una-cadena-aleatoria-y-larga"
GEMINI_API_KEY="tu-clave-de-Google-AI-Studio"
NEXT_PUBLIC_LAN_URL="http://TU-IP-LOCAL:3000"
```

`GEMINI_API_KEY` se obtiene gratis, sin tarjeta, en [aistudio.google.com](https://aistudio.google.com). `NEXT_PUBLIC_LAN_URL` se usa para que el código QR de las salas apunte siempre a una dirección accesible desde otros dispositivos de la red, sin importar cómo se abrió la página. Ninguna de estas variables debe subirse al repositorio.

## Modelo de datos

Siete entidades: `Docente`, `Pregunta`, `Set`, `SetPregunta` (tabla puente que permite reutilizar una pregunta en varios sets), `Sala`, `Participante` y `Respuesta`. El progreso de una partida en curso (pregunta activa, temporizador) vive en memoria del servidor mientras dura la sesión; solo el resultado final se persiste en la base de datos.

## Rutas de API

| Método y ruta | Función |
|---|---|
| `POST /api/auth/registro` | Crea una cuenta de docente |
| `POST /api/auth/login` | Inicia sesión |
| `POST /api/auth/logout` | Cierra sesión |
| `GET / POST /api/preguntas` | Lista o crea preguntas |
| `PUT / DELETE /api/preguntas/[id]` | Edita o elimina una pregunta propia |
| `GET / POST /api/sets` | Lista o crea sets |
| `POST /api/salas` | Crea una sala a partir de un set |
| `POST /api/ia/sugerencias` | Genera sugerencias de preguntas con Gemini |

Todas excepto registro y login requieren sesión activa.

## Eventos de Socket.IO

| Evento | Dirección | Función |
|---|---|---|
| `sala:docente-entra` | cliente → servidor | El docente abre la proyección |
| `sala:unirse` | cliente → servidor | Un alumno se une con código y alias |
| `sala:iniciar` | cliente → servidor | Inicia la partida |
| `sala:siguiente` | cliente → servidor | Avanza de pregunta manualmente |
| `juego:responder` | cliente → servidor | Un alumno envía su respuesta |
| `sala:participantes` | servidor → clientes | Lista de alumnos conectados |
| `juego:pregunta` | servidor → clientes | Pregunta activa (sin la respuesta correcta) |
| `juego:progreso` | servidor → clientes | Cuántos alumnos ya respondieron |
| `juego:respuesta-recibida` | servidor → cliente | Retroalimentación personal |
| `juego:finalizado` | servidor → clientes | Ranking final |

El avance de pregunta también puede dispararse automáticamente desde el servidor al agotarse el tiempo límite, sin necesidad de ningún evento del cliente.

## Limitaciones conocidas

- Editar y eliminar preguntas o sets aún no tiene botones en la interfaz (sí funciona por API).
- Un alumno que pierde la conexión y vuelve a entrar crea un participante nuevo en vez de recuperar su progreso.
- El sistema solo es accesible dentro de la misma red local mientras corre con `npm run dev`; no está desplegado en un servidor público.

## Documentación

El documento completo del proyecto, el manual de usuario y el manual técnico están incluidos como parte de los entregables de la materia.

## Equipo

Carlos Pérez García · Christian Jesus Pacheco Robles · Alexis Michael García Hernández · Dennise Hernández Salas

Proyecto Integrador — Universidad Politécnica de Santa Rosa Jáuregui — Carrera ITIID IA
