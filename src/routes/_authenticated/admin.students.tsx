import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { QueryState } from "@/components/states";
import { avg } from "@/lib/analytics";
import { useRealtime } from "@/lib/use-auth";

type StudentSearch = {
  college?: string;
  course?: string;
  sem?: string;
  q?: string;
};

export const Route = createFileRoute("/_authenticated/admin/students")({
  validateSearch: (search: Record<string, unknown>): StudentSearch => {
    const out: StudentSearch = {};
    for (const key of ["college", "course", "sem", "q"] as const) {
      const value = search[key];
      if (typeof value === "string" && value) out[key] = value;
    }
    return out;
  },
  component: AdminStudents,
});

function AdminStudents() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useRealtime(["students", "progress", "mock_attempts"], ["admin-students"]);

  const query = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const [students, colleges, courses] = await Promise.all([
        supabase.from("students").select("*").is("archived_at", null).order("name"),
        supabase.from("colleges").select("id, name, code, college_code").is("archived_at", null),
        supabase.from("courses").select("code, name").eq("is_active", true).order("code"),
      ]);
      return {
        students: students.data ?? [],
        colleges: colleges.data ?? [],
        courses: courses.data ?? [],
      };
    },
  });

  const data = query.data;
  const term = (search.q ?? "").toLowerCase();

  const filtered = (data?.students ?? []).filter((student) => {
    if (search.college && student.college_id !== search.college) return false;
    if (search.course && (student.course ?? student.department) !== search.course) return false;
    if (search.sem && String(student.semester) !== search.sem) return false;
    if (term && !`${student.name} ${student.usn} ${student.email}`.toLowerCase().includes(term)) return false;
    return true;
  });

  function setFilter(patch: StudentSearch) {
    navigate({
      to: "/admin/students",
      search: (prev: StudentSearch) => {
        const next: StudentSearch = { ...prev, ...patch };
        for (const key of ["college", "course", "sem", "q"] as const) {
          if (!next[key]) delete next[key];
        }
        return next;
      },
    });
  }

  async function archiveStudent(id: string) {
    const { error } = await supabase
      .from("students")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Student archived — records retained");
    queryClient.invalidateQueries({ queryKey: ["admin-students"] });
  }

  const semesters = Array.from(new Set((data?.students ?? []).map((s) => s.semester))).sort((a, b) => a - b);

  return (
    <div>
      <PageHeader
        title="Student database"
        description="Every student across every college, with drill-down into their full readiness profile."
        back="/admin"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students shown" value={filtered.length} />
        <StatCard label="Avg readiness" value={`${avg(filtered.map((s) => s.placement_readiness ?? 0))}%`} />
        <StatCard label="Avg learning" value={`${avg(filtered.map((s) => s.learning_progress ?? 0))}%`} />
        <StatCard
          label="At risk (below 40%)"
          value={filtered.filter((s) => (s.placement_readiness ?? 0) < 40).length}
        />
      </div>

      <div className="panel mt-6 space-y-3 p-5">
        <Input
          placeholder="Search by name, USN or email"
          value={search.q ?? ""}
          onChange={(event) => setFilter({ q: event.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={search.college ? "outline" : "default"} onClick={() => setFilter({ college: "" })}>
            All colleges
          </Button>
          {(data?.colleges ?? []).map((college) => (
            <Button
              key={college.id}
              size="sm"
              variant={search.college === college.id ? "default" : "outline"}
              onClick={() => setFilter({ college: college.id })}
            >
              {college.college_code ?? college.code}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={search.course ? "outline" : "default"} onClick={() => setFilter({ course: "" })}>
            All courses
          </Button>
          {(data?.courses ?? []).map((course) => (
            <Button
              key={course.code}
              size="sm"
              variant={search.course === course.code ? "default" : "outline"}
              onClick={() => setFilter({ course: course.code })}
            >
              {course.code}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={search.sem ? "outline" : "default"} onClick={() => setFilter({ sem: "" })}>
            All semesters
          </Button>
          {semesters.map((sem) => (
            <Button
              key={sem}
              size="sm"
              variant={search.sem === String(sem) ? "default" : "outline"}
              onClick={() => setFilter({ sem: String(sem) })}
            >
              Sem {sem}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <QueryState
          isLoading={query.isLoading}
          error={query.error}
          isEmpty={!filtered.length}
          emptyTitle="No students match these filters"
          emptyHint="Clear the filters or provision students from the college portal."
        >
          <div className="panel overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 text-left">Student</th>
                  <th className="py-2 text-left">USN</th>
                  <th className="py-2 text-left">College</th>
                  <th className="py-2 text-left">Course</th>
                  <th className="py-2 text-left">Sem</th>
                  <th className="py-2 text-right">Learning</th>
                  <th className="py-2 text-right">Mock</th>
                  <th className="py-2 text-right">Readiness</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const college = (data?.colleges ?? []).find((c) => c.id === student.college_id);
                  return (
                    <tr key={student.id} className="border-b border-border last:border-0">
                      <td className="py-2">
                        <Link
                          to="/admin/student/$studentId"
                          params={{ studentId: student.id }}
                          className="font-medium hover:underline"
                        >
                          {student.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </td>
                      <td className="py-2 font-mono text-xs">{student.usn}</td>
                      <td className="py-2">
                        {college ? (
                          <Link
                            to="/admin/college/$collegeId"
                            params={{ collegeId: college.id }}
                            search={{ tab: "overview" }}
                            className="hover:underline"
                          >
                            {college.college_code ?? college.code}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2">{student.course ?? student.department}</td>
                      <td className="py-2">{student.semester}</td>
                      <td className="py-2 text-right">{student.learning_progress}%</td>
                      <td className="py-2 text-right">{student.mock_score}%</td>
                      <td className="py-2 text-right font-semibold">{student.placement_readiness}%</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to="/admin/student/$studentId" params={{ studentId: student.id }}>
                              View
                            </Link>
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button size="sm" variant="destructive">
                                Archive
                              </Button>
                            }
                            title="Archive this student?"
                            description="The student is hidden from active lists but all submissions and scores are retained."
                            details={<p>{student.name} · {student.usn}</p>}
                            confirmLabel="Confirm archive"
                            requireTyping="ARCHIVE"
                            onConfirm={() => archiveStudent(student.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </QueryState>
      </div>
    </div>
  );
}
