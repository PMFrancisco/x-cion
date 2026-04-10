"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { PostWithCounts, PaginatedResponse } from "@/lib/types";
import type { InfiniteData } from "@tanstack/react-query";

type PostPages = InfiniteData<PaginatedResponse<PostWithCounts>>;

export function useVotePoll() {
  const queryClient = useQueryClient();
  const { effectiveProfileId } = useAuth();

  return useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      if (!effectiveProfileId) throw new Error("Not authenticated");
      const supabase = createClient();
      const { error } = await supabase
        .from("poll_votes")
        .insert({ poll_id: pollId, user_id: effectiveProfileId, option_id: optionId });
      if (error) throw error;
    },

    onMutate: async ({ pollId, optionId }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const previousPosts = queryClient.getQueriesData<PostPages>({ queryKey: ["posts"] });

      queryClient.setQueriesData<PostPages>({ queryKey: ["posts"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((post) => {
              if (post.poll?.id !== pollId) return post;
              return {
                ...post,
                poll: {
                  ...post.poll,
                  user_vote_option_id: optionId,
                  total_votes: post.poll.total_votes + 1,
                  options: post.poll.options.map((opt) =>
                    opt.id === optionId ? { ...opt, vote_count: opt.vote_count + 1 } : opt
                  ),
                },
              };
            }),
          })),
        };
      });

      // Also update thread view
      queryClient.setQueriesData<PostWithCounts>({ queryKey: ["post"], exact: false }, (old) => {
        if (!old || old.poll?.id !== pollId) return old;
        return {
          ...old,
          poll: {
            ...old.poll,
            user_vote_option_id: optionId,
            total_votes: old.poll.total_votes + 1,
            options: old.poll.options.map((opt) =>
              opt.id === optionId ? { ...opt, vote_count: opt.vote_count + 1 } : opt
            ),
          },
        };
      });

      return { previousPosts };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        for (const [key, data] of context.previousPosts) {
          queryClient.setQueryData(key, data);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
  });
}
