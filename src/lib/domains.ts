/** Domain taxonomy used by student personal projects. */
export const PROJECT_DOMAINS = [
  "Artificial Intelligence & Machine Learning",
  "Data Science & Analytics",
  "Web Development",
  "Mobile App Development",
  "Cloud & DevOps",
  "Cybersecurity",
  "Internet of Things (IoT)",
  "Blockchain & Web3",
  "AR / VR",
  "Robotics & Automation",
  "Embedded Systems",
  "Game Development",
  "FinTech",
  "HealthTech",
  "EdTech",
  "AgriTech",
  "E-commerce",
  "Social Impact",
  "Business & Management",
  "Finance & Accounting",
  "Marketing & Design",
  "Other",
] as const;

export type ProjectDomain = (typeof PROJECT_DOMAINS)[number];

export const PROJECT_TYPES = ["individual", "team"] as const;

export function domainLabel(row: {
  domain: string | null;
  custom_domain: string | null;
}) {
  if (row.domain && row.domain !== "Other") return row.domain;
  return row.custom_domain || row.domain || "Unclassified";
}
