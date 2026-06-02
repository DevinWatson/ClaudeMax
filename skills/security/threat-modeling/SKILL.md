---
name: threat-modeling
description: Use to threat-model a system or feature at the architecture level — map a data-flow diagram with trust boundaries, enumerate threats per element with STRIDE, build attack trees for the top assets, and propose mitigations mapped to threats (eliminate vs. reduce, with residual risk). TRIGGER when designing or reviewing a system/feature for security before code, at the level of components, flows, and boundaries — not line-by-line code review. Defensive only. Any agent that reasons about design-level security (a threat modeler, a security architect, a design reviewer) can load it.
allowed-tools: Read, Grep, Glob
category: security
tags: [security, threat-modeling, stride, attack-trees, architecture]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Threat Modeling

The substantive design-level security capability: model a system the user is authorized to
design or review so its design can be hardened *before* code is written — working at components,
data flows, and trust boundaries, not individual lines of code.

## When to use this skill
When evaluating an architecture, feature, or design for security threats: producing a
STRIDE/attack-tree threat model with trust boundaries, a data-flow diagram, and ranked
mitigations. Pairs with a ranking skill (e.g. [[severity-triage]]) to score threats. Not for
code-level vulnerability review (that is appsec-review) — hand concrete code findings there.

## Instructions
1. **Establish system context.** What the system does, its actors, the valuable assets (data,
   funds, availability, reputation), and the assumed adversaries (anonymous internet user,
   authenticated tenant, malicious insider, compromised dependency). Read any architecture docs,
   diagrams, API specs, or IaC available. State the modeled boundary and what is out of scope.
2. **Map the system as a data-flow diagram (DFD).** Enumerate external entities, processes, data
   stores, and the flows between them. Draw **trust boundaries** wherever data crosses a
   privilege/ownership/network change (internet→edge, service→service, app→DB, tenant→tenant,
   user-space→admin). Render the DFD as a Mermaid diagram.
3. **Enumerate threats per element with STRIDE.** For each process and each flow crossing a trust
   boundary, walk the categories:
   - **S**poofing — impersonation (weak/absent authn, token replay).
   - **T**ampering — modification in transit or at rest (missing integrity, no TLS).
   - **R**epudiation — denying an action later (missing/weak audit logging).
   - **I**nformation disclosure — leaking confidential data (over-broad responses, logs).
   - **D**enial of service — degrading availability (unbounded work, no rate limits).
   - **E**levation of privilege — gaining higher rights (design-level IDOR, trust-boundary
     confusion, SSRF reaching internal services).
4. **Build attack trees for the top risks.** For the 2–4 most valuable assets, decompose the
   attacker goal into AND/OR sub-goals to expose the cheapest realistic attack path and where one
   mitigation cuts the most branches.
5. **Propose mitigations mapped to threats.** Give a concrete control per threat (validate JWT
   `aud`/`iss`; enforce row-level tenant scoping in the query layer; allowlist egress to block
   SSRF; idempotency keys + rate limit). Distinguish controls that *eliminate* a threat from
   those that *reduce* it, and flag accepted residual risk.
6. **Rank for the consumer.** Hand each threat to a ranking skill ([[severity-triage]]) scored by
   impact and likelihood, with confidence; suppress speculative low-impact noise and note where
   information was missing to judge likelihood.

## Inputs
- The system/feature description, any architecture docs/diagrams/API specs/IaC, the assets, and
  the assumed adversaries and scope boundary.

## Output
- System and scope summary (assets, adversaries, out-of-scope).
- A Mermaid data-flow diagram with trust boundaries labeled.
- Threats, each with: element, STRIDE category, the threat, the attack path, and a specific
  mitigation (eliminate vs. reduce) — ready to be severity-ranked.
- Attack trees for the top assets, and residual risks/assumptions.

## Notes
- Defensive only. Identify threats and design-level controls; never produce weaponized exploits
  or guidance for attacking systems the user does not own.
- Stay at the design level. A concrete code-level vulnerability gets named and handed to
  appsec-review rather than reviewed line-by-line here.
- Be honest about likelihood; mark unconfirmable threats as speculative and state what is missing.
