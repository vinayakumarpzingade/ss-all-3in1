import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useRealtime, useSession } from "@/lib/use-auth";
import { Check, Lock, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/path")({ component: StudentPath });

const SEQUENCE = ["reading", "video", "cheat_sheet", "mcq", "coding", "assignment", "mini_project"];
const LABELS: Record<string, string> = { reading: "Reading / Lesson", video: "Video", cheat_sheet: "Cheat Sheet", mcq: "MCQ", coding: "Coding Practice", assignment: "Assignment", mini_project: "Mini Project" };

function StudentPath() {
  const { data: session } = useSession();
  useRealtime(["weeks", "week_sections", "progress"], ["student-path"]);
  const { data } = useQuery({
    queryKey: ["student-path", session?.collegeId, session?.studentId],
    enabled: !!session?.collegeId && !!session?.studentId,
    queryFn: async () => {
      const collegeId = session?.collegeId;
      const studentId = session?.studentId;
      if (!collegeId || !studentId) return { paths: [], weeks: [], progress: [], sections: [] };
      const { data: links } = await supabase.from("college_paths").select("path_id").eq("college_id", collegeId);
      const pathIds = (links ?? []).map((link) => link.path_id);
      if (!pathIds.length) return { paths: [], weeks: [], progress: [], sections: [] };
      const [paths, weeks, progress, sections] = await Promise.all([
        supabase.from("learning_paths").select("*").in("id", pathIds).is("archived_at", null),
        supabase.from("weeks").select("*").in("path_id", pathIds).eq("is_published", true).is("archived_at", null).order("week_number"),
        supabase.from("progress").select("week_id, kind, completed").eq("student_id", studentId),
        supabase.from("week_sections").select("week_id, kind").in("week_id", (await supabase.from("weeks").select("id").in("path_id", pathIds).eq("is_published", true)).data?.map((week) => week.id) ?? []),
      ]);
      return { paths: paths.data ?? [], weeks: weeks.data ?? [], progress: progress.data ?? [], sections: sections.data ?? [] };
    },
  });

  function weekState(week: NonNullable<typeof data>["weeks"][number], ordered: NonNullable<typeof data>["weeks"]) {
    const index = ordered.findIndex((item) => item.id === week.id);
    const previous = ordered[index - 1];
    const previousRows = previous ? data?.progress.filter((row) => row.week_id === previous.id && row.completed) : [];
    const previousKinds = new Set(data?.sections.filter((row) => row.week_id === previous?.id).map((row) => row.kind));
    const previousComplete = !previous || [...previousKinds].every((kind) => previousRows?.some((row) => row.kind === kind));
    const completed = data?.progress.filter((row) => row.week_id === week.id && row.completed).length ?? 0;
    const stepKinds = new Set(data?.sections.filter((row) => row.week_id === week.id).map((row) => row.kind));
    const percent = stepKinds.size ? Math.round((completed * 100) / stepKinds.size) : 0;
    return { index, locked: !previousComplete, completed, percent, stepKinds };
  }

  return <div>
    <PageHeader title="Learning path" description="Work through each week in order. A week unlocks only after every assigned activity in the previous week is complete." />
    {!data?.paths.length ? <p className="text-sm text-muted-foreground">Your college has not been assigned a learning path yet.</p> : null}
    <div className="space-y-6">{(data?.paths ?? []).map((path) => { const weeks = (data?.weeks ?? []).filter((week) => week.path_id === path.id).sort((a, b) => a.week_number - b.week_number); return <div key={path.id} className="panel p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="stat-label">Assigned curriculum</p><h2 className="mt-1 text-xl font-semibold">{path.title}</h2><p className="mt-1 text-sm text-muted-foreground">{path.description}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{weeks.length} weeks</span></div><div className="mt-5 space-y-3">{weeks.map((week) => { const state = weekState(week, weeks); const done = state.percent === 100 && state.stepKinds.size > 0; return <div key={week.id} className={`rounded-lg border p-4 ${state.locked ? "border-border bg-secondary/30" : done ? "border-success/40 bg-success/5" : "border-primary/40 bg-primary/5"}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="stat-label">Week {week.week_number}</p><h3 className="mt-1 font-semibold">{week.title}</h3><p className="mt-1 text-xs text-muted-foreground">{done ? "Completed" : state.locked ? "Locked until the previous week is complete" : state.completed ? `${state.completed} activity steps complete` : "Ready to start"}</p></div>{state.locked ? <Lock className="size-5 text-muted-foreground" /> : done ? <Check className="size-5 text-success" /> : <Play className="size-5 text-primary" />}</div><div className="mt-3 grid gap-2 sm:grid-cols-7">{SEQUENCE.map((kind) => { const present = state.stepKinds.has(kind); const complete = data?.progress.some((row) => row.week_id === week.id && row.kind === kind && row.completed); return <div key={kind} className={`rounded-md border px-2 py-2 text-center text-[11px] ${complete ? "border-success/40 text-success" : present ? "border-border text-muted-foreground" : "border-dashed border-border text-muted-foreground/50"}`}>{complete ? <Check className="mx-auto mb-1 size-3" /> : null}{LABELS[kind]}</div> })}</div><div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${state.percent}%` }} /></div><span className="text-xs font-medium">{state.percent}%</span>{state.locked ? <Button size="sm" variant="outline" disabled><Lock className="mr-2 size-3" /> Locked</Button> : <Button asChild size="sm"><Link to="/student/week/$weekId" params={{ weekId: week.id }}>{done ? "Review week" : "Open week"}</Link></Button>}</div></div> })}</div></div> })}</div>
  </div>;
}