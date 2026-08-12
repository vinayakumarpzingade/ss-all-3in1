import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { GraduationCap, LogOut } from "lucide-react";

type NavItem = { to: string; label: string };

const NAV: Record<string, NavItem[]> = {
  super_admin: [
    { to: "/admin", label: "Overview" },
    { to: "/admin/colleges", label: "Colleges" },
    { to: "/admin/students", label: "Students" },
    { to: "/admin/paths", label: "Learning Paths" },
    { to: "/admin/mocks", label: "Mock Tests" },
    { to: "/admin/submissions", label: "Submissions" },
  ],
  college: [
    { to: "/college", label: "Overview" },
    { to: "/college/students", label: "Students" },
    { to: "/college/analytics", label: "Analytics" },
    { to: "/college/reports", label: "Reports" },
  ],
  student: [
    { to: "/student", label: "Dashboard" },
    { to: "/student/path", label: "Learning Path" },
    { to: "/student/mocks", label: "Mock Tests" },
    { to: "/student/projects", label: "Projects" },
    { to: "/student/certificates", label: "Certificates" },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Central Intelligence",
  college: "College Command Center",
  student: "Student Ecosystem",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV[session?.role ?? "student"] ?? [];

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-ink text-ink-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">STARTSAFE</span>
          </Link>
          <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground md:inline">
            {ROLE_LABEL[session?.role ?? "student"]}
          </span>
          <nav className="ml-auto hidden flex-wrap items-center gap-1 lg:flex">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  pathname === item.to && "bg-secondary text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{session?.fullName || session?.email}</p>
              <p className="text-xs text-muted-foreground">{session?.collegeName ?? "StartSafe HQ"}</p>
            </div>
            <Button variant="outline" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground",
                pathname === item.to && "bg-secondary text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
  backLabel,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Fallback path used when there is no browser history to go back to. */
  back?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6">
      {back ? <BackButton fallback={back} label={backLabel ?? "Back"} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="panel p-4">
      <p className="stat-label">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
