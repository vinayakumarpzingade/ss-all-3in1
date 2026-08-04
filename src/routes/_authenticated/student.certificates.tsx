import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/student/certificates")({
  component: StudentCertificates,
});

function StudentCertificates() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  useRealtime(["certificates", "progress", "mock_attempts", "project_submissions"], ["student-certs"]);

  const { data } = useQuery({
    queryKey: ["student-certs", session?.studentId],
    enabled: !!session?.studentId,
    queryFn: async () => {
      const studentId = session!.studentId!;
      const [certificates, progress, attempts, projects, links] = await Promise.all([
        supabase.from("certificates").select("*").eq("student_id", studentId),
        supabase.from("progress").select("kind, week_id").eq("student_id", studentId),
        supabase.from("mock_attempts").select("id").eq("student_id", studentId),
        supabase.from("project_submissions").select("id").eq("student_id", studentId),
        supabase.from("college_paths").select("path_id").eq("college_id", session!.collegeId!),
      ]);
      const kinds = new Set((progress.data ?? []).map((p) => p.kind));
      return {
        certificates: certificates.data ?? [],
        pathId: links.data?.[0]?.path_id ?? null,
        eligible:
          kinds.has("objectives") &&
          kinds.has("assignment") &&
          (attempts.data?.length ?? 0) > 0 &&
          (projects.data?.length ?? 0) > 0,
      };
    },
  });

  async function claim() {
    if (!session?.studentId || !session.collegeId) return;
    const serial = `SS-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from("certificates").insert({
      student_id: session.studentId,
      college_id: session.collegeId,
      path_id: data?.pathId ?? null,
      title: "StartSafe Placement Readiness Certificate",
      serial,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Certificate unlocked");
    queryClient.invalidateQueries();
  }

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Unlocked automatically once learning, assignment, mock test and project are done."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {(data?.certificates ?? []).map((certificate) => (
          <div key={certificate.id} className="panel p-6">
            <p className="stat-label">Certificate</p>
            <h2 className="mt-2 text-lg font-semibold">{certificate.title}</h2>
            <p className="mt-2 font-mono text-xs text-muted-foreground">{certificate.serial}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Issued {new Date(certificate.issued_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
      {!data?.certificates.length ? (
        <div className="panel mt-4 p-5">
          <p className="text-sm text-muted-foreground">
            {data?.eligible
              ? "All requirements met — claim your certificate."
              : "Complete a week, an assignment, a mock test and a project to unlock your certificate."}
          </p>
          <Button className="mt-3" disabled={!data?.eligible} onClick={claim}>
            Claim certificate
          </Button>
        </div>
      ) : null}
    </div>
  );
}
