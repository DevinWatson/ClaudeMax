---
name: load-test-authoring
description: Use when authoring load / performance / stress / soak tests (k6, Locust, or JMeter) that generate traffic against a system and assert on SLAs — modeling realistic scenarios with ramp-up and think-time, setting thresholds on p95/p99 latency, error rate, and throughput, then running headless and interpreting results (percentiles, saturation/knee). TRIGGER on writing a load test or measuring whether a system meets performance SLAs. Any agent that authors or reviews performance tests (a load-test author, a capacity/SRE reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: qa
tags: [testing, load, performance, k6, locust]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Load Test Authoring

The substantive capability for load/performance tests that model realistic traffic and assert
measurable SLAs: generate load and judge whether the system meets its targets — without tuning
the database or instrumenting the app.

## When to use this skill
When writing a load/stress/spike/soak test, or measuring a system against p95/p99 latency,
error-rate, and throughput SLAs. Not for single-query SQL/DB tuning and not for building app
metrics/dashboards/tracing.

## Instructions
1. **Detect or pick the tool, and fix the SLA.** Look for existing k6 `*.js` scripts, a
   `locustfile.py`, or `.jmx` plans and match them; otherwise default to k6. Establish the SLA
   up front (e.g. p95 < 300ms, error rate < 1%, sustain 200 RPS); a load test without a
   pass/fail threshold is noise. Identify the target endpoint(s) and the test environment —
   never accidentally point at production. State scope in one line.
2. **Model the scenario realistically.** Map the user journey and request mix, including
   think-time between steps. Choose the profile to the question being asked:
   - **load** — expected peak, sustained.
   - **stress** — ramp past peak to find the breaking point.
   - **spike** — sudden surge then drop.
   - **soak** — moderate load over a long duration to catch leaks/degradation.
3. **Write the script with stages and thresholds** so the run exits non-zero on breach:
   - k6: `export const options = { stages: [...], thresholds: { http_req_duration:
     ['p(95)<300','p(99)<500'], http_req_failed: ['rate<0.01'] } }`; `sleep()` for think-time,
     `check()` per response, custom `Trend`/`Rate` for business steps.
   - Locust: `HttpUser` with `@task` weights and `wait_time = between(1, 3)`; assert via
     `--check-rps`/`--check-fail-ratio` or post-run stats.
   - JMeter: thread groups with ramp-up, timers for think-time, assertions, non-GUI run.
4. **Run headless/CLI** against the test environment: `k6 run script.js` (`--out json=...` to
   capture), `locust --headless -u <users> -r <rate> -t <time>`, or `jmeter -n -t plan.jmx -l
   results.jtl`. Warm up first; ensure the load generator itself isn't the bottleneck.
5. **Interpret against the SLA.** Report percentiles (p95/p99, never the misleading mean),
   error rate, throughput (RPS), and where it broke down. Note the knee in the
   latency-vs-load curve and whether each threshold passed or failed.

## Inputs
- The target endpoint(s), the test environment and any auth/setup, the SLA targets, and any
  existing load-test scripts to match.

## Output
- The load-test script with explicit stages/ramp, think-time, and SLA thresholds.
- The run command and the target environment used.
- A results summary: p95/p99 latency, error rate, throughput, pass/fail vs. each threshold,
  and the observed saturation/breaking point.
- A short interpretation: does it meet SLA and the top bottleneck signal (without prescribing
  the fix — that's for the relevant specialist).

## Notes
- Never run load against production or shared environments without explicit confirmation;
  state the target before running. Always assert on percentiles and error rate, never averages
  alone. Keep the load generator honest (confirm headroom) so you measure the system.
- Fit the repo with [[match-project-conventions]]; confirm with [[verify-by-running]] — report
  the exact run command and observed results, never an SLA pass/fail you did not measure.
