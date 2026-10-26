# AccessPath Finance

AccessPath Finance is a customer-facing financial journey built from the original AccessPath route-audit codebase. The first journey is a **sample personal-loan application**. It helps a customer understand each step, review suggested document fields, see an illustrative repayment breakdown and finish a synthetic application.

## What works now

- `/` introduces the Finance journey through Approach, Evidence, Demo and Contact sections.
- `/contact` lists Team Amrtisari Naan, the two developer email addresses, and reserved slots for the GitHub and LinkedIn QR codes.
- `/login` and `/account` provide email/password account access through a separate Finance Supabase project once its public project settings are configured. Finance loan progress remains browser-local and is not stored in Supabase.
- `/apply` runs a five-step synthetic loan flow with English/Hindi copy, repayment calculations, browser speech output, a cost understanding check, and browser-local progress recovery. Sarvam explains terms and extracts fields from the bundled fictional payslip. The customer must review suggested fields. Fixed sample fields and explanations remain available if the API is unavailable.
- `/insights` shows the sample step route and recovery events from this browser. Events contain no name, income, document text or loan amount.
- `/audit` keeps the original AccessPath audit experience. Its existing report, dashboard, API and worker routes remain in the codebase.
- No data is sent to a lender. The sample document is fictional, and the final action only changes local demo state.

## What is still planned

Uploads of customer documents, voice input, lender-specific forms, consented backend drafts, finance-specific route telemetry and a lender review view are **not implemented**. No eligibility, credit or insurance decision is made by the app.

## Local development

Requires Node.js 24 and pnpm 12.

```powershell
pnpm install --frozen-lockfile
pnpm --filter ./apps/web dev
```

Open `http://localhost:3000`. To enable live explanations and document extraction, add `SARVAM_API_KEY=...` to `apps/web/.env.local` and restart the web server. The key stays on the server. Explanation requests send only synthetic loan parameters and a fixed question. Document extraction sends only the bundled fictional `sample-payslip.pdf` to Sarvam; customer document uploads are disabled. The demo remains usable without a key. The original AccessPath scan worker and sign-in features still require their own server-side environment variables; see `docs/SETUP-AND-DEPLOYMENT.md`.

### Finance account setup

Use a **separate Supabase project** for AccessPath Finance. In `apps/web/.env.local`, add its public project settings:

```text
NEXT_PUBLIC_FINANCE_SUPABASE_URL=<Finance project URL>
NEXT_PUBLIC_FINANCE_SUPABASE_PUBLISHABLE_KEY=<Finance publishable key>
```

In Supabase Authentication URL settings, add `http://localhost:3000/auth/callback` as an allowed redirect URL for local sign-up confirmation. Add the deployed site's `/auth/callback` URL before deployment. Restart Next.js after changing environment variables. Email/password authentication and email confirmation must be enabled in the Finance project. Keep the original `NEXT_PUBLIC_SUPABASE_*` variables for the inherited audit workspace; Finance uses the `NEXT_PUBLIC_FINANCE_SUPABASE_*` pair. Do not put a Supabase secret/service-role key in public variables. The `/account` page validates the signed-in user on the server and the sign-out action ends the local session.

The separate project currently has no Finance data tables. The login protects the account page; it does not sync loan drafts or create a lender application.

## Build

```powershell
pnpm --filter ./apps/web build
pnpm --filter @accesspath/worker check
pnpm --filter @accesspath/worker test
```

Loan figures are illustrative. The sample interest rate is 18% annually, with a separate 2% processing fee. The sample rate is **not APR**; a real lender must provide its own disclosures. The Finance demo should only be used with fictional information.
