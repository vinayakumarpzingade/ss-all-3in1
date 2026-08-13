import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StudentProfileView } from "@/components/student-profile";

export const Route = createFileRoute("/_authenticated/admin/student/$studentId")({
  component: AdminStudentProfile,
});

function AdminStudentProfile() {
  const { studentId } = Route.useParams();
  return (
    <div>
      <PageHeader
        title="Student intelligence"
        description="Full readiness profile across every module."
        back="/admin/students"
      />
      <StudentProfileView studentId={studentId} portal="admin" />
    </div>
  );
}
