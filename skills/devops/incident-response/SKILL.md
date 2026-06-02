---
name: incident-response
description: Use during a live production incident — establish impact and severity, stop the bleeding with the fastest safe reversible mitigation (rollback > feature-flag > scale > failover/load-shed), confirm recovery on the defining signal, then write a blameless postmortem with timeline and owned action items. TRIGGER when users may be affected right now. Any agent that drives or reviews incident handling (an incident responder, an on-call SRE, a postmortem facilitator) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: devops
tags: [incident, oncall, mitigation, postmortem, sre]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Incident Response

The substantive capability for driving a live production incident to mitigation and then to a
blameless postmortem. The first job is to **stop user pain**, not to find the perfect
root-cause fix. Act read-first and bias toward fast, reversible mitigations.

## When to use this skill
When an incident is active and users may be affected — error spikes, outages, degradation.
Not for proactively building dashboards/SLOs/alerts.

## Instructions
1. **Assess impact and declare severity.** Quantify blast radius: what is broken, for whom,
   since when. Use the [[severity-triage]] rubric to set the SEV level and decide whether to
   page more responders. Anchor the timeline: what changed just before onset (deploy, config
   flip, traffic spike, dependency outage)?
2. **Mitigate before diagnosing.** Reach for the fastest *reversible* action that restores
   service, in rough order of preference:
   - **Roll back** the suspect deploy (`kubectl rollout undo`, revert the release, redeploy
     last-good image/tag).
   - **Toggle a feature flag** off, **scale** up/out, **fail over** to a healthy region/replica,
     **shed load** (rate-limit), or **drain** a bad node.
   Apply one change at a time and observe its effect; do not stack speculative changes.
3. **Confirm recovery on the signal.** Watch the SLI that defined the incident (error rate,
   latency, availability) return to normal. Declare mitigated only when the signal — not a
   hunch — shows recovery, and keep monitoring for regression.
4. **Find root cause after the fire is out.** Apply [[reproduce-then-fix]] to understand *why*
   it happened and land a durable fix as a separate, reviewed change — not in the heat of the
   incident.
5. **Write the blameless postmortem** with these sections:
   - **Summary** (one paragraph: what, impact, duration).
   - **Impact** (users/requests/revenue affected, SLO budget burned).
   - **Timeline** (UTC: detection → mitigation → resolution).
   - **Root cause** (the technical why; contributing factors).
   - **What went well / what went wrong / where we got lucky.**
   - **Action items** (each with an owner and a concrete due date; tag detection, mitigation,
     prevention).
   Focus on systems and gaps, never on blaming individuals.

## Inputs
- The current state: firing alerts, error/latency signals, recent deploys/config changes,
  dashboards — gathered read-only before any change.

## Output
- A status line: **ACTIVE / MITIGATED / RESOLVED**, SEV level, one-line impact.
- The mitigation taken and the signal/command proving recovery.
- The postmortem document (once resolved) following the sections above.

## Notes
- Mitigation over root-causing while users hurt; prefer reversible actions applied one at a
  time so the effect is attributable. Announce blast radius before any change that could
  worsen the incident; confirm destructive/irreversible steps.
- Postmortems are blameless: describe what the system allowed, not who erred. Do not declare
  RESOLVED unless the defining signal recovered and held.
