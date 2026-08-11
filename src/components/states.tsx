import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string | undefined }) {
  return (
    <div className="panel p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="panel border-destructive/40 p-6 text-center" role="alert">
      <p className="text-sm font-medium text-destructive">Something went wrong</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

/** Renders the right state for a query: loading → error → empty → content. */
export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyHint,
  children,
}: {
  isLoading: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyTitle?: string | undefined;
  emptyHint?: string | undefined;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unexpected error"} />;
  if (isEmpty) return <EmptyState title={emptyTitle ?? "Nothing here yet"} hint={emptyHint} />;
  return <>{children}</>;
}
