---
name: dbt-modeling
description: Use when authoring or reviewing dbt models, tests, and docs — staging→intermediate→marts layering, materializations (view/table/incremental/ephemeral), schema tests (unique/not_null/relationships/accepted_values), sources/snapshots, ref()/source() wiring, and Jinja macros. TRIGGER on writing a dbt model, choosing a materialization, adding tests on a grain, or fixing ref/source wiring and fan-out. A dbt model author or a reviewer checking layering/test coverage can both load it. NOT for general pipeline orchestration/ingestion and NOT for raw query/index performance tuning.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: data
tags: [dbt, modeling, sql, transformations, tests]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# dbt Modeling

The substantive dbt capability: author clean, well-tested, well-documented models inside the
transformation layer — layering, materializations, tests, sources/snapshots, and macros —
distinct from orchestration (etl-architect) and engine-level query tuning (sql-optimizer).

## When to use this skill
When authoring or reviewing dbt models/tests/docs: adding or changing a model, choosing a
materialization, wiring `ref()`/`source()`, adding schema/singular tests on a grain, declaring
sources/snapshots, or factoring Jinja macros. Not for designing the orchestrator that triggers
`dbt run` or for index/query-plan tuning.

## Instructions
1. **Establish the project conventions first.** Read `dbt_project.yml`, the existing `models/`
   tree, `sources.yml`/`schema.yml`, and any macros and `packages.yml` (e.g. `dbt_utils`,
   `dbt_expectations`). Match layer folders, naming (`stg_`, `int_`, `fct_`/`dim_`), and the
   configured warehouse adapter. Confirm scope in one line: which model(s)/tests you will touch.
2. **Respect the layering.**
   - **staging (`stg_`)** — 1:1 with a source; rename/cast/clean only, materialized as views,
     selecting from `{{ source(...) }}`. No joins or business logic.
   - **intermediate (`int_`)** — reusable joins/aggregations, never exposed directly.
   - **marts (`fct_`/`dim_`)** — business-grain facts and dimensions consumers query.
   - Always reference upstream models with `{{ ref('...') }}` and raw tables with
     `{{ source('...') }}` — never hard-code schema/table names.
3. **Choose materialization for cost/freshness, not by default.** `view` for thin staging;
   `table` for marts queried often; `incremental` for large append/update-heavy facts;
   `ephemeral` for small reused CTEs. For incremental, set a real `unique_key`, an
   `incremental_strategy` (`merge`/`delete+insert`/`insert_overwrite`) appropriate to the
   adapter, and guard with
   `{% if is_incremental() %} where <watermark> > (select max(...) from {{ this }}) {% endif %}`.
   Note when a `--full-refresh` is required after logic changes.
4. **Test what matters.** On every model add schema tests: `unique` + `not_null` on the
   grain/key, `relationships` for foreign keys, `accepted_values` for enums. Add freshness on
   sources. Write singular / `dbt_utils` / `dbt_expectations` tests for business invariants (row
   counts, non-negative amounts, no fan-out from joins). Tests are the contract — a model
   without a uniqueness test on its grain is unfinished.
5. **Document as you build.** Add model and column `description`s in `schema.yml`; declare
   `sources` with loaded-at freshness; use `snapshots` (timestamp/check strategy) for SCD-2
   history rather than hand-rolled change tracking.
6. **Factor with Jinja, but keep it readable.** Use macros for genuinely repeated logic
   (surrogate keys via `dbt_utils.generate_surrogate_key`, date spines, currency conversion).
   Avoid clever Jinja that obscures the compiled SQL. Watch for join fan-out and accidental
   many-to-many that inflate grain.
7. **Verify.** Run `dbt build --select <model>+` (runs and tests the model and its downstream)
   or `dbt run` + `dbt test`; inspect `target/compiled/...` to confirm the SQL is what you
   intend; check the model's grain with a uniqueness test. Report pass/fail (or state you
   couldn't run it and give the exact commands).

## Inputs
- The `dbt_project.yml`, the `models/` tree, `sources.yml`/`schema.yml`, macros and
  `packages.yml`, and the warehouse adapter in use.

## Output
```
Models: <files added/changed, with layer + materialization>
Lineage: <ref()/source() wiring; grain of each new mart>
Tests: <unique/not_null/relationships/accepted_values + any custom invariants>
Docs/snapshots: <descriptions / sources / snapshot strategy added>
Commands: dbt build --select ... (and result)
Notes: <full-refresh needed? incremental strategy + unique_key? fan-out risks>
```

## Notes
- Never select directly from a raw table or another model without `source()`/`ref()`.
- Never ship a mart without a uniqueness/not-null test on its declared grain.
- Stay in the transformation layer; surface ingestion/orchestration (etl-architect) and
  index/query-plan rewrites (sql-optimizer) as handoffs rather than doing them here.
