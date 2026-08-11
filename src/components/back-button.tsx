import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Goes back through real browser history so the previous page (and its
 * filters, which live in the URL) are restored. Falls back to a parent path
 * when there is no history entry to return to (deep link / refresh).
 */
export function BackButton({ fallback = "/", label = "Back" }: { fallback?: string; label?: string }) {
  const router = useRouter();

  function goBack() {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    void router.navigate({ to: fallback });
  }

  return (
    <Button variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground" onClick={goBack}>
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
