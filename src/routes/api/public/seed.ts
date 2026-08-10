import { createFileRoute } from "@tanstack/react-router";
import { parseWeek } from "@/lib/week-parser";

const WEEK1 = `# Week 1 — Programming Basics

Objectives
- Understand what a program is and how it executes
- Declare and use variables and data types
- Apply arithmetic, relational and logical operators
- Write loops to repeat work safely

Cheat Sheet
A variable is a named box in memory. Choose the smallest type that fits the data.
Operators come in three families: arithmetic (+ - * / %), relational (> < >= <= == !=) and logical (and, or, not).
Loops repeat a block: use "for" when the count is known and "while" when it depends on a condition.
Always guard a while loop with a change to the condition variable, otherwise the loop never ends.

MCQ Practice
1. Which of the following is a valid Python variable name?
a) 2total
b) total_2
c) total-2
d) class
Answer: b
Explanation: Names may not start with a digit, contain hyphens, or reuse keywords.

2. What is the output of 7 % 3?
a) 2.33
b) 1
c) 2
d) 0
Answer: b
Explanation: The modulo operator returns the remainder, which is 1.

3. Which loop is best when the number of iterations is known?
a) while
b) for
c) do-while
d) recursion
Answer: b

4. What does the logical operator "and" return when the first operand is False?
a) True
b) False
c) Error
d) None
Answer: b

5. Which statement exits a loop immediately?
a) continue
b) pass
c) break
d) return
Answer: c

Coding Practice
- Sum of first N numbers - Read an integer N and print the sum of numbers from 1 to N.
  Language: python
  Expected output: 15
  Difficulty: easy
- Even or Odd - Read an integer and print EVEN or ODD.
  Language: python
  Expected output: EVEN
  Difficulty: easy
- Multiplication table - Print the multiplication table of 5 from 1 to 10, one per line.
  Language: python
  Difficulty: medium

Mini Project
- Student Marks Calculator
Build a small program that accepts marks for five subjects, computes total, percentage and grade, then prints a formatted report card. Handle invalid input gracefully.

Assignment
- Write 10 loop programs
Submit a single document containing 10 short loop programs with output screenshots.

Resources
- Python official tutorial: https://docs.python.org/3/tutorial/
- Loops crash course video: https://www.youtube.com/watch?v=6iF8Xb7Z3wQ
- Operators reference PDF: https://docs.python.org/3/library/operator.html

Interview Questions
- What is the difference between a compiler and an interpreter?
- Explain mutable vs immutable data types.
- What happens if a while loop condition never becomes false?
- How does integer division differ from float division?
`;

const WEEK2 = `# Week 2 — Functions and Data Structures

Objectives
- Write reusable functions with parameters and return values
- Choose between list, tuple, set and dictionary
- Understand time complexity basics
- Debug using print and assertions

Cheat Sheet
A function groups a task behind a name. Keep functions small: one job each.
Lists are ordered and mutable, tuples are ordered and immutable, sets store unique values, dictionaries map keys to values.
Lookups in a dictionary or set are on average constant time; scanning a list is linear.

MCQ Practice
1. Which data structure guarantees unique elements?
a) list
b) tuple
c) set
d) dict values
Answer: c

2. What does a function return when there is no return statement?
a) 0
b) empty string
c) None
d) Error
Answer: c

3. Average time complexity of a dictionary lookup is
a) O(n)
b) O(log n)
c) O(1)
d) O(n log n)
Answer: c

4. Which of these is immutable?
a) list
b) set
c) dict
d) tuple
Answer: d

Coding Practice
- Reverse a string - Write a function that returns the reverse of a given string.
  Language: python
  Difficulty: easy
- Count word frequency - Given a sentence, print each word and how many times it appears.
  Language: python
  Difficulty: medium

Mini Project
- Contact Book
Build a dictionary-backed contact book supporting add, search, update and delete with a simple menu loop.

Assignment
- Function refactor task
Take your Week 1 marks calculator and refactor it into at least four functions.

Resources
- Data structures guide: https://docs.python.org/3/tutorial/datastructures.html
- Big-O cheat sheet: https://www.bigocheatsheet.com/

Interview Questions
- When would you use a tuple instead of a list?
- What is the difference between arguments and parameters?
- Explain pass by object reference in Python.
`;

