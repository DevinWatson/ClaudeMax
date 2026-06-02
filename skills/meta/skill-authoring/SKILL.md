---
name: skill-authoring
description: Use when creating or revising a ClaudeMax skill — defines the SKILL.md format, how to write a discoverable description, when to bundle scripts/resources, and how skills back agents. Load this before writing any new skills/**/SKILL.md.
category: meta
tags: [authoring, skills, standards]
version: 1.0.0
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
- A skill is shared infrastructure: write it so multiple agents can rely on it. Agents
  reference it via their `skills:` frontmatter. See [[agent-authoring]].

## Workflow

1. `npm run new:skill -- --name <name> --category <id> --description "…"`.
2. Fill in instructions; add `scripts/` or `references/` if useful.
3. `npm run validate` then `npm run catalog`.
4. List the skill under the `skills:` of any agent that depends on it.

## Quality bar

- `description` states both what and when, specifically.
- Instructions are reproducible by a fresh agent with no extra context.
- Bundled scripts are referenced explicitly from the body.
- `name` matches the directory; `category` is in the taxonomy.
