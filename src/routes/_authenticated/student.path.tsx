import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/student/path")({
  component: StudentPath,
});

function StudentPath() {
  const { data: session } = useSession();
  useRealtime(["weeks", "progress"], ["student-path"]);

  const { data } = useQuery({
    queryKey: ["student-path", session?.collegeId, session?.studentId],
    enabled: !!session?.collegeId,
    queryFn: async () => {
      const { data: links } = await supabase
        .from("college_paths")
        .select("path_id")
        .eq("college_id", session!.collegeId!);
      const pathIds = (links ?? []).map((l) => l.path_id);
      if (!pathIds.length) return { paths: [], weeks: [], done: new Set<string>() };
      const [paths, weeks, progress] = await Promise.all([
        supabase.from("learning_paths").select("*").in("id", pathIds),
        supabase
          .from("weeks")
          .select("*")
          .in("path_id", pathIds)
          .eq("is_published", true)
          .order("week_number"),
        supabase.from("progress").select("week_id").eq("student_id", session!.studentId!),
      ]);
      return {
        paths: paths.data ?? [],
        weeks: weeks.data ?? [],
        done: new Set((progress.data ?? []).map((p) => p.week_id)),
      };
    },
  });

  return (
    <div>
      <PageHeader
        title="Learning path"
        description="Only content your college has been assigned appears here."
      />
      <div className="space-y-6">
        {(data?.paths ?? []).map((path) => (
          <div key={path.id} className="panel p-5">
            <h2 className="text-lg font-semibold">{path.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{path.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.weeks ?? [])
                .filter((week) => week.path_id === path.id)
                .map((week) => (
                  <div key={week.id} className="rounded-lg border border-border p-4">
                    <p className="stat-label">Week {week.week_number}</p>
                    <p className="mt-1 font-medium">{week.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {data?.done.has(week.id) ? "Completed" : "In progress"}
                    </p>
                    <Button asChild size="sm" className="mt-3">
                      <Link to="/student/week/$weekId" params={{ weekId: week.id }}>
                        Open
                      </Link>
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}
        {!data?.paths.length ? (
          <p className="text-sm text-muted-foreground">
            Your college has not been assigned a learning path yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
