import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { useRealtime } from "@/lib/use-auth";
import { PageHeader, StatCard } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  useRealtime(
    ["students", "progress", "mock_attempts", "coding_submissions", "project_submissions", "certificates", "weeks"],
    ["admin-overview"],
  );

  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [colleges, students, paths, weeks, attempts, projects, certificates, codes] =
        await Promise.all([
          supabase.from("colleges").select("id, name, code, is_active"),
          supabase.from("students").select("id, college_id, placement_readiness, learning_progress, mock_score, coding_score"),
          supabase.from("learning_paths").select("id, title"),
          supabase.from("weeks").select("id, is_published"),
          supabase.from("mock_attempts").select("id, score, total, created_at"),
          supabase.from("project_submissions").select("id, status, created_at, name"),
          supabase.from("certificates").select("id, title, issued_at"),
          supabase.from("coding_submissions").select("id, passed"),
        ]);

      const studentRows = students.data ?? [];
      const collegeRows = colleges.data ?? [];

      const byCollege = collegeRows.map((college) => {
        const rows = studentRows.filter((s) => s.college_id === college.id);
        const avg = (key: "placement_readiness" | "learning_progress" | "mock_score") =>
          rows.length ? Math.round(rows.reduce((sum, r) => sum + (r[key] ?? 0), 0) / rows.length) : 0;
        return {
          name: college.code,
          students: rows.length,
          readiness: avg("placement_readiness"),
          learning: avg("learning_progress"),
          mock: avg("mock_score"),
        };
      });

      return {
        colleges: collegeRows.length,
        students: studentRows.length,
        paths: paths.data?.length ?? 0,
        publishedWeeks: (weeks.data ?? []).filter((w) => w.is_published).length,
        attempts: attempts.data?.length ?? 0,
        projects: projects.data ?? [],
        certificates: certificates.data?.length ?? 0,
        codeRuns: codes.data?.length ?? 0,
        avgReadiness: studentRows.length
          ? Math.round(
              studentRows.reduce((sum, r) => sum + (r.placement_readiness ?? 0), 0) /
                studentRows.length,
            )
          : 0,
        byCollege,
      };
    },
  });

  return (
    <div>
      <PageHeader
        title="Central Intelligence"
        description="Live platform activity across every college, student and learning path."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Colleges" value={data?.colleges ?? 0} />
        <StatCard label="Students" value={data?.students ?? 0} />
        <StatCard label="Learning paths" value={data?.paths ?? 0} />
        <StatCard label="Published weeks" value={data?.publishedWeeks ?? 0} />
        <StatCard label="Avg placement readiness" value={`${data?.avgReadiness ?? 0}%`} />
        <StatCard label="Mock attempts" value={data?.attempts ?? 0} />
        <StatCard label="Code submissions" value={data?.codeRuns ?? 0} />
        <StatCard label="Certificates issued" value={data?.certificates ?? 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Readiness by college</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byCollege ?? []}>
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

        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Latest project submissions</h2>
          <ul className="mt-4 space-y-3">
            {(data?.projects ?? []).slice(0, 8).map((project) => (
              <li key={project.id} className="border-b border-border pb-2 last:border-0">
                <p className="text-sm font-medium">{project.name}</p>
                <p className="text-xs text-muted-foreground">
                  {project.status} · {new Date(project.created_at).toLocaleString()}
                </p>
              </li>
            ))}
            {!data?.projects.length ? (
              <li className="text-sm text-muted-foreground">No submissions yet.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
