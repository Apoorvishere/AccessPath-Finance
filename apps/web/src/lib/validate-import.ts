import type { AuditResult, AuditPage, AuditViolation } from "./audit-types";

const DEMO_ORIGIN = "https://access-path-mu.vercel.app";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, limit: number): string | null {
  return typeof value === "string" && value.length <= limit ? value : null;
}

function approvedPage(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.origin !== DEMO_ORIGIN || url.port || url.username || url.password ||
        !/^\/demo-site(?:\/|$)/.test(url.pathname)) return null;
    url.hash = "";
    return url.toString();
  } catch { return null; }
}

export function validateImportedAudit(value: unknown): AuditResult | null {
  if (!record(value) || typeof value.checkedAt !== "string" ||
      !Number.isFinite(Date.parse(value.checkedAt)) ||
      !Array.isArray(value.pages) || value.pages.length < 1 || value.pages.length > 3) return null;
  const note = text(value.note, 1000);
  if (note === null) return null;
  const pages: AuditPage[] = [];
  for (const rawPage of value.pages) {
    if (!record(rawPage)) return null;
    const url = approvedPage(rawPage.url);
    const title = text(rawPage.title, 250);
    if (!url || title === null || !Array.isArray(rawPage.violations) || rawPage.violations.length > 30 ||
        !Number.isInteger(rawPage.needsReviewCount) || (rawPage.needsReviewCount as number) < 0 || (rawPage.needsReviewCount as number) > 100 ||
        !Number.isInteger(rawPage.passedRuleCount) || (rawPage.passedRuleCount as number) < 0 || (rawPage.passedRuleCount as number) > 500) return null;
    const screenshot = rawPage.screenshot;
    if (screenshot !== null &&
        (typeof screenshot !== "string" || screenshot.length > 500_000 ||
         !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(screenshot))) return null;
    let metadata: AuditPage["metadata"];
    if (rawPage.metadata !== undefined) {
      if (!record(rawPage.metadata)) return null;
      const raw = rawPage.metadata;
      const description = raw.description === null ? null : text(raw.description, 300);
      const language = raw.language === null ? null : text(raw.language, 40);
      const canonicalUrl = raw.canonicalUrl === null ? null : approvedPage(raw.canonicalUrl);
      const robots = raw.robots === null ? null : text(raw.robots, 100);
      if (description === null && raw.description !== null || language === null && raw.language !== null ||
          canonicalUrl === null && raw.canonicalUrl !== null || robots === null && raw.robots !== null ||
          !Array.isArray(raw.headings) || raw.headings.length > 12 ||
          !raw.headings.every(item => typeof item === "string" && item.length <= 120) ||
          !Array.isArray(raw.approvedLinks) || raw.approvedLinks.length > 12) return null;
      const approvedLinks: { url: string; label: string }[] = [];
      for (const item of raw.approvedLinks) {
        if (!record(item) || typeof item.label !== "string" || item.label.length > 100) return null;
        const linkUrl = approvedPage(item.url);
        if (!linkUrl) return null;
        approvedLinks.push({ url: linkUrl, label: item.label });
      }
      metadata = { description, language, canonicalUrl, robots,
        headings: raw.headings as string[], approvedLinks };
    }
    const violations: AuditViolation[] = [];
    for (const rawFinding of rawPage.violations) {
      if (!record(rawFinding)) return null;
      const id = text(rawFinding.id, 80);
      const help = text(rawFinding.help, 180);
      const helpUrl = text(rawFinding.helpUrl, 500);
      const impact = rawFinding.impact === null ? null : text(rawFinding.impact, 30);
      if (id === null || help === null || helpUrl === null || impact === null && rawFinding.impact !== null ||
          !Number.isInteger(rawFinding.affectedCount) || (rawFinding.affectedCount as number) < 0 || (rawFinding.affectedCount as number) > 100 ||
          !Array.isArray(rawFinding.selectors) || rawFinding.selectors.length > 100 ||
          !rawFinding.selectors.every((selector: unknown) => typeof selector === "string" && selector.length <= 300)) return null;
      if (helpUrl && (!helpUrl.startsWith("https://") || !/^https:\/\/[^\s]+$/.test(helpUrl))) return null;
      violations.push({ id, help, helpUrl, impact, affectedCount: rawFinding.affectedCount as number, selectors: rawFinding.selectors as string[] });
    }
    pages.push({ url, title, violations, needsReviewCount: rawPage.needsReviewCount as number,
      passedRuleCount: rawPage.passedRuleCount as number, screenshot: screenshot as string | null,
      ...(metadata ? { metadata } : {}) });
  }
  if (new Set(pages.map(page => page.url)).size !== pages.length) return null;
  return { checkedAt: value.checkedAt, pages, note };
}
