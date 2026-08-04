import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";

export const Route = createFileRoute("/_authenticated/college")({
  component: () => (
    <AppShell>
      <RoleGuard allow="college">
        <Outlet />
      </RoleGuard>
    </AppShell>
  ),
});
