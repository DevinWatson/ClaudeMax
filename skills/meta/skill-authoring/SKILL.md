---
name: skill-authoring
description: Use when creating or revising a ClaudeMax skill — defines the SKILL.md format, how to write a discoverable description, when to bundle scripts/resources, and how skills back agents. Load this before writing any new skills/**/SKILL.md.
category: meta
tags: [authoring, skills, standards]
version: 1.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Skill Authoring

A ClaudeMax skill is a reusable, model-invokable capability stored as a directory at
`skills/<category>/<name>/` containing a `SKILL.md` file (plus optional helper files).
Skills encapsulate a *procedure* — they are loaded on demand when their `description`
matches the situation, keeping the base context lean.

## Directory layout

```
skills/<category>/<name>/
├── SKILL.md            # required: frontmatter + instructions
├── scripts/            # optional: helper scripts the skill tells Claude to run
├── references/         # optional: reference docs/data loaded only when needed
└── assets/             # optional: templates, fixtures, images
```

The skill `name` MUST equal the directory name.

## Frontmatter

```yaml
---
name: <kebab-case = directory name>
description: <what it does AND when to use it — this is the discovery signal>
allowed-tools: Read, Grep        # optional tool restriction while active
category: <taxonomy id>
tags: [a, b]
version: 0.1.0
license: MIT
status: experimental | stable | deprecated
---
```

## Writing the `description`

This is the single most important line: Claude reads only the name + description to
decide whether to pull in the skill. Make it carry both halves:

- **What** the skill does, in plain terms.
- **When** to use it — concrete triggers ("Use when …", "TRIGGER when …").
- Optionally **when NOT** to use it, to prevent misfires.

## Body structure

1. **One-line summary** of the capability.
2. **When to use** — expand on the triggers.
3. **Instructions** — the procedure, as numbered, imperative steps.
4. **Inputs / Output** — what the skill consumes and the exact shape it produces.
5. **Notes** — edge cases, links to bundled scripts/references.

Principles:
- Progressive disclosure: keep SKILL.md tight; push long reference material into
  `references/` and tell Claude to read it only when needed.
- Deterministic where possible: if a step is purely mechanical, provide a script under
  `scripts/` and instruct Claude to run it rather than re-deriving the logic each time.
- Skills are where the substance lives. ClaudeMax agents are thin orchestrators that compose
  skills (see [[agent-authoring]]); a skill carries the actual reproducible procedure.

Two kinds of skill — both are first-class:
- **Shared skills** back many agents (e.g. `severity-triage`, `verify-by-running`,
  `match-project-conventions`). Prefer reusing an existing one over making a new one.
- **Capability skills** capture one agent's distinctive expertise (e.g. `rust-ownership`,
  `sql-query-design`). These may start with a single consumer — that is fine — but each MUST be
  a coherent, nameable capability written so a *different* agent (a reviewer, a debugger, a
  future specialist) could load it standalone. The test: can you name a plausible second
  consumer? If not, you've sliced an agent's prompt rather than extracted a capability — rethink
  the cut. Write the description for that broader audience, not just the one agent.

## Workflow

1. `npm run new:skill -- --name <name> --category <id> --description "…"`.
2. Fill in instructions; add `scripts/` or `references/` if useful.
3. `npm run validate` then `npm run catalog`.
4. List the skill under the `skills:` of any agent that depends on it.

## Quality bar

- `description` states both what and when, specifically — and is written for any plausible
  consumer, not just the one agent you extracted it from.
- It is a coherent capability with a nameable second consumer (not a slice of one agent's prompt).
- Instructions are reproducible by a fresh agent with no extra context.
- Bundled scripts are referenced explicitly from the body.
- A skill backing any `stable` agent is itself `stable` (maturity must match).
- `name` matches the directory; `category` is in the taxonomy.
