"use client";

import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PollDuration } from "@/lib/types";

interface PollComposerProps {
  options: string[];
  duration: PollDuration;
  onChange: (poll: { options: string[]; duration: PollDuration }) => void;
  onRemove: () => void;
}

const DURATION_LABELS: Record<PollDuration, string> = {
  "1d": "1 dia",
  "3d": "3 dias",
  "7d": "7 dias",
};

export function PollComposer({ options, duration, onChange, onRemove }: PollComposerProps) {
  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    onChange({ options: updated, duration });
  };

  const addOption = () => {
    if (options.length >= 4) return;
    onChange({ options: [...options, ""], duration });
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    onChange({ options: options.filter((_, i) => i !== index), duration });
  };

  return (
    <div className="mt-3 rounded-xl border p-3 space-y-3">
      <div className="space-y-2">
        {options.map((option, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Opcion ${i + 1}`}
              maxLength={80}
              className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-xcion-primary"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={`Eliminar opcion ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < 4 && (
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1.5 text-sm text-xcion-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar opcion
        </button>
      )}

      <div className="flex items-center gap-2 border-t pt-3">
        <span className="text-sm text-muted-foreground">Duracion:</span>
        <div className="flex gap-1">
          {(Object.keys(DURATION_LABELS) as PollDuration[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ options, duration: d })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                duration === d
                  ? "bg-xcion-primary text-white"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {DURATION_LABELS[d]}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="ml-auto text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Eliminar encuesta
        </Button>
      </div>
    </div>
  );
}
