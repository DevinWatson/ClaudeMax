---
name: reliability-engineering
description: Use when designing or reviewing a system for resilience and availability — defining SLIs/SLOs and error budgets, analyzing failure modes, applying timeouts/retries-with-backoff/circuit-breakers/backpressure correctly, designing graceful degradation and load shedding, planning capacity, and validating with readiness/chaos checks. TRIGGER on reliability/resilience design or review, or hardening a service against partial failure — not on triaging a live outage. Language- and framework-agnostic — the resilience patterns and their failure semantics; the library specifics come from a separate language capability the agent also composes. Any agent that designs for resilience (an SRE, a backend reviewer, a platform engineer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: devops
tags: [reliability, resilience, slo, error-budget, circuit-breaker, backpressure]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# Reliability Engineering

The substantive capability for designing systems that stay up under partial failure: define what
reliable means (SLOs), find how the system breaks (failure modes), apply the resilience patterns with
their correct semantics, and degrade gracefully instead of cascading. Independent of the language; the
concrete client/library belongs to the composed language capability.

## When to use this skill
When designing or reviewing a system for resilience, availability, or fault tolerance — or hardening a
service against dependency failure, overload, and partial outages. Not for triaging a live incident
(that is incident-response) and not for instrumenting the signals themselves (that is
observability-instrumentation, which this composes for SLO measurement). Pairs with
[[software-architecture]] (where the boundaries are).

## Instructions
1. **Define reliability targets.** Pick user-centric SLIs (availability, latency at p95/p99, error
   rate, correctness) and set SLO targets with an error budget. The budget is the decision rule:
   reliability work is justified by budget burn, not by fear. State the targets before designing
   mechanisms.
2. **Analyze failure modes.** Enumerate how each dependency and component can fail — slow, erroring,
   unavailable, partially available, returning bad data — and the blast radius of each. Identify single
   points of failure, shared fate, and the dependency chains where one slow service stalls everything
   upstream.
3. **Apply call-resilience patterns correctly.** For every cross-boundary call: a bounded **timeout**
   (always — an unbounded call is the classic outage); **retries** only for idempotent operations, with
   exponential backoff + jitter and a cap (never retry a non-idempotent write blindly, never retry into
   an overloaded dependency); a **circuit breaker** to stop hammering a failing dependency and to fail
   fast; **bulkheads** to isolate resource pools so one dependency can't exhaust them all.
4. **Design backpressure and load shedding.** Bound queues and concurrency; reject or shed low-priority
   work early (with `429`/`503` + `Retry-After`) rather than collapsing under unbounded queueing. Prefer
   shedding load to falling over. Make timeouts shorter as you go deeper so callers give up before
   callees pile up.
5. **Design graceful degradation.** For each dependency failure, define the degraded behavior: serve
   stale/cached data, a reduced feature, or a clear error — not a hang or a cascade. Keep the core path
   working when a non-critical dependency is down.
6. **Plan capacity.** Estimate load (steady + peak), headroom, and the autoscaling/limits that keep the
   system inside its SLO under expected and surge traffic. Identify the resource that saturates first.
7. **Validate resilience.** Define readiness/liveness criteria and validate the design with failure
   injection / chaos experiments (kill a dependency, add latency, drop the network) — confirm the system
   degrades as designed, not catastrophically. Run available checks via [[verify-by-running]] and report
   results.

## Inputs
- The system/service and its dependencies, the current SLOs (or inputs to set them), the expected load,
  and any existing resilience config (timeouts, retry policies, autoscaling).

## Output
- The SLIs/SLOs and error budget, and a failure-mode analysis (how each part fails + blast radius).
- The resilience design: per-call timeout/retry/circuit-breaker/bulkhead decisions, backpressure/load-
  shedding, and the graceful-degradation behavior for each dependency failure — each with rationale.
- The capacity plan and the validation (readiness criteria + chaos/failure-injection results).

## Notes
- Retries amplify outages: retry only idempotent calls, always with backoff+jitter and a budget, and
  back off when the dependency is already failing.
- Shedding load beats falling over — bound every queue and reject early.
- Stay language-agnostic; the specific HTTP/gRPC client, retry library, and breaker implementation belong
  to the composed language capability.
