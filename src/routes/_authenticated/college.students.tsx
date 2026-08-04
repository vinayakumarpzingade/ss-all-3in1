import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createStudentAccount } from "@/lib/accounts.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRealtime, useSession } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/college/students")({
  component: CollegeStudents,
});

function CollegeStudents() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const createStudent = useServerFn(createStudentAccount);
  useRealtime(["students"], ["college-students"]);

  const [form, setForm] = useState({
    name: "",
    usn: "",
    email: "",
    password: "Student@123",
    semester: "1",
    department: "",
  });

  const { data: students } = useQuery({
    queryKey: ["college-students", session?.collegeId],
    enabled: !!session?.collegeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("college_id", session!.collegeId!)
        .order("name");
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () =>
      createStudent({
        data: {
          name: form.name,
          usn: form.usn,
          email: form.email,
          password: form.password,
          semester: Number(form.semester),
          department: form.department,
        },
      }),
    onSuccess: () => {
      toast.success("Student created — share the credentials");
      setForm({ name: "", usn: "", email: "", password: "Student@123", semester: "1", department: "" });
      queryClient.invalidateQueries({ queryKey: ["college-students"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <PageHeader title="Students" description="Only colleges can create student logins." />
      <div className="grid gap-4 lg:grid-cols-3">
        <form
          className="panel space-y-3 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <h2 className="text-lg font-semibold">Add student</h2>
          {[
            { id: "name", label: "Full name", key: "name" as const, type: "text" },
            { id: "usn", label: "USN", key: "usn" as const, type: "text" },
            { id: "email", label: "Email", key: "email" as const, type: "email" },
            { id: "department", label: "Department", key: "department" as const, type: "text" },
            { id: "semester", label: "Semester", key: "semester" as const, type: "number" },
            { id: "password", label: "Password", key: "password" as const, type: "text" },
          ].map((field) => (
            <div key={field.id} className="space-y-1">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                type={field.type}
                required
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              />
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create login"}
          </Button>
        </form>

        <div className="panel overflow-x-auto p-0 lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">USN</th>
                <th className="px-4 py-2">Sem</th>
                <th className="px-4 py-2">Learning</th>
                <th className="px-4 py-2">Mock</th>
                <th className="px-4 py-2">Coding</th>
                <th className="px-4 py-2">Readiness</th>
              </tr>
            </thead>
            <tbody>
              {(students ?? []).map((student) => (
                <tr key={student.id} className="border-t border-border">
                  <td className="px-4 py-2">{student.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{student.usn}</td>
                  <td className="px-4 py-2">{student.semester}</td>
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
    </div>
  );
}
