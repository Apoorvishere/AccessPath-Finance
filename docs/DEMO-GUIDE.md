# AccessPath demo guide

**Status:** presenter guide
**Checked against repository:** 18 October 2026
**Project:** AccessPath, AZINHACK 2026

> The controlled Northstar fixture has one intentional, verified form-label barrier. A live Northstar scan has completed with a saved report, and the team has reported a completed GitHub scan. The public before/after audit is a separate recorded browser audit. Keep these evidence streams distinct when presenting.

## 1. Purpose and core message

AccessPath begins with a visitor goal, follows the route toward it with TinyFish, checks the approved pages with axe-core, and saves findings alongside page evidence for the signed-in account. The demo should show an actual route and a finding tied to a specific element. Automated results require human review; a completed scan is not a WCAG conformance certificate.

The primary presentation uses the team's fictional Northstar Services site. Its sample form accepts no submission. The optional GitHub target demonstrates a second approved public site, but its results must be presented as observed rather than promised.

## 2. What works today

| Capability | Current evidence or limit |
| --- | --- |
| Controlled site | Public Home, Support, original Contact, and corrected Contact pages under `/demo-site`. |
| Free-text visitor goal | The dashboard accepts a goal of 12-180 characters for one of two fixed start URLs. |
| Live journey | A completed Northstar run followed Home → Support → Contact and saved an owner-only report. |
| Automated finding | The live report recorded 3 checked pages, 1 violated rule, 1 affected element, and 3 page-level checks needing human review. The finding is axe-core `label` on `#demo-email`. |
| Corrected-page comparison | The public `/reports/demo` is a separate, dated TinyFish Browser + axe-core audit. It recorded the `label` finding on the original Contact page and no `label` finding on the corrected Contact page. |
| Second target | The team reported a completed saved scan of its public GitHub repository. No fixed finding count is promised for GitHub. |
| Privacy | Accounts and saved reports use Supabase. The team previously checked report isolation with two accounts. |

The landing-page journey graphic is illustrative. Use the saved scan report, rather than the graphic, as evidence of an actual run. The Northstar fixture is synthetic; the agent run, browser audit and saved findings are real provider outputs.

## 3. URLs and safe scope

