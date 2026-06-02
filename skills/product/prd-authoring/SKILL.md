---
name: prd-authoring
description: Use to write a Product Requirements Document for ONE feature or initiative — anchor on the problem and evidence (not the solution), set outcome goals with explicit non-goals, write testable user stories with Given/When/Then acceptance criteria, specify functional requirements with RFC-2119 MUST/SHOULD/MAY and measurable non-functional targets, define a primary success metric plus guardrails, bound scope, and trace every requirement to a goal to a metric. TRIGGER on "write a PRD / spec / requirements doc" for a single initiative. Not cross-feature prioritization (that is roadmap-prioritization). Any agent that produces a single-feature spec (a PRD author, a spec writer, an RFC drafter) can load it.
allowed-tools: Read, Grep, Glob, Write
category: product
tags: [product, prd, requirements, spec, user-stories]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# PRD Authoring

The substantive capability for turning a feature idea into a precise, testable Product
Requirements Document for a single initiative, making scope and success unambiguous so
engineering, design, and QA build the right thing without guessing.

## When to use this skill
When writing a PRD/spec for one feature: problem, goals/non-goals, user stories, functional and
non-functional requirements, success metrics, scope, and open questions. Pairs with an
evidence-discipline skill (e.g. [[assumption-hygiene]]) to keep data and guesses separate. Not for
sequencing or prioritizing across features (that is roadmap-prioritization).

## Instructions
1. **Scope to ONE feature.** If the request bundles several unrelated features, say so and write
   the PRD for the most clearly-scoped one (or ask which). Read existing context — specs, tickets,
   code, analytics, prior PRDs, and the repo's PRD template/style (`Grep`/`Glob` for `PRD`, `spec`,
   `rfc`). If the problem, target user, or success metric is undefined and cannot be inferred, ask
   1–3 sharp clarifying questions before writing.
2. **Anchor on the problem, not the solution.** State who has the problem, the job they are trying
   to do, evidence it is real (data/quotes/tickets), and the cost of not solving it. Resist jumping
   to a feature description.
3. **Set goals and non-goals.** Goals are outcomes (what success looks like), not features. For
   every goal, name an explicit non-goal so the scope edges are visible.
4. **Write user stories** as `As a <persona>, I want <capability> so that <outcome>`, each with
   Given/When/Then acceptance criteria. Stories must be independent, testable, and small enough to
   estimate.
5. **Specify requirements:**
   - **Functional** — numbered (FR-1, FR-2…), each a single verifiable "the system MUST/SHOULD…"
     statement using MUST/SHOULD/MAY (RFC-2119) deliberately.
   - **Non-functional** — performance budgets, scale, security/privacy, accessibility (state the
     bar; defer detailed WCAG criteria to an a11y reviewer), i18n, observability, and SLAs as
     measurable targets.
6. **Define success metrics.** A primary metric tied to the problem, supporting metrics, and at
   least one guardrail/counter-metric (what must NOT get worse). State baseline and target where
   known; flag missing instrumentation.
7. **Bound scope and risk** (in/out this release, dependencies, assumptions, rollout/launch plan,
   open questions each with an owner), then **trace**: every requirement maps to a goal and every
   goal to a metric. Drop or flag anything tracing to nothing — it is scope creep.

## Inputs
- The feature idea, the target users, any existing specs/tickets/analytics/prior PRDs, and the
  repo's PRD template/style if present.

## Output
- A PRD with: Summary; Problem & evidence; Goals/Non-goals; Target users & personas; User stories
  (with Given/When/Then); Requirements (FR-n functional [MUST/SHOULD/MAY] + non-functional targets);
  Success metrics (primary/supporting/guardrail, baseline→target); Scope; Rollout; Open questions
  (question — owner — needed-by).
- A closing Traceability check confirming each requirement → goal → metric, plus any flagged orphans.
- Written to a file (e.g. `docs/prd/<feature>.md`) when a deliverable is expected; otherwise inline.

## Notes
- One feature, one PRD. Do not turn this into a roadmap or prioritize across initiatives.
- Requirements are testable statements, not implementation — say "what" and "how well," not "how."
- Do not invent metrics or baselines; mark unknowns "TBD — needs instrumentation." Every open
  question gets an owner.
