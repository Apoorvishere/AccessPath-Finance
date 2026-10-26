# Controlled demo journey

**Purpose:** Give AccessPath a public target with a known, reproducible accessibility barrier and a corrected comparison page. Northstar Services is fictional. The site has no backend and its sample form has no submit button.

## Routes

| Route | Role |
| --- | --- |
| `/demo-site` | Home and journey entry |
| `/demo-site/support` | Support hub |
| `/demo-site/contact` | Contact form with one intentional barrier |
| `/demo-site/fixed/contact` | Corrected comparison |

## Intended visitor task

> Find the contact form through the support page without submitting it.

The intended journey is Home → Support → Contact. TinyFish's observed route may differ; report what it actually visits rather than editing the result to match this plan.

## Known fixture

`/demo-site/contact` displays “Email address” as a plain `<span>` above the email input. That text is not programmatically associated with the input, and the input has no other accessible name. The corrected page uses a visible `<label>` associated with the input through matching `htmlFor` and `id` values.

The expected automated finding is an accessible-name or form-label rule on the original page and its absence for that field on the corrected page. **This is an expectation, not a scan result.** Record the actual rule ID and result only after the browser audit runs. Other findings may occur and should be kept in the report if verified.

## Safety and scope

- The demo pages are safe to inspect without authentication.
- Do not enter personal data. The forms have no submit button and send nothing.
- TinyFish requires a publicly reachable HTTPS deployment; it cannot visit your laptop's `localhost` URL.
- Add only the exact deployed hostname to `ACCESSPATH_ALLOWED_HOSTS` for the private preview. Do not put the deployment URL in that variable.
- The journey-discovery stage records pages visited; it does not run accessibility checks.

## Manual acceptance checks

1. Open `/demo-site` and follow the support link to the contact form.
2. Confirm the original email input is visible and has no associated label in the source.
3. Open `/demo-site/fixed/contact` and confirm the `Email address` label is visible and associated with the field.
4. Check the pages at mobile width and navigate the links using the keyboard.
5. Run `pnpm build` from the repository root before committing.
