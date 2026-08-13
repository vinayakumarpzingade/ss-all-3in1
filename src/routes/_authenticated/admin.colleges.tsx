import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { QueryState } from "@/components/states";
import { useRealtime } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin/colleges")({
  component: AdminColleges,
});

const EMPTY_FORM = {
  name: "",
  code: "",
  location: "",
  officerName: "",
  officerEmail: "",
  officerPhone: "",
  email: "",
  password: "",
};

function AdminColleges() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createCollege = useServerFn(createCollegeAccount);
  useRealtime(["students", "colleges"], ["admin-colleges"]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formCourses, setFormCourses] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    officer_name: "",
    officer_email: "",
    officer_phone: "",
  });

  const query = useQuery({
    queryKey: ["admin-colleges"],
    queryFn: async () => {
      const [colleges, students, paths, links, courses, collegeCourses] = await Promise.all([
        supabase.from("colleges").select("*").is("archived_at", null).order("created_at"),
        supabase.from("students").select("id, college_id, placement_readiness").is("archived_at", null),
        supabase.from("learning_paths").select("id, title").is("archived_at", null),
        supabase.from("college_paths").select("id, college_id, path_id"),
        supabase.from("courses").select("code, name").eq("is_active", true).order("code"),
        supabase.from("college_courses").select("id, college_id, course_code"),
      ]);
      return {
        colleges: colleges.data ?? [],
        students: students.data ?? [],
        paths: paths.data ?? [],
        links: links.data ?? [],
        courses: courses.data ?? [],
        collegeCourses: collegeCourses.data ?? [],
      };
    },
  });
  const data = query.data;

  const mutation = useMutation({
    mutationFn: async () =>
      createCollege({
        data: {
          name: form.name,
          code: form.code,
          location: form.location,
          city: form.location,
          officerName: form.officerName,
          officerEmail: form.officerEmail,
          officerPhone: form.officerPhone,
          courses: formCourses,
          email: form.email,
          password: form.password,
        },
      }),
    onSuccess: () => {
      toast.success("College created — unique College ID generated and portal activated");
      setForm(EMPTY_FORM);
      setFormCourses([]);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function toggleActive(id: string, isActive: boolean) {
    const { error } = await supabase.from("colleges").update({ is_active: isActive }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from("colleges")
      .update({
        name: editForm.name,
        location: editForm.location,
        city: editForm.location,
        officer_name: editForm.officer_name || null,
        officer_email: editForm.officer_email || null,
        officer_phone: editForm.officer_phone || null,
      })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("College updated");
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
  }

  async function toggleCourse(collegeId: string, courseCode: string, assigned: boolean) {
    if (assigned) {
      const { error } = await supabase
        .from("college_courses")
        .delete()
        .eq("college_id", collegeId)
        .eq("course_code", courseCode);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase
        .from("college_courses")
        .insert({ college_id: collegeId, course_code: courseCode });
      if (error) { toast.error(error.message); return; }
    }
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

  async function archiveCollege(id: string) {
    const { error } = await supabase
      .from("colleges")
      .update({ archived_at: new Date().toISOString(), is_active: false })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("College archived — data is retained and can be restored");
    queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
  }

  return (
    <div>
      <PageHeader
        title="Colleges"
        description="Create colleges with a permanent College ID, manage courses, and drill into any college report."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "+ Add College"}</Button>
        }
      />

      {showForm ? (
        <form
          className="panel mb-6 grid gap-3 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold">New college</h2>
            <p className="text-xs text-muted-foreground">
              College ID is generated automatically from the short code and location (e.g. PESCE-MDY-001) and can
              never be edited afterwards.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">College name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="code">Short code</Label>
            <Input id="code" required placeholder="PESCE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="Mandya" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="officerName">Placement officer name</Label>
            <Input id="officerName" value={form.officerName} onChange={(e) => setForm({ ...form, officerName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="officerEmail">Placement officer email</Label>
            <Input id="officerEmail" type="email" value={form.officerEmail} onChange={(e) => setForm({ ...form, officerEmail: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="officerPhone">Placement officer phone</Label>
            <Input id="officerPhone" value={form.officerPhone} onChange={(e) => setForm({ ...form, officerPhone: e.target.value })} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Courses offered</Label>
            <div className="flex flex-wrap gap-2">
              {(data?.courses ?? []).map((course) => {
                const selected = formCourses.includes(course.code);
                return (
                  <Button
                    key={course.code}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() =>
                      setFormCourses((prev) =>
                        selected ? prev.filter((c) => c !== course.code) : [...prev, course.code],
                      )
                    }
                  >
                    {course.code}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Portal email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Portal password</Label>
            <Input id="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create & activate"}
            </Button>
          </div>
        </form>
      ) : null}

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={!data?.colleges.length}
        emptyTitle="No colleges yet"
        emptyHint="Use + Add College to onboard the first campus."
      >
        <div className="space-y-4">
          {(data?.colleges ?? []).map((college) => {
            const students = (data?.students ?? []).filter((s) => s.college_id === college.id);
            const avg = students.length
              ? Math.round(
                  students.reduce((sum, s) => sum + (s.placement_readiness ?? 0), 0) / students.length,
                )
              : 0;
            const assignedCourses = (data?.collegeCourses ?? []).filter((c) => c.college_id === college.id);
            const isEditing = editing === college.id;
            return (
              <div key={college.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() =>
                      navigate({
                        to: "/admin/college/$collegeId",
                        params: { collegeId: college.id },
                        search: { tab: "overview" },
                      })
                    }
                  >
                    <h3 className="font-semibold hover:underline">{college.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{college.college_code ?? college.code}</span> ·{" "}
                      {college.location || college.city || "—"} · {students.length} students · avg readiness {avg}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Officer: {college.officer_name || "—"}
                      {college.officer_email ? ` · ${college.officer_email}` : ""}
                      {college.officer_phone ? ` · ${college.officer_phone}` : ""}
                    </p>
                  </button>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={college.is_active}
                      onCheckedChange={(value) => toggleActive(college.id, value)}
                    />
                    {college.is_active ? "Active" : "Suspended"}
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link
                      to="/admin/college/$collegeId"
                      params={{ collegeId: college.id }}
                      search={{ tab: "overview" }}
                    >
                      View
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/students" search={{ college: college.id }}>
                      Students
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/college/$collegeId" params={{ collegeId: college.id }} search={{ tab: "analytics" }}>
                      Analytics
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/college/$collegeId" params={{ collegeId: college.id }} search={{ tab: "projects" }}>
                      Projects
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/college/$collegeId" params={{ collegeId: college.id }} search={{ tab: "reports" }}>
                      Reports
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(isEditing ? null : college.id);
                      setEditForm({
                        name: college.name,
                        location: college.location ?? college.city ?? "",
                        officer_name: college.officer_name ?? "",
                        officer_email: college.officer_email ?? "",
                        officer_phone: college.officer_phone ?? "",
                      });
                    }}
                  >
                    {isEditing ? "Cancel edit" : "Edit"}
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button size="sm" variant="destructive">
                        Archive
                      </Button>
                    }
                    title="Archive this college?"
                    description="The college and its data are retained (soft delete) and the portal login is suspended."
                    details={<p>{college.name}</p>}
                    confirmLabel="Confirm archive"
                    requireTyping="ARCHIVE"
                    onConfirm={() => archiveCollege(college.id)}
                  />
                </div>

                {isEditing ? (
                  <div className="mt-4 grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-2">
                      <Label>College ID (permanent)</Label>
                      <Input value={college.college_code ?? college.code} disabled readOnly />
                    </div>
                    <div className="space-y-1">
                      <Label>College name</Label>
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Location</Label>
                      <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Placement officer</Label>
                      <Input value={editForm.officer_name} onChange={(e) => setEditForm({ ...editForm, officer_name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Officer email</Label>
                      <Input value={editForm.officer_email} onChange={(e) => setEditForm({ ...editForm, officer_email: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Officer phone</Label>
                      <Input value={editForm.officer_phone} onChange={(e) => setEditForm({ ...editForm, officer_phone: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Button size="sm" onClick={() => saveEdit(college.id)}>
                        Save changes
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="stat-label">Courses offered</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(data?.courses ?? []).map((course) => {
                        const assigned = assignedCourses.some((c) => c.course_code === course.code);
                        return (
                          <Button
                            key={course.code}
                            size="sm"
                            variant={assigned ? "default" : "outline"}
                            onClick={() => toggleCourse(college.id, course.code, assigned)}
                          >
                            {course.code}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
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
              </div>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
