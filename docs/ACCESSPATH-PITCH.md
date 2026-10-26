# AccessPath Pitch

**Status:** Project narrative

**Checked against repository and team-reported runs:** 18 October 2026

**Project:** AccessPath, AZINHACK 2026

> Use this document to prepare a deck and demo; it is not the deck. Distinguish a recorded result, an implemented feature, and a hypothesis. Any new numeric claim needs a dated source or measurement beside it.

## 1. The one-paragraph pitch

AccessPath begins with a visitor's goal, such as “find the contact form through the support page.” A TinyFish agent follows that goal across an approved live site. A separate browser session checks the visited pages with axe-core, and AccessPath saves the route, rule-based findings, affected elements, page screenshots when available, and checks that still need a person. The prototype has completed a three-page Northstar demo journey and saved an owner-only report. It helps teams find a concrete place to start accessibility work; it does not certify that a site is accessible.

## 2. Problem and opportunity

People complete tasks across pages. A team that checks only the landing page can miss a barrier at the destination form or lose the context of how a visitor reached it. Existing page-based tools remain useful, but a team still has to choose and connect the pages that matter to a task.

AccessPath's question is: **for this visitor goal, what route did the agent actually take, and what automated barriers appeared on its approved pages?** The route gives findings a task context. The report gives a developer the rule, page and affected element to investigate. It does not answer whether a person using assistive technology can complete the whole task; that requires human evaluation. [W3C WAI explains that no tool alone can determine conformance](https://www.w3.org/WAI/test-evaluate/).

The commercial opportunity is a hypothesis: teams that already perform page audits may value a task-oriented evidence layer to decide which fixes to investigate first. This prototype has not measured willingness to pay, market size, time savings or downstream business outcomes.

## 3. What the product does today

1. A signed-in user chooses one of two approved starts: the fictional Northstar demo or the team's public GitHub repository, and writes a visitor goal of 12-180 characters.
2. The web API checks the request and queues a scan in Supabase. The UI returns to the scan list while a private Railway worker claims the job.
3. TinyFish Agent navigates toward the goal and returns a structured journey. AccessPath validates returned URLs against the chosen target's allowed paths.
4. A separate TinyFish Browser session, controlled through Playwright, audits up to **three** approved visited pages with axe-core and captures viewport screenshots when feasible.
5. The worker saves a completed report or a failed outcome. The signed-in owner opens their saved report from the dashboard.

The report shows route steps, page-level rule counts, rule details, affected elements, screenshots or missing-image placeholders, and human-review prompts. Screenshots are optional data in owner-scoped report JSON, not files in a Supabase Storage bucket. The present worker does not create a partial audit report after an audit-stage failure, retry it automatically, or provide a user cancel button.

## 4. What has been demonstrated

