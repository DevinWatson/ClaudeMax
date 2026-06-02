---
name: example-skill
description: <What the skill does> AND <when to use it — concrete triggers>. This text is the only signal Claude uses to decide whether to load the skill, so make it precise.
category: engineering
tags: [example, template]
version: 0.1.0
maintainer: you@example.com
license: MIT
status: experimental
---

# Example Skill

One-line summary of the capability.

## When to use this skill
Expand on the triggers from the description. Optionally state when NOT to use it.

## Instructions
1. Step one (imperative).
2. Step two.
3. Step three.

## Inputs
- What the skill expects (files, arguments, prior context).

## Output
- The exact shape of what the skill produces.

## Notes
- Bundle helper scripts under `scripts/` and reference material under `references/`
  inside this directory, and reference them explicitly from the steps above.

<!--
This is a human reference. To create a real skill, prefer:
  npm run new:skill -- --name <name> --category <id> --description "…"
Then follow the standards in skills/meta/skill-authoring/SKILL.md.
-->
