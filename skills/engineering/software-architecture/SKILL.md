---
name: software-architecture
description: Use when designing or reviewing the structure of a system, service, or module — defining component boundaries and responsibilities, managing coupling and cohesion, mapping data flow and interface contracts, weighing trade-offs against quality attributes, and recording the decision as an ADR with an eye to evolvability. TRIGGER before building something non-trivial, when splitting/merging modules or services, or when reviewing a design proposal. Language- and framework-agnostic — shapes boundaries and contracts, not implementation; the language specifics come from a separate language capability the agent also composes. Any agent that designs or reviews structure (a system architect, a staff engineer doing design review, a migration planner) can load it.
allowed-tools: Read, Grep, Glob, Write
category: engineering
tags: [architecture, design, boundaries, coupling, adr, trade-offs]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# Software Architecture

The substantive structural-design capability: decide where boundaries go, what each component owns,
how data and control flow across contracts, and what trade-offs the design accepts — independent of
the language that implements it. Optimize for the quality attributes that actually matter to this
system and make every significant choice traceable.

## When to use this skill
When designing a new system/service/module, restructuring an existing one, or reviewing a design
proposal for soundness. Not for low-level code structure within a single function/class (that is
refactoring) and not for the API wire contract alone (that is rest-api-design / protobuf-schema-design,
which this composes). Pairs with [[assumption-hygiene]] (surface unstated assumptions).

## Instructions
1. **Establish drivers and constraints.** Capture the functional needs, the dominant quality
   attributes (e.g. latency, throughput, availability, security, cost, time-to-market), and the hard
   constraints (team, existing systems, compliance, deadlines). Rank them — you cannot maximize all,
   so name which attributes win when they conflict.
2. **Define boundaries by responsibility.** Decompose into components/services/modules each owning one
   cohesive responsibility and one reason to change. Put the boundary where the rate of change or the
   ownership differs. Favor high cohesion inside a boundary and low coupling across it.
3. **Map data and control flow.** For each interaction, state who calls whom, sync vs async, the data
   that crosses, and who owns each piece of state (single source of truth). Watch for cyclic
   dependencies, chatty cross-boundary calls, and shared mutable state — call them out.
4. **Specify interface contracts.** Define the contract at each boundary: the operations, the data
   shapes, the error/failure semantics, and the compatibility expectations. Keep contracts narrow and
   explicit; hide internals behind them. Defer to the relevant wire-contract capability for the exact
   schema.
5. **Analyze trade-offs explicitly.** For each significant decision present at least two viable
   options with their consequences against the ranked quality attributes — do not present a single
   choice as if it were the only one. State what each option costs (complexity, latency, operability,
   lock-in).
6. **Plan for evolvability.** Identify the parts most likely to change and ensure the boundaries
   isolate that change. Note the migration/extension path and any one-way-door decisions that are
   expensive to reverse.
7. **Record the decision (ADR).** Write a short Architecture Decision Record: context, the options
   considered, the decision, and its consequences. One ADR per significant decision; date and status it.

## Inputs
- The problem/requirements, the relevant quality attributes and constraints, and the existing system
  (code, services, data stores, current diagrams) the design must fit or replace.

## Output
- A boundary/responsibility map (components and what each owns) and a data-/control-flow description.
- The interface contracts at each boundary (operations, data, failure semantics, compatibility).
- A trade-off analysis: the options weighed and why the chosen one wins for the ranked attributes.
- An ADR per significant decision and a note on evolvability / one-way-door risks.

## Notes
- Prefer the simplest structure that satisfies the drivers; justify every added boundary, indirection,
  or service by a real attribute, not by speculation.
- Make trade-offs visible — a design without stated rejected alternatives is an assertion, not a design.
- Stay at the structural layer; algorithms, types, and framework idioms belong to the composed language
  capability.
