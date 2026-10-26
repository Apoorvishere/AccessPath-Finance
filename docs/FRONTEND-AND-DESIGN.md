# Frontend and design

**Status:** implementation-aligned design and interface review
**Checked against repository:** 18 October 2026
**Project:** AccessPath, AZINHACK 2026

> This document describes the current web interface and separates shipped behavior from accessibility goals that still need testing. Screenshots used for presentation must come from the running build. A concept drawing must be labeled as such.

## 1. Product interface

AccessPath turns a visitor task into a route, automated page findings, and a report a developer can inspect. The web app uses Next.js App Router, React, TypeScript and CSS Modules. Supabase authentication connects each account to its own saved scans. The private live worker performs the paid journey and browser audit; the browser UI submits and displays the result.

The report uses concrete evidence rather than an aggregate accessibility score. A rule violation is not proof that all other barriers are absent, and a completed scan is not WCAG certification.

## 2. Principles reflected in the build

| Principle | Current expression |
| --- | --- |
| Evidence first | The saved report groups journey steps, checked pages, violations, affected elements, screenshot captures and human-review prompts. |
| Bounded scope | The live form offers two approved sites and a free-text goal; it does not take arbitrary public URLs. |
| State in words | The dashboard lists queued/running/completed/failed states and shows a safe, plain-language summary for known failure stages. |
| Honest claims | The report distinguishes detected rules from page-level checks needing review and has no compliance score. |
| Owner context | Saved scans appear in the signed-in workspace; the report fetches the selected owner's record through the API. |
| Change review | A user can select two saved reports and compare axe rule findings on matching page URLs without starting another scan. |

The visual style is editorial: large headings, numbered sections, clear dividers and plain status text. Motion on the landing page supports the presentation but does not carry the scan result.

## 3. Implemented visual language

The original draft's ink/teal/paper palette and Instrument Sans font do **not** match the checked-in interface. Current styles use charcoal text, light blue and grey backgrounds, muted slate/lavender accents, and white report cards. Color values are set in page-level CSS Modules; the app does not have one central documented token system.

| Item | Current implementation |
| --- | --- |
| Body | Manrope from `next/font/google`, with Arial/sans-serif fallback. |
| Display headings | Space Grotesk from `next/font/google`. |
| Technical metadata | IBM Plex Mono from `next/font/google`, with monospace fallback. |
| Global default | `#bdd4e7` background and `#212227` text in `globals.css`. |
| Saved report | Light grey-blue `#e9eef2` canvas, white finding cards, dark text, colored status panels. |
| Focus | The report defines a visible 3 px `:focus-visible` outline for links, buttons and inputs. |
| Reduced motion | Global smooth scrolling is disabled on `prefers-reduced-motion`; several page modules shorten transitions. |

These are implementation observations, **not** a verified WCAG contrast audit. Test the actual foreground/background pairs, hover, focus and disabled states at their rendered sizes before publishing an accessibility claim about the app itself.

## 4. Current screens and routes

| Route | What it does |
| --- | --- |
| `/` | Public introduction, illustrated journey and links into the controlled demo and reports. |
| `/login` | Email/password sign-in and account creation using Supabase Auth. |
| `/dashboard` | Approved live-scan form when enabled, JSON import, owner-only saved scan library and status text. |
| `/journeys/new` | Private journey studio for the earlier controlled preview flow. |
| `/reports/demo` | Public dated Northstar before/after browser-audit report. |
| `/reports/local?scan=<id>` | Saved report view for a selected owner-scoped scan; it also supports local JSON preview/import. |
| `/demo-site`, `/demo-site/support`, `/demo-site/contact`, `/demo-site/fixed/contact` | Fictional controlled test pages, including the original and corrected contact field. |

There is no `/scans/new` page, `/scans/[id]` page, cursor-paginated scan dashboard, or standalone `components/` tree matching the original design specification. The dashboard itself contains the live form and list. `apps/web/src/lib/scan-targets.ts` defines the two approved starts: Northstar and the team's public GitHub repository.

## 5. Scan input and lifecycle

The dashboard exposes a labeled approved-site selector and a labeled visitor-goal input. The goal is required and constrained to 12-180 characters in the form. Submission calls `POST /api/scans` with an idempotency key. It returns a queued record rather than waiting for TinyFish to finish.

The list refreshes approximately every eight seconds while it contains a queued or running scan. The visible states are:

| Stored status | Dashboard presentation | Report link |
| --- | --- | --- |
| `queued` | WAITING | No report yet. |
| `running` | IN PROGRESS | No report yet. |
| `completed` | Completion status and Open report link. | Yes. |
| `partial` | Open report link if such a record exists. | Yes; current live worker does not create partial results. |
| `failed` / cancelled | Failure or cancellation label plus a bounded explanation for known worker failure codes. | No. |

Completed/partial saved reports can be selected in order as Before and After. `/reports/compare` loads both through the owner-scoped scan API, matches only pages present in both reports, and classifies rule/page pairs as no longer detected, still detected, or newly detected. If the task, target or page count differs, the report warns that the comparison is partial. It does not claim a fix is complete or WCAG conformance, and it does not start a scan.

The current UI does not show fine-grained stages such as “starting browser” or “auditing page 2,” a countdown, cancellation, a retry button, or a reset time for every quota error. Known failures explain what the user can check next; a saving failure warns the operator to check provider activity before retrying. The worker marks audit-stage failures as failed without saving a partial audit report. A pause switch stops new claims; it is an operator control, not an in-page button.

The dashboard also imports an AccessPath audit JSON file of less than 800 KB. That path saves prior evidence and does not run TinyFish or consume new API credits. Keep it distinct from a newly queued live scan in demonstrations.

## 6. Saved report structure

