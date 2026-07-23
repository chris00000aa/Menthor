// components/BotonCerrarSesion.tsx
"use client";

import { useRouter } from "next/navigation";

export default function BotonCerrarSesion() {
  const router = useRouter();

  async function handleCerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleCerrarSesion}
      className="m-btn m-btn-ghost px-3.5 py-2 text-sm"
    >
      Cerrar sesión
    </button>
  );
}
