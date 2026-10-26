# Verified controlled demo audit

## Status and scope

On 18 October 2026 (IST), AccessPath's local audit script opened the deployed Northstar Services pages in one TinyFish Browser API session, controlled that session using Playwright CDP, and ran axe-core 4.14.0 with WCAG 2.0/2.1 A and AA tags. The script saved local JSON results and screenshots. This was a **real browser audit of the controlled fixture**. It was not triggered by a public AccessPath user, and the TinyFish Agent route-discovery result was not the source of these audit targets.

The published [demo report](https://access-path-mu.vercel.app/reports/demo) deliberately shows only the original and corrected contact-page results from that run.

## Recorded results

| Page | Recorded rule violations | Affected field | Needs human review |
| --- | ---: | --- | ---: |
| `/demo-site/contact` | 1 `label` rule, critical impact | `#demo-email` | 1 check |
| `/demo-site/fixed/contact` | 0 | None for the `label` rule | 1 check |

The original email input had no programmatic label. The corrected page used a visible `<label>` associated through `htmlFor` and `id`. The [axe-core rule documentation](https://dequeuniversity.com/rules/axe/4.14/label) explains why this association matters.

The run also checked the Home and Support pages. The first Home capture reported shared-header and contrast findings associated with the previous deployment, while subsequent pages and a fresh browser check showed the updated header. We excluded Home findings from the published comparison because the capture did not establish a stable deployment version. Do not present the Home findings as current without a fresh verified scan.

## Reproduction

From the repository root, with the private TinyFish key in ignored `apps/web/.env.local` and `playwright-core` plus `axe-core` installed:

```powershell
node .\scripts\audit-demo.mjs https://access-path-mu.vercel.app
```

This consumes one TinyFish Browser API session. Results are written to ignored `docs/evidence/`. Review all output before publishing evidence or making accessibility claims. The script tries to terminate the TinyFish session in a `finally` block.

## Limits

- Zero automated violations on the corrected page does not prove WCAG conformance.
- One check on each page was marked for human review; the current summarized JSON records only the count, not its rule ID.
- The demo report is a dated snapshot of a controlled site. It is not a general site-scanning feature.
- This local comparison script is separate from the invite-only live queue. The live queue now has sign-in, saved owner-scoped reports, and shared attempt limits; it is still restricted to approved targets and has not been opened to general users. Do not present the local original/fixed comparison as the output of one queued live scan.
