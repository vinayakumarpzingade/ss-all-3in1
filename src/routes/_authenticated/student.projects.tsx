import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/student/projects")({
  component: StudentProjects,
});

function StudentProjects() {
  const { data: session } = useSession();
  useRealtime(["project_submissions"], ["student-projects"]);

  const { data } = useQuery({
    queryKey: ["student-projects", session?.studentId],
    enabled: !!session?.studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("project_submissions")
        .select("*")
        .eq("student_id", session!.studentId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="My projects"
        description="Submit projects from the week page. Your college reviews them here."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {(data ?? []).map((project) => (
          <div key={project.id} className="panel p-5">
            <h2 className="font-semibold">{project.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            {project.github_url ? (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-primary underline"
              >
                GitHub repository
              </a>
            ) : null}
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {project.status}
            </p>
            {project.review_note ? (
              <p className="mt-1 text-xs text-muted-foreground">{project.review_note}</p>
            ) : null}
          </div>
        ))}
        {!data?.length ? (
          <p className="text-sm text-muted-foreground">No projects submitted yet.</p>
        ) : null}
      </div>
    </div>
  );
}
