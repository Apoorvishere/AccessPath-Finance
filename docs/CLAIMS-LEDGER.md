# AccessPath Claims Ledger

**Status:** Living evidence record

**Baseline:** 17 October 2026

**Reviewed against repository and team-reported outcomes:** 18 October 2026

**Project:** AccessPath, AZINHACK 2026

> The ledger controls how AccessPath is described in the README, technical docs, deck and demo. Code-backed behavior, observed reports and team-reported tests have different levels of proof. Do not turn a plan or a single controlled example into a general result.

## 1. How to use this ledger

1. Find the claim below before using it in a slide, video, README or answer to a judge. If it is missing, add a row with a proof source.
2. Use the wording permitted by its evidence level. A feature visible in code may be described as implemented, but a live performance or security outcome needs recorded test evidence.
3. Record the deployment or commit, date, target, method, result and safe-to-share artifact when promoting a claim.
4. Update the affected docs and the deck in the same pass. Retain contradicted claims here as **Retired** so they do not return later.
5. Store only sanitized evidence in Git. `docs/evidence/` is ignored by Git; its local files are not automatically public proof. Do not commit credentials, private account data, or screenshots of third-party sites without permission.

## 2. Evidence levels

| Level | Meaning | Permitted language |
| --- | --- | --- |
| **Observed** | A dated run or report is available, with a reproducible target and result. | State the exact measured result and its limits. |
| **Code-backed** | The checked-in implementation directly supports the behavior, but a live or adversarial test is not recorded here. | “The current implementation…”; avoid success or security guarantees. |
| **Team-reported** | Team members confirmed a result in this project conversation, but a public artifact or test record is not linked. | “The team tested/reported…”; attach proof before presenting it as independently verified. |
| **Planned** | Intended or documented but not shipped. | “Planned,” “next,” or “roadmap.” |
| **Unmeasured** | A numerical outcome lacks a method, sample and record. | Omit the number. |
| **Retired** | An earlier claim was contradicted or superseded. | Do not repeat it as current. |

An implementation can have more than one level: the queue is code-backed, while a completed scan is observed. An owner-isolation policy is code-backed, while the two-account check is team-reported. Evidence levels are not a security or WCAG certification.

## 3. Current evidence anchors