| Evidence | What it supports | Important boundary |
| --- | --- | --- |
| Saved Northstar live report | Home → Support → Contact; 3 checked pages; 1 violated rule; 1 affected element; 3 page-level checks needing human review. The `label` finding points to `#demo-email`. | The site is a fictional controlled fixture with an intentional barrier. |
| Public [verified demo audit](https://access-path-mu.vercel.app/reports/demo) | A separate dated browser audit recorded a `label` violation on the original Contact field and no `label` violation on its corrected version. | It was not a second live queue run through the full product flow. |
| Team-reported GitHub saved report | The second approved target has produced a completed report. | No fixed route or violation count is claimed here. |
| Team-reported two-account privacy check | Saved reports were checked for owner isolation. | This is not a scale or security certification. |

The Home-page findings mentioned in the earlier local audit note came from a stale deployment capture and are excluded from the public comparison. Do not add them to the current live report's one violated rule.

## 5. Who it is for

| Candidate user | Task they could bring | Value to validate |
| --- | --- | --- |
| Frontend developer or QA engineer | Trace a support or contact journey before release. | Faster path from a task to the affected page and element. |
| Small web agency | Review a client's approved public journey and hand back a specific fix target. | More useful client handoff than a disconnected page checklist. |
| University or public-service web team | Investigate a high-value public information route. | Task context for deciding which accessibility fixes to review first. |
| Product owner | Understand the user task affected by a rule-based finding. | Clearer discussion with engineering and accessibility specialists. |

These are proposed customer segments, not validated customers. Initial fit is an authorized team reviewing a small set of public pages. The current build is an invite-only, exact-target preview, not an open site-scanning service.

## 6. Position among existing tools

AccessPath complements established testing tools rather than replacing them. [WAVE](https://wave.webaim.org/) evaluates a supplied page and facilitates human review. The free [axe DevTools extension](https://www.deque.com/axe/devtools/extension/) supports automated page testing, while Deque's broader paid tools offer guided tests, workflow integration and reporting. AccessPath uses the open-source [axe-core](https://github.com/dequelabs/axe-core) engine for its own rule results.

| Approach | Strength | AccessPath's current distinction | Limit of our prototype |
| --- | --- | --- | --- |
| Manual expert evaluation | Can judge real task completion, context and assistive-technology behavior. | Provides automated route evidence before or alongside expert review. | Cannot replace the expert. |
| Page-based automated tools | Fast, mature rule checks on a selected page. | Starts from a visitor goal and records the visited route. | Only two approved starts and up to three audited pages. |
| Broader accessibility platforms | More mature workflows, reporting and enterprise controls. | Small task-focused demonstration with visible route context. | No comparable coverage, integrations, collaboration or scale claim. |

No head-to-head benchmark has been run. Do not say AccessPath finds more issues, is more accurate, is cheaper, or is the only journey-based product.

## 7. TinyFish, axe-core, and human roles

TinyFish Agent interprets the goal and navigates. TinyFish Browser provides an isolated browser session for page inspection. AccessPath validates the route and controls a Playwright audit of the selected pages. axe-core supplies the rule-based violations. Humans verify findings in context and test keyboard use, assistive technology, focus order and task completion.

The team did not train an AI model. AI does **not** decide whether a page is WCAG conformant, and the same page is not guaranteed to yield identical output across different page states or deployments. Deque describes [axe-core as an automated accessibility testing engine](https://github.com/dequelabs/axe-core); W3C WAI requires knowledgeable human evaluation for accessibility conclusions.

The split between agent navigation and controlled audit matters: the agent finds a plausible route; the worker decides which returned pages are eligible for testing. An out-of-scope URL is rejected rather than silently treated as approved.

## 8. Feasibility and technical shape

The delivered stack is Next.js 16 and React for the web app, Supabase Auth and Postgres with row-level access control for accounts and reports, a Node/TypeScript worker on Railway, TinyFish Agent and Browser APIs, Playwright and axe-core. Vercel hosts the web app. The queue is database-backed and can be paused by an operator. One active scan per account and shared attempt limits constrain paid preview usage.

The boundaries make the first version feasible: two exact public starts, constrained visited paths, at most three audited pages, no target login, no form submissions and no arbitrary private-network URL. The team has built and run the core flow. Throughput, concurrency under load, uptime and cost per scan remain unmeasured as product-wide figures. The operational limits are not a guaranteed dollar cap.

## 9. Impact hypothesis and measurement plan

**Hypothesis:** A task-oriented report helps a team choose and verify an accessibility fix more efficiently than reviewing page findings without journey context.

The controlled fixture proves a narrower technical point: the system can connect an observed Home → Support → Contact route to one real axe-core `label` finding on the Contact input, and a separate recorded audit shows that rule absent on the corrected field. It does not prove user outcome, productivity gain or economic benefit.

| Measure for a pilot | How to collect it | Decision it informs |
| --- | --- | --- |
| Task completion in human testing | Observe participants using keyboard and assistive technology on the original and corrected route; record method and sample size. | Whether the change improves the actual experience. |
| Triage time | Give reviewers the same task and compare time to locate and explain the actionable barrier with a conventional page report versus AccessPath. | Whether route context saves investigation time. |
| Finding validity | Have a reviewer confirm each reported rule in context and record false or unresolved cases. | Whether the evidence is trustworthy enough for a handoff. |
| Scan success, duration and provider cost | Log attempt status, checked pages, elapsed time and TinyFish billed amount across a defined sample. | Budget, reliability and pricing assumptions. |
| Repeatability after a fix | Run comparable audits on the same approved path and document code/deployment changes between them. | Whether the reported finding actually disappears after remediation. |

Report medians or distributions, sample size, dates and inclusion criteria before quoting a figure. A business case can later estimate *hours saved × loaded review cost* plus avoided rework, but those inputs must come from a pilot. Do not convert the single Northstar finding into an annual savings or market-size claim.

## 10. Limits and risks to state plainly

- Automated rules cover a subset of accessibility problems. A “zero detected violations” page is not a pass certificate.
- Agent navigation can vary with wording and site changes. The audit browser has a separate session, so stateful or authenticated paths may not replay.
- The preview uses exact approved sites; LinkedIn, Amazon, Reddit and arbitrary domains are not enabled.
- Public GitHub content can change independently; a demo on it is not a fixed benchmark.
- A failed live audit produces a failed scan without a partial report. Browser startup, cloud provider behavior and target CSP can affect success.
- Screenshots may be omitted to keep a report under the database size cap. The textual finding still needs to be understandable.
- The current repository does not establish broad load capacity, formal WCAG conformance of the product UI, an automatic retry system, or secure private file storage for screenshots.

## 11. Roadmap tied to evidence

| Horizon | Work | Proof before claiming completion |
| --- | --- | --- |
| Before submission | Keep Northstar and GitHub reports reproducible; capture sanitized screenshots; rehearse the two-minute demonstration; verify repository links and current deployment. | Dated saved reports, commit SHA and working links. |
| Hackathon iteration | Improve failed-scan recovery, safe user-facing diagnostics, report clarity on mobile, product keyboard/screen-reader checks and cost visibility. | Tests and recorded walkthroughs on the shipped build. |
| Later pilot | Add more authorized target policies, repeatable before/after runs, issue ownership and measured team workflows. | Consented pilot, observed task outcomes and cost/reliability data. |

Private evidence storage, broader site coverage and stronger operation controls are future work. The roadmap is a sequence of tests and implementation tasks, not a promise that they exist today.

## 12. Two-minute demonstration

1. Open the [Northstar controlled site](https://access-path-mu.vercel.app/demo-site) and follow Home → Support → Contact. Show the unlabeled email field.
2. On the signed-in dashboard, show the approved-site selector and visitor goal. Use a prior saved live report if a paid run would take too long. Say when evidence was captured earlier.
3. In that report, show the observed route, three checked pages, the `label` rule, `#demo-email`, screenshot if present, and human-review list.
4. Open the [corrected contact page](https://access-path-mu.vercel.app/demo-site/fixed/contact) and the separate [public comparison report](https://access-path-mu.vercel.app/reports/demo). Explain that this recorded browser audit shows the `label` rule absent on the corrected field.
5. Close on the private report library and the [GitHub repository](https://github.com/Apoorvishere/AccessPath). Summarize the scope: an approved-site prototype with real evidence, not an arbitrary-site scanner or certificate.

See the [Demo Guide](./DEMO-GUIDE.md) for the timed script and failure fallback. The Northstar site and planted barrier are synthetic; the reported browser output is real.

## 13. Questions and concise answers

**Why TinyFish?** Its agent follows a natural-language task through the live site, and its browser API hosts the separate audit session. Both are integral to the working route-to-report flow.

**Is this another axe wrapper?** axe-core supplies the rules. AccessPath adds goal-led route discovery, approved-page validation, queueing, owner-only storage and a report that connects findings to the task path.

**Can it tell us whether users can complete the task?** No. The agent's route and rule checks are evidence to guide human task testing, not a substitute for it.

**What has the team proved?** A completed Northstar three-page live report, a separate original/fixed-field browser comparison, a team-reported GitHub scan and two-account isolation test. Broader customer and impact claims still need a pilot.

**How much does it cost?** TinyFish usage consumes credits. One observed run is not enough to establish a reliable per-scan price; record several real attempts, including failures, before quoting cost.

**Why not allow every URL?** The current preview uses exact policies so paid scans stay within known public routes. General coverage needs additional safety, reliability and budget work.

## 14. Claims checklist for the deck

| Supported phrasing | Avoid |
| --- | --- |
| “Three-page live Northstar report with one `label` rule violation.” | “Two live defects found and fixed.” |
| “The corrected field had no `label` violation in a separate recorded audit.” | “The live worker rescanned the whole fixed site.” |
| “Two approved public starts today.” | “Scan any website.” |
| “Rule-based findings plus human review.” | “WCAG certified” or “finds every issue.” |
| “Built for owner-scoped preview use; scale still unmeasured.” | “Production-ready for thousands of users.” |
| “We integrate TinyFish's agent.” | “We trained our own AI model.” |

For each slide, attach the relevant real screenshot, code path or dated report. Use a market statistic only with a direct dated source and a defined geography/market. Never turn forecast or competitor marketing copy into measured AccessPath impact.

## 15. Suggested deck map

| Slide | Core point | Visual or evidence |
| --- | --- | --- |
| 1 | Name and one-sentence value proposition. | Current product screen. |
| 2 | A visitor task crosses pages. | Northstar Home → Support → Contact route. |
| 3 | Who needs the evidence. | Developer/QA workflow, marked as target segment. |
| 4 | Goal to route to audit to report. | Simple architecture flow. |
| 5 | TinyFish versus axe-core versus human roles. | Three labeled stages. |
| 6 | Working report. | Real `label` finding with page and element. |
| 7 | Corrected comparison and boundary. | Dated public original/fixed-field captures. |
| 8 | Competition and positioning. | Fair categories from section 6. |
| 9 | Feasibility, safety and costs. | Approved-target policy and current limits. |
| 10 | Impact hypothesis and pilot measurements. | Metrics planned, no invented savings. |
| 11 | Roadmap. | Next proof points. |
| 12 | Demo links and close. | Deployed app and repository links. |

## 16. Sources and project records

- [W3C WAI: Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/) — tools and human evaluation.
- [Deque axe-core project](https://github.com/dequelabs/axe-core) — automated rule engine.
- [WAVE](https://wave.webaim.org/) and [axe DevTools extension](https://www.deque.com/axe/devtools/extension/) — examples used for product positioning.
- [Architecture](./ARCHITECTURE.md), [TinyFish and audit pipeline](./TINYFISH-PIPELINE.md), [Data model and API](./DATA-AND-API.md), [Security](./SECURITY.md), [Demo Guide](./DEMO-GUIDE.md), and [Verified Northstar audit](./demo-audit-validation.md) — implementation details and dated local evidence.
- [AccessPath repository](https://github.com/Apoorvishere/AccessPath) and [live app](https://access-path-mu.vercel.app) — current public artifacts.

The event-specific schedule and judging requirements should be checked against the team's saved Unstop listing before submission; they are not reproduced here without the exact listing.
