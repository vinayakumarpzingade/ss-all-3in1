export type AttemptRow = {
  id: string;
  test_id: string;
  student_id: string;
  college_id: string;
  score: number;
  total: number;
  attempt_number: number;
  created_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  tab_switch_count: number;
  fullscreen_exit_count: number;
};

export function pct(score: number, total: number) {
  return total > 0 ? Math.round((score * 100) / total) : 0;
}

export function avg(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** Best attempt per student for a test — best score wins, ties resolved by latest. */
export function bestAttempt<T extends { score: number; created_at: string }>(attempts: T[]): T | null {
  if (!attempts.length) return null;
  return attempts.reduce((best, current) => {
    if (current.score > best.score) return current;
    if (current.score === best.score && current.created_at > best.created_at) return current;
    return best;
  });
}

export function latestAttempt<T extends { created_at: string }>(attempts: T[]): T | null {
  if (!attempts.length) return null;
  return attempts.reduce((latest, current) => (current.created_at > latest.created_at ? current : latest));
}

/** Average of each student's BEST percentage per test (the platform-wide rule). */
export function bestScorePercent<T extends { test_id: string; score: number; total: number; created_at: string }>(
  attempts: T[],
) {
  const byTest = new Map<string, T[]>();
  for (const attempt of attempts) {
    const list = byTest.get(attempt.test_id) ?? [];
    list.push(attempt);
    byTest.set(attempt.test_id, list);
  }
  const bests: number[] = [];
  for (const list of byTest.values()) {
    const best = bestAttempt(list);
    if (best) bests.push(pct(best.score, best.total));
  }
  return avg(bests);
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export const RISK_THRESHOLD = 40;
