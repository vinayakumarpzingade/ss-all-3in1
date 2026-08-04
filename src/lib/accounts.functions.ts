import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  usn: z.string().trim().min(2).max(40),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(72),
  semester: z.number().int().min(1).max(12),
  department: z.string().trim().min(1).max(80),
  collegeId: z.string().uuid().optional(),
});

/** Colleges and admins provision student logins. Students never self-register. */
export const createStudentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("role, college_id")
      .eq("id", context.userId)
      .maybeSingle();

    if (!profile || (profile.role !== "college" && profile.role !== "super_admin")) {
      throw new Error("Only colleges and admins can create student accounts");
    }

    const collegeId = profile.role === "college" ? profile.college_id : data.collegeId;
    if (!collegeId) throw new Error("A college must be selected");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (authError || !created?.user) {
      throw new Error(authError?.message ?? "Could not create the login");
    }

    const userId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: data.email,
      full_name: data.name,
      role: "student",
      college_id: collegeId,
    });
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "student" });

    const { error: studentError } = await supabaseAdmin.from("students").insert({
      profile_id: userId,
      college_id: collegeId,
      name: data.name,
      usn: data.usn,
      email: data.email,
      semester: data.semester,
      department: data.department,
    });
    if (studentError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(studentError.message);
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      college_id: collegeId,
      title: "Welcome to StartSafe",
      body: "Your learning path is ready. Start with Week 1.",
    });

    return { ok: true, userId };
  });

const collegeSchema = z.object({
  name: z.string().trim().min(3).max(160),
  code: z.string().trim().min(2).max(20),
  city: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(72),
});

/** Admin creates a college and its activated portal login in one step. */
export const createCollegeAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => collegeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: college, error: collegeError } = await supabaseAdmin
      .from("colleges")
      .insert({
        name: data.name,
        code: data.code.toUpperCase(),
        city: data.city ?? "",
        is_active: true,
      })
      .select()
      .single();
    if (collegeError) throw new Error(collegeError.message);

    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (authError || !created?.user) {
      await supabaseAdmin.from("colleges").delete().eq("id", college.id);
      throw new Error(authError?.message ?? "Could not create the college login");
    }

    await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      email: data.email,
      full_name: data.name,
      role: "college",
      college_id: college.id,
    });
    await supabaseAdmin.from("user_roles").upsert({ user_id: created.user.id, role: "college" });

    return { ok: true, collegeId: college.id };
  });
