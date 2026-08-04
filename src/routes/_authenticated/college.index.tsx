import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app-shell";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/college/")({
  component: CollegeOverview,
});

function CollegeOverview() {
  const { data: session } = useSession();
  useRealtime(["students", "progress", "mock_attempts", "project_submissions"], ["college-overview"]);

  const { data } = useQuery({
    queryKey: ["college-overview", session?.collegeId],
    enabled: !!session?.collegeId,
    queryFn: async () => {
      const collegeId = session!.collegeId!;
      const [students, attempts, projects, certificates] = await Promise.all([
        supabase.from("students").select("*").eq("college_id", collegeId),
        supabase.from("mock_attempts").select("id, score, total").eq("college_id", collegeId),
        supabase.from("project_submissions").select("id, name, status").eq("college_id", collegeId),
        supabase.from("certificates").select("id").eq("college_id", collegeId),
      ]);
      const rows = students.data ?? [];
      const avg = (key: "placement_readiness" | "learning_progress" | "coding_score" | "mock_score") =>
        rows.length ? Math.round(rows.reduce((s, r) => s + (r[key] ?? 0), 0) / rows.length) : 0;
      return {
        students: rows,
        avgReadiness: avg("placement_readiness"),
        avgLearning: avg("learning_progress"),
        avgMock: avg("mock_score"),
        avgCoding: avg("coding_score"),
        attempts: attempts.data?.length ?? 0,
        projects: projects.data ?? [],
        certificates: certificates.data?.length ?? 0,
      };
    },
  });

  const top = [...(data?.students ?? [])]
    .sort((a, b) => b.placement_readiness - a.placement_readiness)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title={session?.collegeName ?? "College Command Center"}
        description="Student activity updates here the moment it happens."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={data?.students.length ?? 0} />
        <StatCard label="Avg readiness" value={`${data?.avgReadiness ?? 0}%`} />
        <StatCard label="Avg learning" value={`${data?.avgLearning ?? 0}%`} />
        <StatCard label="Avg mock" value={`${data?.avgMock ?? 0}%`} />
        <StatCard label="Coding points" value={data?.avgCoding ?? 0} />
        <StatCard label="Mock attempts" value={data?.attempts ?? 0} />
        <StatCard label="Projects submitted" value={data?.projects.length ?? 0} />
        <StatCard label="Certificates" value={data?.certificates ?? 0} />
      </div>

      <div className="mt-6 panel p-5">
        <h2 className="text-lg font-semibold">Top performers</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {top.map((student, index) => (
            <li key={student.id} className="flex justify-between border-b border-border pb-2">
              <span>
                #{index + 1} {student.name} · {student.usn}
              </span>
              <span className="font-medium">{student.placement_readiness}%</span>
            </li>
          ))}
          {!top.length ? <li className="text-muted-foreground">Add students to begin.</li> : null}
        </ul>
      </div>
    </div>
  );
}
