import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <AppShell>
      <RoleGuard allow="super_admin">
        <Outlet />
      </RoleGuard>
    </AppShell>
  ),
});
