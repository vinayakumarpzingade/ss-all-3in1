// Parses a single pasted markdown block into structured week sections.
// Used by the Admin week editor on Publish and by the demo seeder.

export type SectionKind =
  | "objectives"
  | "cheat_sheet"
  | "mcq"
  | "coding"
  | "mini_project"
  | "assignment"
  | "resources"
  | "interview";

export type ParsedMcq = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export type ParsedCoding = {
  title: string;
  prompt: string;
  language: string;
  expected_output: string;
  difficulty: string;
};

export type ParsedWeek = {
  title: string;
  sections: {
    kind: SectionKind;
    title: string;
    body: string;
    items: string[];
    position: number;
  }[];
  mcqs: ParsedMcq[];
  coding: ParsedCoding[];
  project: { title: string; brief: string } | null;
  assignment: { title: string; brief: string } | null;
};

const HEADINGS: { kind: SectionKind; label: string; match: RegExp }[] = [
  { kind: "objectives", label: "Objectives", match: /^(objectives?|learning objectives?|goals?)$/i },
  { kind: "cheat_sheet", label: "Cheat Sheet", match: /^(cheat ?sheet|notes|theory|summary)$/i },
  { kind: "mcq", label: "MCQ Practice", match: /^(mcqs?|mcq practice|quiz|multiple choice.*)$/i },
  { kind: "coding", label: "Coding Practice", match: /^(coding|coding practice|coding problems?|programming practice)$/i },
  { kind: "mini_project", label: "Mini Project", match: /^(mini ?project|project)$/i },
  { kind: "assignment", label: "Assignment", match: /^(assignments?|task|homework)$/i },
  { kind: "resources", label: "Resources", match: /^(resources?|references?|links?|videos?|pdfs?)$/i },
  { kind: "interview", label: "Interview Questions", match: /^(interview questions?|interview prep|interview)$/i },
];

function cleanHeading(line: string) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*(.*)\*\*$/, "$1")
    .replace(/[:\-–]\s*$/, "")
    .trim();
}

function bulletText(line: string) {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
}

function isBullet(line: string) {
  return /^\s*(?:[-*•]|\d+[.)])\s+/.test(line);
}

export function parseWeek(raw: string, fallbackTitle = "Week"): ParsedWeek {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  let title = fallbackTitle;
  const titleLine = lines.find((l) => /^#{0,3}\s*week\s*\d+/i.test(l.trim()));
  if (titleLine) title = cleanHeading(titleLine);

  // Split into blocks by recognised headings
  const blocks: { kind: SectionKind; label: string; lines: string[] }[] = [];
  let current: { kind: SectionKind; label: string; lines: string[] } | null = null;

  for (const line of lines) {
    const candidate = cleanHeading(line);
    if (candidate && candidate.length < 60) {
      const heading = HEADINGS.find((h) => h.match.test(candidate));
      if (heading) {
        current = { kind: heading.kind, label: candidate || heading.label, lines: [] };
        blocks.push(current);
        continue;
      }
    }
    if (current) current.lines.push(line);
  }

  const sections: ParsedWeek["sections"] = [];
  const mcqs: ParsedMcq[] = [];
  const coding: ParsedCoding[] = [];
  let project: ParsedWeek["project"] = null;
  let assignment: ParsedWeek["assignment"] = null;

  blocks.forEach((block, index) => {
    const text = block.lines.join("\n").trim();
    const items = block.lines.filter(isBullet).map(bulletText).filter(Boolean);

    if (block.kind === "mcq") {
      mcqs.push(...parseMcqs(block.lines));
    }
    if (block.kind === "coding") {
      coding.push(...parseCoding(block.lines));
    }
    if (block.kind === "mini_project") {
      project = { title: items[0] || "Mini Project", brief: text };
    }
    if (block.kind === "assignment") {
      assignment = { title: items[0] || "Assignment", brief: text };
    }

    sections.push({
      kind: block.kind,
      title: block.label,
      body: text,
      items,
      position: index,
    });
  });

  return { title, sections, mcqs, coding, project, assignment };
}

function parseMcqs(lines: string[]): ParsedMcq[] {
  const out: ParsedMcq[] = [];
  let q: ParsedMcq | null = null;

  const push = () => {
    if (q && q.question && q.options.length >= 2) out.push(q);
    q = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const answer = line.match(/^(?:answer|ans|correct)\s*[:\-]\s*([a-dA-D0-9])/i);
    if (answer && q) {
      const token = (answer[1] ?? 'a').toLowerCase();
      q.correct_index = /[0-9]/.test(token)
        ? Math.max(0, parseInt(token, 10) - 1)
        : token.charCodeAt(0) - 97;
      continue;
    }

    const explanation = line.match(/^(?:explanation|why)\s*[:\-]\s*(.+)$/i);
    if (explanation && q) {
      q.explanation = explanation[1] ?? '';
      continue;
    }

    const option = line.match(/^\(?([a-dA-D])[).]\s+(.*)$/);
    if (option && q) {
      q.options.push((option[2] ?? '').trim());
      continue;
    }

    // new question
    push();
    q = {
      question: line.replace(/^(?:q\s*\d*\s*[.):]|\d+[.)])\s*/i, "").trim(),
      options: [],
      correct_index: 0,
      explanation: "",
    };
  }
  push();
  return out;
}

function parseCoding(lines: string[]): ParsedCoding[] {
  const out: ParsedCoding[] = [];
  let currentTitle = "";
  let buffer: string[] = [];
  let meta: Record<string, string> = {};

  const push = () => {
    if (!currentTitle) return;
    out.push({
      title: currentTitle,
      prompt: buffer.join("\n").trim(),
      language: (meta["language"] || "python").toLowerCase(),
      expected_output: meta["expected"] || meta["output"] || meta["expected output"] || "",
      difficulty: (meta["difficulty"] || "easy").toLowerCase(),
    });
    buffer = [];
    meta = {};
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (isBullet(rawLine)) {
      push();
      const body = bulletText(rawLine);
      const [head, ...rest] = body.split(/\s*[-–:]\s+/);
      currentTitle = (head ?? '').trim();
      if (rest.length) buffer.push(rest.join(": "));
      continue;
    }

    const kv = line.match(/^(language|expected output|expected|output|difficulty)\s*[:\-]\s*(.+)$/i);
    if (kv) {
      meta[(kv[1] ?? "").toLowerCase()] = (kv[2] ?? "").trim();
      continue;
    }
    if (!currentTitle) currentTitle = line;
    else buffer.push(line);
  }
  push();
  return out;
}

export const SECTION_LABELS: Record<SectionKind, string> = {
  objectives: "Objectives",
  cheat_sheet: "Cheat Sheet",
  mcq: "MCQ Practice",
  coding: "Coding Practice",
  mini_project: "Mini Project",
  assignment: "Assignment",
  resources: "Resources",
  interview: "Interview Questions",
};
