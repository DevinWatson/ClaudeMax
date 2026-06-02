---
name: github-actions-workflows
description: Use when authoring or fixing GitHub Actions workflows (.github/workflows) — structuring jobs and matrices, dependency/build caching, reusable/composite workflows, and CI security (SHA-pinned actions, least-privilege GITHUB_TOKEN, OIDC, pull_request_target / script-injection safety), validated with actionlint. TRIGGER on writing or repairing a workflow. Any agent that authors, reviews, or hardens CI/CD workflows (a CI engineer, a supply-chain security reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: devops
tags: [github-actions, ci, cd, workflows, security]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# GitHub Actions Workflows

The substantive capability for fast, secure, maintainable CI/CD on GitHub Actions: treat the
runner as untrusted and ephemeral and the `GITHUB_TOKEN` as a credential to scope down.

## When to use this skill
When writing a new workflow or fixing an existing one — job structure, caching, matrices,
reusable workflows, or CI security. Not for the build steps inside a container image or for
Terraform/k8s deploy logic the workflow merely invokes.

## Instructions
1. **Match the real toolchain.** Read existing `.github/workflows/` and the project's
   build/test commands so the workflow uses the right package manager and language versions.
   Note the trigger surface (`on:`) and whether any job touches secrets or deploys.
2. **Structure jobs.** Split build/test/lint/deploy into jobs with explicit `needs:` so
   independent work runs in parallel. Use a `matrix` for multi-version/multi-OS testing; add
   `fail-fast: false` when you want all cells to report.
3. **Cache deliberately.** Prefer the setup action's built-in cache (`setup-node` with
   `cache: npm`, `setup-python`, `setup-go`) over hand-rolled `actions/cache`. When using
   `actions/cache`, key on the lockfile hash (`hashFiles('**/package-lock.json')`) with a
   sensible `restore-keys`. Cache the dependency store, not build output that must stay fresh.
4. **Lock down security (non-negotiable).**
   - Set least-privilege top-level `permissions:` (default `contents: read`); grant more only
     on the job that needs it.
   - Pin every third-party `uses:` to a full commit SHA with the version in a trailing comment.
   - Never run untrusted code with secrets: avoid `pull_request_target` + checkout of the PR
     head; never interpolate `${{ github.event.* }}` directly into `run:` (script injection) —
     pass via `env:` instead.
   - Prefer OIDC (`permissions: id-token: write` + cloud federation) over long-lived cloud keys.
5. **Make it efficient and robust.** Add `concurrency:` with `cancel-in-progress` for PR
   workflows; set `timeout-minutes`; gate deploy jobs with `if:` on the right ref. Prefer
   reusable (`workflow_call`) or composite actions over copy-pasted steps.
6. **Validate.** Run `actionlint` on every changed workflow and fix all findings.

## Inputs
- The workflow file(s), the project's build/test commands and language versions, and the
  trigger/secret surface.

## Output
- The workflow YAML as `path:line` diffs with a one-line rationale for caching keys,
  `permissions` scoping, and any `if:`/`concurrency` choice.
- The exact `actionlint` command and its result (must be clean).
- A security note: token scope, action pinning, and untrusted-input handling.

## Notes
- The live workflow run cannot be executed locally; state that the run itself is unverified
  and that `actionlint` is the static gate.
- Run [[yaml-manifest-review]] as the CI-security YAML pass (permissions, pinning, secrets).
- Fit the repo with [[match-project-conventions]] and use [[verify-by-running]] for the
  `actionlint` invocation (exact command + result), never claiming correctness without it.
