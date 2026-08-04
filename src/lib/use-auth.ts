import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "college" | "student";

export type SessionBundle = {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  collegeId: string | null;
  collegeName: string | null;
  studentId: string | null;
} | null;

export const sessionQueryKey = ["startsafe-session"] as const;

export function useSession() {
  return useQuery<SessionBundle>({
    queryKey: sessionQueryKey,
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, college_id")
        .eq("id", user.id)
        .maybeSingle();

      let collegeName: string | null = null;
      if (profile?.college_id) {
        const { data: college } = await supabase
          .from("colleges")
          .select("name")
          .eq("id", profile.college_id)
          .maybeSingle();
        collegeName = college?.name ?? null;
      }

      let studentId: string | null = null;
      if (profile?.role === "student") {
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();
        studentId = student?.id ?? null;
      }

      return {
        userId: user.id,
        email: profile?.email ?? user.email ?? "",
        fullName: profile?.full_name ?? "",
        role: (profile?.role ?? "student") as AppRole,
        collegeId: profile?.college_id ?? null,
        collegeName,
        studentId,
      };
    },
  });
}

export function roleHome(role: AppRole | undefined) {
  if (role === "super_admin") return "/admin";
  if (role === "college") return "/college";
  return "/student";
}

/** Subscribe to postgres changes on the given tables and refresh cached queries. */
export function useRealtime(tables: string[], keyPrefixes: string[] = []) {
  const queryClient = useQueryClient();
  const tableKey = tables.join(",");
  const prefixKey = keyPrefixes.join(",");

  useEffect(() => {
    const channel = supabase.channel(`rt-${tableKey}-${Math.random().toString(36).slice(2)}`);
    for (const table of tableKey.split(",").filter(Boolean)) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        const prefixes = prefixKey.split(",").filter(Boolean);
        if (prefixes.length === 0) {
          queryClient.invalidateQueries();
          return;
        }
        for (const prefix of prefixes) {
          queryClient.invalidateQueries({ queryKey: [prefix] });
        }
      });
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableKey, prefixKey, queryClient]);
}
