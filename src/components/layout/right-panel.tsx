"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function RightPanel() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[350px] flex-col gap-4 overflow-y-auto py-4 pl-6 lg:flex">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar en Xcion"
          className="rounded-full bg-secondary pl-10"
        />
      </div>

      <div className="rounded-2xl bg-secondary p-4">
        <h2 className="mb-4 text-xl font-bold">Qué está pasando</h2>
        <p className="text-sm text-muted-foreground">
          Los temas de tendencia aparecerán aquí.
        </p>
      </div>

      <div className="rounded-2xl bg-secondary p-4">
        <h2 className="mb-4 text-xl font-bold">A quién seguir</h2>
        <p className="text-sm text-muted-foreground">
          Las sugerencias aparecerán aquí.
        </p>
      </div>
    </aside>
  );
}
