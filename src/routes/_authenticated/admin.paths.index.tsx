import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/paths/")({
  component: AdminPaths,
});

function AdminPaths() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    course: "",
    department: "",
    semester: "",
  });

  const { data } = useQuery({
    queryKey: ["admin-paths"],
    queryFn: async () => {
      const [paths, weeks] = await Promise.all([
        supabase.from("learning_paths").select("*").order("created_at"),
        supabase.from("weeks").select("id, path_id, is_published"),
      ]);
      return { paths: paths.data ?? [], weeks: weeks.data ?? [] };
    },
  });

  async function createPath(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from("learning_paths").insert({
      title: form.title,
      description: form.description,
      course: form.course,
      department: form.department,
      semester: form.semester ? Number(form.semester) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Learning path created");
    setForm({ title: "", description: "", course: "", department: "", semester: "" });
    queryClient.invalidateQueries({ queryKey: ["admin-paths"] });
  }

  async function removePath(id: string) {
    const { error } = await supabase.from("learning_paths").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-paths"] });
  }

  return (
    <div>
      <PageHeader
        title="Learning paths"
        description="Admin owns every learning path. Add weeks inside a path to publish content."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={createPath} className="panel space-y-3 p-5">
          <h2 className="text-lg font-semibold">New learning path</h2>
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              placeholder="Programming Foundations"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                type="number"
                min={1}
                max={12}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full">
            Create path
          </Button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {(data?.paths ?? []).map((path) => {
            const weeks = (data?.weeks ?? []).filter((w) => w.path_id === path.id);
            return (
              <div key={path.id} className="panel flex flex-col p-5">
                <h3 className="font-semibold">{path.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{path.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {path.course || "—"} · {path.department || "—"} · Sem {path.semester ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {weeks.length} weeks · {weeks.filter((w) => w.is_published).length} published
                </p>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm">
                    <Link to="/admin/paths/$pathId" params={{ pathId: path.id }}>
                      Open week editor
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => removePath(path.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
