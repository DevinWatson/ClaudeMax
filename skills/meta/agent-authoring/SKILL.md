---
name: agent-authoring
description: Use when creating or revising a ClaudeMax custom agent — defines the file format, required frontmatter, model/tool selection, and the system-prompt structure that produces a reliable subagent. Load this before writing any new agents/*.md file.
category: meta
tags: [authoring, agents, standards, scaffolding]
version: 1.1.0
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

## System-prompt structure (thin agent + composed skill layer)

ClaudeMax agents are **thin orchestrators**: the substantive procedures live in backing
skills, and the agent composes them. Write the body as:

1. **Identity + mandate** — one or two sentences restating who the agent is and its job.
2. **When you are invoked** — what to read/confirm before acting (context-gathering that is
   the agent's own, not a skill's).
3. **How you work** — one bullet per backing skill, naming the *intent* and linking the skill
   via `[[skill-name]]` (e.g. "Write idiomatic Rust using [[rust-ownership]]; fit the codebase
   via [[match-project-conventions]]; verify with [[verify-by-running]]"). The detailed how-to
   lives in the skills — do **not** re-state their steps or command lists here.
4. **Output contract** — exactly what to return and in what shape (this stays on the agent).
5. **Guardrails** — agent-specific scope limits, what NOT to do, when to ask vs. proceed.

Principles:
- Decompose: an agent's distinctive expertise belongs in a **capability skill** it composes,
  not inline. See [[skill-authoring]] for how to extract a coherent, reusable capability.
- The agent keeps what is genuinely agent-level: routing (`description`), context-gathering,
  the output contract, agent-specific guardrails, and any deliberate omissions (say *why* a
  plausible skill is intentionally not composed).
- Don't duplicate skill content. If a command/procedure lives in a skill, reference the skill
  and name the intent — re-listing it in the agent drifts over time.
- Bake in verification by composing a verify skill (e.g. [[verify-by-running]]).
- Single responsibility: one agent, one clear job. Split rather than overload.

## Workflow

1. Pick the category and a precise `name`.
2. Scaffold: `npm run new:agent -- --name <name> --category <id> --description "…"`.
3. Flesh out the system prompt using the structure above.
4. `npm run validate` then `npm run catalog`.
5. Commit. Promote `status` from `experimental` to `stable` once it's proven.

## Quality bar (reject if any fail)

- `description` makes the trigger unambiguous vs. sibling agents.
- Tools are scoped to the minimum needed.
- The agent is thin: it composes ≥1 backing skill and does not re-implement a procedure that
  belongs in a skill. (Genuinely self-contained micro-agents are the rare exception, not the norm.)
- The body has an explicit output contract and agent-specific guardrails.
- Any `skills:` listed actually exist, and a `status: stable` agent lists only `stable` skills
  (maturity must match — promote agent and skills together).
- `name` matches the filename; `category` is in the taxonomy.
