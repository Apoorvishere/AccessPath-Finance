# Wikipedia reading-journey target

Status: implemented in code; live result not yet verified.

## Scope

- Start: <https://en.wikipedia.org/wiki/Web_accessibility>
- Goal: Find the article explaining the Web Content Accessibility Guidelines (WCAG).
- Other approved page: <https://en.wikipedia.org/wiki/Web_Content_Accessibility_Guidelines>
- The worker may audit only these two exact public article URLs. It does not edit Wikipedia, authenticate, submit a form, or audit Wikipedia as a whole.
- TinyFish records the pages visited. AccessPath runs axe-core on the approved visited pages and saves the report to the signed-in account.

## Release order

1. Apply `supabase/migrations/202610200001_wikipedia_target.sql` in the project's Supabase SQL Editor. This adds the exact start URL to `enqueue_live_scan` and preserves the current queue switch and budgets.
2. Deploy the new worker code to Railway and confirm its deployment is active.
3. Deploy the web code to Vercel. The Wikipedia option remains hidden while `NEXT_PUBLIC_WIKIPEDIA_SCAN_ENABLED` is unset or `false`.
4. Set `NEXT_PUBLIC_WIKIPEDIA_SCAN_ENABLED=true` for the intended Vercel environment, then redeploy the web app.
5. If the live queue is paused, enable it only for the authorized test. Sign in, choose **Wikipedia accessibility articles**, and run the example goal once.
6. Check that the saved journey lists the two approved articles and that the report shows both pages checked. Report actual findings and any failed or unvisited pages, not an expected count of violations.

**Deployment check:** Applying the SQL migration updates Supabase only; it does not update the Railway worker. Compare Railway's active deployment commit with the latest GitHub commit. If Railway paused a build, trigger **Deploy Latest Commit** after builds resume, then confirm the new deployment is active and logs `AccessPath controlled-scan worker started.` Do not start a second worker against the same queue. Leave the Wikipedia web flag off until the worker code is deployed.

If the test cannot complete, set `NEXT_PUBLIC_WIKIPEDIA_SCAN_ENABLED=false` and redeploy the web app. The existing Northstar and GitHub targets are unaffected.

## Claim boundary

Say “two-page Wikipedia reading-journey audit” and show the pages checked. Automated axe-core findings require human review and do not establish WCAG conformance or coverage of all of Wikipedia.
