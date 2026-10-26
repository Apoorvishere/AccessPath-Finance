import assert from "node:assert/strict";
import test from "node:test";
import { auditUrlsFromJourney, parseJourney, repeatedJourneyStep } from "./tinyfish";
import { targetForStart, NORTHSTAR_START, GITHUB_START, WIKIPEDIA_START } from "./targets";

const northstar = targetForStart(NORTHSTAR_START)!;
const github = targetForStart(GITHUB_START)!;
const wikipedia = targetForStart(WIKIPEDIA_START)!;

const base = {
  outcome: "completed",
  summary: "Reached the contact page.",
  steps: [
    { title: "Home", url: "https://access-path-mu.vercel.app/demo-site", action: "Open", observation: "Support link" },
    { title: "Contact", url: "https://access-path-mu.vercel.app/demo-site/contact", action: "Follow", observation: "Contact form" },
  ],
};

test("only approved controlled-demo pages enter an audit", () => {
  const journey = parseJourney(base, northstar);
  assert.ok(journey);
  assert.deepEqual(auditUrlsFromJourney(journey), base.steps.map(step => step.url));
  assert.equal(parseJourney({ ...base, steps: [{ ...base.steps[0], url: "https://example.com/" }] }, northstar), null);
  assert.equal(parseJourney({ ...base, steps: [{ ...base.steps[0], url: "https://access-path-mu.vercel.app/demo-site?token=x" }] }, northstar), null);
  assert.equal(parseJourney({ ...base, steps: [{ ...base.steps[0], url: "https://access-path-mu.vercel.app.evil.test/demo-site" }] }, northstar), null);
});

test("uncompleted journeys never produce paid audit targets", () => {
  const journey = parseJourney({ ...base, outcome: "blocked" }, northstar);
  assert.ok(journey);
  assert.deepEqual(auditUrlsFromJourney(journey), []);
});

test("a repeated page and action is flagged, while a different action on the same page is allowed", () => {
  const repeated = parseJourney({ ...base, steps: [base.steps[0], base.steps[1], { ...base.steps[0], action: "  OPEN  " }] }, northstar);
  assert.ok(repeated);
  assert.deepEqual(repeatedJourneyStep(repeated), { first: 0, repeated: 2 });

  const revisit = parseJourney({ ...base, steps: [base.steps[0], { ...base.steps[0], action: "Follow support link" }] }, northstar);
  assert.ok(revisit);
  assert.equal(repeatedJourneyStep(revisit), null);
});

test("public GitHub audit stays inside the owned repository", () => {
  const step = { ...base.steps[0], url: GITHUB_START };
  assert.ok(parseJourney({ ...base, steps: [step] }, github));
  assert.ok(parseJourney({ ...base, steps: [{ ...step, url: `${GITHUB_START}/blob/main/README.md` }] }, github));
  for (const url of ["https://github.com/login", "https://github.com/Apoorvishere/Other", "https://github.com/Apoorvishere/AccessPath/issues", "https://github.com/Apoorvishere/AccessPath?tab=readme-ov-file"]) {
    assert.equal(parseJourney({ ...base, steps: [{ ...step, url }] }, github), null);
  }
});

test("Wikipedia journey accepts only the two approved public articles", () => {
  const step = { ...base.steps[0], url: WIKIPEDIA_START };
  const guidelines = "https://en.wikipedia.org/wiki/Web_Content_Accessibility_Guidelines";
  const journey = parseJourney({ ...base, steps: [step, { ...step, url: guidelines }] }, wikipedia);
  assert.ok(journey);
  assert.deepEqual(auditUrlsFromJourney(journey), [WIKIPEDIA_START, guidelines]);
  for (const url of ["https://en.wikipedia.org/wiki/Main_Page", "https://en.wikipedia.org/wiki/Special:UserLogin", "https://en.wikipedia.org/wiki/Web_accessibility?action=edit", "https://en.wikipedia.org.evil.test/wiki/Web_accessibility"]) {
    assert.equal(parseJourney({ ...base, steps: [{ ...step, url }] }, wikipedia), null);
  }
});
