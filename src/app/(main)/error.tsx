"use client";

import { useRouter } from "next/navigation";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold">Algo salió mal</h1>
        <p className="mb-4 text-muted-foreground">{error.message || "Error inesperado"}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-xcion-primary px-6 py-2 font-semibold text-white hover:bg-xcion-primary-hover"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-border px-6 py-2 font-semibold hover:bg-accent"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
