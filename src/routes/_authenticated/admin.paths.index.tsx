import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { QueryState } from "@/components/states";
import { useRealtime } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin/paths/")({
  component: AdminPaths,
});

type PathForm = {
  title: string;
  description: string;
  course: string;
  department: string;
  semester: string;
};

const EMPTY: PathForm = { title: "", description: "", course: "", department: "", semester: "" };

function AdminPaths() {
  const queryClient = useQueryClient();
  useRealtime(["learning_paths", "weeks", "college_paths"], ["admin-paths"]);
  const [form, setForm] = useState<PathForm>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PathForm>(EMPTY);
  const [showArchived, setShowArchived] = useState(false);

  const query = useQuery({
    queryKey: ["admin-paths"],
    queryFn: async () => {
      const [paths, weeks, colleges, links, courses] = await Promise.all([
        supabase.from("learning_paths").select("*").order("created_at"),
        supabase.from("weeks").select("id, path_id, is_published, archived_at"),
        supabase.from("colleges").select("id, name, code, college_code").is("archived_at", null).order("name"),
        supabase.from("college_paths").select("college_id, path_id"),
        supabase.from("courses").select("code, name").eq("is_active", true).order("name"),
      ]);
      return {
        paths: paths.data ?? [],
        weeks: weeks.data ?? [],
        colleges: colleges.data ?? [],
        links: links.data ?? [],
        courses: courses.data ?? [],
      };
    },
  });
  const data = query.data;
  const paths = (data?.paths ?? []).filter((p) => (showArchived ? true : !p.archived_at));

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-paths"] });
  }

  async function createPath(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from("learning_paths").insert({
      title: form.title,
      description: form.description,
      course: form.course || null,
      department: form.department || null,
      semester: form.semester ? Number(form.semester) : null,
      is_published: false,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Learning path created as a draft");
    setForm(EMPTY);
    refresh();
  }

  async function saveEdit(pathId: string) {
    const { error } = await supabase
      .from("learning_paths")
      .update({
        title: editForm.title,
        description: editForm.description,
        course: editForm.course || null,
        department: editForm.department || null,
        semester: editForm.semester ? Number(editForm.semester) : null,
      })
      .eq("id", pathId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Learning path updated");
    setEditingId(null);
    refresh();
  }

  async function togglePublish(pathId: string, next: boolean) {
    const { error } = await supabase.from("learning_paths").update({ is_published: next }).eq("id", pathId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Published to assigned colleges" : "Unpublished");
    refresh();
  }

  async function archivePath(pathId: string, next: boolean) {
    const { error } = await supabase
      .from("learning_paths")
      .update(next ? { archived_at: new Date().toISOString(), is_published: false } : { archived_at: null })
      .eq("id", pathId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Archived — students no longer see it" : "Restored");
    refresh();
  }

  async function deletePath(pathId: string) {
    const { error } = await supabase.from("learning_paths").delete().eq("id", pathId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Learning path deleted");
    refresh();
  }

  async function toggleCollege(pathId: string, collegeId: string, assigned: boolean) {
    if (assigned) {
      await supabase.from("college_paths").delete().eq("path_id", pathId).eq("college_id", collegeId);
    } else {
      await supabase.from("college_paths").insert({ path_id: pathId, college_id: collegeId });
    }
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Learning paths"
        description="Create, publish and assign paths. Weeks inside each path carry the lessons, MCQs, coding, projects and assignments students see."
        back="/admin"
        actions={
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived
          </label>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Paths" value={paths.length} />
        <StatCard label="Published" value={paths.filter((p) => p.is_published).length} />
        <StatCard
          label="Published weeks"
          value={(data?.weeks ?? []).filter((w) => w.is_published && !w.archived_at).length}
        />
        <StatCard label="College assignments" value={(data?.links ?? []).length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <form onSubmit={createPath} className="panel space-y-3 p-5">
          <h2 className="text-lg font-semibold">New learning path</h2>
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              placeholder="Full Stack Development"
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
              <select
                id="course"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              >
                <option value="">Any course</option>
                {(data?.courses ?? []).map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.name}
                  </option>
                ))}
              </select>
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

        <div className="grid gap-4 lg:col-span-2">
          <QueryState isLoading={query.isLoading} error={query.error} isEmpty={!paths.length} emptyTitle="No learning paths yet">
            {paths.map((path) => {
              const weeks = (data?.weeks ?? []).filter((w) => w.path_id === path.id && !w.archived_at);
              const assigned = (data?.links ?? []).filter((l) => l.path_id === path.id);
              const editing = editingId === path.id;
              return (
                <div key={path.id} className="panel panel-hover p-5">
                  {editing ? (
                    <div className="space-y-3">
                      <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          value={editForm.course}
                          onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                        >
                          <option value="">Any course</option>
                          {(data?.courses ?? []).map((course) => (
                            <option key={course.code} value={course.code}>
                              {course.name}
                            </option>
                          ))}
                        </select>
                        <Input
                          placeholder="Department"
                          value={editForm.department}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Sem"
                          value={editForm.semester}
                          onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(path.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            to="/admin/paths/$pathId"
                            params={{ pathId: path.id }}
                            className="font-semibold hover:underline"
                          >
                            {path.title}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">{path.description}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {path.course || "Any course"} · {path.department || "—"} · Sem {path.semester ?? "—"} ·{" "}
                            {weeks.length} weeks ({weeks.filter((w) => w.is_published).length} published)
                          </p>
                        </div>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                          {path.archived_at ? "Archived" : path.is_published ? "Published" : "Draft"}
                        </span>
                      </div>

                      <p className="stat-label mt-4">Assigned colleges</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(data?.colleges ?? []).map((college) => {
                          const isAssigned = assigned.some((a) => a.college_id === college.id);
                          return (
                            <Button
                              key={college.id}
                              size="sm"
                              variant={isAssigned ? "default" : "outline"}
                              onClick={() => toggleCollege(path.id, college.id, isAssigned)}
                            >
                              {college.college_code ?? college.code}
                            </Button>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <Link to="/admin/paths/$pathId" params={{ pathId: path.id }}>
                            Week content
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(path.id);
                            setEditForm({
                              title: path.title,
                              description: path.description ?? "",
                              course: path.course ?? "",
                              department: path.department ?? "",
                              semester: path.semester == null ? "" : String(path.semester),
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => togglePublish(path.id, !path.is_published)}>
                          {path.is_published ? "Unpublish" : "Publish"}
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="outline">
                              {path.archived_at ? "Restore" : "Archive"}
                            </Button>
                          }
                          title={path.archived_at ? "Restore this path?" : "Archive this learning path?"}
                          description="Are you sure you want to continue? Archived paths stay in the database but disappear for students."
                          confirmLabel={path.archived_at ? "Restore" : "Archive"}
                          onConfirm={() => archivePath(path.id, !path.archived_at)}
                        />
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="destructive">
                              Delete
                            </Button>
                          }
                          title="Delete this learning path permanently?"
                          description="Are you sure you want to continue? Weeks, MCQs, coding questions and student progress for this path are removed for good."
                          confirmLabel="Delete forever"
                          requireTyping="DELETE"
                          onConfirm={() => deletePath(path.id)}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </QueryState>
        </div>
      </div>
    </div>
  );
}
