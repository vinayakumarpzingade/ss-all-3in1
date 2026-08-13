import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runCode } from "@/lib/judge0.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SECTION_LABELS, type SectionKind } from "@/lib/week-parser";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/student/week/$weekId")({
  component: WeekView,
});

function WeekView() {
  const { weekId } = Route.useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const execute = useServerFn(runCode);
  useRealtime(["week_sections", "progress"], ["student-week"]);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [code, setCode] = useState<Record<string, string>>({});
  const [assignmentText, setAssignmentText] = useState("");
  const [project, setProject] = useState({ name: "", github: "", description: "" });

  const { data } = useQuery({
    queryKey: ["student-week", weekId, session?.studentId],
    enabled: !!session?.studentId,
    queryFn: async () => {
      const [week, sections, mcqs, coding, projects, assignments, progress] = await Promise.all([
        supabase.from("weeks").select("*").eq("id", weekId).maybeSingle(),
        supabase.from("week_sections").select("*").eq("week_id", weekId).order("position"),
        supabase.from("mcqs").select("*").eq("week_id", weekId).order("position"),
        supabase.from("coding_questions").select("*").eq("week_id", weekId).order("position"),
        supabase.from("projects").select("*").eq("week_id", weekId),
        supabase.from("assignments").select("*").eq("week_id", weekId),
        supabase.from("progress").select("kind").eq("week_id", weekId).eq("student_id", session!.studentId!),
      ]);
      return {
        week: week.data,
        sections: sections.data ?? [],
        mcqs: mcqs.data ?? [],
        coding: coding.data ?? [],
        project: projects.data?.[0] ?? null,
        assignment: assignments.data?.[0] ?? null,
        completed: new Set((progress.data ?? []).map((p) => p.kind as SectionKind)),
      };
    },
  });

  async function markComplete(kind: SectionKind) {
    if (!session?.studentId || !session.collegeId) return;
    const { error } = await supabase.from("progress").upsert(
      {
        student_id: session.studentId,
        college_id: session.collegeId,
        week_id: weekId,
        kind,
        completed: true,
      },
      { onConflict: "student_id,week_id,kind" },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${SECTION_LABELS[kind]} marked complete`);
    queryClient.invalidateQueries({ queryKey: ["student-week"] });
    queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
  }

  function submitQuiz() {
    const total = data?.mcqs.length ?? 0;
    const correct = (data?.mcqs ?? []).filter((m) => answers[m.id] === m.correct_index).length;
    setQuizDone(true);
    toast.success(`Scored ${correct}/${total}`);
    if (total && correct / total >= 0.5) void markComplete("mcq");
  }

  async function submitCode(question: {
    id: string;
    language: string;
    expected_output: string | null;
    points: number;
  }) {
    if (!session?.studentId || !session.collegeId) return;
    const source = code[question.id] ?? "";
    if (!source.trim()) {
      toast.error("Write some code first");
      return;
    }
    const result = await execute({
      data: {
        language: question.language,
        code: source,
        expectedOutput: question.expected_output ?? "",
      },
    });
    await supabase.from("coding_submissions").insert({
      question_id: question.id,
      student_id: session.studentId,
      college_id: session.collegeId,
      language: question.language,
      code: source,
      status: result.status,
      output: result.stdout,
      passed: result.passed,
      score: result.passed ? question.points : 0,
    });
    toast[result.passed ? "success" : "info"](result.message);
    if (result.passed) void markComplete("coding");
    queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
  }

  async function submitAssignment() {
    if (!data?.assignment || !session?.studentId || !session.collegeId) return;
    const { error } = await supabase.from("assignment_submissions").insert({
      assignment_id: data.assignment.id,
      student_id: session.studentId,
      college_id: session.collegeId,
      content: assignmentText,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setAssignmentText("");
    toast.success("Assignment submitted");
    void markComplete("assignment");
  }

  async function submitProject() {
    if (!session?.studentId || !session.collegeId) return;
    const { error } = await supabase.from("project_submissions").insert({
      project_id: data?.project?.id ?? null,
      student_id: session.studentId,
      college_id: session.collegeId,
      name: project.name,
      github_url: project.github,
      description: project.description,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setProject({ name: "", github: "", description: "" });
    toast.success("Project submitted for college review");
    void markComplete("mini_project");
  }

  return (
    <div>
      <PageHeader
        title={data?.week?.title ?? "Week"}
        description="Content published by StartSafe HQ. Complete each section to grow your readiness."
        back="/student/path"
      />

      <div className="space-y-4">
        {(data?.sections ?? []).map((section) => {
          const kind = section.kind as SectionKind;
          const items = Array.isArray(section.items) ? (section.items as string[]) : [];
          return (
            <section key={section.id} className="panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{SECTION_LABELS[kind]}</h2>
                {data?.completed.has(kind) ? (
                  <span className="text-xs font-medium text-success">Completed</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => markComplete(kind)}>
                    Mark complete
                  </Button>
                )}
              </div>

              {kind === "mcq" ? (
                <div className="mt-4 space-y-4">
                  {(data?.mcqs ?? []).map((mcq, index) => (
                    <div key={mcq.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium">
                        {index + 1}. {mcq.question}
                      </p>
                      <div className="mt-2 space-y-1">
                        {(mcq.options as string[]).map((option, optionIndex) => {
                          const chosen = answers[mcq.id] === optionIndex;
                          const correct = quizDone && optionIndex === mcq.correct_index;
                          return (
                            <button
                              key={optionIndex}
                              type="button"
                              onClick={() => setAnswers({ ...answers, [mcq.id]: optionIndex })}
                              className={`block w-full rounded-md border px-3 py-1.5 text-left text-sm ${
                                correct
                                  ? "border-success bg-success/10"
                                  : chosen
                                    ? "border-primary bg-primary/10"
                                    : "border-border"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {quizDone && mcq.explanation ? (
                        <p className="mt-2 text-xs text-muted-foreground">{mcq.explanation}</p>
                      ) : null}
                    </div>
                  ))}
                  {data?.mcqs.length ? (
                    <Button onClick={submitQuiz}>Submit answers</Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">No questions in this week.</p>
                  )}
                </div>
              ) : kind === "coding" ? (
                <div className="mt-4 space-y-4">
                  {(data?.coding ?? []).map((question) => (
                    <div key={question.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium">{question.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{question.prompt}</p>
                      <Textarea
                        className="mt-2 min-h-32 font-mono text-xs"
                        placeholder={`# ${question.language}`}
                        value={code[question.id] ?? ""}
                        onChange={(e) => setCode({ ...code, [question.id]: e.target.value })}
                      />
                      <Button size="sm" className="mt-2" onClick={() => submitCode(question)}>
                        Run & submit
                      </Button>
                    </div>
                  ))}
                </div>
              ) : kind === "assignment" ? (
                <div className="mt-4 space-y-2">
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{section.body}</p>
                  <Textarea
                    placeholder="Paste your answer or submission link"
                    value={assignmentText}
                    onChange={(e) => setAssignmentText(e.target.value)}
                  />
                  <Button size="sm" onClick={submitAssignment}>
                    Submit assignment
                  </Button>
                </div>
              ) : kind === "mini_project" ? (
                <div className="mt-4 space-y-2">
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{section.body}</p>
                  <Input
                    placeholder="Project name"
                    value={project.name}
                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                  />
                  <Input
                    placeholder="GitHub URL"
                    value={project.github}
                    onChange={(e) => setProject({ ...project, github: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description"
                    value={project.description}
                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                  />
                  <Button size="sm" onClick={submitProject}>
                    Submit project
                  </Button>
                </div>
              ) : items.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                  {section.body}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
