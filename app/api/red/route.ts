// app/api/red/route.ts

import { NextResponse } from "next/server";
import os from "node:os";

export async function GET() {
  const interfaces = os.networkInterfaces();

  for (const nombre of Object.keys(interfaces)) {
    for (const direccion of interfaces[nombre] || []) {
      if (direccion.family === "IPv4" && !direccion.internal && /wi-?fi|wlan/i.test(nombre)) {
        return NextResponse.json({ ip: direccion.address });
      }
    }
  }

  for (const nombre of Object.keys(interfaces)) {
    if (/virtual|vmware|vbox|hyper-v/i.test(nombre)) continue;
    for (const direccion of interfaces[nombre] || []) {
      if (direccion.family === "IPv4" && !direccion.internal) {
        return NextResponse.json({ ip: direccion.address });
      }
    }
  }

  return NextResponse.json({ ip: null });
}