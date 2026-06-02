---
name: protobuf-schema-design
description: Use when designing or evolving Protocol Buffers / gRPC schemas — modeling proto3 messages and services, assigning and reserving field numbers, applying the backward/forward-compatibility rules so old and new code interoperate, detecting breaking changes before they ship, reasoning about wire-format and safe evolution, and organizing for codegen. TRIGGER on writing or changing a `.proto`, adding a gRPC service/method, or reviewing a proto diff for compatibility. Language- and framework-agnostic — the schema and wire contract; the generated-code/runtime specifics come from a separate language capability the agent also composes. Any agent that owns protobuf schemas (a schema designer, an API reviewer, a gRPC service author) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: data
tags: [protobuf, proto3, grpc, schema, compatibility, wire-format]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Protobuf Schema Design

The substantive capability for designing and evolving Protobuf/gRPC schemas: model messages and
services correctly, manage field numbers, and apply the compatibility rules so a schema change never
breaks a deployed peer — independent of the language the code is generated into. The generated-code and
runtime details come from the composed language capability.

## When to use this skill
When authoring or changing a `.proto` file, defining a gRPC service, or reviewing a proto diff for
compatibility. Not for a JSON/HTTP REST contract (that is rest-api-design) and not for consumer-driven
contract tests (that is contract-testing). Pairs with [[software-architecture]] (the service
boundaries) and [[verify-by-running]] (run the breaking-change detector).

## Instructions
1. **Model messages around stable meaning.** Use proto3. Choose field types deliberately (scalar vs.
   message, `enum`, `map`, `repeated`, `oneof` for mutually-exclusive variants); prefer well-known types
   (`Timestamp`, `Duration`, `Struct`) over reinventing them. Name fields by meaning, not by their
   current representation, so the meaning survives evolution.
2. **Assign and protect field numbers.** Field numbers are the wire identity — they are forever. Use
   1–15 (one-byte tags) for the most frequent fields. Never reuse or renumber a field. When you remove a
   field, **`reserved`** its number (and name) so it can never be reassigned to a different meaning — the
   single most common cause of silent data corruption.
3. **Apply the compatibility rules.** Know what is safe vs. breaking on the wire:
   - **Safe (compatible):** adding a new field with a new number; adding a value to an `enum`; adding a
     method/service. Old readers ignore unknown fields; new readers see absent fields as default.
   - **Breaking:** changing a field's number, changing its type incompatibly, reusing a removed number,
     renaming an `enum` value's number, moving a field in/out of a `oneof`, or changing
     `repeated`↔singular.
   Treat field removal as: stop using it, then `reserved` it — not delete-and-reuse.
4. **Reason about wire format and defaults.** Remember proto3 has no presence for scalars by default
   (a zero value and an unset value look the same on the wire) — use `optional` (explicit presence) or a
   wrapper/`oneof` when "unset vs. zero" matters. Understand that varint/length-delimited encoding makes
   certain type changes (e.g. `int32`↔`int64`) compatible and others not.
5. **Design services for evolution.** For gRPC, give each method a dedicated request and response
   *message* (not bare scalars) so fields can be added later without changing the method signature.
   Choose unary vs. streaming intentionally. Keep one logical service cohesive.
6. **Detect breaking changes mechanically.** Before shipping a proto change, run a breaking-change
   detector (e.g. `buf breaking` against the previous version) and a linter (`buf lint`) via
   [[verify-by-running]] — don't rely on eyeballing the diff. Report the command and result; treat any
   wire/source-breaking finding as blocking unless a coordinated migration is planned.

## Inputs
- The data/service to model (or the existing `.proto` to evolve), the previous schema version for
  comparison, the deployment reality (are producers and consumers upgraded together or independently?),
  and the codegen toolchain.

## Output
- The `.proto` definitions (messages/enums/services) with deliberate field numbering and `reserved`
  entries for any removals.
- A compatibility assessment of the change: each field/message change classified safe vs. breaking, with
  the rule behind it.
- The breaking-change-detector and lint results via [[verify-by-running]] (exact command + outcome), with
  any breaking change called out and its migration path.

## Notes
- Field numbers are permanent — never reuse one; `reserved` every removed number and name.
- "Unset vs. zero" is invisible for proto3 scalars without `optional`/wrapper — model presence
  explicitly when it matters.
- Stay at the schema/wire layer; generated-code ergonomics and runtime usage belong to the composed
  language capability.
