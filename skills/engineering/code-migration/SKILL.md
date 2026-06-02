---
name: code-migration
description: Use when planning or executing a version, framework, or library migration or upgrade — analyzing compatibility and breaking changes, applying codemods/automated rewrites, moving incrementally via a strangler approach, handling deprecations, keeping a rollback path, and verifying at each step that behavior is preserved. TRIGGER on a "upgrade X to Y", "migrate from A to B", or "modernize/replace this dependency/framework" task. Language- and framework-agnostic — the migration strategy; the specific codemod tool and API deltas come from a separate language capability the agent also composes. Any agent that performs migrations (a migration engineer, a dependency-upgrade bot, a modernization reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: engineering
tags: [migration, upgrade, codemod, strangler, deprecation, rollback]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Code Migration

The substantive capability for moving a codebase from one version/framework/library to another safely:
understand what breaks, change it in reversible increments that each stay green, and prove behavior is
preserved at every step — independent of the language. The specific codemod tooling and API deltas
come from the composed language capability.

## When to use this skill
When upgrading a runtime/framework/library version, replacing a dependency, or modernizing a codebase
off a deprecated technology. Not for general feature work (that is feature-development) and not for
behavior-changing refactors. Pairs with [[behavior-preserving-refactoring]] (preserve behavior while
restructuring), [[match-project-conventions]], and [[verify-by-running]] (prove each step).

## Instructions
1. **Analyze the gap and compatibility.** Compare current vs. target version/framework: read the
   changelog/migration guide and inventory the breaking changes, removed/renamed APIs, behavioral
   changes, and new requirements. Map which of those breaking changes the codebase actually touches —
   Grep the affected APIs to size the real surface, not the theoretical one.
2. **Assess blast radius and pick a strategy.** Decide between a **big-bang** cutover (only for small,
   well-tested surfaces) and an **incremental strangler** approach (run old and new side by side,
   migrate slice by slice, route gradually) — prefer incremental for anything large or risky. Identify
   transitive dependency upgrades the target forces and any incompatibilities between them.
3. **Establish a safety net first.** Confirm there is enough test coverage on the affected behavior to
   detect a regression; add characterization tests where coverage is thin *before* migrating. A
   migration without a way to detect behavior change is a guess.
4. **Automate the mechanical rewrites.** Use codemods/automated rewrites (provided by the composed
   language capability) for repetitive API renames and signature changes rather than hand-editing —
   they are consistent and reviewable. Run the codemod, then review its diff; never trust a bulk rewrite
   blind.
5. **Handle deprecations and shims.** For APIs removed in the target, replace them with the supported
   equivalent; where the migration must straddle versions, use a compatibility shim/adapter as a
   temporary bridge and track it for removal. Don't leave silent deprecation warnings unaddressed —
   they are next year's breakage.
6. **Migrate incrementally with a rollback path.** Land the migration in small, independently revertable
   steps, each leaving the build/tests green and the system shippable. Keep the rollback explicit
   (feature flag, version pin, dual-run) so any step can be backed out without a forward-fix scramble.
7. **Verify behavior preservation at each step.** After every increment, run the build/tests/linters via
   [[verify-by-running]] and confirm behavior is unchanged (the safety-net tests still pass). Report the
   command and result per step; do not batch verification to the end.

## Inputs
- The current and target versions/frameworks/libraries, the migration guide/changelog, the codebase and
  its test coverage, and any constraint on downtime or cutover.

## Output
- The compatibility analysis: breaking changes that actually apply, the affected call sites, and forced
  transitive upgrades.
- The migration plan: strategy (big-bang vs. strangler), the ordered increments, and the rollback path.
- The applied changes (codemod diffs + manual edits) as `path:line`, plus any temporary shims tracked for
  removal, and the per-step verification result via [[verify-by-running]].

## Notes
- Never run a bulk codemod without reviewing its diff and re-running tests.
- Keep every step revertable; a migration you cannot roll back is a one-way door taken on faith.
- Stay language-agnostic; the specific codemod tool (and exact API deltas) belong to the composed
  language capability.
