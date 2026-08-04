import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/student/mocks")({
  component: StudentMocks,
});

function StudentMocks() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  useRealtime(["mock_attempts", "mock_assignments"], ["student-mocks"]);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const { data } = useQuery({
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
        supabase.from("mock_tests").select("*").in("id", ids).eq("is_published", true),
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

  async function submit(testId: string) {
    if (!session?.studentId || !session.collegeId) return;
    const questions = (data?.questions ?? []).filter((q) => q.test_id === testId);
    const score = questions.filter((q) => answers[q.id] === q.correct_index).length;
    const { error } = await supabase.from("mock_attempts").insert({
      test_id: testId,
      student_id: session.studentId,
      college_id: session.collegeId,
      score,
      total: questions.length,
      answers,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Scored ${score}/${questions.length} — analytics updated`);
    setActiveTest(null);
    setAnswers({});
    queryClient.invalidateQueries();
  }

  return (
    <div>
      <PageHeader title="Mock tests" description="Assigned by StartSafe HQ to your college." />
      <div className="space-y-4">
        {(data?.tests ?? []).map((test) => {
          const questions = (data?.questions ?? []).filter((q) => q.test_id === test.id);
          const attempts = (data?.attempts ?? []).filter((a) => a.test_id === test.id);
          const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
          return (
            <div key={test.id} className="panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{test.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {questions.length} questions · {test.duration_minutes} min ·{" "}
                    {best !== null ? `best ${best}/${questions.length}` : "not attempted"}
                  </p>
                </div>
                <Button onClick={() => setActiveTest(activeTest === test.id ? null : test.id)}>
                  {activeTest === test.id ? "Close" : "Attempt"}
                </Button>
              </div>

              {activeTest === test.id ? (
                <div className="mt-4 space-y-3">
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
                  <Button onClick={() => submit(test.id)}>Submit test</Button>
                </div>
              ) : null}
            </div>
          );
        })}
        {!data?.tests.length ? (
          <p className="text-sm text-muted-foreground">No mock tests assigned yet.</p>
        ) : null}
      </div>
    </div>
  );
}
