"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Algo salió muy mal</h1>
          <p className="mb-4 text-gray-400">{error.message || "Error inesperado"}</p>
          <button
            onClick={reset}
            className="rounded-full bg-[#e8501c] px-6 py-2 font-semibold text-white hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
