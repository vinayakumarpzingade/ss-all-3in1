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
import { parseWeek } from "@/lib/week-parser";
import { useRealtime } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin/mocks/")({
  component: AdminMocks,
});

const SAMPLE = `1. 20% of 250 is
a) 40
b) 45
c) 50
d) 55
Answer: c
`;

function AdminMocks() {
  const queryClient = useQueryClient();
  useRealtime(["mock_attempts"], ["admin-mocks"]);
  const [form, setForm] = useState({ title: "", description: "", duration: "30", questions: SAMPLE });

  const { data } = useQuery({
    queryKey: ["admin-mocks"],
    queryFn: async () => {
      const [tests, questions, assignments, colleges, attempts] = await Promise.all([
        supabase.from("mock_tests").select("*").order("created_at", { ascending: false }),
        supabase.from("mock_questions").select("id, test_id"),
        supabase.from("mock_assignments").select("id, test_id, college_id"),
        supabase.from("colleges").select("id, name, code"),
        supabase.from("mock_attempts").select("id, test_id, score, total, created_at, student_id"),
      ]);
      return {
        tests: tests.data ?? [],
        questions: questions.data ?? [],
        assignments: assignments.data ?? [],
        colleges: colleges.data ?? [],
        attempts: attempts.data ?? [],
      };
    },
  });

  async function createTest(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseWeek(`MCQ Practice\n${form.questions}`);
    if (!parsed.mcqs.length) {
      toast.error("No questions detected. Use the a) b) Answer: format.");
      return;
    }
    const { data: test, error } = await supabase
      .from("mock_tests")
      .insert({
        title: form.title,
        description: form.description,
        duration_minutes: Number(form.duration || 30),
      })
      .select()
      .single();
    if (error || !test) {
      toast.error(error?.message ?? "Failed");
      return;
    }
    await supabase.from("mock_questions").insert(
      parsed.mcqs.map((m, i) => ({
        test_id: test.id,
        question: m.question,
        options: m.options,
        correct_index: m.correct_index,
        position: i,
      })),
    );
    toast.success(`Mock test created with ${parsed.mcqs.length} questions`);
    setForm({ title: "", description: "", duration: "30", questions: SAMPLE });
    queryClient.invalidateQueries({ queryKey: ["admin-mocks"] });
  }

  async function toggleAssign(testId: string, collegeId: string, assigned: boolean) {
    if (assigned) {
      await supabase
        .from("mock_assignments")
        .delete()
        .eq("test_id", testId)
        .eq("college_id", collegeId);
    } else {
      await supabase.from("mock_assignments").insert({ test_id: testId, college_id: collegeId });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-mocks"] });
  }

  return (
    <div>
      <PageHeader title="Mock tests" description="Create tests, assign colleges and track attempts live." />
      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={createTest} className="panel space-y-3 p-5">
          <h2 className="text-lg font-semibold">New mock test</h2>
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="questions">Questions (paste)</Label>
            <Textarea
              id="questions"
              className="min-h-[220px] font-mono text-xs"
              value={form.questions}
              onChange={(e) => setForm({ ...form, questions: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full">
            Create test
          </Button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          {(data?.tests ?? []).map((test) => {
            const questionCount = (data?.questions ?? []).filter((q) => q.test_id === test.id).length;
            const attempts = (data?.attempts ?? []).filter((a) => a.test_id === test.id);
            const avg = attempts.length
              ? Math.round(
                  attempts.reduce((s, a) => s + (a.total ? (a.score * 100) / a.total : 0), 0) /
                    attempts.length,
                )
              : 0;
            return (
              <div key={test.id} className="panel p-5">
                <h3 className="font-semibold">{test.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {questionCount} questions · {test.duration_minutes} min · {attempts.length} attempts
                  · avg {avg}%
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(data?.colleges ?? []).map((college) => {
                    const assigned = (data?.assignments ?? []).some(
                      (a) => a.test_id === test.id && a.college_id === college.id,
                    );
                    return (
                      <Button
                        key={college.id}
                        size="sm"
                        variant={assigned ? "default" : "outline"}
                        onClick={() => toggleAssign(test.id, college.id, assigned)}
                      >
                        {college.code}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
