# AccessPath documentation

The [repository README](../README.md) gives the product overview, live links, and quick start. These documents record the implemented prototype, its limits, and the team's next validation work. Start with the demo guide for a walkthrough or the architecture for technical detail.

## Product and demonstration

- [Demo guide](DEMO-GUIDE.md) — timed walkthrough, approved targets, and fallback when a live run is unavailable.
- [AccessPath pitch](ACCESSPATH-PITCH.md) — problem, intended users, differentiation, and impact measurement plan.
- [Frontend and design](FRONTEND-AND-DESIGN.md) — interface structure, visual choices, and review needs.

## Implementation and operations

- [Architecture](ARCHITECTURE.md) — components, trust boundaries, queue lifecycle, and repository map.
- [TinyFish and audit pipeline](TINYFISH-PIPELINE.md) — route discovery, page checks, failure handling, and the roles of AI, rules, and people.
- [Data model and API](DATA-AND-API.md) — tables, access policies, endpoints, and request examples.
- [Security](SECURITY.md) — controls, limitations, and security review checklist.
- [Setup, testing and deployment](SETUP-AND-DEPLOYMENT.md) — local checks, environment variables, migrations, and deployment steps.

## Evidence and claims

- [Claims ledger](CLAIMS-LEDGER.md) — what is observed, code-backed, team-reported, or still planned. Check this before quoting numbers in a deck or demo.
- [Controlled demo fixture](demo-fixture.md) — the fictional Northstar site and its intentional form-label barrier.
- [Verified browser audit](demo-audit-validation.md) — the separate original/fixed Contact comparison and how it was recorded.

The public [demo report](https://access-path-mu.vercel.app/reports/demo) is a dated controlled-site example. Signed-in live reports are owner-only. Local files under `docs/evidence/` are intentionally ignored by Git; review and redact any evidence before publishing it.
