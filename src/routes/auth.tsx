import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleHome } from "@/lib/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — StartSafe" },
      { name: "description", content: "Sign in to your StartSafe student, college or admin portal." },
      { property: "og:title", content: "Sign in — StartSafe" },
      { property: "og:description", content: "Access your StartSafe portal." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Sign in failed");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    setLoading(false);
    toast.success("Welcome back");
    navigate({ to: roleHome(profile?.role ?? "student"), replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-grad-hero p-10 text-ink-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-ink-foreground/15">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">STARTSAFE</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            One database. Three portals. Zero lag.
          </h1>
          <p className="mt-4 max-w-md text-ink-foreground/80">
            Version 1.0 Pilot Edition — Learn • Build • Innovate
          </p>
        </div>
        <p className="text-xs text-ink-foreground/60">
          Students receive credentials from their college. Self-registration is disabled by design.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="panel w-full max-w-sm space-y-4 p-6">
          <div>
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your StartSafe portal credentials.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@startsafe.in"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
