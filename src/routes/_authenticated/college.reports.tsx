import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/college/reports")({
  component: CollegeReports,
});

function CollegeReports() {
  const { data: session } = useSession();

  const { data: students } = useQuery({
    queryKey: ["college-report", session?.collegeId],
    enabled: !!session?.collegeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("college_id", session!.collegeId!)
        .order("placement_readiness", { ascending: false });
      return data ?? [];
    },
  });

  function download() {
    const header = "Name,USN,Department,Semester,Learning %,Mock %,Coding Points,Readiness %";
    const rows = (students ?? []).map((s) =>
      [s.name, s.usn, s.department, s.semester, s.learning_progress, s.mock_score, s.coding_score, s.placement_readiness].join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `startsafe-weekly-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Weekly reports"
        description="Snapshot of every student's readiness, exportable as CSV."
        back="/college"
        actions={<Button onClick={download}>Download CSV</Button>}
      />
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">USN</th>
              <th className="px-4 py-2">Learning</th>
              <th className="px-4 py-2">Mock</th>
              <th className="px-4 py-2">Coding</th>
              <th className="px-4 py-2">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {(students ?? []).map((student, index) => (
              <tr key={student.id} className="border-t border-border">
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">{student.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{student.usn}</td>
                <td className="px-4 py-2">{student.learning_progress}%</td>
                <td className="px-4 py-2">{student.mock_score}%</td>
                <td className="px-4 py-2">{student.coding_score}</td>
                <td className="px-4 py-2 font-medium">{student.placement_readiness}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
