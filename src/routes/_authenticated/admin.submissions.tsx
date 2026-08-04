import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { useRealtime } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  component: AdminSubmissions,
});

function AdminSubmissions() {
  useRealtime(["project_submissions", "assignment_submissions", "coding_submissions"], ["admin-subs"]);

  const { data } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: async () => {
      const [projects, assignments, coding, students] = await Promise.all([
        supabase.from("project_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("assignment_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("coding_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("students").select("id, name, usn"),
      ]);
      const nameOf = (id: string) =>
        (students.data ?? []).find((s) => s.id === id)?.name ?? "Student";
      return {
        projects: (projects.data ?? []).map((p) => ({ ...p, student: nameOf(p.student_id) })),
        assignments: (assignments.data ?? []).map((a) => ({ ...a, student: nameOf(a.student_id) })),
        coding: (coding.data ?? []).map((c) => ({ ...c, student: nameOf(c.student_id) })),
      };
    },
  });

  return (
    <div>
      <PageHeader title="Submissions" description="Everything students submit, platform wide." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h2 className="font-semibold">Projects</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data?.projects.map((p) => (
              <li key={p.id} className="border-b border-border pb-2">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.student} · {p.status}
                </p>
              </li>
            ))}
            {!data?.projects.length ? <li className="text-muted-foreground">None yet.</li> : null}
          </ul>
        </div>
        <div className="panel p-5">
          <h2 className="font-semibold">Assignments</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data?.assignments.map((a) => (
              <li key={a.id} className="border-b border-border pb-2">
                <p className="font-medium">{a.student}</p>
                <p className="text-xs text-muted-foreground">{a.content.slice(0, 90)}</p>
              </li>
            ))}
            {!data?.assignments.length ? <li className="text-muted-foreground">None yet.</li> : null}
          </ul>
        </div>
        <div className="panel p-5">
          <h2 className="font-semibold">Code runs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data?.coding.map((c) => (
              <li key={c.id} className="border-b border-border pb-2">
                <p className="font-medium">{c.student}</p>
                <p className="text-xs text-muted-foreground">
                  {c.language} · {c.passed ? "passed" : c.status}
                </p>
              </li>
            ))}
            {!data?.coding.length ? <li className="text-muted-foreground">None yet.</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
