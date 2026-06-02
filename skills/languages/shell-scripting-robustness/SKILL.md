---
name: shell-scripting-robustness
description: Use when writing or hardening Bash/POSIX shell scripts — strict mode (set -euo pipefail, IFS, traps), correct quoting and word-splitting, arrays over space-joined strings, portability (Bash vs. POSIX sh, GNU vs. BSD utilities), and passing shellcheck clean. Also flags when shell is the wrong tool. Verifies with shellcheck and bash -n. Any agent producing shell scripts (writer, reviewer, devops) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [bash, shell, posix, shellcheck, portability]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Shell Scripting Robustness

The substantive shell capability: write scripts that fail loudly, handle hostile input
(spaces, globs, newlines) safely, stay portable to the intended platforms, and pass shellcheck.

## When to use this skill
When authoring or hardening a Bash/POSIX script, when a script is fragile or fails on edge
cases (paths with spaces, empty args, glob expansion), or when deciding whether shell is even
the right tool. Not needed for a one-line, fully-quoted command with no control flow.

## Instructions
1. **Make failures fatal and visible.** Start scripts with `set -euo pipefail` and set
   `IFS=$'\n\t'` where appropriate. Add `trap 'cleanup' EXIT` for temp files. Verify
   `set -e` interactions (functions, `||`, `if`, command substitution) behave as intended —
   `set -e` does not fire inside conditions.
2. **Quote everything.** Every expansion is `"$var"` / `"${arr[@]}"`; never rely on word
   splitting. Use arrays for argument lists, not space-joined strings. Prefer `[[ ]]` over
   `[ ]` in Bash, `mktemp` for temp files, and `--` to terminate option parsing before
   user-supplied paths.
3. **Be deterministic and portable.** Do not parse `ls`; use globs (with `nullglob`/`shopt`
   awareness) or `find … -print0 | xargs -0`. Prefer parameter expansion over spawning
   `sed`/`awk`/`cut` for simple string ops. Match the shebang to what the script uses
   (`#!/usr/bin/env bash` vs. POSIX `sh`) and flag GNU-only flags (`sed -i`, `date`, `getopt`)
   when BSD/macOS portability is required.
4. **Know the ceiling.** If the task needs nontrivial data structures, real error recovery, or
   heavy parsing, say so and recommend Python or another language rather than forcing it into
   shell.
5. **Verify.** Run `shellcheck` (treat its findings as required; justify each remaining one with
   a `# shellcheck disable=SCxxxx` and a reason) and `bash -n` for a syntax check; dry-run on
   edge-case inputs (paths with spaces, empty args) where safe. Report the exact commands and
   results.

## Inputs
- The script and how it is invoked (cron, CI, sourced), the target shell and platform(s), and
  the failing input/edge case if hardening an existing script.

## Output
- The script/diff with shebang, `set` options, traps, and quoting in place.
- The `shellcheck` result (clean, or each remaining warning justified) and the portability
  assumptions (Bash version, GNU vs. BSD utilities).

## Notes
- Safety over brevity: never ship an unquoted expansion or an unchecked destructive command.
- Confirm before anything destructive (`rm -rf`, overwriting files, `eval`); prefer dry-run
  output first.
- Apply within the project's conventions — match the existing scripts' shell, style, and
  utility assumptions.
