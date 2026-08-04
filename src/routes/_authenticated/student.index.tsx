import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const { data: session } = useSession();
  useRealtime(["weeks", "progress", "mock_attempts", "certificates"], ["student-dashboard"]);

  const { data } = useQuery({
    queryKey: ["student-dashboard", session?.studentId],
    enabled: !!session?.studentId,
    queryFn: async () => {
      const studentId = session!.studentId!;
      const [student, progress, attempts, certificates, projects, links] = await Promise.all([
        supabase.from("students").select("*").eq("id", studentId).maybeSingle(),
        supabase.from("progress").select("week_id, kind").eq("student_id", studentId),
        supabase.from("mock_attempts").select("id, score, total").eq("student_id", studentId),
        supabase.from("certificates").select("id, title").eq("student_id", studentId),
        supabase.from("project_submissions").select("id, name, status").eq("student_id", studentId),
        supabase.from("college_paths").select("path_id").eq("college_id", session!.collegeId!),
      ]);
      const pathIds = (links.data ?? []).map((l) => l.path_id);
      const { data: weeks } = pathIds.length
        ? await supabase
            .from("weeks")
            .select("id, title, week_number, path_id")
            .in("path_id", pathIds)
            .eq("is_published", true)
            .order("week_number")
        : { data: [] };
      const doneWeeks = new Set((progress.data ?? []).map((p) => p.week_id));
      const current = (weeks ?? []).find((w) => !doneWeeks.has(w.id)) ?? null;
      return {
        student: student.data,
        attempts: attempts.data ?? [],
        certificates: certificates.data ?? [],
        projects: projects.data ?? [],
        weeks: weeks ?? [],
        completedWeeks: doneWeeks.size,
        current,
      };
    },
  });

  const student = data?.student;

  return (
    <div>
      <PageHeader
        title={`Hello, ${student?.name ?? "Student"}`}
        description={`${student?.department ?? ""} · Semester ${student?.semester ?? "-"} · ${student?.usn ?? ""}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Learning progress" value={`${student?.learning_progress ?? 0}%`} />
        <StatCard label="Placement readiness" value={`${student?.placement_readiness ?? 0}%`} />
        <StatCard label="Mock score" value={`${student?.mock_score ?? 0}%`} />
        <StatCard label="Coding points" value={student?.coding_score ?? 0} />
        <StatCard label="Weeks completed" value={`${data?.completedWeeks ?? 0}/${data?.weeks.length ?? 0}`} />
        <StatCard label="Mock attempts" value={data?.attempts.length ?? 0} />
        <StatCard label="Projects" value={data?.projects.length ?? 0} />
        <StatCard label="Certificates" value={data?.certificates.length ?? 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Current week</h2>
          {data?.current ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Week {data.current.week_number} · {data.current.title}
              </p>
              <Progress className="mt-4" value={student?.learning_progress ?? 0} />
              <Button asChild className="mt-4">
                <Link to="/student/week/$weekId" params={{ weekId: data.current.id }}>
                  Continue learning
                </Link>
              </Button>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              All published weeks complete. New content appears here instantly.
            </p>
          )}
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Certificates</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data?.certificates.map((certificate) => (
              <li key={certificate.id}>{certificate.title}</li>
            ))}
            {!data?.certificates.length ? (
              <li className="text-muted-foreground">
                Complete learning, assignment, mock test and project to unlock.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
