import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/college/analytics")({
  component: CollegeAnalytics,
});

function CollegeAnalytics() {
  const { data: session } = useSession();
  useRealtime(["students", "progress", "mock_attempts", "coding_submissions"], ["college-analytics"]);

  const { data } = useQuery({
    queryKey: ["college-analytics", session?.collegeId],
    enabled: !!session?.collegeId,
    queryFn: async () => {
      const { data: students } = await supabase
        .from("students")
        .select("*")
        .eq("college_id", session!.collegeId!);
      return (students ?? []).map((s) => ({
        name: s.name.split(" ")[0],
        learning: s.learning_progress,
        mock: s.mock_score,
        coding: Math.min(100, s.coding_score),
        readiness: s.placement_readiness,
      }));
    },
  });

  return (
    <div>
      <PageHeader title="Analytics" description="Learning, coding and mock performance per student." />
      <div className="panel p-5">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="learning" name="Learning" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="mock" name="Mock" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="coding" name="Coding" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="readiness" name="Readiness" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
