import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {Icon && (
        <Icon className="h-10 w-10 text-muted-foreground mb-4" />
      )}
      <p className="text-lg font-bold">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          {description}
        </p>
      )}
    </div>
  );
}
