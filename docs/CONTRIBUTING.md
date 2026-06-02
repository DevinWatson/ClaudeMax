# Contributing

Thanks for adding to ClaudeMax. The bar is **distinct purpose + quality**, not raw count.

## Prerequisites

- Node.js ≥ 22.6 (for built-in TypeScript type stripping). No `npm install` is required to
  run the tooling.

## Add an agent

```bash
npm run new:agent -- \
  --name my-agent \
  --category engineering \
  --description "Use when <trigger>; <what it does>." \
  --model sonnet \
  --tools "Read, Grep, Glob" \
  --skills "some-backing-skill"
```

Then open `agents/<category>/my-agent.md` and write the system prompt following
[`skills/meta/agent-authoring`](../skills/meta/agent-authoring/SKILL.md).

## Add a skill

```bash
npm run new:skill -- --name my-skill --category engineering \
  --description "What it does AND when to use it."
```

Then fill in `skills/<category>/my-skill/SKILL.md` following
[`skills/meta/skill-authoring`](../skills/meta/skill-authoring/SKILL.md).

## Before you commit

```bash
npm run validate      # schemas, naming, taxonomy, backing-skill existence, duplicates,
                      # maturity (stable agents → stable skills), skill coverage, stray-artifact scan
npm run catalog       # regenerate catalog/CATALOG.md + index.json
```

Both must pass; commit the regenerated catalog. CI runs `validate` and `catalog:check`.

## Conventions

- **Naming:** kebab-case. Agent `name` = filename (sans `.md`); skill `name` = directory name.
- **Category:** must exist in [`taxonomy.json`](../taxonomy.json). To add a category, edit
  that file in the same PR and explain why no existing category fits.
- **Status:** new definitions start `experimental`. Promote to `stable` once proven (an
  `agent-evaluator` review is encouraged).
- **Versioning:** semver in `version`. Bump on behavioral changes.
- **Descriptions:** the `description` is how Claude routes/loads — make it a specific
  "Use when …" that won't collide with siblings.
- **Tool scope:** grant agents the minimum tools they need (read-only reviewers get no
  write/exec tools).

## Bulk additions

For expanding a whole category at once, invoke the `agent-architect` agent — it proposes
names, scaffolds via `cmx new`, factors shared logic into skills, and validates. Avoid
hand-creating dozens of near-duplicate stubs.
