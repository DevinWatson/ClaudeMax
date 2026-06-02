---
name: cost-optimization
description: Use when analyzing or reducing the compute, cloud, or resource cost of a system — attributing spend to its drivers, right-sizing instances/containers/storage, cutting wasteful egress and storage tiers, improving query and compute efficiency, adding caching/batching, and weighing each FinOps change against its performance and reliability cost. TRIGGER on a cost-reduction goal, a bill spike, or a cost review — not on raw runtime performance tuning for its own sake. Language- and framework-agnostic — the cost reasoning; the runtime/query specifics come from a separate language capability the agent also composes. Any agent that analyzes spend (a FinOps engineer, a platform reviewer, an architect weighing cost trade-offs) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: devops
tags: [cost, finops, cloud, right-sizing, caching, efficiency]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# Cost Optimization

The substantive capability for reducing the cost of running software: find where the money actually
goes, attack the biggest drivers first, and weigh each saving against its effect on performance and
reliability — independent of the language. The concrete query/runtime details come from the composed
language capability.

## When to use this skill
When the goal is to lower compute/cloud/resource cost, explain a bill, or review a design for cost.
Not for performance tuning purely for latency (that is a performance/profiling capability, though they
overlap), and not for capacity planning for reliability (that is reliability-engineering). Pairs with
[[software-architecture]] (cost is a quality attribute) and [[assumption-hygiene]] (cost claims need
evidence).

## Instructions
1. **Attribute spend to drivers.** Before changing anything, find where cost actually concentrates:
   break the bill down by service/resource (compute, storage, network/egress, managed services, data
   transfer) and by workload. Optimize the top drivers — a 10% cut on 70% of the bill beats a 90% cut on
   2%. State the baseline.
2. **Right-size compute.** Compare provisioned vs. actually-used CPU/memory for instances, containers,
   and functions; downsize over-provisioned resources and set requests/limits to real usage plus
   headroom. Eliminate idle and zombie resources (unattached volumes, idle environments, oversized
   always-on services). Consider spot/preemptible for fault-tolerant workloads and committed/reserved
   pricing for steady ones.
3. **Cut storage and egress waste.** Move cold data to cheaper tiers and set lifecycle/expiry policies;
   delete orphaned data and snapshots. Attack egress: cross-AZ/cross-region and internet egress are
   often a hidden top driver — colocate chatty components, cache at the edge, and avoid needless data
   movement.
4. **Improve compute and query efficiency.** Reduce the work itself: inefficient queries
   (full scans, N+1, missing predicates/partitioning), redundant recomputation, and over-fetching cost
   compute directly. Defer the exact query/runtime fix to the composed language/data capability, but
   identify the costly pattern.
5. **Add caching and batching where it pays.** Cache expensive, reused results; batch many small calls
   into fewer larger ones to cut per-request overhead and egress. Weigh the cost of the cache
   (memory/infrastructure, staleness risk) against the saving — caching is not free.
6. **Weigh the FinOps trade-off explicitly.** For each change state the estimated saving and what it
   costs in performance, reliability, complexity, or developer time. Spot pricing trades cost for
   availability; aggressive downsizing trades cost for headroom. Never recommend a saving that breaks an
   SLO without saying so.
7. **Quantify and verify.** Estimate the saving per recommendation and, where possible, validate the
   driver with real data via [[verify-by-running]] (cost export, usage metrics, query plans). Rank
   recommendations by saving ÷ effort/risk.

## Inputs
- The cost/usage data (bill breakdown, utilization metrics, query plans, traffic), the system
  architecture, and the SLO/performance constraints any change must respect.

## Output
- The baseline attribution: where spend concentrates, by driver.
- Ranked recommendations, each with: the driver attacked, the change, the estimated saving, and the
  performance/reliability/complexity trade-off.
- The evidence used (usage data, query plans) and any change that would risk an SLO, flagged explicitly.

## Notes
- Right-size on measured usage, not guesses — and always leave headroom for peak and growth.
- A cheaper system that misses its SLO is not cheaper; state every trade-off.
- Stay language-agnostic; the exact query rewrite or runtime flag belongs to the composed language/data
  capability.
