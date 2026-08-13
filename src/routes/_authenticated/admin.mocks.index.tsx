import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { QueryState } from "@/components/states";
import { parseWeek } from "@/lib/week-parser";
import { bestAttempt, pct } from "@/lib/analytics";
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
  useRealtime(["mock_attempts", "mock_tests", "mock_assignments"], ["admin-mocks"]);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "30",
    difficulty: "medium",
    maxAttempts: "3",
    passingMarks: "",
    course: "",
    semester: "",
    questions: SAMPLE,
  });

  const query = useQuery({
    queryKey: ["admin-mocks"],
    queryFn: async () => {
      const [tests, questions, assignments, colleges, attempts, students, courses] = await Promise.all([
        supabase.from("mock_tests").select("*").order("created_at", { ascending: false }),
        supabase.from("mock_questions").select("id, test_id"),
        supabase.from("mock_assignments").select("id, test_id, college_id"),
        supabase.from("colleges").select("id, name, code, college_code").is("archived_at", null),
        supabase.from("mock_attempts").select("id, test_id, score, total, created_at, student_id"),
        supabase.from("students").select("id, college_id").is("archived_at", null),
        supabase.from("courses").select("code, name").eq("is_active", true).order("name"),
      ]);
      return {
        tests: tests.data ?? [],
        questions: questions.data ?? [],
        assignments: assignments.data ?? [],
        colleges: colleges.data ?? [],
        attempts: attempts.data ?? [],
        students: students.data ?? [],
        courses: courses.data ?? [],
      };
    },
  });
  const data = query.data;
  const tests = (data?.tests ?? []).filter((t) => (showArchived ? true : !t.archived_at));

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-mocks"] });
  }

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
        difficulty: form.difficulty,
        max_attempts: Number(form.maxAttempts || 3),
        passing_marks: form.passingMarks ? Number(form.passingMarks) : null,
        total_marks: parsed.mcqs.length,
        target_course: form.course || null,
        target_semester: form.semester ? Number(form.semester) : null,
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
    setForm({ ...form, title: "", description: "", questions: SAMPLE });
    refresh();
  }

  async function toggleAssign(testId: string, collegeId: string, assigned: boolean) {
    if (assigned) {
      await supabase.from("mock_assignments").delete().eq("test_id", testId).eq("college_id", collegeId);
    } else {
      await supabase.from("mock_assignments").insert({ test_id: testId, college_id: collegeId });
    }
    refresh();
  }

  async function togglePublish(testId: string, next: boolean) {
    const { error } = await supabase.from("mock_tests").update({ is_published: next }).eq("id", testId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Published — assigned students can start it" : "Unpublished");
    refresh();
  }

  async function archiveTest(testId: string, next: boolean) {
    const { error } = await supabase
      .from("mock_tests")
      .update(next ? { archived_at: new Date().toISOString(), is_published: false } : { archived_at: null })
      .eq("id", testId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Archived — hidden from students" : "Restored");
    refresh();
  }

  async function deleteTest(testId: string) {
    const { error } = await supabase.from("mock_tests").delete().eq("id", testId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Test deleted");
    refresh();
  }

  async function duplicateTest(testId: string) {
    const source = (data?.tests ?? []).find((t) => t.id === testId);
    if (!source) return;
    const { data: copy, error } = await supabase
      .from("mock_tests")
      .insert({
        title: `${source.title} (copy)`,
        description: source.description,
        duration_minutes: source.duration_minutes,
        difficulty: source.difficulty,
        max_attempts: source.max_attempts,
        max_violations: source.max_violations,
        passing_marks: source.passing_marks,
        total_marks: source.total_marks,
        instructions: source.instructions,
        target_course: source.target_course,
        target_semester: source.target_semester,
        is_published: false,
      })
      .select()
      .single();
    if (error || !copy) {
      toast.error(error?.message ?? "Could not duplicate");
      return;
    }
    const { data: questions } = await supabase
      .from("mock_questions")
      .select("question, options, correct_index, position")
      .eq("test_id", testId)
      .order("position");
    if (questions?.length) {
      await supabase.from("mock_questions").insert(questions.map((q) => ({ ...q, test_id: copy.id })));
    }
    toast.success("Duplicated as an unpublished draft");
    refresh();
  }

  const totalAttempts = (data?.attempts ?? []).length;

  return (
    <div>
      <PageHeader
        title="Mock tests"
        description="Create, publish, assign and analyse proctored tests. Best attempt always counts as the final score."
        back="/admin"
        actions={
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived
          </label>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tests" value={tests.length} />
        <StatCard label="Published" value={tests.filter((t) => t.is_published).length} />
        <StatCard label="Assignments" value={(data?.assignments ?? []).length} />
        <StatCard label="Attempts" value={totalAttempts} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <form onSubmit={createTest} className="panel space-y-3 p-5">
          <h2 className="text-lg font-semibold">New mock test</h2>
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="attempts">Max attempts</Label>
              <Input
                id="attempts"
                type="number"
                min={1}
                value={form.maxAttempts}
                onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="passing">Passing marks</Label>
              <Input
                id="passing"
                type="number"
                min={0}
                value={form.passingMarks}
                onChange={(e) => setForm({ ...form, passingMarks: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="course">Course</Label>
              <select
                id="course"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              >
                <option value="">Any course</option>
                {(data?.courses ?? []).map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                type="number"
                min={1}
                max={12}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="questions">Questions (paste)</Label>
            <Textarea
              id="questions"
              className="min-h-[200px] font-mono text-xs"
              value={form.questions}
              onChange={(e) => setForm({ ...form, questions: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full">
            Create test
          </Button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <QueryState isLoading={query.isLoading} error={query.error} isEmpty={!tests.length} emptyTitle="No mock tests yet.">
            {tests.map((test) => {
              const questionCount = (data?.questions ?? []).filter((q) => q.test_id === test.id).length;
              const attempts = (data?.attempts ?? []).filter((a) => a.test_id === test.id);
              const assignedColleges = (data?.assignments ?? []).filter((a) => a.test_id === test.id);
              const assignedStudents = (data?.students ?? []).filter((s) =>
                assignedColleges.some((a) => a.college_id === s.college_id),
              );
              const byStudent = new Map<string, typeof attempts>();
              for (const attempt of attempts) {
                byStudent.set(attempt.student_id, [...(byStudent.get(attempt.student_id) ?? []), attempt]);
              }
              const bestPercents = [...byStudent.values()].map((rows) => {
                const best = bestAttempt(rows);
                return best ? pct(best.score, best.total) : 0;
              });
              const average = bestPercents.length
                ? Math.round(bestPercents.reduce((s, v) => s + v, 0) / bestPercents.length)
                : 0;
              return (
                <div key={test.id} className="panel panel-hover p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/admin/mocks/$testId"
                        params={{ testId: test.id }}
                        className="font-semibold hover:underline"
                      >
                        {test.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {questionCount} questions · {test.duration_minutes} min · {test.difficulty} · max{" "}
                        {test.max_attempts} attempts
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {byStudent.size}/{assignedStudents.length} students attempted · avg best {average}%
                        {test.archived_at ? " · archived" : test.is_published ? " · published" : " · draft"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link to="/admin/mocks/$testId" params={{ testId: test.id }}>
                          View
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => togglePublish(test.id, !test.is_published)}>
                        {test.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => duplicateTest(test.id)}>
                        Duplicate
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="outline">
                            {test.archived_at ? "Restore" : "Archive"}
                          </Button>
                        }
                        title={test.archived_at ? "Restore this test?" : "Archive this test?"}
                        description={
                          test.archived_at
                            ? "It becomes available for publishing again."
                            : "Are you sure you want to continue? Students will no longer see this test, but attempts are kept."
                        }
                        confirmLabel={test.archived_at ? "Restore" : "Archive"}
                        onConfirm={() => archiveTest(test.id, !test.archived_at)}
                      />
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        }
                        title="Delete this test permanently?"
                        description="Are you sure you want to continue? Questions and attempts are removed for good. Archive instead if you may need it later."
                        confirmLabel="Delete forever"
                        requireTyping="DELETE"
                        onConfirm={() => deleteTest(test.id)}
                      />
                    </div>
                  </div>

                  <p className="stat-label mt-4">Assigned colleges</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(data?.colleges ?? []).map((college) => {
                      const assigned = assignedColleges.some((a) => a.college_id === college.id);
                      return (
                        <Button
                          key={college.id}
                          size="sm"
                          variant={assigned ? "default" : "outline"}
                          onClick={() => toggleAssign(test.id, college.id, assigned)}
                        >
                          {college.college_code ?? college.code}
                        </Button>
                      );
                    })}
                    {!data?.colleges.length ? (
                      <span className="text-xs text-muted-foreground">Add a college first.</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </QueryState>
        </div>
      </div>
    </div>
  );
}
