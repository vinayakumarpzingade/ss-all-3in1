import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ProjectDetailView } from "@/components/project-detail";

export const Route = createFileRoute("/_authenticated/admin/project/$submissionId")({
  component: AdminProjectDetail,
});

function AdminProjectDetail() {
  const { submissionId } = Route.useParams();
  return (
    <div>
      <PageHeader
        title="Project submission"
        description="Complete submission record with student context."
        back="/admin/submissions"
      />
      <ProjectDetailView submissionId={submissionId} canReview portal="admin" />
    </div>
  );
}
