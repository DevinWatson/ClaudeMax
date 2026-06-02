---
name: sql-explain-analysis
description: Use when diagnosing why a SQL query is slow — guides reading an EXPLAIN/EXPLAIN ANALYZE plan, spotting the common culprits (full scans, bad join order, missing indexes, spills), and proposing targeted fixes. Database-agnostic with Postgres/MySQL notes.
category: data
tags: [sql, performance, explain, indexing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# SQL EXPLAIN Analysis

A repeatable procedure for turning a query plan into a concrete optimization.

## When to use
A query is slow and you have (or can obtain) its execution plan.

## Instructions
1. **Capture the plan.**
   - Postgres: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <query>;`
   - MySQL: `EXPLAIN ANALYZE <query>;` (8.0+) or `EXPLAIN FORMAT=JSON`.
   - If you cannot run it, ask for the plan output rather than guessing.
2. **Find the dominant node.** Read from the most expensive/innermost node outward.
   Compare estimated vs. actual rows — large divergence means stale statistics.
3. **Check for the usual culprits:**
   - Sequential/full scan on a large table where a selective index would help.
   - Nested-loop join over many rows (often a missing index on the join key).
   - Sort/hash spilling to disk (work_mem / sort buffer too small, or avoidable sort).
   - Functions wrapping an indexed column (`WHERE lower(email) = …`) defeating the index.
   - `SELECT *` pulling wide rows; implicit type casts on join/filter columns.
4. **Propose the minimal fix** and predict its effect:
   - Add/adjust an index (state the exact columns and order; consider covering indexes).
   - Rewrite the predicate to be sargable.
   - Restructure the join or add a missing filter.
   - Update statistics (`ANALYZE`) if estimates are off.

## Output
```
Bottleneck: <node + why it dominates>
Root cause: <the underlying reason>
Fix: <specific DDL/SQL change>
Expected effect: <what improves and roughly why>
Verify with: <the EXPLAIN command to re-run to confirm>
```

## Notes
- Always re-measure after a change; a plan that looks better can regress under real data
  distribution. Never claim a speedup you have not observed or cannot justify from the plan.
