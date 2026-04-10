"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PollWithOptions } from "@/lib/types";

interface PollDisplayProps {
  poll: PollWithOptions;
  onVote: (optionId: string) => void;
  isVoting: boolean;
}

function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Finalizada";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d restantes`;
  }
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  return `${minutes}m restantes`;
}

export function PollDisplay({ poll, onVote, isVoting }: PollDisplayProps) {
  const hasVoted = poll.user_vote_option_id !== null;
  const showResults = hasVoted || poll.is_expired;

  return (
    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
      {poll.options.map((option) => {
        const percentage =
          poll.total_votes > 0 ? Math.round((option.vote_count / poll.total_votes) * 100) : 0;
        const isUserChoice = option.id === poll.user_vote_option_id;

        if (showResults) {
          return (
            <div key={option.id} className="relative overflow-hidden rounded-lg border py-2 px-3">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-all",
                  isUserChoice ? "bg-xcion-primary/20" : "bg-accent"
                )}
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  {isUserChoice && <Check className="h-3.5 w-3.5 text-xcion-primary" />}
                  {option.label}
                </span>
                <span className="font-medium text-muted-foreground">{percentage}%</span>
              </div>
            </div>
          );
        }

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onVote(option.id)}
            disabled={isVoting}
            className="w-full rounded-lg border py-2 px-3 text-left text-sm font-medium transition-colors hover:border-xcion-primary hover:text-xcion-primary disabled:opacity-50"
          >
            {option.label}
          </button>
        );
      })}

      <p className="text-xs text-muted-foreground">
        {poll.total_votes} {poll.total_votes === 1 ? "voto" : "votos"} ·{" "}
        {formatTimeRemaining(poll.expires_at)}
      </p>
    </div>
  );
}
