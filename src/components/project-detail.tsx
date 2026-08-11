import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QueryState } from "@/components/states";
import { StatCard } from "@/components/app-shell";
import { bestScorePercent, formatDate } from "@/lib/analytics";
import { useRealtime } from "@/lib/use-auth";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="stat-label">{label}</p>
      <p className="mt-1 text-sm">{value || "—"}</p>
    </div>
  );
}

export function ProjectDetailView({
  submissionId,
  canReview,
  portal,
}: {
  submissionId: string;
  canReview: boolean;
  portal: "admin" | "college";
}) {
  const queryClient = useQueryClient();
  useRealtime(["project_submissions"], ["project-detail"]);
  const [review, setReview] = useState<{ status: string; note: string; score: string } | null>(null);

  const query = useQuery({
    queryKey: ["project-detail", submissionId],
    queryFn: async () => {
      const { data: submission, error } = await supabase
        .from("project_submissions")
        .select("*")
        .eq("id", submissionId)
        .maybeSingle();
      if (error) throw error;
      if (!submission) throw new Error("Submission not found");

      const [student, college, project, attempts, certificates] = await Promise.all([
        supabase.from("students").select("*").eq("id", submission.student_id).maybeSingle(),
        supabase
          .from("colleges")
          .select("name, college_code")
          .eq("id", submission.college_id)
          .maybeSingle(),
        submission.project_id
          ? supabase.from("projects").select("title, brief, week_id").eq("id", submission.project_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("mock_attempts").select("*").eq("student_id", submission.student_id),
        supabase
          .from("certificates")
          .select("id")
          .eq("student_id", submission.student_id)
          .is("archived_at", null),
      ]);

      return {
        submission,
        student: student.data,
        college: college.data,
        project: project.data,
        mockBest: bestScorePercent(attempts.data ?? []),
        certificates: certificates.data?.length ?? 0,
      };
    },
  });

  const data = query.data;

  async function saveReview() {
    if (!review) return;
    const { error } = await supabase
      .from("project_submissions")
      .update({
        status: review.status,
        review_note: review.note,
        score: review.score === "" ? null : Number(review.score),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Review saved");
    setReview(null);
    queryClient.invalidateQueries({ queryKey: ["project-detail", submissionId] });
  }

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {data ? (
        <div className="space-y-6">
          <div className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">{data.submission.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {data.project?.title ? `Brief: ${data.project.title} · ` : ""}
                  Submitted {formatDate(data.submission.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="stat-label">Status</p>
                <p className="text-sm font-semibold uppercase">{data.submission.status}</p>
                {data.submission.score != null ? (
                  <p className="text-xs text-muted-foreground">Score {data.submission.score}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Student"
              value={
                data.student ? (
                  <Link
                    to={portal === "admin" ? "/admin/student/$studentId" : "/college/student/$studentId"}
                    params={{ studentId: data.student.id }}
                    className="text-primary hover:underline"
                  >
                    {data.student.name}
                  </Link>
                ) : (
                  "—"
                )

              }
            />
            <Field label="Student ID / USN" value={data.student?.usn} />
            <Field label="College" value={`${data.college?.name ?? "—"} (${data.college?.college_code ?? "—"})`} />
            <Field label="Course" value={data.student?.course} />
            <Field label="Department" value={data.student?.department} />
            <Field label="Semester" value={data.student?.semester} />
            <Field label="Submission date" value={formatDate(data.submission.created_at)} />
            <Field label="Deadline" value={formatDate(data.submission.deadline)} />
            <Field label="Reviewed" value={formatDate(data.submission.reviewed_at)} />
          </div>

          <div className="panel space-y-4 p-5">
            <div>
              <p className="stat-label">Description</p>
              <p className="mt-1 whitespace-pre-line text-sm">{data.submission.description || "—"}</p>
            </div>
            <div>
              <p className="stat-label">Objectives</p>
              <p className="mt-1 whitespace-pre-line text-sm">
                {data.submission.objectives || data.project?.brief || "—"}
              </p>
            </div>
            <div>
              <p className="stat-label">Technology stack</p>
              <p className="mt-1 text-sm">{data.submission.tech_stack || "—"}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {data.submission.github_url ? (
                <a className="text-primary underline" href={data.submission.github_url} target="_blank" rel="noreferrer">
                  GitHub repository
                </a>
              ) : null}
              {data.submission.demo_url ? (
                <a className="text-primary underline" href={data.submission.demo_url} target="_blank" rel="noreferrer">
                  Live demo
                </a>
              ) : null}
              {data.submission.docs_url ? (
                <a className="text-primary underline" href={data.submission.docs_url} target="_blank" rel="noreferrer">
                  Documentation
                </a>
              ) : null}
              {data.submission.file_url ? (
                <a className="text-primary underline" href={data.submission.file_url} target="_blank" rel="noreferrer">
                  Uploaded file
                </a>
              ) : null}
              {!data.submission.github_url &&
              !data.submission.demo_url &&
              !data.submission.docs_url &&
              !data.submission.file_url ? (
                <span className="text-muted-foreground">No links attached.</span>
              ) : null}
            </div>
            {data.submission.review_note ? (
              <div>
                <p className="stat-label">Review feedback</p>
                <p className="mt-1 whitespace-pre-line text-sm">{data.submission.review_note}</p>
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Student readiness snapshot</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Placement readiness" value={`${data.student?.placement_readiness ?? 0}%`} />
              <StatCard label="Learning progress" value={`${data.student?.learning_progress ?? 0}%`} />
              <StatCard label="Mock tests (best)" value={`${data.mockBest}%`} />
              <StatCard label="Coding points" value={data.student?.coding_score ?? 0} />
              <StatCard label="Certificates" value={data.certificates} />
            </div>
          </div>

          {canReview ? (
            <div className="panel space-y-3 p-5">
              <h3 className="font-semibold">Review project</h3>
              {review ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={review.status}
                        onChange={(e) => setReview({ ...review, status: e.target.value })}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under review</option>
                        <option value="approved">Approved</option>
                        <option value="needs_changes">Needs changes</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="score">Score (0–100)</Label>
                      <Input
                        id="score"
                        type="number"
                        min={0}
                        max={100}
                        value={review.score}
                        onChange={(e) => setReview({ ...review, score: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="note">Feedback</Label>
                    <Textarea
                      id="note"
                      value={review.note}
                      onChange={(e) => setReview({ ...review, note: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveReview}>Save review</Button>
                    <Button variant="outline" onClick={() => setReview(null)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() =>
                    setReview({
                      status: data.submission.status,
                      note: data.submission.review_note ?? "",
                      score: data.submission.score?.toString() ?? "",
                    })
                  }
                >
                  Review this project
                </Button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </QueryState>
  );
}