| Key | Record | Scope and caution |
| --- | --- | --- |
| E-01 | [Repository](https://github.com/Apoorvishere/AccessPath), [README](../README.md) and checked-in app/worker code. | Supports implementation claims; a current deploy may lag the latest commit. |
| E-02 | [Controlled audit validation](./demo-audit-validation.md) and [public demo report](https://access-path-mu.vercel.app/reports/demo). | Dated original/corrected Contact browser audit, separate from the live product queue. |
| E-03 | Team's completed Northstar live scan and saved report, described in the project conversation and [README](../README.md). | Home → Support → Contact; 3 pages; 1 `label` rule violation on `#demo-email`; 1 affected element; 3 page-level human-review checks. Record a safe report screenshot and timestamp before external submission. |
| E-04 | Team's completed GitHub scan and saved report, reported in the project conversation. | Supports a second approved target completing; no route or issue count is asserted without its report. |
| E-05 | Team-reported two-account privacy test. | Supports a limited manual isolation check; retain the test steps and date for judges. |
| E-06 | [Saved-scan migration](../supabase/migrations/202610180001_saved_scans.sql) and [live queue migration](../supabase/migrations/202610180002_live_scans.sql), plus later migrations. | Supports owner policy, idempotency index, active-scan uniqueness, paused queue and claim function in source. Verify applied production state separately. |
| E-07 | [Web API](../apps/web/src/app/api/scans/route.ts), [approved targets](../apps/web/src/lib/scan-targets.ts), [worker target policy](../apps/worker/src/targets.ts) and [worker](../apps/worker/src/index.ts). | Supports request, path, job and report behavior. |
| E-08 | [Dashboard](../apps/web/src/app/dashboard/page.tsx) and [saved report](../apps/web/src/app/reports/local/page.tsx). | Supports visible product states and sections. |

The URLs and code paths above should be checked against the final submission commit. Do not publish a private saved report URL that exposes an account or personal data.

## 4. Product and implementation claims

| ID | Current claim | Level | Evidence and boundary |
| --- | --- | --- | --- |
| C-01 | The web app and worker exist and have been deployed. | Code-backed + Team-reported | E-01; team confirmed Vercel ready and Railway active. Capture final deployment commit and status. |
| C-02 | `POST /api/scans` queues an approved goal and returns an ID with HTTP 202. | Code-backed | E-07. API checks session, origin, JSON, target, goal and idempotency key; it does no browser work in the request. |
| C-03 | TinyFish Agent found a Northstar route from a visitor goal. | Observed | E-03. Cite the actual saved route, not the landing-page animation. |
| C-04 | A separate TinyFish Browser session was used for Playwright/axe-core auditing. | Observed + Code-backed | E-02 and E-07. Session cleanup is implemented, but do not claim every failure closes cleanly without failure-path evidence. |
| C-05 | The worker audits at most **three** approved visited pages and may retain page screenshots. | Code-backed + Observed | E-07 bounds pages; E-03 recorded 3 checked pages. A screenshot can be omitted to fit the report cap. |
| C-06 | The current controlled Northstar result has **one** `label` rule violation affecting `#demo-email`. | Observed | E-02/E-03. The original “two known defects” claim is **Retired**. |
| C-07 | The corrected Contact field had no `label` violation in a separate recorded browser audit. | Observed | E-02. Do not describe this as a second live queue scan or a site-wide pass. |
| C-08 | An audit-stage failure is recorded as failed, without a partial audit report. | Code-backed | E-07. The original “partial page failures produce a partial report” claim is **Retired** for the current worker. |
| C-09 | The saved report displays the journey, checked pages, rule findings, page screenshots or placeholders, and human-review prompts. | Code-backed + Team-reported | E-08 and the team's opened live report. It does not guarantee severity sorting or a screenshot beside every element. |
| C-10 | The queue has a restricted claim function using row locking to avoid duplicate claims. | Code-backed | E-06. Concurrency/restart behavior has no recorded stress test; do not claim tested leases or auto-recovery. |

## 5. Multi-user, safety and operations claims

| ID | Current claim | Level | Evidence and boundary |
| --- | --- | --- | --- |
| C-11 | Saved scans have an owner-only read policy; the team checked two-account separation. | Code-backed + Team-reported | E-05/E-06. Obtain sanitized test steps and outcomes before calling the privacy test independently verified. |
| C-12 | Optional screenshot data lives in owner-scoped report JSON. | Code-backed | E-07/E-08. The original private Storage bucket and short-lived signed-link claim is **Retired**. No screenshot retention period is documented. |
| C-13 | Live scans accept two exact public HTTPS starts and constrain audited paths. | Code-backed | E-07. Do not claim a general-purpose DNS/IP/redirect checker for arbitrary URLs; the allowlist is the current boundary. |
| C-14 | One active scan per account and shared attempt limits are implemented. | Code-backed | E-06. Do not claim a per-domain cap, current per-account daily live cap, or automatic dollar-spend ceiling. Production limit values must be inspected before quoting them. |
| C-15 | The database has a per-user idempotency index and enqueue function returns an existing matching request. | Code-backed | E-06/E-07. Duplicate/concurrent HTTP behavior lacks a linked test record. |
| C-16 | Secrets are read from server/worker environment variables, while public Supabase values reach the browser. | Code-backed | E-01. A complete repository-history or deployed-bundle secret audit has not been recorded. Do not claim secrets have never leaked. |
| C-17 | The worker has diagnostic redaction for URLs and selected token patterns. | Code-backed | E-07. Not a guarantee that all page data or secrets are absent from every log. |
| C-18 | Hostile-content and prompt-injection fixtures were tested end to end. | Planned | No recorded fixture or test result found. The UI renders report strings as React text; that narrower source observation is code-backed. |
| C-19 | Alerts cover queue age, errors, browser sessions and spend. | Planned | No alert configuration evidence found. Manual Railway/Supabase/TinyFish monitoring was used during development. |
| C-20 | The web app, worker and database produced a completed live production report. | Team-reported + Observed report | E-03, Vercel URL and Railway status reported by the team. Capture final deployment IDs or dated screenshots before submission. |
| C-21 | A GitHub Actions workflow runs web lint/build and worker TypeScript checks on pushes and pull requests. | Implemented in source | `.github/workflows/checks.yml`; its hosted result remains unverified until the workflow runs on GitHub. It does not run the worker test script. |
| C-23 | Users can compare two saved reports on page URLs common to both and see rule/page findings as no longer detected, still detected, or newly detected. | Implemented in source | Dashboard selection plus `/reports/compare`; matching uses URL and axe rule ID. It is evidence comparison, not fix validation or WCAG conformance. |
| C-22 | The app has responsive styles and visible text states. | Code-backed | E-08. A full keyboard, screen-reader, contrast and zoom pass is not documented; do not claim WCAG conformance of AccessPath itself. |

## 6. Descriptive claims that must remain precise

| ID | Approved statement | Prohibited inference |
| --- | --- | --- |
| D-01 | TinyFish Agent is the AI navigation component; axe-core supplies automated rule results. | “We trained our own model” or “AI certified the page.” |
| D-02 | A tool-supported audit is a starting point for human evaluation. | “WCAG compliant,” “all barriers found,” or “zero findings means accessible.” |
| D-03 | The prototype supports signed-in accounts and owner-scoped reports. | “Scales to thousands” without load results. |
| D-04 | The current live preview starts only at Northstar or the public AccessPath GitHub repository. | “Works on any site” or “scans LinkedIn, Amazon or Reddit.” |
| D-05 | The worker audits at most three approved visited pages. | The retired five-page limit. |
| D-06 | Northstar is fictional and has an intentionally unlabeled email input. | Representing fixture results as prevalence in real sites. |
| D-07 | The public original/fixed Contact comparison is a separate recorded browser audit. | Saying both pages were tested by the same live queued scan. |

## 7. Metrics ledger

| Measure | Current status | Required method before a deck claim |
| --- | --- | --- |
| Northstar checked pages and findings | Observed for **one** cited run: 3 pages, 1 violated rule, 1 affected element, 3 page-level checks needing review. | Keep the saved report, date, target and deployment version with the numbers. Do not extrapolate. |
| Live scan duration | Unmeasured as a product statistic. | Record enqueue and final timestamps across a defined sample; include failed attempts and distribution. |
| TinyFish cost per scan | Unmeasured as a product statistic. | Match provider billing to several run IDs, including failures; show method and sample. |
| Scan success rate or reliability | Unmeasured. | Define eligible attempts and final outcomes across a dated sample. |
| Time saved in fixing issues | Unmeasured. | Compare task-based triage with a page-based baseline using participants and identical tasks. |
| Detection accuracy or false-negative rate | Unmeasured. | Use a human-reviewed reference set and define which issues automation could detect. |
| Throughput, concurrency, uptime and adoption | Unmeasured. | Run load/availability measurement and record environment, window and sample. |
| Market size, revenue or economic savings | Unmeasured. | Use a dated external source or pilot inputs and state assumptions; do not invent an estimate. |

One provider run shown in a dashboard can be cited as that run's cost or duration if its run ID and date are retained. It cannot establish a typical rate. The source ledger's blanket “all numbers unmeasured” wording is retired because the Northstar report contains legitimate narrow counts.

## 8. Open decisions and missing artifacts

| Item | Current state | Needed before final submission |
| --- | --- | --- |
| Team names, roles and profile URLs | Not supplied to this document. | Confirm exact spelling and links with each member. |
| Final deployed commit and dated service statuses | Team reported deployments. | Capture Vercel and Railway deployment IDs/commit plus current app link. |
| Sanitized Northstar and GitHub report proof | Team opened both reports. | Capture safe screenshots with run date and route; do not publish account data. |
| Two-account privacy test record | Team confirmed it passed. | Keep exact accounts' roles, list/read attempts and outcomes, without identities. |
| Product keyboard/screen-reader/zoom review | No written test record found. | Run and document before making interface accessibility claims. |
| Spend, latency and reliability figures | No defined sample. | Measure or leave figures out. |
| Screenshot retention and deletion policy | Not documented. | Decide before a broader user launch. |
| License and security contact | Verify in the final repository. | Add only if the team intends to publish them. |
| Hackathon submission rules and deadline | The original ledger contains dates not verified in this review. | Reopen the official team-saved Unstop listing immediately before submission. |

The repository URL, live app URL, exact environment-variable names, actual `label` rule ID and current approved targets are no longer unknown; they are linked in the project docs. The original unknowns table should not be copied forward unchanged.

## 9. Retired and excluded claims

- **Retired:** two planted defects, two confirmed live findings, a five-page worker limit, a separate `demo-site/` application, Supabase Storage evidence links, an automatic partial audit report, worker leases/retries, configured CI and alerting, and an implemented general public-URL scanner.
- **Excluded from this submission's current product:** target-site login, checkout, payments, form submission, private-network scanning, site-wide crawling, automatic remediation, an aggregate accessibility score and WCAG certification.
- **Separate project:** The older Resolve prototype is not AccessPath evidence and should not appear in this repository's product claims.

An excluded capability can appear in a roadmap only if labeled clearly as future work and accompanied by the safety and cost work it would require.

## 10. Release reconciliation

- [ ] Pin the exact Git commit deployed on Vercel and Railway; make the deck screenshots match it.
- [ ] Open the signed-in Northstar report and the public original/fixed report; note which evidence comes from which run.
- [x] Correct the [README](../README.md) passages to describe both approved live targets.
- [x] Update [demo-audit-validation.md](./demo-audit-validation.md) to distinguish its separate local browser audit from the implemented invite-only queue.
- [ ] Compare every quoted count, URL, rule, page limit and status in the deck and demo video with its dated source.
- [ ] Remove unsupported claims of two defects, five pages, private Storage, partial-report recovery, CI, alerting or arbitrary-site scans from all presentation material.
- [ ] Capture the team's two-account test steps and one final successful live-report screenshot with private details hidden.
- [ ] Keep cost, duration, scale, market and savings numbers out unless they have a method, sample and source.
- [ ] Check keyboard and mobile presentation of the app before claiming those qualities.
- [ ] Verify the actual submission format, size, deadline, judging criteria, links and QR codes against the official Unstop listing. Do not rely on dates copied from an earlier draft.
- [ ] Push the final corrected Markdown, then review the public GitHub rendering and links. Keep private local evidence out of Git.

This checklist identifies final work; an unchecked line is not a failure of the current demo, and a checked line needs an artifact or named reviewer.

## 11. Change record

| Date | Change | Basis |
| --- | --- | --- |
| 17 October 2026 | Planning baseline. | Original project direction. |
| 18 October 2026 | Reconciled with implemented web/worker/database code, controlled audit record, and team-reported live scans and privacy check. Retired claims that no longer match the prototype. | E-01 through E-08; final deployment and submission details remain to verify. |
| 21 October 2026 | Added saved-report comparison, safe scan-failure summaries, and a GitHub Actions lint/build/type-check workflow. | Source changes; deployment and hosted workflow result still require verification. |

## 12. References

[AccessPath Pitch](./ACCESSPATH-PITCH.md), [Architecture](./ARCHITECTURE.md), [TinyFish and audit pipeline](./TINYFISH-PIPELINE.md), [Data model and API](./DATA-AND-API.md), [Security](./SECURITY.md), [Frontend and design](./FRONTEND-AND-DESIGN.md), [Demo Guide](./DEMO-GUIDE.md), [Setup and deployment](./SETUP-AND-DEPLOYMENT.md), and the [repository README](../README.md).
