import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Building2, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StartSafe — Campus Readiness Platform" },
      {
        name: "description",
        content:
          "One platform, three connected portals: Student Ecosystem, College Command Center and Central Intelligence. Learning paths, mock tests, coding practice, projects and certificates in real time.",
      },
      { property: "og:title", content: "StartSafe — Campus Readiness Platform" },
      {
        property: "og:description",
        content:
          "One platform, three connected portals: Student Ecosystem, College Command Center and Central Intelligence. Learning paths, mock tests, coding practice, projects and certificates in real time.",
      },
    ],
  }),
  component: Landing,
});

const DEMO = [
  { role: "Super Admin", email: "admin@startsafe.in", password: "Admin@123" },
  { role: "P.E.S. College of Engineering", email: "pesce@startsafe.in", password: "PESCE@123" },
  { role: "Srushti Degree College", email: "srushti@startsafe.in", password: "Srushti@123" },
  { role: "Student (PESCE)", email: "arjun.pesce@startsafe.in", password: "Student@123" },
  { role: "Student (Srushti)", email: "aditya.srushti@startsafe.in", password: "Student@123" },
];

const PORTALS = [
  {
    icon: GraduationCap,
    title: "Student Ecosystem",
    body: "Weekly learning paths with objectives, cheat sheets, MCQs, coding practice, projects, assignments and auto-unlocked certificates.",
  },
  {
    icon: Building2,
    title: "College Command Center",
    body: "Onboard students, track learning, coding and mock analytics, rank performers and download weekly readiness reports.",
  },
  {
    icon: ShieldCheck,
    title: "Central Intelligence",
    body: "Own every learning path, publish weeks with one paste, assign mock tests and watch platform-wide activity update live.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-ink text-ink-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">STARTSAFE</span>
        </div>
        <Button asChild>
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="bg-grad-hero text-ink-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <p className="stat-label !text-ink-foreground/70">Learn • Build • Innovate</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            The placement readiness engine for every campus.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-ink-foreground/80 sm:text-lg">
            Three connected portals on one live database. Admin publishes, colleges assign, students
            complete — every score, project and certificate syncs instantly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Open your portal</Link>
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-4 py-2 text-sm">
              <Activity className="size-4" /> Realtime sync enabled
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-16 md:grid-cols-3">
        {PORTALS.map((portal) => (
          <div key={portal.title} className="panel p-6">
            <portal.icon className="size-6 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">{portal.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{portal.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="text-xl font-semibold">Pilot demo accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Students never self-register — colleges issue their credentials.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Portal</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Password</th>
              </tr>
            </thead>
            <tbody>
              {DEMO.map((row) => (
                <tr key={row.email} className="border-t border-border bg-card">
                  <td className="px-4 py-2">{row.role}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.email}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
