import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createCollegeAccount } from "@/lib/accounts.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRealtime } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin/colleges")({
  component: AdminColleges,
});

function AdminColleges() {
  const queryClient = useQueryClient();
  const createCollege = useServerFn(createCollegeAccount);
  useRealtime(["students"], ["admin-colleges"]);

  const [form, setForm] = useState({
    name: "",
    code: "",
    city: "",
    email: "",
    password: "",
  });

  const { data } = useQuery({
    queryKey: ["admin-colleges"],
    queryFn: async () => {
      const [colleges, students, paths, links] = await Promise.all([
        supabase.from("colleges").select("*").order("created_at"),
        supabase.from("students").select("id, college_id, placement_readiness"),
        supabase.from("learning_paths").select("id, title"),
        supabase.from("college_paths").select("id, college_id, path_id"),
      ]);
      return {
        colleges: colleges.data ?? [],
        students: students.data ?? [],
        paths: paths.data ?? [],
        links: links.data ?? [],
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async () =>
      createCollege({
        data: {
          name: form.name,
          code: form.code,
          city: form.city,
          email: form.email,
          password: form.password,
        },
      }),
    onSuccess: () => {
      toast.success("College created and activated");
      setForm({ name: "", code: "", city: "", email: "", password: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function toggleActive(id: string, isActive: boolean) {
    const { error } = await supabase.from("colleges").update({ is_active: isActive }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
  }

  async function togglePath(collegeId: string, pathId: string, assigned: boolean) {
    if (assigned) {
      const { error } = await supabase
        .from("college_paths")
        .delete()
        .eq("college_id", collegeId)
        .eq("path_id", pathId);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase
        .from("college_paths")
        .insert({ college_id: collegeId, path_id: pathId });
      if (error) { toast.error(error.message); return; }
    }
    queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
    toast.success("Assignment updated");
  }

  return (
    <div>
      <PageHeader
        title="Colleges"
        description="Create a college, activate its portal login and assign learning paths."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <form
          className="panel space-y-3 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <h2 className="text-lg font-semibold">New college</h2>
          <div className="space-y-1">
            <Label htmlFor="name">College name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Portal email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Portal password</Label>
            <Input
              id="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create & activate"}
          </Button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          {(data?.colleges ?? []).map((college) => {
            const students = (data?.students ?? []).filter((s) => s.college_id === college.id);
            const avg = students.length
              ? Math.round(
                  students.reduce((sum, s) => sum + (s.placement_readiness ?? 0), 0) /
                    students.length,
                )
              : 0;
            return (
              <div key={college.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{college.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {college.code} · {college.city || "—"} · {students.length} students · avg
                      readiness {avg}%
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={college.is_active}
                      onCheckedChange={(value) => toggleActive(college.id, value)}
                    />
                    {college.is_active ? "Active" : "Suspended"}
                  </label>
                </div>
                <div className="mt-4">
                  <p className="stat-label">Assigned learning paths</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(data?.paths ?? []).map((path) => {
                      const assigned = (data?.links ?? []).some(
                        (l) => l.college_id === college.id && l.path_id === path.id,
                      );
                      return (
                        <Button
                          key={path.id}
                          size="sm"
                          variant={assigned ? "default" : "outline"}
                          onClick={() => togglePath(college.id, path.id, assigned)}
                        >
                          {path.title}
                        </Button>
                      );
                    })}
                    {!data?.paths.length ? (
                      <p className="text-sm text-muted-foreground">Create a learning path first.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
