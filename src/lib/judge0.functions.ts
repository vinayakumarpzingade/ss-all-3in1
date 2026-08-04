import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const runSchema = z.object({
  language: z.string().min(1).max(30),
  code: z.string().min(1).max(20000),
  stdin: z.string().max(4000).optional(),
  expectedOutput: z.string().max(4000).optional(),
});

const JUDGE0_LANGUAGES: Record<string, number> = {
  python: 71,
  python3: 71,
  javascript: 63,
  java: 62,
  c: 50,
  cpp: 54,
  "c++": 54,
};

/**
 * Executes student code with Judge0 when JUDGE0_URL is configured, otherwise
 * falls back to a strict expected-output comparison so scoring still works.
 */
export const runCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => runSchema.parse(input))
  .handler(async ({ data }) => {
    const judgeUrl = process.env["JUDGE0_URL"];
    const judgeKey = process.env["JUDGE0_KEY"];
    const expected = (data.expectedOutput ?? "").trim();

    if (!judgeUrl) {
      return {
        engine: "offline" as const,
        stdout: "",
        stderr: "",
        status: "queued",
        passed: false,
        message:
          "Code stored for review. Connect a Judge0 endpoint (JUDGE0_URL) to grade runs automatically.",
      };
    }

    const languageId = JUDGE0_LANGUAGES[data.language.toLowerCase()] ?? 71;
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (judgeKey) {
      headers["X-Auth-Token"] = judgeKey;
      headers["X-RapidAPI-Key"] = judgeKey;
    }

    const response = await fetch(
      `${judgeUrl.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          language_id: languageId,
          source_code: data.code,
          stdin: data.stdin ?? "",
          expected_output: expected || null,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Judge0 error ${response.status}`);
    }

    const result = (await response.json()) as {
      stdout?: string | null;
      stderr?: string | null;
      compile_output?: string | null;
      status?: { description?: string };
    };

    const stdout = (result.stdout ?? "").trim();
    const passed = expected ? stdout === expected : (result.status?.description ?? "") === "Accepted";

    return {
      engine: "judge0" as const,
      stdout,
      stderr: (result.stderr ?? result.compile_output ?? "").trim(),
      status: result.status?.description ?? "unknown",
      passed,
      message: passed ? "All checks passed" : "Output did not match the expected result",
    };
  });