const ACC_WEEK1 = `# Week 1 — Accounting Fundamentals

Objectives
- Understand the accounting cycle
- Apply the double entry system
- Prepare journal entries and ledgers
- Read a trial balance

Cheat Sheet
Every transaction affects at least two accounts. Debit what comes in, credit what goes out.
Assets = Liabilities + Capital is the accounting equation that must always balance.
The trial balance verifies that total debits equal total credits before final accounts are prepared.

MCQ Practice
1. Assets = Liabilities + ?
a) Expenses
b) Capital
c) Revenue
d) Drawings
Answer: b

2. A purchase of machinery for cash is recorded as
a) Debit cash, credit machinery
b) Debit machinery, credit cash
c) Debit machinery, credit capital
d) Debit capital, credit cash
Answer: b

3. Which statement shows financial position on a given date?
a) Trading account
b) Profit and loss account
c) Balance sheet
d) Cash book
Answer: c

Coding Practice
- Ledger balance calculator - Build a spreadsheet formula set that totals debit and credit columns and flags mismatches.
  Language: text
  Difficulty: easy

Mini Project
- Small business books
Prepare one month of journal, ledger and trial balance for a fictional stationery shop with 15 transactions.

Assignment
- Journal entries worksheet
Record 20 given transactions as journal entries and submit the scanned worksheet.

Resources
- Accounting basics: https://www.investopedia.com/accounting-4689733
- Double entry explainer video: https://www.youtube.com/watch?v=IhYPfZ2fPMk

Interview Questions
- What is the difference between capital and revenue expenditure?
- Explain accrual vs cash basis accounting.
- Why can a trial balance tally and still contain errors?
`;

async function ensureUser(
  admin: any,
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (!error && data?.user) return data.user.id;

  // already exists — find it
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list?.users?.find((u: { email?: string }) => u.email === email);
  if (found) {
    await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true });
    return found.id;
  }
  throw new Error(`Could not provision ${email}: ${error?.message}`);
}

const STUDENTS: Record<string, { name: string; usn: string; sem: number; dept: string; slug: string }[]> = {
  PESCE: [
    { name: "Arjun Rao", usn: "4PS22CS001", sem: 5, dept: "Computer Science", slug: "arjun" },
    { name: "Bhavana S", usn: "4PS22CS014", sem: 5, dept: "Computer Science", slug: "bhavana" },
    { name: "Chetan Kumar", usn: "4PS22CS027", sem: 5, dept: "Information Science", slug: "chetan" },
    { name: "Deepa N", usn: "4PS22EC008", sem: 3, dept: "Electronics", slug: "deepa" },
    { name: "Harsha M", usn: "4PS22ME019", sem: 3, dept: "Mechanical", slug: "harsha" },
  ],
  SRUSHTI: [
    { name: "Aditya Gowda", usn: "SDC23BC002", sem: 3, dept: "B.Com", slug: "aditya" },
    { name: "Bindu Rani", usn: "SDC23BC011", sem: 3, dept: "B.Com", slug: "bindu" },
    { name: "Kavya H R", usn: "SDC23BB004", sem: 3, dept: "BBA", slug: "kavya" },
    { name: "Manoj Patil", usn: "SDC23BB017", sem: 5, dept: "BBA", slug: "manoj" },
    { name: "Nisha Kumari", usn: "SDC23BC022", sem: 5, dept: "B.Com", slug: "nisha" },
  ],
};

