export function PostSkeleton() {
  return (
    <div className="flex gap-3 border-b px-4 py-3 animate-pulse">
      <div className="h-10 w-10 shrink-0 rounded-full bg-secondary" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-4 w-24 rounded bg-secondary" />
          <div className="h-4 w-16 rounded bg-secondary" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-full rounded bg-secondary" />
          <div className="h-4 w-3/4 rounded bg-secondary" />
        </div>
        <div className="flex gap-8 pt-2">
          <div className="h-4 w-10 rounded bg-secondary" />
          <div className="h-4 w-10 rounded bg-secondary" />
          <div className="h-4 w-10 rounded bg-secondary" />
        </div>
      </div>
    </div>
  );
}

export function PostSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-32 bg-secondary sm:h-48" />
      <div className="px-4">
        <div className="-mt-12 h-20 w-20 rounded-full border-4 border-background bg-secondary sm:-mt-16 sm:h-32 sm:w-32" />
        <div className="mt-3 space-y-2">
          <div className="h-5 w-32 rounded bg-secondary" />
          <div className="h-4 w-24 rounded bg-secondary" />
          <div className="h-4 w-48 rounded bg-secondary" />
        </div>
      </div>
    </div>
  );
}
