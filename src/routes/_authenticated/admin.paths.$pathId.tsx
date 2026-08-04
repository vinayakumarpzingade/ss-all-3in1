import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseWeek, SECTION_LABELS } from "@/lib/week-parser";

export const Route = createFileRoute("/_authenticated/admin/paths/$pathId")({
  component: WeekEditor,
});

const TEMPLATE = `# Week 1 — Topic name

Objectives
- First objective
- Second objective

Cheat Sheet
Write the theory paragraph here.

MCQ Practice
1. Question text?
a) Option A
b) Option B
Answer: b

Coding Practice
- Problem title - Problem description
  Language: python
  Expected output: 15

Mini Project
- Project title
Project description.

Assignment
- Assignment title
Task description.

Resources
- Video: https://example.com

Interview Questions
- Question one?
`;

function WeekEditor() {
  const { pathId } = Route.useParams();
  const queryClient = useQueryClient();
  const [weekNumber, setWeekNumber] = useState("");
  const [raw, setRaw] = useState(TEMPLATE);

  const { data } = useQuery({
    queryKey: ["admin-week-editor", pathId],
    queryFn: async () => {
      const [path, weeks] = await Promise.all([
        supabase.from("learning_paths").select("*").eq("id", pathId).maybeSingle(),
        supabase.from("weeks").select("*").eq("path_id", pathId).order("week_number"),
      ]);
      return { path: path.data, weeks: weeks.data ?? [] };
    },
  });

  const preview = parseWeek(raw, `Week ${weekNumber || (data?.weeks.length ?? 0) + 1}`);

  async function publish() {
    const number = Number(weekNumber || (data?.weeks.length ?? 0) + 1);
    const parsed = parseWeek(raw, `Week ${number}`);

    const { data: week, error } = await supabase
      .from("weeks")
      .upsert(
        {
          path_id: pathId,
          week_number: number,
          title: parsed.title,
          raw_content: raw,
          is_published: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "path_id,week_number" },
      )
      .select()
      .single();
    if (error || !week) {
      toast.error(error?.message ?? "Could not publish");
      return;
    }

    await Promise.all([
      supabase.from("week_sections").delete().eq("week_id", week.id),
      supabase.from("mcqs").delete().eq("week_id", week.id),
      supabase.from("coding_questions").delete().eq("week_id", week.id),
      supabase.from("projects").delete().eq("week_id", week.id),
      supabase.from("assignments").delete().eq("week_id", week.id),
    ]);

    await supabase.from("week_sections").insert(
      parsed.sections.map((s) => ({
        week_id: week.id,
        kind: s.kind,
        title: s.title,
        body: s.body,
        items: s.items,
        position: s.position,
      })),
    );
    if (parsed.mcqs.length) {
      await supabase.from("mcqs").insert(
        parsed.mcqs.map((m, i) => ({
          week_id: week.id,
          question: m.question,
          options: m.options,
          correct_index: m.correct_index,
          explanation: m.explanation,
          position: i,
        })),
      );
    }
    if (parsed.coding.length) {
      await supabase.from("coding_questions").insert(
        parsed.coding.map((c, i) => ({
          week_id: week.id,
          path_id: pathId,
          title: c.title,
          prompt: c.prompt,
          language: c.language,
          expected_output: c.expected_output,
          difficulty: c.difficulty,
          position: i,
        })),
      );
    }
    if (parsed.project) {
      await supabase
        .from("projects")
        .insert({ week_id: week.id, title: parsed.project.title, brief: parsed.project.brief });
    }
    if (parsed.assignment) {
      await supabase.from("assignments").insert({
        week_id: week.id,
        title: parsed.assignment.title,
        brief: parsed.assignment.brief,
      });
    }

    toast.success(`Week ${number} published — students see it instantly`);
    queryClient.invalidateQueries({ queryKey: ["admin-week-editor", pathId] });
  }

  async function loadWeek(id: string) {
    const week = data?.weeks.find((w) => w.id === id);
    if (!week) return;
    setWeekNumber(String(week.week_number));
    setRaw(week.raw_content);
  }

  return (
    <div>
      <PageHeader
        title={data?.path?.title ?? "Week editor"}
        description="Paste one structured block. Publishing parses it into student-facing sections automatically."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(data?.weeks ?? []).map((week) => (
          <Button key={week.id} size="sm" variant="outline" onClick={() => loadWeek(week.id)}>
            Week {week.week_number} {week.is_published ? "✓" : "(draft)"}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-3 p-5">
          <div className="w-32 space-y-1">
            <Label htmlFor="week">Week number</Label>
            <Input
              id="week"
              type="number"
              min={1}
              value={weekNumber}
              placeholder={String((data?.weeks.length ?? 0) + 1)}
              onChange={(e) => setWeekNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="content">Week content</Label>
            <Textarea
              id="content"
              className="min-h-[520px] font-mono text-xs"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </div>
          <Button onClick={publish} className="w-full">
            Parse & publish
          </Button>
        </div>

        <div className="panel space-y-4 p-5">
          <h2 className="text-lg font-semibold">Parsed preview</h2>
          <p className="text-sm text-muted-foreground">
            {preview.title} · {preview.mcqs.length} MCQs · {preview.coding.length} coding problems
          </p>
          {preview.sections.map((section) => (
            <div key={section.kind} className="rounded-lg border border-border p-3">
              <p className="stat-label">{SECTION_LABELS[section.kind]}</p>
              {section.items.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {section.items.slice(0, 6).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {section.body.slice(0, 320)}
                </p>
              )}
            </div>
          ))}
          {!preview.sections.length ? (
            <p className="text-sm text-muted-foreground">
              No sections detected yet — keep the headings (Objectives, Cheat Sheet, MCQ Practice…).
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
