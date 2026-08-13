import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ProjectDetailView } from "@/components/project-detail";

export const Route = createFileRoute("/_authenticated/college/project/$submissionId")({
  component: CollegeProjectDetail,
});

function CollegeProjectDetail() {
  const { submissionId } = Route.useParams();
  return (
    <div>
      <PageHeader
        title="Project submission"
        description="Review this student's project submission."
        back="/college/students"
      />
      <ProjectDetailView submissionId={submissionId} canReview portal="college" />
    </div>
  );
}
