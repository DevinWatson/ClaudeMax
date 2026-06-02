---
name: relational-data-modeling
description: Use when designing or evolving a relational schema — choosing normalization vs. deliberate denormalization, keys and constraints, indexing strategy, partitioning, data types, and safe schema evolution/migration shape. Engine-agnostic schema design; the SQL dialect specifics of writing queries against it come from sql-query-design. TRIGGER when a new table/schema is needed, an existing one must change, or a model is causing anomalies/bloat. Any DBA, data-engineer, or SQL data-modeler agent can load it.
allowed-tools: Read, Grep, Glob
category: data
tags: [data-modeling, schema, normalization, indexing, partitioning, migrations]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Relational Data Modeling

The substantive schema-design capability: turn entities and access patterns into a correct,
maintainable relational model — keys, constraints, indexes, partitioning, and a safe path for
evolving it over time.

## When to use this skill
When designing a new table or schema, evolving an existing one, or diagnosing a model that is
producing anomalies, redundancy, or bloat. Use it for the *shape* of the data (structure, keys,
constraints, indexes, partitions, evolution). Do NOT use it for writing/correcting individual
queries or dialect query syntax — that is sql-query-design — nor for tuning a specific slow
query from its plan — that is plan/EXPLAIN work.

## Instructions
1. **Model the entities and relationships first.** Enumerate the entities, their attributes, and
   the cardinality of each relationship (1:1, 1:N, M:N). Resolve every M:N with a junction table.
   Identify the natural key of each entity before deciding on a surrogate.
2. **Choose keys deliberately.** Pick a primary key per table; prefer a stable surrogate
   (identity/sequence/UUID) when the natural key is wide, mutable, or externally controlled, but
   keep a UNIQUE constraint on the natural key to preserve integrity. State the UUID tradeoff
   (random UUIDv4 fragments index locality; prefer ordered keys or UUIDv7 for high-insert tables).
3. **Normalize to 3NF/BCNF by default, then denormalize only with a reason.** Eliminate update
   anomalies and redundant storage first. Denormalize (duplicated columns, pre-joined/rollup
   tables, arrays/JSON columns) only for a measured read pattern, and record what now has to be
   kept in sync and how.
4. **Enforce integrity with constraints, not application code.** Add NOT NULL, UNIQUE, CHECK,
   foreign keys with explicit ON DELETE/ON UPDATE behavior, and defaults. Make illegal states
   unrepresentable in the schema wherever feasible.
5. **Choose precise data types.** Use the narrowest correct type; exact numerics (DECIMAL) for
   money, not floats; timezone-aware timestamps; native ENUM or a lookup table over free text;
   and appropriate text vs. bounded varchar. Avoid storing numbers/dates as strings.
6. **Design the indexing strategy from the access patterns.** Index foreign keys and frequent
   filter/join/sort columns; order composite-index columns by selectivity and query shape
   (equality before range); consider covering and partial indexes. Note that every index is a
   write cost — do not over-index.
7. **Decide partitioning only when justified by scale.** For very large or time-series tables,
   consider range/list/hash partitioning (e.g., by date) to bound index size and enable cheap
   archival/drop. Align the partition key with the dominant query and retention pattern; do not
   partition small tables.
8. **Plan schema evolution as safe, reversible steps.** Prefer additive, backward-compatible
   changes; expand-then-contract for renames/type changes (add new, backfill, switch reads/writes,
   drop old). Flag locking/rewrite risks of altering large tables and the need to backfill in
   batches. Every change should have a forward migration and a rollback.

## Inputs
- The entities and their relationships, the dominant access patterns (reads vs. writes, query
  shapes), expected data volume and growth, integrity rules, and the target engine/version (for
  type and partitioning capabilities). For an evolution, the current DDL and what must change.

## Output
- The proposed schema as DDL (tables, columns with precise types, keys, constraints), plus the
  index list with a one-line rationale per non-obvious index.
- The normalization stance (and any deliberate denormalization with its sync obligation),
  partitioning decision, and — for an evolution — the ordered, reversible migration steps with
  any locking/backfill risk called out.

## Notes
- Read-only by default: propose DDL/migrations; do not execute mutations against a real database.
- Correctness and integrity over premature optimization — only denormalize, index, or partition
  against an actual access pattern, and say what each costs.
- Hand off query authoring against the model to sql-query-design and slow-query plan tuning to
  EXPLAIN analysis.