The report currently presents the following sections in reading order:

1. **Source and context:** report source, checked time and a statement that the preview does not launch another scan.
2. **Discovered journey:** shown when journey data is present, with ordered steps, titles, actions and observations.
3. **Overview:** pages checked, rules with violations, affected elements and page-level checks needing human review.
4. **Checked route:** ordered audited pages, each with a text count of detected violation rules.
5. **Findings:** rule details, affected element information, impact and remediation help. The report does not promise a severity-sorted list.
6. **Page evidence:** captured viewport screenshots or an explicit “No screenshot in this export” placeholder.
7. **Human review:** keyboard, screen-reader, focus-order and task-completion work still needed.

The report has a Print / save PDF browser action and print CSS. The current evidence format can embed JPEG data URLs in owner-scoped report JSON. There are no expiring signed Storage links to refresh. Screenshots are page captures rather than a guaranteed crop around each affected element; some may be omitted to fit report-size limits. Text findings remain available when a screenshot is absent.

The public `/reports/demo` is a separate dated Northstar comparison and must not be described as another page of the same live queue transaction.

## 7. Interface states and limitations

| State | Current behavior | Improvement to evaluate |
| --- | --- | --- |
| Supabase not configured | Login and dashboard show a setup notice; authentication controls are disabled. | Make deployment diagnostics clearer to operators. |
| Loading list | “Loading your reports…” appears in text. | Verify announcements with a screen reader. |
| No saved scans | The library shows an empty-state message. | Point the user to either import or a live scan, depending on enabled features. |
| Request error | The dashboard shows an error message. | Preserve context and offer a clear retry action. |
| Failed scan | The list explains known failure stages with a bounded next step; unknown reasons stay generic. | A guided operator retry path remains future work. |
| Missing screenshot | The report displays a text placeholder. | Explain why an image is absent, where known. |
| Narrow screen | CSS Modules include phone/tablet breakpoints for dashboard and report; report captures collapse to one column. | Verify high zoom, reflow and horizontal overflow manually. |

The saved scan list has no cursor pagination in the current UI. The present app should be described as a bounded preview, not a mature operations dashboard.

## 8. Untrusted content in the UI

Page titles, URLs, selectors, finding text, and agent observations originate outside AccessPath. Render them as React text, not inserted HTML. The checked-in report uses ordinary JSX text nodes for these values. Its page links open in a new tab with `rel="noopener noreferrer"`; they are still links to external content, so the user should recognize the destination.

The browser validates imported report structure and JPEG data URLs before display. Server validation and target allowlists protect the saved/live paths; see [Security](./SECURITY.md). No separate prompt-injection or XSS demo fixture was verified in the current code. Do not claim those tests have passed without a recorded test result.

## 9. Accessibility of AccessPath itself

Because the product evaluates accessibility, its own UI needs independent review. Existing strengths include native form controls, visible labels on the login and dashboard fields, textual states, report image alt text, focus styling in the report, responsive CSS, and reduced-motion handling. These code observations do not establish that every screen passes WCAG.

Complete and record a release check covering:

- Keyboard-only navigation through login, site selection, scan submission, library and report controls; check visible focus and logical order.
- Screen-reader reading order and announcements for queue updates, request errors, form validation and saved-report changes.
- Contrast for all rendered text and controls, including muted metadata, hover, focus and disabled states.
- Reflow at narrow widths and 200% zoom; check long URLs, tables, screenshots and print output.
- axe-core checks of the product's own pages, followed by manual keyboard and assistive-technology tests.
- Honest screenshot alternatives: the existing `Captured viewport of <URL>` alt text identifies the page but does not describe visual evidence within the screenshot. Keep the written finding usable without the image.

No repository-wide Vitest suite, Playwright end-to-end UI suite, formal contrast report, or documented screen-reader pass was found during this review. Do not mark those as completed.

## 10. Content and presentation use

Use direct language: “detected rule violation,” “needs human review,” and “scan failed.” Avoid “accessibility score,” “WCAG compliant,” or “all issues found.” Explain that the live report and the public corrected-page comparison are different runs.

For slides and the demo video, capture current running screens: approved-site selector, queued/running list state, the Northstar report's route and `label` finding, and the corrected contact field. Do not use the landing-page route animation as proof of a specific scan. Label any concept mockup “Concept UI.” Sanitize account details and provider information before sharing.

## 11. Implementation status

| Area | Status on 18 October 2026 | Evidence or remaining work |
| --- | --- | --- |
| Landing, login and dashboard | Implemented and used by team | Real app pages and a successful signed-in scan. |
| Two approved targets and flexible goal | Implemented | Target selector and worker allowlist. |
| Owner-scoped saved report | Implemented and team-tested | Saved Northstar report and reported two-account isolation check. |
| Report route, rule, element, screenshot and manual-review sections | Implemented | `reports/local/page.tsx` and successful Northstar report. |
| Public corrected-page comparison | Verified as a separate recorded audit | `docs/demo-audit-validation.md` and `/reports/demo`. |
| Fine-grained scan progress, cancel/retry UI, cursor pagination | Not implemented | Current dashboard only polls high-level statuses. |
| Formal product accessibility pass | Not documented | Run and record keyboard, screen-reader, zoom and contrast tests. |
| Automated UI/end-to-end tests | Not found in repository | Add only if needed for release confidence; do not cite them as existing. |

## 12. References

[Architecture](./ARCHITECTURE.md), [Data model and API](./DATA-AND-API.md), [Security](./SECURITY.md), [Demo Guide](./DEMO-GUIDE.md), [Setup and deployment](./SETUP-AND-DEPLOYMENT.md), [Verified controlled audit](./demo-audit-validation.md), and the [Repository README](../README.md).
