---
name: yaml-manifest-review
description: Use when reviewing or hardening declarative infra YAML (Kubernetes manifests, Helm-rendered output, GitHub Actions workflows) — checks schema validity, least-privilege, pinned versions, and resource limits before the YAML is applied or merged. Do NOT use to author YAML from scratch; this is a pre-flight review gate only.
allowed-tools: Read, Grep, Glob, Bash
category: devops
tags: [kubernetes, helm, ci, yaml, security]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Yaml Manifest Review

A consistent hardening pass for declarative infrastructure YAML — Kubernetes objects,
Helm-rendered manifests, and GitHub Actions workflows — covering validity,
least-privilege, version pinning, and resource governance before the YAML lands.

## When to use this skill
TRIGGER when you are about to apply, merge, or hand off declarative infra YAML and want
a structured safety review. Applies to raw k8s manifests, `helm template` output, and
`.github/workflows/*.yml`. Do NOT use it to author the YAML from scratch (that is the
job of the owning agent) — use it as the pre-flight gate on YAML that already exists.

## Instructions
1. **Validate structure first.** Run the right validator before reasoning about content:
   - Kubernetes / Helm output: `kubectl apply --dry-run=server -f <file>` (catches
     admission + schema errors against the real API) or, offline, `kubeconform -strict
     -summary <file>`. For Helm, pipe `helm template . | kubeconform -strict -`.
   - GitHub Actions: `actionlint .github/workflows/<file>.yml` (catches expression,
     shell, and `runs-on` errors). Fall back to `yamllint` for pure syntax.
   Report any failure verbatim and stop — content review on invalid YAML is wasted.
2. **Check least-privilege.**
   - k8s/Helm: containers set `securityContext.runAsNonRoot: true`,
     `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, and drop all
     capabilities. Reject `privileged: true`, `hostNetwork`/`hostPID`/`hostPath`, and
     wildcard RBAC (`verbs: ["*"]` / `resources: ["*"]`) unless explicitly justified.
   - Actions: top-level `permissions:` is set to least-privilege (default to
     `contents: read`); `GITHUB_TOKEN` scope is narrowed; no `pull_request_target` running
     untrusted code with secrets.
3. **Check version pinning.**
   - k8s images use a digest or explicit tag, never `:latest`.
   - Actions `uses:` are pinned to a full commit SHA (not a floating `@v4` tag) for any
     third-party action; record the human-readable version in a trailing comment.
4. **Check resource governance.** Every k8s container declares CPU/memory `requests` and
   `limits`; Deployments set a `livenessProbe`/`readinessProbe` where meaningful and a
   sane `replicas`/`strategy`. Flag missing `PodDisruptionBudget` for HA workloads.
5. **Check secret handling.** No plaintext secrets, tokens, or kubeconfigs inline; secrets
   come from `Secret`/`secretKeyRef` or Actions `secrets.*`, never echoed to logs.

## Inputs
- One or more YAML files (or rendered Helm output) plus the cluster/CI context if known.

## Output
- A findings list, each as: `severity (critical|high|medium|low) | location file:line | issue | fix`.
  Rank with the repo's `severity-triage` rubric so findings are comparable across agents.
- The exact validator command(s) run and their pass/fail result.
- A one-line verdict: safe to apply/merge, or blocked pending the listed high findings.

## Notes
- Prefer server-side dry-run when a cluster is reachable; it catches admission-webhook and
  CRD errors that offline schema checks miss.
- This skill reviews; it does not mutate. Hand fixes back to the owning agent to apply.
