import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/app-shell";
import { QueryState } from "@/components/states";
import { bestAttempt, bestScorePercent, formatDate, pct, RISK_THRESHOLD } from "@/lib/analytics";
import { useRealtime } from "@/lib/use-auth";

export function StudentProfileView({
  studentId,
  portal,
}: {
  studentId: string;
  portal: "admin" | "college";
}) {
  useRealtime(
    ["students", "progress", "mock_attempts", "coding_submissions", "project_submissions", "certificates"],
    ["student-profile"],
  );

  const query = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      if (!student) throw new Error("Student not found");

      const [college, links, progress, attempts, tests, coding, questions, projects, certificates] =
        await Promise.all([
          supabase.from("colleges").select("name, college_code, code").eq("id", student.college_id).maybeSingle(),
          supabase.from("college_paths").select("path_id").eq("college_id", student.college_id),
          supabase.from("progress").select("*").eq("student_id", studentId),
          supabase.from("mock_attempts").select("*").eq("student_id", studentId).order("created_at"),
          supabase.from("mock_tests").select("id, title"),
          supabase.from("coding_submissions").select("*").eq("student_id", studentId),
          supabase.from("coding_questions").select("id, title, week_id, points"),
          supabase
            .from("project_submissions")
            .select("*")
            .eq("student_id", studentId)
            .is("archived_at", null)
            .order("created_at", { ascending: false }),
          supabase.from("certificates").select("*").eq("student_id", studentId).is("archived_at", null),
        ]);

      const pathIds = (links.data ?? []).map((l) => l.path_id);
      const paths = pathIds.length
        ? await supabase
            .from("learning_paths")
            .select("id, title, course")
            .in("id", pathIds)
            .is("archived_at", null)
        : { data: [] as { id: string; title: string; course: string | null }[] };
      const weeks = pathIds.length
        ? await supabase
            .from("weeks")
            .select("id, title, week_number, path_id")
            .in("path_id", pathIds)
            .eq("is_published", true)
            .is("archived_at", null)
            .order("week_number")
        : { data: [] as { id: string; title: string; week_number: number; path_id: string }[] };

      const weekRows = weeks.data ?? [];
      const completedWeeks = new Set(
        (progress.data ?? []).filter((p) => p.completed).map((p) => p.week_id),
      );
      const currentWeek = weekRows.find((w) => !completedWeeks.has(w.id)) ?? weekRows[weekRows.length - 1] ?? null;

      const attemptRows = attempts.data ?? [];
      const codingRows = coding.data ?? [];
      const projectRows = projects.data ?? [];

      const scoredProjects = projectRows.filter((p) => p.score != null);
      const projectScore = scoredProjects.length
        ? Math.round(scoredProjects.reduce((s, p) => s + (p.score ?? 0), 0) / scoredProjects.length)
        : projectRows.some((p) => p.status === "approved")
          ? 100
          : projectRows.length
            ? 50
            : 0;

      const activity = [
        ...attemptRows.map((a) => ({
          at: a.created_at,
          text: `Mock attempt #${a.attempt_number} — ${a.score}/${a.total}`,
        })),
        ...codingRows.map((c) => ({
          at: c.created_at,
          text: `Coding submission (${c.language}) — ${c.passed ? "passed" : "failed"}`,
        })),
        ...projectRows.map((p) => ({ at: p.created_at, text: `Project submitted — ${p.name}` })),
        ...(progress.data ?? [])
          .filter((p) => p.completed)
          .map((p) => ({ at: p.completed_at, text: `Completed section: ${p.kind}` })),
        ...(certificates.data ?? []).map((c) => ({ at: c.issued_at, text: `Certificate issued — ${c.title}` })),
      ]
        .sort((a, b) => (a.at > b.at ? -1 : 1))
        .slice(0, 12);

      const strengths: string[] = [];
      const gaps: string[] = [];
      const push = (label: string, value: number) =>
        value >= 70 ? strengths.push(`${label} (${value}%)`) : value < RISK_THRESHOLD ? gaps.push(`${label} (${value}%)`) : undefined;
      push("Learning", student.learning_progress);
      push("Mock tests", student.mock_score);
      push("Coding", Math.min(100, student.coding_score));
      push("Projects", projectScore);

      return {
        student,
        college: college.data,
        paths: paths.data ?? [],
        weeks: weekRows,
        completedWeeks,
        currentWeek,
        attempts: attemptRows,
        tests: tests.data ?? [],
        coding: codingRows,
        codingQuestions: questions.data ?? [],
        projects: projectRows,
        certificates: certificates.data ?? [],
        projectScore,
        mockBest: bestScorePercent(attemptRows),
        activity,
        strengths,
        gaps,
      };
    },
  });

  const data = query.data;

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {data ? (
        <div className="space-y-6">
          <div className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">{data.student.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {data.student.usn} · {data.student.email}
                </p>
                <p className="mt-1 text-sm">
                  {data.college?.name ?? "—"}
                  {data.college?.college_code ? ` · ${data.college.college_code}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.student.course ?? "Course not set"} · {data.student.department} · Semester{" "}
                  {data.student.semester}
                  {data.student.section ? ` · Section ${data.student.section}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="stat-label">Placement readiness</p>
                <p className="font-display text-3xl font-bold">{data.student.placement_readiness}%</p>
                {data.student.archived_at ? (
                  <p className="text-xs text-destructive">Archived</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Learning completion" value={`${data.student.learning_progress}%`} />
            <StatCard label="Mock score (best)" value={`${data.mockBest}%`} hint={`${data.attempts.length} attempts`} />
            <StatCard label="Coding points" value={data.student.coding_score} />
            <StatCard label="Projects" value={data.projects.length} hint={`Score ${data.projectScore}%`} />
            <StatCard label="Certificates" value={data.certificates.length} />
            <StatCard
              label="Learning path"
              value={data.paths[0]?.title ?? "Not assigned"}
              {...(data.paths[0]?.course ? { hint: data.paths[0].course } : {})}
            />
            <StatCard
              label="Current week"
              value={data.currentWeek ? `Week ${data.currentWeek.week_number}` : "—"}
              {...(data.currentWeek?.title ? { hint: data.currentWeek.title } : {})}
            />
            <StatCard
              label="Weeks completed"
              value={`${data.completedWeeks.size}/${data.weeks.length}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <h3 className="font-semibold">Weekly progress</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.weeks.map((week) => (
                  <li key={week.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                    <span>
                      Week {week.week_number} · {week.title}
                    </span>
                    <span
                      className={
                        data.completedWeeks.has(week.id) ? "text-success" : "text-muted-foreground"
                      }
                    >
                      {data.completedWeeks.has(week.id) ? "Completed" : "Pending"}
                    </span>
                  </li>
                ))}
                {!data.weeks.length ? (
                  <li className="text-muted-foreground">No published weeks assigned.</li>
                ) : null}
              </ul>
            </div>

            <div className="panel p-5">
              <h3 className="font-semibold">Mock test performance</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.tests
                  .map((test) => ({
                    test,
                    rows: data.attempts.filter((a) => a.test_id === test.id),
                  }))
                  .filter((entry) => entry.rows.length)
                  .map(({ test, rows }) => {
                    const best = bestAttempt(rows);
                    return (
                      <li key={test.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                        <span>{test.title}</span>
                        <span>
                          best {best?.score}/{best?.total} ({pct(best?.score ?? 0, best?.total ?? 0)}%) ·{" "}
                          {rows.length} attempts
                        </span>
                      </li>
                    );
                  })}
                {!data.attempts.length ? (
                  <li className="text-muted-foreground">No mock tests attempted yet.</li>
                ) : null}
              </ul>
            </div>

            <div className="panel p-5">
              <h3 className="font-semibold">Projects</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.projects.map((project) => (
                  <li key={project.id} className="border-b border-border pb-2 last:border-0">
                    <Link
                      to={portal === "admin" ? "/admin/project/$submissionId" : "/college/project/$submissionId"}
                      params={{ submissionId: project.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {project.status} · {formatDate(project.created_at)}
                      {project.score != null ? ` · score ${project.score}` : ""}
                    </p>
                  </li>
                ))}
                {!data.projects.length ? (
                  <li className="text-muted-foreground">No project submissions yet.</li>
                ) : null}
              </ul>
            </div>

            <div className="panel p-5">
              <h3 className="font-semibold">Certificates</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.certificates.map((certificate) => (
                  <li key={certificate.id} className="border-b border-border pb-2 last:border-0">
                    <p className="font-medium">{certificate.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {certificate.serial} · {formatDate(certificate.issued_at)}
                    </p>
                  </li>
                ))}
                {!data.certificates.length ? (
                  <li className="text-muted-foreground">No certificates issued yet.</li>
                ) : null}
              </ul>
            </div>

            <div className="panel p-5">
              <h3 className="font-semibold">Top skills</h3>
              <ul className="mt-3 space-y-1 text-sm">
                {data.strengths.map((item) => (
                  <li key={item} className="text-success">
                    {item}
                  </li>
                ))}
                {!data.strengths.length ? (
                  <li className="text-muted-foreground">No strong areas yet.</li>
                ) : null}
              </ul>
              <h3 className="mt-4 font-semibold">Areas of improvement</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {data.gaps.map((item) => (
                  <li key={item} className="text-destructive">
                    {item}
                  </li>
                ))}
                {!data.gaps.length ? (
                  <li className="text-muted-foreground">Nothing critical right now.</li>
                ) : null}
              </ul>
            </div>

            <div className="panel p-5">
              <h3 className="font-semibold">Recent activity</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.activity.map((item, index) => (
                  <li key={index} className="border-b border-border pb-2 last:border-0">
                    <p>{item.text}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.at)}</p>
                  </li>
                ))}
                {!data.activity.length ? (
                  <li className="text-muted-foreground">No activity recorded yet.</li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </QueryState>
  );
}
