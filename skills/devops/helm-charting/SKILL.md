---
name: helm-charting
description: Use when packaging an application as a reusable Helm chart — writing templates, a values.yaml surface and values.schema.json, _helpers.tpl, chart dependencies, and release/upgrade hooks, and getting helm lint / helm template clean across configurations. TRIGGER on creating, refactoring, or fixing a chart's rendering or upgrade behavior. Any agent that authors, reviews, or audits Helm charts (a chart author, a platform reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: devops
tags: [helm, charts, packaging, releases, templates]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Helm Charting

The substantive capability for packaging applications into clean, parameterized, reusable
Helm charts designed for the chart's *consumer*: sane defaults, a documented values surface,
and templates that render correctly across configurations.

## When to use this skill
When creating a new chart, refactoring one, or fixing rendering/upgrade behavior. Not for
operating live workloads or one-off manifests, and not for building the container image.

## Instructions
1. **Lay out the chart.** `Chart.yaml` with `apiVersion: v2`, a semver chart `version` and an
   `appVersion`; `templates/`, `values.yaml`, and `templates/NOTES.txt`. Declare
   `dependencies:` in `Chart.yaml` and manage them with `helm dependency update`.
2. **Template with discipline.**
   - Centralize names/labels in `_helpers.tpl` (`fullname`, standard `app.kubernetes.io/*`
     labels) and reuse them everywhere.
   - Make every environment-specific value configurable via `values.yaml` with safe defaults;
     never hardcode image tags, replica counts, or resources.
   - Quote string values (`{{ .Values.x | quote }}`), use `toYaml | nindent` for blocks, guard
     optional sections with `{{- if .Values.x }}`, use `required` for must-supply values, and
     chomp whitespace (`{{- ... -}}`) for clean output.
3. **Make it safe by default.** Default `values.yaml` sets resource requests/limits, a
   non-root `securityContext`, probes, and a `ServiceAccount`. Provide a `values.schema.json`
   to validate inputs. Support common knobs: `image.repository/tag`, `replicaCount`,
   `ingress.enabled`, `resources`, `nodeSelector/tolerations/affinity`.
4. **Render and lint.** `helm lint .`, then `helm template . --debug` — and again with a
   non-default `-f` values file and `--set` overrides — to prove it renders for multiple
   configurations.
5. **Verify the install path (optional).** `helm install <r> . --dry-run --debug` validates
   against the API server; document upgrade behavior (hooks, `helm upgrade --install`).

## Inputs
- Any existing `Chart.yaml`, `values.yaml`, and `templates/`, or the raw manifests being
  converted, plus the target Helm version (v3).

## Output
- The chart files as `path:line` diffs, leading with the `values.yaml` surface the consumer sets.
- The commands run (`helm lint`, `helm template` for each config, dry-run) and their results.
- Notes on chosen defaults, chart `dependencies`, and upgrade/rollback behavior.

## Notes
- Keep the chart generic and configurable — no environment-specific values baked into
  templates. Bump the chart `version` on any template change; bump `appVersion` only when the
  app changes.
- Harden the rendered manifests with [[yaml-manifest-review]] (pipe `helm template` output
  through it).
- Fit the repo with [[match-project-conventions]]; confirm with [[verify-by-running]] that
  `helm lint` is clean and `helm template` renders for the documented configs (exact commands
  + output), never claiming it works without the run.
