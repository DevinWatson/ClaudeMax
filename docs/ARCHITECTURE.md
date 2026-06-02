# Architecture

ClaudeMax is a monorepo designed to hold **thousands** of custom Claude agents and the
skills that back them, while staying easy to validate, browse, and deploy.

## Mental model

```
            taxonomy.json  ──────────────┐  (categories = the only enforced vocabulary)
                                          │
   agents/<category>/<name>.md  ──┐       │
                                  ├──> registry ──> validate ──> catalog (CATALOG.md + index.json)
   skills/<category>/<name>/      │       │                 └──> install ──> a target .claude/
        SKILL.md                ──┘       │
                                          │
            schemas/*.schema.json  ───────┘  (frontmatter contracts)
```

- **Agents** are single markdown files. Their frontmatter (`name`, `description`, `model`,
  `tools`) is consumed by Claude Code; extra fields (`category`, `tags`, `version`,
  `skills`, `status`) are ClaudeMax metadata that Claude Code ignores.
- **Skills** are directories with a `SKILL.md`. They encapsulate reusable procedures and
  can bundle `scripts/`, `references/`, and `assets/`. Agents reference skills by name in
  their `skills:` field; this is the **backing** relationship the catalog and installer
  understand.
- **Taxonomy** (`taxonomy.json`) is the single registered vocabulary. The first folder
  segment under `agents/` and `skills/` is the category and must exist in the taxonomy.
  Subcategories below that are free-form folders.

## Why this shape scales to thousands

- **Flat-per-category folders** keep navigation predictable and let many people add
  definitions without merge contention.
- **Validation is mechanical and fast** (`cmx validate`): schema + naming + taxonomy +
  dependency existence + duplicate detection, with no external services.
- **The catalog is generated and deterministic**, so CI can fail a PR whose catalog is
  stale (`cmx catalog --check`) — the index never drifts from reality.
- **Authoring is automated** (`cmx new`) and **governed by skills** (`agent-authoring`,
  `skill-authoring`) plus a meta agent (`agent-architect`) that can design and scaffold in
  bulk, and `agent-evaluator` that gates quality. The repo can grow itself.
- **Deployment is decoupled** (`cmx install`): you author here, then install any slice into
  a project or user `.claude/`, and backing skills come along automatically.

## The tooling (`cmx`)

Zero runtime dependencies. Written in TypeScript and run via Node's built-in type
stripping (`node --experimental-strip-types`), so it works with no `npm install`.

| File | Responsibility |
| --- | --- |
| `tools/src/cli.ts` | Command dispatch + help. |
| `tools/src/lib/yaml.ts` | Minimal YAML parser for frontmatter (no deps). |
| `tools/src/lib/frontmatter.ts` | Split `--- … ---` frontmatter from body. |
| `tools/src/lib/jsonschema.ts` | Draft-07 subset validator (no deps). |
| `tools/src/lib/registry.ts` | Discover + parse all agents/skills + taxonomy. |
| `tools/src/commands/*` | `new`, `validate`, `catalog`, `stats`, `list`, `install`. |

## Lifecycle of a definition

`experimental` → `stable` → `deprecated` (the `status` field). Default installs exclude
`experimental`; promote to `stable` once an agent/skill is proven, ideally after an
`agent-evaluator` pass.
