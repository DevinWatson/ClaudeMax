# ClaudeMax

A scalable monorepo for **thousands** of custom [Claude Code](https://claude.com/claude-code)
agents and the **skills** that back them — with batteries-included tooling to author,
validate, catalog, and deploy them.

- 🧩 **Native format.** Agents are `agents/<category>/<name>.md` subagents; skills are
  `skills/<category>/<name>/SKILL.md`. Drop them straight into Claude Code.
- 🔗 **Agents are backed by skills.** Reusable procedures live once as skills; agents
  reference them by name. The tooling tracks the dependency.
- ✅ **Quality at scale.** One command validates every definition (schema, naming,
  taxonomy, dependencies, duplicates). A deterministic catalog keeps the index honest.
- 🛠 **Zero install.** The `cmx` CLI is TypeScript run via Node's built-in type stripping —
  no `npm install` needed.
- 🤖 **Self-growing.** Meta agents (`agent-architect`, `agent-evaluator`) and meta skills
  (`agent-authoring`, `skill-authoring`) let the repo design and vet new definitions.

## Quickstart

Requires **Node.js ≥ 22.6**.

```bash
# See what's here
npm run stats
npm run list

# Create a new agent (scaffolds a standards-compliant file)
npm run new:agent -- --name sql-optimizer --category data \
    --description "Use when a SQL query is slow; rewrites it and explains the new plan." \
    --model sonnet --tools "Read, Bash" --skills sql-explain-analysis

# Validate everything and regenerate the catalog
npm run validate
npm run catalog

# Install a slice into a project (backing skills come along automatically)
npm run cmx -- install --target . --category engineering
```

## Repository layout

```
ClaudeMax/
├── agents/<category>/<name>.md          # the agents (single markdown files)
├── skills/<category>/<name>/SKILL.md    # the backing skills (directories)
├── taxonomy.json                        # the registered category vocabulary
├── schemas/                             # frontmatter contracts (JSON Schema)
├── templates/                           # human reference templates
├── catalog/                             # GENERATED: CATALOG.md + index.json
├── tools/                               # the `cmx` CLI (zero-dependency TypeScript)
└── docs/                                # ARCHITECTURE.md, CONTRIBUTING.md
```

## The `cmx` CLI

| Command | What it does |
| --- | --- |
| `cmx new agent` / `new skill` | Scaffold a standards-compliant definition. |
| `cmx validate` | Validate all definitions; fails on any error. |
| `cmx catalog [--check]` | Generate `catalog/`; `--check` fails if stale (used in CI). |
| `cmx stats` | Inventory counts by category and status. |
| `cmx list` | List/search agents and skills. |
| `cmx install` | Copy selected agents + their backing skills into a `.claude/`. |

Run `npm run cmx -- help` for full options. (Use `--` to forward flags through npm.)

## Using these in Claude Code

`cmx install --target <dir>` copies the agents you select into `<dir>/.claude/agents/` and
their backing skills into `<dir>/.claude/skills/`. Use `--target user` for your home
directory (global), or `--target .` for the current project. Restart Claude Code in that
directory and the subagents and skills become available. Add `--include-experimental` to
include unproven definitions, or `--dry-run` to preview.

## Contributing & standards

- How to add agents/skills: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- How it all fits together: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Agent standard: [`skills/meta/agent-authoring`](skills/meta/agent-authoring/SKILL.md)
- Skill standard: [`skills/meta/skill-authoring`](skills/meta/skill-authoring/SKILL.md)
- Full inventory: [`catalog/CATALOG.md`](catalog/CATALOG.md)

## License

MIT — see [`LICENSE`](LICENSE).
