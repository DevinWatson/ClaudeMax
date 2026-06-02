---
name: observability-instrumentation
description: Use when instrumenting or improving observability outside a live incident — adding RED/USE metrics, logs, and traces, writing correct PromQL and dashboards, defining SLOs and error budgets, and authoring multi-window multi-burn-rate alerts that page on symptoms not causes, validated with promtool/amtool. TRIGGER on adding instrumentation, dashboards, SLOs, or alert rules. Any agent that builds or reviews observability (an observability engineer, an SRE doing reliability review) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: devops
tags: [observability, metrics, tracing, slo, alerting, promql]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Observability Instrumentation

The substantive capability for making systems observable and alerting trustworthy: instrument
the right signals, write correct PromQL, define SLOs/error budgets, and author alerts that
page on user-visible symptoms rather than internal causes. Work read-first and optimize for
actionable alerts over dashboard sprawl.

## When to use this skill
When proactively adding or improving metrics/logs/traces, dashboards, SLOs, or alert rules.
Not for triaging a live outage in progress (that is incident response).

## Instructions
1. **Read what already exists.** Inspect current instrumentation, dashboards, and rule files
   (Prometheus rules, Grafana JSON, OpenTelemetry config) so you do not duplicate metrics or
   names. State scope in one line: instrumentation, dashboards, SLOs, or alerting — which service.
2. **Cover the three signals deliberately.**
   - **Metrics:** RED for request-driven services (Rate, Errors, Duration), USE for resources
     (Utilization, Saturation, Errors). Use correct types (counter/gauge/histogram); name with
     units (`_seconds`, `_bytes`, `_total`); keep label cardinality bounded — never put
     unbounded IDs in labels.
   - **Logs:** structured (JSON), with a correlation/trace ID and consistent levels.
   - **Traces:** propagate context across service boundaries; span slow/external calls.
3. **Define SLOs before alerts.** Pick user-centric SLIs (availability, latency at p95/p99,
   error rate), set an SLO target and error budget; alerts defend the budget.
4. **Write correct PromQL.** `rate()`/`increase()` on counters (never gauges),
   `histogram_quantile()` over `_bucket` series for latency, `sum by (...)`/`without` to
   aggregate before dividing. Guard ratios against divide-by-zero (`> 0`, `clamp_min`).
5. **Author alerts that page on symptoms.** Prefer multi-window, multi-burn-rate error-budget
   alerts over static thresholds; alert on user-visible symptoms (SLO burn), not internal
   causes (high CPU) that become noise. Every rule has a `for:` duration, severity labels, and
   an annotation linking a runbook + dashboard.
6. **Validate.** `promtool check rules <file>` and `promtool query instant` against sample
   data (or `amtool check-config` for Alertmanager); validate dashboard JSON. Confirm each
   alert would fire on the intended condition and not on benign blips.

## Inputs
- The service and its existing instrumentation/dashboards/rules, plus the SLO targets (or the
  inputs needed to propose them).

## Output
- A statement of what is now observable and what each new alert pages on (symptom + threshold).
- Instrumentation/PromQL/rule/dashboard changes as `path:line` diffs, with rationale for metric
  types, label sets, and burn-rate windows.
- The validation commands run (`promtool check rules`, etc.) and their results.

## Notes
- Avoid alert noise: every alert must be actionable and link a runbook, or it belongs as a
  dashboard panel, not a page. Watch label cardinality — a high-cardinality label can take down
  the metrics backend.
- This is proactive work; live-outage triage and mitigation belong to incident response.
- Fit the repo with [[match-project-conventions]]; confirm with [[verify-by-running]] that
  `promtool`/`amtool` passed (exact command + result), never claiming a rule is valid without
  the run.
