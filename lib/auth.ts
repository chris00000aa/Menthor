// lib/auth.ts

import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface PayloadToken {
  docenteId: number;
  correo: string;
}

export function getDocenteAutenticado(
  request: NextRequest
): PayloadToken | null {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as PayloadToken;
    return payload;
  } catch {
    // Token corrupto, alterado, o expirado: lo tratamos igual que "no autenticado".
    return null;
  }
}