| Destination | URL | Use |
| --- | --- | --- |
| Live app | [AccessPath](https://access-path-mu.vercel.app) | Introduce the product. |
| Northstar start | [Home](https://access-path-mu.vercel.app/demo-site) | Open the controlled fixture. |
| Original form | [Contact](https://access-path-mu.vercel.app/demo-site/contact) | Show the intentionally unlabeled email input. |
| Corrected form | [Fixed Contact](https://access-path-mu.vercel.app/demo-site/fixed/contact) | Show the associated email label. |
| Recorded comparison | [Verified demo report](https://access-path-mu.vercel.app/reports/demo) | Show the dated before/after browser audit and screenshots. |
| Private reports | [Dashboard](https://access-path-mu.vercel.app/dashboard) | Show the owner-only saved live run after signing in. |
| Second approved start | [AccessPath on GitHub](https://github.com/Apoorvishere/AccessPath) | Optional second live target. |

The live worker accepts only the two exact approved start URLs. Northstar audits stay within its listed demo routes; GitHub audits stay within the public repository pages allowed by code. The worker checks at most three approved visited pages. It does not log in to the target, submit forms, make purchases, or scan arbitrary URLs.

## 4. Choose the demo path

**Reliable two-minute path:** Open the Northstar pages, then the already saved live report and the separate public before/after report. This shows actual evidence without making the audience wait for a paid cloud run.

**Live-run path:** Only if the queue is enabled, Railway worker is healthy, credits and team budget are available, and the account has no active scan, sign in to the dashboard. Choose **Northstar controlled demo** and use “Find the contact form through the support page.” Start one scan, point out the queued/running status, and open the report when it completes. Provider latency is variable; switch to the saved report if the run exceeds the presentation window. Say explicitly when showing a prior run.

**Optional GitHub path:** Select **AccessPath on GitHub** and enter “Find the local setup instructions in the README.” The navigation and audit results may differ from Northstar. Do not claim a preselected GitHub violation, WCAG score, or comparison result.

## 5. Presenter preparation

- Confirm the production app, login, Northstar pages, public demo report, and a signed-in saved Northstar report all open.
- For a live attempt, check the Vercel live-scan feature flag, Supabase queue switch and remaining budget, Railway worker deployment/logs, and TinyFish credit balance. A visible button does not prove the database queue is enabled.
- Use the existing test account. Do not create accounts on stage or show personal email, provider keys, environment variables, Supabase SQL, or teammate billing screens.
- Keep a sanitized screenshot of the saved live report and the public comparison report offline. Treat screenshots as dated evidence; capture the deployment date and scan date.
- Rehearse at the presentation screen size. Have the report URLs and repository open in separate tabs. Do not rely on a second live run to finish within two minutes.

## 6. Two-minute speaking flow

| Time | Show | Say |
| --- | --- | --- |
| 0:00-0:20 | Northstar Home → Support → Contact. | “A visitor's task crosses pages. Our controlled site has an email field whose visible text is not associated with the input.” |
| 0:20-0:45 | Dashboard approved-site selector and free-text goal; show saved run status or start one authorized run. | “TinyFish follows the goal. The app limits which pages can be audited and queues the work.” |
| 0:45-1:15 | Saved live report: route, 3 pages, `label`, `#demo-email`, screenshot and manual checks. | “axe-core identified this specific form-label issue. The report connects it to the page and affected element.” |
| 1:15-1:40 | Corrected Contact page and public `/reports/demo`. | “The corrected field has an associated label. This separate recorded audit shows the `label` rule absent there; it is not a second live queue run.” |
| 1:40-2:00 | Dashboard library and repository. | “Reports belong to the signed-in user. This is a bounded prototype: automated checks help prioritize review, and people still verify the experience.” |

Let the live result determine its own counts and route. If it differs from the saved Northstar run, describe the new observation accurately. The two-minute timing applies to the prepared presentation, not to a guaranteed live scan duration.

## 7. Evidence to point at

1. **Route:** The saved Northstar report shows the actual visited sequence; the expected task path is Home → Support → Contact.
2. **Finding:** The email input `#demo-email` on the original Contact page triggers axe-core's `label` rule. Point to the element and screenshot, not just a count.
3. **Human checks:** The saved live report includes three page-level checks needing human review. They are prompts for further testing, not additional confirmed violations.
4. **Correction:** The fixed Contact page associates a visible label with the field. The dated public comparison report recorded zero `label` violations for that corrected page.
5. **Ownership:** A signed-in user sees their saved reports in the dashboard. Use a clean second account only if there is time and consent to demonstrate isolation.

Do not present the public comparison report as the same transaction as the live journey. The former used a local audit script in a TinyFish Browser session; the latter was a queued product run. The earlier Home-page findings noted in `docs/demo-audit-validation.md` came from a stale deployment capture and are excluded from the public comparison.

## 8. Failure and fallback plan

| Situation | Presenter action |
| --- | --- |
| Queue is paused or budget exhausted | Do not toggle production settings during the talk. Open the existing saved run and explain it was completed earlier. |
| New scan stays queued or runs slowly | Show its status briefly, then move to the saved run. Do not promise a fixed completion time. |
| New scan fails | State that the new attempt failed. Show the earlier successful report as separate evidence; capture the failure status for later diagnosis. |
| Report has no screenshot for a page | Show its finding data. Large screenshot previews may be dropped to fit the database report-size cap. |
| Login or network fails | Use dated offline screenshots and clearly label them as earlier captured results. |
| GitHub target behaves differently | Return to Northstar. GitHub can change independently and no particular finding is guaranteed. |

The current worker marks unsuccessful jobs failed and does not automatically retry them. There is no user-facing cancel button. Avoid claiming that a failed page produces a partial report; the present worker saves a failed scan without an audit report when the audit stage stops.

## 9. Questions judges may ask

**What is the AI doing?** TinyFish's agent interprets the visitor goal and navigates. axe-core produces rule-based accessibility findings. AccessPath joins route, page, finding and evidence in a report.

**Did the team train an AI model?** No. The team integrated provider services and built the target policy, queue, audit orchestration, storage and report UI.

**Can it scan any website or perform any task?** The goal text is flexible within the approved site, but the two start URLs and auditable paths are fixed. Tasks needing login, form submission or navigation outside the approved area cannot complete.

**Does the fixed page prove conformance?** No. The recorded audit shows one specific `label` rule absent for the corrected field. Keyboard, assistive-technology and usability testing still require people.

**What protects user reports?** Supabase authentication and owner-only database access. The team reported a two-account privacy check. Avoid displaying other accounts' data in the demo.

**How are costs controlled?** The preview has a paused queue switch, shared attempt limits, one active scan per account, and a three-page audit bound. These are operational limits, not a guaranteed dollar cap. Check live provider balance and database settings before a paid run.

**What is next?** Broader approved targets, stronger recovery and cost controls, and private evidence storage are future work. They are not part of the present demonstration.

## 10. Claims and evidence checklist

| Avoid saying | Use the supported statement |
| --- | --- |
| “Two defects were found and fixed.” | “The verified Northstar comparison has one `label` violation on the original field and none for that rule on the corrected field.” |
| “The live scan audited the fixed site too.” | “The public fixed-page audit is a separate recorded browser run.” |
| “We certify WCAG compliance.” | “We report automated findings and identify manual checks.” |
| “Any website works.” | “The current live preview accepts two exact approved public starts.” |
| “It always finishes in two minutes.” | “The presentation uses saved evidence because provider runtime varies.” |
| “No more accessibility problems remain.” | “This one automated rule no longer fires on the corrected field.” |

Before filming or presenting, record the deployed commit, date/time of each shown scan, route and finding count from that actual report, and whether each screen is live or previously captured. Sanitize screenshots and logs. The repository currently has demo Home/Contact images; any new report screenshot should be reviewed for private data before committing it.

## 11. References

- [Architecture](./ARCHITECTURE.md)
- [TinyFish and audit pipeline](./TINYFISH-PIPELINE.md)
- [Data model and API](./DATA-AND-API.md)
- [Security](./SECURITY.md)
- [Setup, testing and deployment](./SETUP-AND-DEPLOYMENT.md)
- [Controlled fixture](./demo-fixture.md)
- [Verified browser audit](./demo-audit-validation.md)
- [Repository README](../README.md)
