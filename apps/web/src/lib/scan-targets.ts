const existingTargets = [
  {
    label: "Northstar controlled demo",
    url: "https://access-path-mu.vercel.app/demo-site",
    exampleGoal: "Find the contact form through the support page.",
  },
  {
    label: "AccessPath on GitHub",
    url: "https://github.com/Apoorvishere/AccessPath",
    exampleGoal: "Find the local setup instructions in the README.",
  },
] as const;

const wikipediaTarget = {
  label: "Wikipedia accessibility articles",
  url: "https://en.wikipedia.org/wiki/Web_accessibility",
  exampleGoal: "Find the article explaining the Web Content Accessibility Guidelines (WCAG).",
} as const;

// Turn this on only after the database migration and worker are deployed.
export const SCAN_TARGETS: ReadonlyArray<(typeof existingTargets)[number] | typeof wikipediaTarget> =
  process.env.NEXT_PUBLIC_WIKIPEDIA_SCAN_ENABLED === "true"
    ? [...existingTargets, wikipediaTarget]
    : existingTargets;

export function approvedScanTarget(value: unknown): (typeof SCAN_TARGETS)[number] | null {
  return SCAN_TARGETS.find(target => target.url === value) ?? null;
}
