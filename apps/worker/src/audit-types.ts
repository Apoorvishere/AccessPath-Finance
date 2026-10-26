export type AuditViolation = {
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  affectedCount: number;
  selectors: string[];
};

export type AuditPage = {
  url: string;
  title: string;
  metadata?: {
    description: string | null;
    language: string | null;
    canonicalUrl: string | null;
    robots: string | null;
    headings: string[];
    approvedLinks: { url: string; label: string }[];
  };
  violations: AuditViolation[];
  needsReviewCount: number;
  passedRuleCount: number;
  screenshot: string | null;
};

export type AuditResult = {
  checkedAt: string;
  pages: AuditPage[];
  note: string;
};