export const Route = createFileRoute("/api/public/seed")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");

        const { count } = await admin
          .from("learning_paths")
          .select("id", { count: "exact", head: true });
        if ((count ?? 0) > 0) {
          return Response.json({ ok: true, skipped: "already seeded" });
        }

        // Colleges
        const { data: colleges, error: cErr } = await admin
          .from("colleges")
          .upsert(
            [
              { name: "P.E.S. College of Engineering, Mandya", code: "PESCE", city: "Mandya" },
              { name: "Srushti Degree College", code: "SRUSHTI", city: "Bengaluru" },
            ],
            { onConflict: "code" },
          )
          .select();
        if (cErr) throw cErr;
        const byCode: Record<string, string> = Object.fromEntries(
          (colleges ?? []).map((c) => [c.code, c.id]),
        );
        const cid = (code: string): string => byCode[code] ?? "";


        // Admin user
        const adminId = await ensureUser(admin, "admin@startsafe.in", "Admin@123", "StartSafe Admin");
        await admin.from("profiles").upsert({
          id: adminId,
          email: "admin@startsafe.in",
          full_name: "StartSafe Admin",
          role: "super_admin",
          college_id: null,
        });
        await admin.from("user_roles").upsert({ user_id: adminId, role: "super_admin" });

        // College users
        const collegeAccounts = [
          {
            email: "pesce@startsafe.in",
            password: "PESCE@123",
            name: "P.E.S. College of Engineering",
            code: "PESCE",
          },
          {
            email: "srushti@startsafe.in",
            password: "Srushti@123",
            name: "Srushti Degree College",
            code: "SRUSHTI",
          },
        ];
        for (const account of collegeAccounts) {
          const uid = await ensureUser(admin, account.email, account.password, account.name);
          await admin.from("profiles").upsert({
            id: uid,
            email: account.email,
            full_name: account.name,
            role: "college",
            college_id: cid(account.code),
          });
          await admin.from("user_roles").upsert({ user_id: uid, role: "college" });
        }

        // Students
        for (const [code, roster] of Object.entries(STUDENTS)) {
          for (const student of roster) {
            const email = `${student.slug}.${code.toLowerCase()}@startsafe.in`;
            const uid = await ensureUser(admin, email, "Student@123", student.name);
            await admin.from("profiles").upsert({
              id: uid,
              email,
              full_name: student.name,
              role: "student",
              college_id: cid(code),
            });
            await admin.from("user_roles").upsert({ user_id: uid, role: "student" });
            await admin.from("students").upsert(
              {
                profile_id: uid,
                college_id: cid(code),
                name: student.name,
                usn: student.usn,
                email,
                semester: student.sem,
                department: student.dept,
              },
              { onConflict: "profile_id" },
            );
          }
        }

        // Learning paths + weeks
        const paths = [
          {
            title: "Programming Foundations",
            description: "Core programming, problem solving and placement basics.",
            course: "B.E.",
            department: "Computer Science",
            semester: 5,
            colleges: ["PESCE"],
            weeks: [WEEK1, WEEK2],
          },
          {
            title: "Financial Accounting",
            description: "Accounting cycle, double entry and final accounts.",
            course: "B.Com",
            department: "Commerce",
            semester: 3,
            colleges: ["SRUSHTI"],
            weeks: [ACC_WEEK1],
          },
        ];

        for (const path of paths) {
          const { data: created, error: pErr } = await admin
            .from("learning_paths")
            .insert({
              title: path.title,
              description: path.description,
              course: path.course,
              department: path.department,
              semester: path.semester,
            })
            .select()
            .single();
          if (pErr) throw pErr;

          for (const code of path.colleges) {
            await admin
              .from("college_paths")
              .insert({ college_id: cid(code), path_id: created.id });
          }

          let weekNumber = 0;
          for (const raw of path.weeks) {
            weekNumber += 1;
            const parsed = parseWeek(raw, `Week ${weekNumber}`);
            const { data: week, error: wErr } = await admin
              .from("weeks")
              .insert({
                path_id: created.id,
                week_number: weekNumber,
                title: parsed.title,
                raw_content: raw,
                is_published: true,
              })
              .select()
              .single();
            if (wErr) throw wErr;

            await admin.from("week_sections").insert(
              parsed.sections.map((section) => ({
                week_id: week.id,
                kind: section.kind,
                title: section.title,
                body: section.body,
                items: section.items,
                position: section.position,
              })),
            );
            if (parsed.mcqs.length) {
              await admin.from("mcqs").insert(
                parsed.mcqs.map((mcq, index) => ({
                  week_id: week.id,
                  question: mcq.question,
                  options: mcq.options,
                  correct_index: mcq.correct_index,
                  explanation: mcq.explanation,
                  position: index,
                })),
              );
            }
            if (parsed.coding.length) {
              await admin.from("coding_questions").insert(
                parsed.coding.map((problem, index) => ({
                  week_id: week.id,
                  path_id: created.id,
                  title: problem.title,
                  prompt: problem.prompt,
                  language: problem.language,
                  expected_output: problem.expected_output,
                  difficulty: problem.difficulty,
                  position: index,
                })),
              );
            }
            if (parsed.project) {
              await admin
                .from("projects")
                .insert({ week_id: week.id, title: parsed.project.title, brief: parsed.project.brief });
            }
            if (parsed.assignment) {
              await admin.from("assignments").insert({
                week_id: week.id,
                title: parsed.assignment.title,
                brief: parsed.assignment.brief,
              });
            }
          }
        }

        // Mock test
        const { data: test } = await admin
          .from("mock_tests")
          .insert({
            title: "Placement Aptitude Mock 1",
            description: "Quantitative, logical and verbal basics.",
            duration_minutes: 30,
          })
          .select()
          .single();
        if (test) {
          await admin.from("mock_questions").insert([
            {
              test_id: test.id,
              question: "If a train travels 180 km in 3 hours, what is its speed?",
              options: ["50 km/h", "60 km/h", "70 km/h", "90 km/h"],
              correct_index: 1,
              position: 0,
            },
            {
              test_id: test.id,
              question: "Find the next number: 2, 6, 12, 20, ?",
              options: ["28", "30", "32", "36"],
              correct_index: 1,
              position: 1,
            },
            {
              test_id: test.id,
              question: "Choose the synonym of 'diligent'.",
              options: ["Lazy", "Hardworking", "Rude", "Hasty"],
              correct_index: 1,
              position: 2,
            },
            {
              test_id: test.id,
              question: "20% of 250 is",
              options: ["40", "45", "50", "55"],
              correct_index: 2,
              position: 3,
            },
            {
              test_id: test.id,
              question: "Which is the odd one out?",
              options: ["Square", "Circle", "Triangle", "Cube"],
              correct_index: 3,
              position: 4,
            },
          ]);
          for (const code of ["PESCE", "SRUSHTI"]) {
            await admin
              .from("mock_assignments")
              .insert({ test_id: test.id, college_id: cid(code) });
          }
        }

        return Response.json({ ok: true, seeded: true });
      },
    },
  },
});
