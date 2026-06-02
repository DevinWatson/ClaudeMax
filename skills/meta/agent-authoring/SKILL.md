---
name: agent-authoring
description: Use when creating or revising a ClaudeMax custom agent — defines the file format, required frontmatter, model/tool selection, and the system-prompt structure that produces a reliable subagent. Load this before writing any new agents/*.md file.
category: meta
tags: [authoring, agents, standards, scaffolding]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Agent Authoring

This skill is the canonical reference for writing a high-quality ClaudeMax agent.
A ClaudeMax agent is a single markdown file at `agents/<category>/<name>.md` whose
YAML frontmatter is consumed by Claude Code and whose body is the agent's system prompt.

## File format

```markdown
---
name: <kebab-case, must equal filename without .md>
description: <when to invoke this agent; Claude routes work using this text>
model: opus | sonnet | haiku | inherit
tools: Read, Grep, Glob        # optional; omit to inherit all tools
category: <taxonomy id>        # must exist in taxonomy.json
tags: [a, b, c]                # optional
version: 0.1.0                 # semver
maintainer: you@example.com    # optional
skills: [skill-a, skill-b]     # optional backing skills (must exist in skills/)
status: experimental | stable | deprecated
---

<system prompt body>
```

`name`, `description`, `model`, and `tools` are read by Claude Code. The remaining
fields are ClaudeMax metadata used by the tooling (validation, catalog, install) and
are ignored by Claude Code.

## Writing the `description` (most important field)

The description is the ONLY signal Claude uses to decide when to delegate to this agent.

- Start with a trigger: "Use when …".
- Name the concrete situation and the outcome, not the persona. Good: "Use when a SQL
  query is slow; rewrites it and explains the new plan." Weak: "A database expert."
- Keep it to 1–3 sentences. Make triggers mutually distinct from sibling agents so
  routing is unambiguous.

## Choosing `model`

- `haiku` — mechanical, well-specified, high-volume tasks (formatting, extraction).
- `sonnet` — the default for most engineering/analysis agents.
- `opus` — deep reasoning, architecture, ambiguous or high-stakes work.
- `inherit` — match whatever model the main session is using.

## Choosing `tools`

Grant the minimum. A read-only reviewer should list `Read, Grep, Glob` and nothing
that mutates files. Omit the field entirely only when the agent genuinely needs the
full toolset. Narrow tools = safer, faster, more predictable agents.

## System-prompt structure

Write the body as instructions to the agent. A dependable structure:

1. **Identity + mandate** — one or two sentences restating who the agent is and its job.
2. **When invoked** — what to read/confirm before acting.
3. **Operating procedure** — numbered steps (gather → plan → execute → verify).
4. **Output contract** — exactly what to return and in what shape.
5. **Guardrails** — scope limits, what NOT to do, when to ask vs. proceed.

Principles:
- Be concrete and imperative. Prefer checklists over prose.
- Bake in verification: tell the agent how to confirm its own output.
- Single responsibility: one agent, one clear job. Split rather than overload.
- If the agent depends on a procedure that other agents also use, factor it into a
  skill and list it under `skills:` instead of duplicating prose. See [[skill-authoring]].

## Workflow

1. Pick the category and a precise `name`.
2. Scaffold: `npm run new:agent -- --name <name> --category <id> --description "…"`.
3. Flesh out the system prompt using the structure above.
4. `npm run validate` then `npm run catalog`.
5. Commit. Promote `status` from `experimental` to `stable` once it's proven.

## Quality bar (reject if any fail)

- `description` makes the trigger unambiguous vs. sibling agents.
- Tools are scoped to the minimum needed.
- The body has an explicit output contract and guardrails.
- Any `skills:` listed actually exist.
- `name` matches the filename; `category` is in the taxonomy.
