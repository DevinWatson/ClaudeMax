---
name: r-idioms
description: Use when writing or fixing R code — vectorized expressions over loops, data frames and tibbles, the tidyverse (dplyr/tidyr/purrr pipelines with |> and %>%), factors, the apply family and functional style, NA/NULL handling, the S3/S4/R5/R6 object systems, environments and lazy evaluation/NSE, package structure (DESCRIPTION/NAMESPACE/roxygen2), reproducibility with renv, and Rcpp for performance. Verifies with Rscript, testthat, lintr, styler, and R CMD check. Any agent touching R (writer, reviewer, debugger, a data-science or Shiny team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [r, tidyverse, vectorization, data-frames, reproducibility]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# R Idioms

The substantive R capability: write clear, vectorized, idiomatic R — across base R, the
tidyverse, and R's object systems — and verify it with the project's tooling.

## When to use this skill
When authoring, reviewing, or debugging R and any of these is involved: a slow or
unidiomatic loop that should be vectorized, a data-frame/tibble or tidyverse pipeline
question, an NA/NULL or factor surprise, a choice among the S3/S4/R5/R6 object systems,
non-standard evaluation (NSE)/environment behavior, package structure
(DESCRIPTION/NAMESPACE/roxygen2), reproducibility (renv), or an Rcpp performance path.
Common contexts: data analysis, statistics/modeling, Shiny, and bioinformatics. Not
needed for a trivial edit with no vectorization, data-shape, object-system, or build
dimension.

## Instructions
1. **Vectorize first.** Prefer whole-object, vectorized operations and the apply family
   (`vapply`/`lapply`/`Map`) or `purrr::map_*` over explicit `for` loops; pre-allocate and
   never grow a vector in a loop. Reach for a loop only when iterations are genuinely
   dependent. Keep functions pure where possible and use the functional style R rewards.
2. **Pick the right tabular tool and pipeline.** Use data frames/tibbles deliberately;
   express transformations as readable `dplyr`/`tidyr`/`purrr` pipelines with the native
   `|>` (or `%>%` to match an existing codebase). Reach for `data.table` when the data is
   large or the operation is hot. Be explicit about column types and factor levels rather
   than relying on defaults.
3. **Handle NA/NULL and factors correctly.** Distinguish `NA` (missing), `NULL` (absent),
   `NaN`, and zero-length vectors; use `is.na()`/`is.null()` and the `na.rm`/`na_matches`
   arguments rather than silent coercion. Treat factor levels as data — control them
   explicitly (e.g. `forcats`) and never compare factors as if they were strings.
4. **Choose the object system deliberately.** S3 for lightweight generic dispatch, S4 when
   you need formal classes/validity/multiple dispatch, R5/R6 for mutable reference
   semantics. Match the system already used in the codebase; do not mix paradigms without
   reason. Be aware of copy-on-modify and reference semantics when reasoning about state.
5. **Reason about environments and lazy evaluation/NSE.** Account for lazy argument
   evaluation, promises, scoping, and non-standard evaluation (tidy eval: `{{ }}`, `!!`,
   `enquo`/`sym`) when a function captures or quotes its arguments; avoid accidental
   capture and forced-promise surprises.
6. **Respect package structure and reproducibility.** For package code, keep
   `DESCRIPTION`/`NAMESPACE`/`roxygen2` consistent — declare imports, export deliberately,
   and regenerate docs with `roxygen2::roxygenise()`. Pin the environment with `renv`
   (`renv::snapshot()`/`renv::restore()`) for reproducibility. Use `Rcpp` only for a
   measured hot path, keeping the R interface clean.
7. **Verify.** Run the project's checks and report the exact command and result:
   `Rscript` to execute, `testthat` (`testthat::test_dir()` / `devtools::test()`) for
   tests, `lintr::lint()` and `styler` for style, and `R CMD check` (or
   `devtools::check()`) for a package. Match the project's configured tooling.

## Inputs
- The R code, the project layout (script, `.Rproj`, or package with
  `DESCRIPTION`/`NAMESPACE`), the renv lockfile if present, and the full error text
  (console error, traceback, `R CMD check` output) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per
  non-obvious vectorization, NSE construct, or object-system choice.
- The verify command run (Rscript/testthat/lintr/styler/R CMD check) and its real result;
  any remaining NA/NULL hazard, factor pitfall, or unpinned dependency flagged with why.

## Notes
- Clarity and vectorization over cleverness; do not add a tidyverse dependency where base
  R reads clearly, and do not drop to a loop where a vectorized form is plain.
- Never claim correctness around missing data without reasoning through NA/NULL on the
  specific path.
- Apply within the project's conventions — match its existing pipe (`|>` vs `%>%`), object
  system, and style/lint configuration.
