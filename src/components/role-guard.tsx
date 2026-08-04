import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { roleHome, useSession, type AppRole } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";

export function RoleGuard({ allow, children }: { allow: AppRole; children: ReactNode }) {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your workspace…</p>;
  }

  if (!session) return null;

  if (session.role !== allow) {
    return (
      <div className="panel mx-auto max-w-md p-6 text-center">
        <h2 className="text-lg font-semibold">Wrong portal</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is reserved for a different role.
        </p>
        <Button asChild className="mt-4">
          <Link to={roleHome(session.role)}>Go to my portal</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
