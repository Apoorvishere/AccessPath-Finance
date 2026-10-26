export const NORTHSTAR_START = "https://access-path-mu.vercel.app/demo-site";
export const GITHUB_START = "https://github.com/Apoorvishere/AccessPath";
export const WIKIPEDIA_START = "https://en.wikipedia.org/wiki/Web_accessibility";

export type ScanTarget = {
  startUrl: string;
  label: string;
  instruction: string;
  allowsPath: (path: string) => boolean;
};

const northstarPaths = new Set([
  "/demo-site", "/demo-site/", "/demo-site/support", "/demo-site/contact", "/demo-site/fixed/contact",
]);
const githubPath = /^\/Apoorvishere\/AccessPath(?:\/(?:tree|blob)\/main\/[A-Za-z0-9._/-]+)?\/?$/;
const wikipediaPaths = new Set([
  "/wiki/Web_accessibility",
  "/wiki/Web_Content_Accessibility_Guidelines",
]);

const targets: ScanTarget[] = [
  {
    startUrl: NORTHSTAR_START,
    label: "Northstar controlled demo",
    instruction: "Stay on access-path-mu.vercel.app under /demo-site.",
    allowsPath: path => northstarPaths.has(path),
  },
  {
    startUrl: GITHUB_START,
    label: "AccessPath public GitHub repository",
    instruction: "Stay within the public Apoorvishere/AccessPath repository on github.com. Only read repository pages and files.",
    allowsPath: path => githubPath.test(path),
  },
  {
    startUrl: WIKIPEDIA_START,
    label: "Wikipedia accessibility articles",
    instruction: "Stay on en.wikipedia.org and only visit the Web accessibility and Web Content Accessibility Guidelines articles. Use the 'Main article: Web Content Accessibility Guidelines' link on the starting page. After clicking, wait for the browser URL to become /wiki/Web_Content_Accessibility_Guidelines and confirm that page loaded. If the URL stays on /wiki/Web_accessibility, try that link once more. Record a new step only after its URL has changed. Read pages only; do not edit or follow external links.",
    allowsPath: path => wikipediaPaths.has(path),
  },
];

export function targetForStart(startUrl: string): ScanTarget | null {
  return targets.find(target => target.startUrl === startUrl) ?? null;
}

export function approvedPageUrl(value: unknown, target: ScanTarget): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const start = new URL(target.startUrl);
    if (url.protocol !== "https:" || url.origin !== start.origin || url.username || url.password || url.search || !target.allowsPath(url.pathname)) return null;
    url.hash = "";
    return url.toString();
  } catch { return null; }
}
