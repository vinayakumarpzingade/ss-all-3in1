import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QueryState } from "@/components/states";
import { bestAttempt, formatDuration, latestAttempt, pct } from "@/lib/analytics";
import { useRealtime } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin/mocks/$testId")({
  component: AdminMockDetail,
});

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function AdminMockDetail() {
  const { testId } = Route.useParams();
  const queryClient = useQueryClient();
  useRealtime(["mock_attempts", "mock_tests", "mock_assignments"], ["admin-mock-detail"]);
  const [openCollege, setOpenCollege] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-mock-detail", testId],
    queryFn: async () => {
      const [test, questions, assignments, colleges, attempts, students, courses] = await Promise.all([
        supabase.from("mock_tests").select("*").eq("id", testId).maybeSingle(),
        supabase.from("mock_questions").select("*").eq("test_id", testId).order("position"),
        supabase.from("mock_assignments").select("college_id").eq("test_id", testId),
        supabase.from("colleges").select("id, name, code, college_code").is("archived_at", null),
        supabase.from("mock_attempts").select("*").eq("test_id", testId),
        supabase
          .from("students")
          .select("id, name, usn, college_id, course, semester")
          .is("archived_at", null),
        supabase.from("courses").select("code, name").eq("is_active", true).order("name"),
      ]);
      return {
        test: test.data,
        questions: questions.data ?? [],
        assignedColleges: (assignments.data ?? []).map((a) => a.college_id),
        colleges: colleges.data ?? [],
        attempts: attempts.data ?? [],
        students: students.data ?? [],
        courses: courses.data ?? [],
      };
    },
  });
  const data = query.data;
  const test = data?.test;

  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    duration: "30",
    maxAttempts: "3",
    maxViolations: "3",
    passingMarks: "",
    difficulty: "medium",
    course: "",
    semester: "",
    startAt: "",
    endAt: "",
  });

  useEffect(() => {
    if (!test) return;
    setForm({
      title: test.title,
      description: test.description ?? "",
      instructions: test.instructions ?? "",
      duration: String(test.duration_minutes),
      maxAttempts: String(test.max_attempts),
      maxViolations: String(test.max_violations),
      passingMarks: test.passing_marks == null ? "" : String(test.passing_marks),
      difficulty: test.difficulty,
      course: test.target_course ?? "",
      semester: test.target_semester == null ? "" : String(test.target_semester),
      startAt: toLocalInput(test.start_at),
      endAt: toLocalInput(test.end_at),
    });
  }, [test]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await supabase
      .from("mock_tests")
      .update({
        title: form.title,
        description: form.description || null,
        instructions: form.instructions || null,
        duration_minutes: Number(form.duration || 30),
        max_attempts: Number(form.maxAttempts || 3),
        max_violations: Number(form.maxViolations || 3),
        passing_marks: form.passingMarks ? Number(form.passingMarks) : null,
        difficulty: form.difficulty,
        target_course: form.course || null,
        target_semester: form.semester ? Number(form.semester) : null,
        start_at: form.startAt ? new Date(form.startAt).toISOString() : null,
        end_at: form.endAt ? new Date(form.endAt).toISOString() : null,
      })
      .eq("id", testId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Test updated");
    queryClient.invalidateQueries({ queryKey: ["admin-mock-detail", testId] });
    queryClient.invalidateQueries({ queryKey: ["admin-mocks"] });
  }

  async function toggleAssign(collegeId: string, assigned: boolean) {
    if (assigned) {
      await supabase.from("mock_assignments").delete().eq("test_id", testId).eq("college_id", collegeId);
    } else {
      await supabase.from("mock_assignments").insert({ test_id: testId, college_id: collegeId });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-mock-detail", testId] });
  }

  const assignedStudents = (data?.students ?? []).filter((s) =>
    (data?.assignedColleges ?? []).includes(s.college_id),
  );
  const attempts = data?.attempts ?? [];
  const byStudent = new Map<string, typeof attempts>();
  for (const attempt of attempts) {
    byStudent.set(attempt.student_id, [...(byStudent.get(attempt.student_id) ?? []), attempt]);
  }
  const bestPercents = [...byStudent.values()].map((rows) => {
    const best = bestAttempt(rows);
    return best ? pct(best.score, best.total) : 0;
  });
  const average = bestPercents.length ? Math.round(bestPercents.reduce((s, v) => s + v, 0) / bestPercents.length) : 0;
  const highest = bestPercents.length ? Math.max(...bestPercents) : 0;
  const lowest = bestPercents.length ? Math.min(...bestPercents) : 0;

  const collegeRows = (data?.assignedColleges ?? []).map((collegeId) => {
    const college = (data?.colleges ?? []).find((c) => c.id === collegeId);
    const students = assignedStudents.filter((s) => s.college_id === collegeId);
    const attempted = students.filter((s) => byStudent.has(s.id));
    const percents = attempted.map((s) => {
      const best = bestAttempt(byStudent.get(s.id) ?? []);
      return best ? pct(best.score, best.total) : 0;
    });
    return {
      id: collegeId,
      name: college?.name ?? "College",
      code: college?.college_code ?? college?.code ?? "",
      assigned: students.length,
      attempted: attempted.length,
      average: percents.length ? Math.round(percents.reduce((s, v) => s + v, 0) / percents.length) : 0,
      highest: percents.length ? Math.max(...percents) : 0,
      students,
    };
  });

  return (
    <div>
      <PageHeader
        title={test?.title ?? "Mock test"}
        description={
          test
            ? `${data?.questions.length ?? 0} questions · ${test.duration_minutes} min · ${test.difficulty} · ${
                test.archived_at ? "archived" : test.is_published ? "published" : "draft"
              }`
            : "Loading test…"
        }
        back="/admin/mocks"
        backLabel="Back to Mock tests"
      />

      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={!test} emptyTitle="Test not found">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Students assigned" value={assignedStudents.length} />
          <StatCard label="Attempted" value={byStudent.size} />
          <StatCard label="Not attempted" value={Math.max(0, assignedStudents.length - byStudent.size)} />
          <StatCard label="Average (best)" value={`${average}%`} />
          <StatCard label="Highest / lowest" value={`${highest}% / ${lowest}%`} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <form onSubmit={save} className="panel space-y-3 p-5">
            <h2 className="text-lg font-semibold">Edit test</h2>
            <div className="space-y-1">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-desc">Description</Label>
              <Input id="t-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-inst">Instructions</Label>
              <Textarea
                id="t-inst"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="t-dur">Duration (min)</Label>
                <Input
                  id="t-dur"
                  type="number"
                  min={5}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-att">Max attempts</Label>
                <Input
                  id="t-att"
                  type="number"
                  min={1}
                  value={form.maxAttempts}
                  onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-vio">Max violations</Label>
                <Input
                  id="t-vio"
                  type="number"
                  min={1}
                  value={form.maxViolations}
                  onChange={(e) => setForm({ ...form, maxViolations: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-pass">Passing marks</Label>
                <Input
                  id="t-pass"
                  type="number"
                  min={0}
                  value={form.passingMarks}
                  onChange={(e) => setForm({ ...form, passingMarks: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-diff">Difficulty</Label>
                <select
                  id="t-diff"
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
                <Label htmlFor="t-course">Course</Label>
                <select
                  id="t-course"
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
                <Label htmlFor="t-sem">Semester</Label>
                <Input
                  id="t-sem"
                  type="number"
                  min={1}
                  max={12}
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-start">Available from</Label>
                <Input
                  id="t-start"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-end">Available until</Label>
                <Input
                  id="t-end"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Save changes
            </Button>

            <p className="stat-label pt-2">Assigned colleges</p>
            <div className="flex flex-wrap gap-2">
              {(data?.colleges ?? []).map((college) => {
                const assigned = (data?.assignedColleges ?? []).includes(college.id);
                return (
                  <Button
                    key={college.id}
                    type="button"
                    size="sm"
                    variant={assigned ? "default" : "outline"}
                    onClick={() => toggleAssign(college.id, assigned)}
                  >
                    {college.college_code ?? college.code}
                  </Button>
                );
              })}
            </div>
          </form>

          <div className="space-y-4 lg:col-span-2">
            <div className="panel p-5">
              <h2 className="text-lg font-semibold">College-wise performance</h2>
              <p className="text-xs text-muted-foreground">Click a college to see its students.</p>
              <div className="mt-3 space-y-2">
                {collegeRows.map((row) => (
                  <div key={row.id} className="rounded-lg border border-border p-3">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setOpenCollege(openCollege === row.id ? null : row.id)}
                    >
                      <p className="font-medium">
                        {row.name} <span className="font-mono text-xs text-muted-foreground">{row.code}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Assigned {row.assigned} · Attempted {row.attempted} · Average {row.average}% · Highest{" "}
                        {row.highest}%
                      </p>
                    </button>
                    {openCollege === row.id ? (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-left text-xs text-muted-foreground">
                            <tr>
                              <th className="py-1">Student</th>
                              <th>Attempts</th>
                              <th>Best</th>
                              <th>Latest</th>
                              <th>Time</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.students.map((student) => {
                              const rows = byStudent.get(student.id) ?? [];
                              const best = bestAttempt(rows);
                              const last = latestAttempt(rows);
                              const bestPct = best ? pct(best.score, best.total) : 0;
                              const passing = test?.passing_marks ?? null;
                              const status = !rows.length
                                ? "Not attempted"
                                : passing != null && best
                                  ? best.score >= passing
                                    ? "Passed"
                                    : "Failed"
                                  : "Completed";
                              return (
                                <tr key={student.id} className="border-t border-border">
                                  <td className="py-2">
                                    <Link
                                      to="/admin/student/$studentId"
                                      params={{ studentId: student.id }}
                                      className="hover:underline"
                                    >
                                      {student.name}
                                    </Link>
                                    <span className="ml-1 font-mono text-xs text-muted-foreground">{student.usn}</span>
                                  </td>
                                  <td>
                                    {rows.length}/{test?.max_attempts ?? 3}
                                  </td>
                                  <td className="font-semibold">
                                    {best ? `${best.score}/${best.total} (${bestPct}%)` : "—"}
                                  </td>
                                  <td>{last ? `${last.score}/${last.total}` : "—"}</td>
                                  <td>{last?.time_taken_seconds ? formatDuration(last.time_taken_seconds) : "—"}</td>
                                  <td>{status}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ))}
                {!collegeRows.length ? (
                  <p className="text-sm text-muted-foreground">Assign this test to a college to collect attempts.</p>
                ) : null}
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-semibold">Questions</h2>
              <ol className="mt-3 space-y-3 text-sm">
                {(data?.questions ?? []).map((question, index) => (
                  <li key={question.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">
                      {index + 1}. {question.question}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {(question.options as string[]).map((option, optionIndex) => (
                        <li key={optionIndex} className={optionIndex === question.correct_index ? "text-success" : ""}>
                          {String.fromCharCode(97 + optionIndex)}) {option}
                          {optionIndex === question.correct_index ? " ✓" : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
