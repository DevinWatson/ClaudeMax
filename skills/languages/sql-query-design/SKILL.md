---
name: sql-query-design
description: Use when writing or correcting a SQL query for correctness — set semantics and JOIN fan-out, NULL three-valued logic, GROUP BY/aggregation edge cases, window functions and CTEs (including recursive), and dialect differences across Postgres/MySQL/SQLite/SQL Server. Verifies the result against sample data rather than trusting valid syntax. For a query that is correct but slow, this is NOT the skill — use plan/EXPLAIN analysis. Any agent authoring SQL (writer, reviewer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [sql, query, joins, null-handling, windows, dialects]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# SQL Query Design

The substantive SQL-correctness capability: reason about a query in set terms, get NULLs and
aggregation right, choose the right construct, account for dialect differences, and confirm
the *result*, not just the syntax.

## When to use this skill
When writing or correcting a SQL query for correctness — complex joins, window functions, CTEs
and recursion, grouping/aggregation edge cases, NULL semantics, or dialect portability. Do NOT
use it for performance tuning of an already-correct query; that is plan/EXPLAIN work.

## Instructions
1. **Reason about set semantics, not row-by-row.** Get JOINs right (inner vs. outer; beware
   fan-out from one-to-many joins inflating aggregates) and apply each predicate at the correct
   level — `ON` vs. `WHERE` vs. `HAVING`. Watch the `GROUP BY` rule for non-aggregated columns.
2. **Handle NULL three-valued logic explicitly.** `NULL = NULL` is unknown; use `IS [NOT] NULL`,
   `COALESCE`/`NULLIF`, and beware `NOT IN (subquery containing NULL)` (which yields no rows)
   and the difference between `COUNT(*)` and `COUNT(col)`.
3. **Choose the right construct.** Prefer window functions (`ROW_NUMBER`, `RANK`, `LAG`/`LEAD`,
   `SUM() OVER (...)`) for running totals and top-N-per-group, and CTEs (`WITH`, including
   `RECURSIVE`) for readable multi-step logic. Use a correlated subquery only when a join or
   window is not clearer.
4. **Mind dialect differences.** Write for the stated engine and call out where syntax diverges:
   `LIMIT`/`OFFSET` vs. `TOP`/`FETCH`, string concat (`||` vs. `CONCAT` vs. `+`), `RETURNING`,
   upsert (`ON CONFLICT` vs. `ON DUPLICATE KEY` vs. `MERGE`), boolean handling, and date/time
   functions.
5. **Establish the schema first.** Get table definitions, keys, nullability, and types, and the
   exact required result (including how to treat duplicates and NULLs) before writing. Never
   write against an assumed schema.
6. **Verify against data.** Where possible, run the query (or a representative subset) against
   sample data and check the result on edge cases — empty groups, ties, NULLs, duplicates —
   because valid syntax is not a correct result. If you cannot run it here, say so and give the
   exact query plus the sample data needed, rather than asserting correctness.

## Inputs
- The requirement (desired result, duplicate/NULL handling), the target engine and version, and
  the relevant schema (tables, keys, types, nullability).

## Output
- The query, formatted readably (uppercase keywords, aligned clauses, meaningful aliases).
- A one-line explanation of any non-obvious join, window, or NULL handling, the target dialect,
  and what would change for other engines.
- Sample input/output or the executed result if you were able to run it.

## Notes
- Correctness first: never hand over a query you have not reasoned through for duplicates and
  NULLs. Read-only by default — propose DML/DDL; do not execute mutations against a real
  database.
- When a wrong result is reported, reproduce it with the smallest dataset that exhibits the
  discrepancy, then correct the query.
