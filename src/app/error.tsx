"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold">Algo salió mal</h1>
        <p className="mb-4 text-muted-foreground">{error.message || "Error inesperado"}</p>
        <button
          onClick={reset}
          className="rounded-full bg-xcion-primary px-6 py-2 font-semibold text-white hover:bg-xcion-primary-hover"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
