import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/states";
import { bestAttempt, formatDuration, pct } from "@/lib/analytics";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/student/mocks")({
  component: StudentMocks,
});

type Attempt = {
  testId: string;
  startedAt: number;
  durationSeconds: number;
  attemptNumber: number;
  maxViolations: number;
};

function StudentMocks() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  useRealtime(["mock_attempts", "mock_assignments", "mock_tests"], ["student-mocks"]);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [violations, setViolations] = useState<{ kind: string; at: string }[]>([]);
  const submittingRef = useRef(false);
  const stateRef = useRef({ answers, tabSwitches, fullscreenExits, violations, attempt });
  stateRef.current = { answers, tabSwitches, fullscreenExits, violations, attempt };

  const query = useQuery({
    queryKey: ["student-mocks", session?.collegeId, session?.studentId],
    enabled: !!session?.collegeId,
    queryFn: async () => {
      const { data: assigned } = await supabase
        .from("mock_assignments")
        .select("test_id")
        .eq("college_id", session!.collegeId!);
      const ids = (assigned ?? []).map((a) => a.test_id);
      if (!ids.length) return { tests: [], questions: [], attempts: [] };
      const [tests, questions, attempts] = await Promise.all([
        supabase
          .from("mock_tests")
          .select("*")
          .in("id", ids)
          .eq("is_published", true)
          .is("archived_at", null),
        supabase.from("mock_questions").select("*").in("test_id", ids).order("position"),
        supabase.from("mock_attempts").select("*").eq("student_id", session!.studentId!),
      ]);
      return {
        tests: tests.data ?? [],
        questions: questions.data ?? [],
        attempts: attempts.data ?? [],
      };
    },
  });
  const data = query.data;

  const finish = useCallback(
    async (auto: boolean) => {
      const current = stateRef.current;
      const active = current.attempt;
      if (!active || submittingRef.current) return;
      if (!session?.studentId || !session.collegeId) return;
      submittingRef.current = true;

      const questions = (data?.questions ?? []).filter((q) => q.test_id === active.testId);
      const score = questions.filter((q) => current.answers[q.id] === q.correct_index).length;
      const timeTaken = Math.min(
        active.durationSeconds,
        Math.round((Date.now() - active.startedAt) / 1000),
      );

      const { error } = await supabase.from("mock_attempts").insert({
        test_id: active.testId,
        student_id: session.studentId,
        college_id: session.collegeId,
        score,
        total: questions.length,
        answers: current.answers,
        attempt_number: active.attemptNumber,
        started_at: new Date(active.startedAt).toISOString(),
        submitted_at: new Date().toISOString(),
        duration_seconds: active.durationSeconds,
        time_taken_seconds: timeTaken,
        tab_switch_count: current.tabSwitches,
        fullscreen_exit_count: current.fullscreenExits,
        violations: current.violations,
        auto_submitted: auto,
      });

      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});

      submittingRef.current = false;
      if (error) {
        toast.error(error.message);
        return;
      }
      toast[auto ? "warning" : "success"](
        `${auto ? "Auto-submitted" : "Submitted"} — scored ${score}/${questions.length}`,
      );
      setAttempt(null);
      setAnswers({});
      setViolations([]);
      setTabSwitches(0);
      setFullscreenExits(0);
      queryClient.invalidateQueries();
    },
    [data?.questions, queryClient, session],
  );

  // Countdown timer with auto-submit at zero.
  useEffect(() => {
    if (!attempt) return;
    const tick = () => {
      const left = attempt.durationSeconds - Math.round((Date.now() - attempt.startedAt) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) void finish(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [attempt, finish]);

  // Proctoring: tab switches and fullscreen exits.
  useEffect(() => {
    if (!attempt) return;

    const record = (kind: string) => {
      setViolations((prev) => [...prev, { kind, at: new Date().toISOString() }]);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      setTabSwitches((prev) => {
        const next = prev + 1;
        record("tab_switch");
        toast.warning(`Tab switch detected (${next}/${attempt.maxViolations})`);
        if (next + stateRef.current.fullscreenExits >= attempt.maxViolations) void finish(true);
        return next;
      });
    };

    const onFullscreen = () => {
      if (document.fullscreenElement) return;
      setFullscreenExits((prev) => {
        const next = prev + 1;
        record("fullscreen_exit");
        toast.warning(`Fullscreen exit detected (${next}/${attempt.maxViolations})`);
        if (next + stateRef.current.tabSwitches >= attempt.maxViolations) void finish(true);
        return next;
      });
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [attempt, finish]);

  async function start(test: {
    id: string;
    duration_minutes: number;
    max_attempts: number;
    max_violations: number;
  }, used: number) {
    if (used >= test.max_attempts) {
      toast.error(`Attempt limit reached (${test.max_attempts}). Your best score stands.`);
      return;
    }
    setAnswers({});
    setViolations([]);
    setTabSwitches(0);
    setFullscreenExits(0);
    await document.documentElement.requestFullscreen?.().catch(() => {});
    setAttempt({
      testId: test.id,
      startedAt: Date.now(),
      durationSeconds: test.duration_minutes * 60,
      attemptNumber: used + 1,
      maxViolations: test.max_violations,
    });
  }

  return (
    <div>
      <PageHeader
        title="Mock tests"
        description="Proctored tests assigned to your college. Timer auto-submits at zero and your best attempt counts."
      />
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={!data?.tests.length}
        emptyTitle="No mock tests assigned yet"
        emptyHint="Your college will publish tests here."
      >
        <div className="space-y-4">
          {(data?.tests ?? []).map((test) => {
            const questions = (data?.questions ?? []).filter((q) => q.test_id === test.id);
            const attempts = (data?.attempts ?? []).filter((a) => a.test_id === test.id);
            const best = bestAttempt(attempts);
            const active = attempt?.testId === test.id;
            const remainingAttempts = Math.max(0, test.max_attempts - attempts.length);
            return (
              <div key={test.id} className="panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{test.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {questions.length} questions · {test.duration_minutes} min · {test.difficulty} ·{" "}
                      {attempts.length}/{test.max_attempts} attempts used
                      {best
                        ? ` · best ${best.score}/${best.total} (${pct(best.score, best.total)}%)`
                        : " · not attempted"}
                    </p>
                    {test.passing_marks != null ? (
                      <p className="text-xs text-muted-foreground">
                        Pass mark {test.passing_marks}
                        {test.total_marks != null ? ` / ${test.total_marks}` : ""}
                        {best ? (best.score >= test.passing_marks ? " · Passed" : " · Not passed yet") : ""}
                      </p>
                    ) : null}
                  </div>
                  {active ? (
                    <div className="text-right">
                      <p className="font-mono text-lg font-semibold">{formatDuration(remaining)}</p>
                      <p className="text-xs text-muted-foreground">
                        Violations {tabSwitches + fullscreenExits}/{test.max_violations}
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => start(test, attempts.length)}
                      disabled={!remainingAttempts || !questions.length}
                    >
                      {remainingAttempts ? `Start attempt ${attempts.length + 1}` : "Attempt limit reached"}
                    </Button>
                  )}
                </div>

                {!active && test.instructions ? (
                  <p className="mt-3 whitespace-pre-wrap rounded-lg border border-border p-3 text-xs text-muted-foreground">
                    {test.instructions}
                  </p>
                ) : null}

                {active ? (
                  <div className="mt-4 space-y-3">
                    <p className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs">
                      Proctoring is on: leaving fullscreen or switching tabs is recorded. After{" "}
                      {test.max_violations} violations the attempt is submitted automatically.
                    </p>
                    {questions.map((question, index) => (
                      <div key={question.id} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-medium">
                          {index + 1}. {question.question}
                        </p>
                        <div className="mt-2 space-y-1">
                          {(question.options as string[]).map((option, optionIndex) => (
                            <button
                              key={optionIndex}
                              type="button"
                              onClick={() => setAnswers({ ...answers, [question.id]: optionIndex })}
                              className={`block w-full rounded-md border px-3 py-1.5 text-left text-sm ${
                                answers[question.id] === optionIndex
                                  ? "border-primary bg-primary/10"
                                  : "border-border"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => finish(false)}>Submit test</Button>
                      <span className="text-xs text-muted-foreground">
                        Answered {Object.keys(answers).length}/{questions.length}
                      </span>
                    </div>
                  </div>
                ) : null}

                {!active && attempts.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {attempts
                      .slice()
                      .sort((a, b) => a.attempt_number - b.attempt_number)
                      .map((row) => (
                        <li key={row.id}>
                          Attempt {row.attempt_number}: {row.score}/{row.total} ({pct(row.score, row.total)}%) ·{" "}
                          {formatDuration(row.time_taken_seconds)}
                          {row.auto_submitted ? " · auto-submitted" : ""}
                          {row.tab_switch_count + row.fullscreen_exit_count
                            ? ` · ${row.tab_switch_count + row.fullscreen_exit_count} violations`
                            : ""}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
