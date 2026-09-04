import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runCode } from "@/lib/judge0.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SECTION_LABELS, type SectionKind } from "@/lib/week-parser";
import { VideoPlayer } from "@/components/video-player";
import { useRealtime, useSession } from "@/lib/use-auth";
import { ChevronLeft, ChevronRight, Check, Lock, Play, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/week/$weekId")({
  component: WeekView,
});

const GUIDED_SEQUENCE: SectionKind[] = ["reading", "video", "cheat_sheet", "mcq", "coding", "assignment", "mini_project"];

function WeekView() {
  const { weekId } = Route.useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const execute = useServerFn(runCode);
  useRealtime(["week_sections", "progress", "mcq_attempts", "coding_submissions", "assignment_submissions", "project_submissions"], ["student-week"]);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [code, setCode] = useState<Record<string, string>>({});
  const [assignmentText, setAssignmentText] = useState("");
  const [project, setProject] = useState({ name: "", github: "", description: "" });
  const [running, setRunning] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["student-week", weekId, session?.studentId],
    enabled: !!session?.studentId,
    queryFn: async () => {
      const studentId = session?.studentId;
      if (!studentId) throw new Error("Student session not ready");
      const [week, sections, mcqs, coding, projects, assignments, progress] = await Promise.all([
        supabase.from("weeks").select("*").eq("id", weekId).maybeSingle(),
        supabase.from("week_sections").select("*").eq("week_id", weekId).order("position"),
        supabase.from("mcqs").select("*").eq("week_id", weekId).order("position"),
        supabase.from("coding_questions").select("*").eq("week_id", weekId).order("position"),
        supabase.from("projects").select("*").eq("week_id", weekId).is("archived_at", null),
        supabase.from("assignments").select("*").eq("week_id", weekId).is("archived_at", null),
        supabase.from("progress").select("kind, completed").eq("week_id", weekId).eq("student_id", studentId),
      ]);
      return {
        week: week.data,
        sections: sections.data ?? [],
        mcqs: mcqs.data ?? [],
        coding: coding.data ?? [],
        project: projects.data?.[0] ?? null,
        assignment: assignments.data?.[0] ?? null,
        completed: new Set((progress.data ?? []).filter((row) => row.completed).map((row) => row.kind as SectionKind)),
      };
    },
  });

  const steps = useMemo(() => GUIDED_SEQUENCE.map((kind) => ({ kind, section: data?.sections.find((row) => row.kind === kind) })), [data?.sections]);
  const completedCount = steps.filter((step) => data?.completed.has(step.kind)).length;
  const progressPercent = steps.length ? Math.round((completedCount * 100) / steps.length) : 0;
  const active = steps[currentStep] ?? steps[0];
  const previousDone = currentStep === 0 || data?.completed.has(steps[currentStep - 1]?.kind);
  const isLocked = !previousDone;

  async function markComplete(kind: SectionKind) {
    if (!session?.studentId || !session.collegeId) return;
    const { error } = await supabase.from("progress").upsert(
      { student_id: session.studentId, college_id: session.collegeId, week_id: weekId, kind, completed: true },
      { onConflict: "student_id,week_id,kind" },
    );
    if (error) {
      toast.error(error.message.includes("locked") ? "Finish the previous step first." : error.message);
      return;
    }
    toast.success(`${SECTION_LABELS[kind]} completed`);
    await queryClient.invalidateQueries({ queryKey: ["student-week"] });
    await queryClient.invalidateQueries({ queryKey: ["student-path"] });
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  async function checkMcq(mcq: NonNullable<typeof data>["mcqs"][number]) {
    if (!session?.studentId || !session.collegeId || answers[mcq.id] == null) {
      toast.error("Choose an answer first");
      return;
    }
    const isCorrect = answers[mcq.id] === mcq.correct_index;
    const { error } = await supabase.from("mcq_attempts").insert({
      student_id: session.studentId,
      college_id: session.collegeId,
      week_id: weekId,
      question_id: mcq.id,
      selected_index: answers[mcq.id],
      correct: isCorrect,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setChecked((previous) => ({ ...previous, [mcq.id]: true }));
    toast[isCorrect ? "success" : "error"](isCorrect ? "Correct answer" : "Not quite — review the explanation");
  }

  async function completeMcq() {
    const unanswered = data?.mcqs.some((mcq) => !checked[mcq.id]);
    if (unanswered) {
      toast.error("Check every question before completing MCQ practice");
      return;
    }
    await markComplete("mcq");
  }

  async function submitCode(question: NonNullable<typeof data>["coding"][number]) {
    if (!session?.studentId || !session.collegeId) return;
    const source = code[question.id] ?? question.starter_code ?? "";
    if (!source.trim()) {
      toast.error("Write some code first");
      return;
    }
    setRunning(question.id);
    try {
      const result = await execute({ data: { language: question.language, code: source, expectedOutput: question.expected_output ?? "" } });
      if (!result.passed) {
        toast.error(`${result.message}${result.stdout ? ` — ${result.stdout}` : ""}`);
        return;
      }
      const { error } = await supabase.from("coding_submissions").insert({
        question_id: question.id, student_id: session.studentId, college_id: session.collegeId,
        language: question.language, code: source, status: result.status, output: result.stdout, passed: true, score: question.points,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("All required tests passed — coding practice submitted");
      await markComplete("coding");
    } finally {
      setRunning(null);
    }
  }

  async function submitAssignment() {
    if (!data?.assignment || !session?.studentId || !session.collegeId || !assignmentText.trim()) {
      toast.error("Add your assignment response first");
      return;
    }
    const { error } = await supabase.from("assignment_submissions").insert({
      assignment_id: data.assignment.id, student_id: session.studentId, college_id: session.collegeId, content: assignmentText.trim(),
    });
    if (error) { toast.error(error.message); return; }
    setAssignmentText("");
    toast.success("Assignment submitted");
    await markComplete("assignment");
  }

  async function submitProject() {
    if (!data?.project || !session?.studentId || !session.collegeId || !project.name.trim()) {
      toast.error("Add a project name first");
      return;
    }
    const { error } = await supabase.from("project_submissions").insert({
      project_id: data.project.id, student_id: session.studentId, college_id: session.collegeId, name: project.name.trim(),
      github_url: project.github.trim() || null, description: project.description.trim() || null, project_type: "individual", is_personal: false,
      team_members: [], status: "submitted",
    });
    if (error) { toast.error(error.message); return; }
    setProject({ name: "", github: "", description: "" });
    toast.success("Mini project submitted for college review");
    await markComplete("mini_project");
  }

  const onVideoWatched = useCallback(() => { void markComplete("video"); }, [weekId, session?.studentId, session?.collegeId, queryClient, steps.length]);

  return (
    <div>
      <PageHeader title={data?.week?.title ?? "Week"} description="Follow the sequence from lesson to project. Your progress is saved as you go." back="/student/path" backLabel="Back to learning path" />
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="stat-label">Guided week {data?.week?.week_number ?? ""}</p><h2 className="mt-1 font-display text-2xl font-bold">{data?.week?.title ?? "Loading…"}</h2></div>
            <div className="text-right"><p className="font-display text-2xl font-bold text-primary">{progressPercent}%</p><p className="text-xs text-muted-foreground">{completedCount}/{steps.length} steps complete</p></div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} /></div>
        </div>
        <div className="panel p-4">
          <p className="stat-label">Your sequence</p>
          <div className="mt-3 space-y-1">
            {steps.map((step, index) => {
              const done = data?.completed.has(step.kind);
              const locked = index > 0 && !data?.completed.has(steps[index - 1]?.kind);
              return <button key={step.kind} type="button" disabled={locked} onClick={() => setCurrentStep(index)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${index === currentStep ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"} ${locked ? "cursor-not-allowed opacity-50" : ""}`}><span className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs">{done ? <Check className="size-3 text-success" /> : locked ? <Lock className="size-3" /> : index + 1}</span><span>{SECTION_LABELS[step.kind]}</span></button>;
            })}
          </div>
        </div>
      </div>

      {active ? <section className={`panel p-5 ${isLocked ? "opacity-70" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div><p className="stat-label">Step {currentStep + 1} of {steps.length}</p><h2 className="mt-1 text-xl font-semibold">{SECTION_LABELS[active.kind]}</h2></div>
          {data?.completed.has(active.kind) ? <span className="inline-flex items-center gap-1 text-sm font-medium text-success"><Check className="size-4" /> Completed</span> : isLocked ? <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Lock className="size-4" /> Finish the previous step</span> : null}
        </div>
        {!active.section && active.kind !== "mcq" && active.kind !== "coding" && active.kind !== "assignment" && active.kind !== "mini_project" ? <p className="mt-5 text-sm text-muted-foreground">This step has not been added to this week yet.</p> : null}
        {!isLocked && active.kind === "reading" ? <div className="mt-5 space-y-4"><p className="whitespace-pre-line text-sm leading-7">{active.section?.body || "No lesson text has been added yet."}</p>{!data?.completed.has("reading") ? <Button onClick={() => markComplete("reading")}><Check className="mr-2 size-4" /> Mark lesson complete</Button> : null}</div> : null}
        {!isLocked && active.kind === "video" ? <div className="mt-5 space-y-4"><VideoPlayer url={active.section?.media_url} title={active.section?.title} onWatched={active.section?.media_url ? onVideoWatched : undefined} />{!active.section?.media_url ? <p className="text-sm text-muted-foreground">A video link has not been attached to this week.</p> : null}</div> : null}
        {!isLocked && active.kind === "cheat_sheet" ? <div className="mt-5 space-y-4"><p className="whitespace-pre-line text-sm leading-7">{active.section?.body || "No cheat sheet has been added yet."}</p>{!data?.completed.has("cheat_sheet") ? <Button onClick={() => markComplete("cheat_sheet")}><Check className="mr-2 size-4" /> Mark cheat sheet complete</Button> : null}</div> : null}
        {!isLocked && active.kind === "mcq" ? <div className="mt-5 space-y-4">{data?.mcqs.map((mcq, index) => { const selected = answers[mcq.id]; const isChecked = checked[mcq.id]; return <div key={mcq.id} className="rounded-lg border border-border p-4"><p className="text-sm font-medium">{index + 1}. {mcq.question}</p><div className="mt-3 grid gap-2">{(mcq.options as string[]).map((option, optionIndex) => <button key={optionIndex} type="button" disabled={isChecked} onClick={() => setAnswers((previous) => ({ ...previous, [mcq.id]: optionIndex }))} className={`rounded-md border px-3 py-2 text-left text-sm ${selected === optionIndex ? "border-primary bg-primary/10" : "border-border"} ${isChecked && optionIndex === mcq.correct_index ? "border-success bg-success/10" : ""}`}>{String.fromCharCode(65 + optionIndex)}. {option}</button>)}</div>{isChecked ? <div className={`mt-3 rounded-md border p-3 text-sm ${selected === mcq.correct_index ? "border-success/50 bg-success/10" : "border-destructive/50 bg-destructive/10"}`}><p className="font-medium">{selected === mcq.correct_index ? "Correct" : `Incorrect — correct answer: ${(mcq.options as string[])[mcq.correct_index]}`}</p>{mcq.explanation ? <p className="mt-1 text-muted-foreground">{mcq.explanation}</p> : null}</div> : <Button size="sm" variant="outline" onClick={() => checkMcq(mcq)}>Check answer</Button>}</div> })}{!data?.mcqs.length ? <p className="text-sm text-muted-foreground">No questions have been added yet.</p> : <Button onClick={completeMcq} disabled={!!data?.completed.has("mcq")}><Check className="mr-2 size-4" /> Complete MCQ practice</Button>}</div> : null}
        {!isLocked && active.kind === "coding" ? <div className="mt-5 space-y-5">{data?.coding.map((question) => <div key={question.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{question.title}</h3><span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">{question.language} · {question.points} pts</span></div><p className="mt-3 whitespace-pre-line text-sm">{question.prompt}</p><div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs"><div><p className="stat-label">Input format</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{question.input_description || "—"}</p></div><div><p className="stat-label">Output format</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{question.output_description || "—"}</p></div><div><p className="stat-label">Constraints</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{question.constraints || "—"}</p></div></div>{question.examples ? <pre className="mt-3 overflow-x-auto rounded-md bg-secondary p-3 text-xs">{JSON.stringify(question.examples, null, 2)}</pre> : null}<Textarea className="mt-3 min-h-40 font-mono text-xs" value={code[question.id] ?? question.starter_code ?? ""} placeholder={`# ${question.language}`} onChange={(event) => setCode((previous) => ({ ...previous, [question.id]: event.target.value }))} /><div className="mt-2 flex flex-wrap items-center gap-3"><Button size="sm" onClick={() => submitCode(question)} disabled={running === question.id}><Play className="mr-2 size-4" />{running === question.id ? "Running…" : "Run tests & submit"}</Button><span className="text-xs text-muted-foreground">Expected output: {question.expected_output || "configured test cases"}</span></div></div>)}{!data?.coding.length ? <p className="text-sm text-muted-foreground">No coding problem has been added yet.</p> : null}</div> : null}
        {!isLocked && active.kind === "assignment" ? <div className="mt-5 space-y-3"><p className="whitespace-pre-line text-sm leading-7">{active.section?.body || data?.assignment?.brief || "No assignment brief has been added yet."}</p><Textarea placeholder="Write your assignment response" value={assignmentText} onChange={(event) => setAssignmentText(event.target.value)} />{!data?.completed.has("assignment") ? <Button onClick={submitAssignment}>Submit assignment</Button> : null}</div> : null}
        {!isLocked && active.kind === "mini_project" ? <div className="mt-5 space-y-3"><div className="rounded-md border border-border bg-secondary/40 p-3 text-sm"><p className="font-medium">{data?.project?.title ?? active.section?.title ?? "Mini project"}</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{data?.project?.brief ?? active.section?.body ?? "Build and submit the assigned project."}</p><p className="mt-2 text-xs text-muted-foreground">Due {data?.project?.due_at ? new Date(data.project.due_at).toLocaleDateString() : "No due date"}</p></div><Input placeholder="Project title" value={project.name} onChange={(event) => setProject((previous) => ({ ...previous, name: event.target.value }))} /><Input placeholder="GitHub URL" value={project.github} onChange={(event) => setProject((previous) => ({ ...previous, github: event.target.value }))} /><Textarea placeholder="Describe what you built" value={project.description} onChange={(event) => setProject((previous) => ({ ...previous, description: event.target.value }))} />{!data?.completed.has("mini_project") ? <Button onClick={submitProject}>Submit mini project</Button> : null}</div> : null}
      </section> : null}
      <div className="mt-4 flex justify-between gap-2"><Button variant="outline" onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} disabled={currentStep === 0}><ChevronLeft className="mr-2 size-4" /> Previous</Button><Button variant="outline" onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))} disabled={currentStep >= steps.length - 1 || !data?.completed.has(active?.kind)}><ChevronRight className="mr-2 size-4" /> Next step</Button></div>
    </div>
  );
}