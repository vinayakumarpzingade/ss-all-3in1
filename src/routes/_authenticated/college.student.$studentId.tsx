import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StudentProfileView } from "@/components/student-profile";

export const Route = createFileRoute("/_authenticated/college/student/$studentId")({
  component: CollegeStudentProfile,
});

function CollegeStudentProfile() {
  const { studentId } = Route.useParams();
  return (
    <div>
      <PageHeader title="Student profile" description="Readiness, progress and submissions for this student." />
      <StudentProfileView studentId={studentId} portal="college" />
    </div>
  );
}
