import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/states";
import { avg, bestScorePercent, formatDate } from "@/lib/analytics";
import { useRealtime } from "@/lib/use-auth";

type Tab = "overview" | "analytics" | "projects" | "reports";
const TABS: Tab[] = ["overview", "analytics", "projects", "reports"];

export const Route = createFileRoute("/_authenticated/admin/college/$collegeId")({
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => {
    const tab = String(search["tab"] ?? "overview") as Tab;
    return { tab: TABS.includes(tab) ? tab : "overview" };
  },
  component: AdminCollegeReport,
});

function AdminCollegeReport() {
  const { collegeId } = Route.useParams();
  const { tab } = Route.useSearch();
  useRealtime(
    ["students", "progress", "mock_attempts", "coding_submissions", "project_submissions", "certificates"],
    ["admin-college-report"],
  );

  const query = useQuery({
    queryKey: ["admin-college-report", collegeId],
    queryFn: async () => {
      const { data: college, error } = await supabase
        .from("colleges")
        .select("*")
        .eq("id", collegeId)
        .maybeSingle();
      if (error) throw error;
      if (!college) throw new Error("College not found");

      const [students, courses, paths, links, attempts, tests, projects, certificates, coding] =
        await Promise.all([
          supabase.from("students").select("*").eq("college_id", collegeId).is("archived_at", null).order("name"),
          supabase.from("college_courses").select("course_code").eq("college_id", collegeId),
          supabase.from("learning_paths").select("id, title, course").is("archived_at", null),
          supabase.from("college_paths").select("path_id").eq("college_id", collegeId),
          supabase.from("mock_attempts").select("*").eq("college_id", collegeId),
          supabase.from("mock_tests").select("id, title"),
          supabase
            .from("project_submissions")
            .select("*")
            .eq("college_id", collegeId)
            .is("archived_at", null)
            .order("created_at", { ascending: false }),
          supabase.from("certificates").select("*").eq("college_id", collegeId).is("archived_at", null),
          supabase.from("coding_submissions").select("id, student_id, passed").eq("college_id", collegeId),
        ]);

      const studentRows = students.data ?? [];
      const pathIds = (links.data ?? []).map((l) => l.path_id);

      return {
        college,
        students: studentRows,
        courses: (courses.data ?? []).map((c) => c.course_code),
        paths: (paths.data ?? []).filter((p) => pathIds.includes(p.id)),
        attempts: attempts.data ?? [],
        tests: tests.data ?? [],
        projects: projects.data ?? [],
        certificates: certificates.data ?? [],
        coding: coding.data ?? [],
        avgLearning: avg(studentRows.map((s) => s.learning_progress ?? 0)),
        avgMock: bestScorePercent(attempts.data ?? []),
        avgReadiness: avg(studentRows.map((s) => s.placement_readiness ?? 0)),
        avgCoding: avg(studentRows.map((s) => Math.min(100, s.coding_score ?? 0))),
      };
    },
  });

  const data = query.data;

  return (
    <div>
      <PageHeader
        title={data?.college.name ?? "College report"}
        description={
          data
            ? `${data.college.college_code ?? data.college.code} · ${data.college.location ?? data.college.city ?? "—"}`
            : "Loading college report…"
        }
        back="/admin/colleges"
        back="/admin/colleges"
        backLabel="Back to Colleges"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/students" search={{ college: collegeId }}>
              Student database
            </Link>
          </Button>
        }
      />

      <QueryState isLoading={query.isLoading} error={query.error}>
        {data ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => (
                <Button
                  key={item}
                  asChild
                  size="sm"
                  variant={tab === item ? "default" : "outline"}
                >
                  <Link to="/admin/college/$collegeId" params={{ collegeId }} search={{ tab: item }}>
                    {item[0]!.toUpperCase() + item.slice(1)}
                  </Link>
                </Button>
              ))}
            </div>

            <div className="panel p-5">
              <h2 className="font-semibold">College information</h2>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">College ID: </span>
                  <span className="font-mono">{data.college.college_code ?? data.college.code}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Status: </span>
                  {data.college.is_active ? "Active" : "Suspended"}
                </p>
                <p>
                  <span className="text-muted-foreground">Location: </span>
                  {data.college.location || data.college.city || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Placement officer: </span>
                  {data.college.officer_name || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Officer email: </span>
                  {data.college.officer_email || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Officer phone: </span>
                  {data.college.officer_phone || "—"}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Courses: </span>
                  {data.courses.length ? data.courses.join(", ") : "—"}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Learning paths: </span>
                  {data.paths.length ? data.paths.map((p) => p.title).join(", ") : "None assigned"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total students" value={data.students.length} />
              <StatCard label="Learning progress" value={`${data.avgLearning}%`} />
              <StatCard label="Mock performance (best)" value={`${data.avgMock}%`} hint={`${data.attempts.length} attempts`} />
              <StatCard label="Coding" value={`${data.avgCoding}%`} hint={`${data.coding.length} runs`} />
              <StatCard label="Project submissions" value={data.projects.length} />
              <StatCard label="Certificates" value={data.certificates.length} />
              <StatCard label="Placement readiness" value={`${data.avgReadiness}%`} />
              <StatCard
                label="At risk (&lt;40%)"
                value={data.students.filter((s) => (s.placement_readiness ?? 0) < 40).length}
              />
            </div>

            {tab === "analytics" ? (
              <div className="panel p-5">
                <h2 className="font-semibold">Student performance</h2>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.students.map((s) => ({
                        name: s.name.split(" ")[0],
                        readiness: s.placement_readiness ?? 0,
                        learning: s.learning_progress ?? 0,
                        mock: s.mock_score ?? 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                      <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="readiness" name="Readiness" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="learning" name="Learning" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="mock" name="Mock" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {tab === "projects" ? (
              <div className="panel p-5">
                <h2 className="font-semibold">Project submissions</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {data.projects.map((project) => (
                    <li key={project.id} className="border-b border-border pb-2 last:border-0">
                      <Link
                        to="/admin/project/$submissionId"
                        params={{ submissionId: project.id }}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {data.students.find((s) => s.id === project.student_id)?.name ?? "Student"} ·{" "}
                        {project.status} · {formatDate(project.created_at)}
                        {project.score != null ? ` · score ${project.score}` : ""}
                      </p>
                    </li>
                  ))}
                  {!data.projects.length ? (
                    <li className="text-muted-foreground">No project submissions yet.</li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {tab === "reports" ? (
              <div className="panel p-5">
                <h2 className="font-semibold">Mock test report</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {data.tests
                    .map((test) => ({ test, rows: data.attempts.filter((a) => a.test_id === test.id) }))
                    .filter((entry) => entry.rows.length)
                    .map(({ test, rows }) => (
                      <li key={test.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                        <span>{test.title}</span>
                        <span className="text-muted-foreground">
                          {new Set(rows.map((r) => r.student_id)).size} students · {rows.length} attempts · avg best{" "}
                          {bestScorePercent(rows)}%
                        </span>
                      </li>
                    ))}
                  {!data.attempts.length ? (
                    <li className="text-muted-foreground">No mock attempts yet.</li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            <div className="panel p-5">
              <h2 className="font-semibold">Student list</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 text-left">Student</th>
                      <th className="py-2 text-left">USN</th>
                      <th className="py-2 text-left">Course</th>
                      <th className="py-2 text-left">Sem</th>
                      <th className="py-2 text-right">Learning</th>
                      <th className="py-2 text-right">Mock</th>
                      <th className="py-2 text-right">Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((student) => (
                      <tr key={student.id} className="border-b border-border last:border-0">
                        <td className="py-2">
                          <Link
                            to="/admin/student/$studentId"
                            params={{ studentId: student.id }}
                            className="font-medium hover:underline"
                          >
                            {student.name}
                          </Link>
                        </td>
                        <td className="py-2 font-mono text-xs">{student.usn}</td>
                        <td className="py-2">{student.course ?? student.department}</td>
                        <td className="py-2">{student.semester}</td>
                        <td className="py-2 text-right">{student.learning_progress}%</td>
                        <td className="py-2 text-right">{student.mock_score}%</td>
                        <td className="py-2 text-right font-semibold">{student.placement_readiness}%</td>
                      </tr>
                    ))}
                    {!data.students.length ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-muted-foreground">
                          No students yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
