---
name: process-optimization
description: Use to analyze and improve a business/operations process — map the as-is flow (actor, action, system, handoff, process vs lead time), find bottlenecks/waste/handoff failures via Lean lenses, compute process efficiency, design a streamlined to-be flow, decide what to automate, and quantify before/after metrics. TRIGGER for onboarding, billing, support, fulfillment, hiring, or approval workflows. NOT software CI/CD pipelines (that is devops). Any agent improving operational throughput (process optimizer, ops-audit agent, workflow-redesign facilitator) can load it.
allowed-tools: Read, Grep, Glob, Write
category: business
tags: [process, operations, lean, optimization, value-stream]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Process Optimization

The substantive capability for mapping a business or operations process, finding where time,
value, and quality leak out, and proposing a streamlined flow with measurable before/after
impact — thinking in Lean / value-stream terms: maximize value-added time, cut waste, fix handoffs.

## When to use this skill
When optimizing a human/operational business process — onboarding, billing, support, order
fulfillment, hiring, approvals. Composes [[assumption-hygiene]] so before/after estimates are
labeled as estimates. Not for optimizing software build/test/deploy pipelines (CI/CD) — that is
a devops concern; route deployment pipelines there.

## Instructions
1. **Map the current state ("as-is").** List steps in order with actor, action, system, and the
   handoff to the next step. Capture where known: **process time** (touch time) vs **lead time**
   (elapsed incl. waiting) and rework/error rate. Mark every handoff — handoffs are where work
   waits and context is lost.
2. **Find the waste and bottlenecks.** Use Lean waste lenses (waiting, rework/defects,
   over-processing, unnecessary handoffs/motion, manual re-entry, no-value approvals). The
   **bottleneck** caps throughput — find it explicitly (longest lead time / queue). Flag handoff
   failures: dropped context, duplicate entry, ambiguous ownership. Compute **process efficiency**
   = value-added time / total lead time; a low ratio shows how much is pure waiting.
3. **Design the future state ("to-be").** Streamline: remove/merge steps, parallelize where
   ordering isn't required, eliminate redundant approvals, fix ownership at each handoff. Relieve
   the bottleneck first — improving non-bottleneck steps won't raise throughput.
4. **Decide what to automate.** Recommend automation only for high-volume, rule-based,
   low-judgment steps (data entry, routing, notifications, status updates). Don't automate a broken
   process — fix/simplify first, then automate. Note effort vs payoff for each.
5. **Quantify before/after.** Estimate improvement in lead time, process efficiency, error/rework
   rate, throughput, cost/unit, manual touches. State the assumptions behind each estimate per
   [[assumption-hygiene]]. Recommend a metric to monitor post-change.

## Inputs
- The process, its trigger (what starts it) and end state (what "done" means), the actors/teams,
  the volume/frequency, and any SOPs/tickets/metrics. If the flow isn't documented, reconstruct
  it from inputs and state assumptions — you can't improve what you haven't mapped.

## Output
Write a durable artifact when expected (e.g. `docs/process-optimization.md`); else inline:
```
Process · trigger → end state · actors · volume/frequency
As-is map: step | actor | system | process time | lead time | handoff | issue
Bottleneck: <throughput-capping step> · Process efficiency: <VA time / lead time>
Waste & handoff failures (ranked by impact)
To-be map: streamlined steps (removed/merged/parallelized; ownership fixed)
Automation candidates: step → rule-based? → effort vs payoff
Before → after: lead time | efficiency | error rate | throughput | cost | manual touches (+ assumptions)
Risks / change-management notes · Metric to monitor
```
Every improvement claim ties to a mapped step and a stated assumption.

## Notes
- Map before you optimize; don't propose changes to a flow you haven't laid out step by step.
- Don't automate a broken process — simplify first. Fix the bottleneck and handoffs first;
  optimizing non-constraint steps is local, not global.
- Quantify with stated assumptions; flag estimates as estimates, never as measured results.
