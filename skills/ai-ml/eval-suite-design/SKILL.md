---
name: eval-suite-design
description: Use when building or reviewing an evaluation for an LLM/ML system — selecting metrics (programmatic vs reference-based vs rubric/LLM-judge), constructing a representative dataset with holdout, setting pass/fail thresholds and a regression suite, and stress-testing the eval itself for leakage, gaming, and flaky judges. TRIGGER on standing up a ship-gate/regression eval, choosing metrics, or auditing an eval's integrity. An eval author or a reviewer auditing whether a suite can be trusted to gate a release can both load it. NOT for writing the prompt under test and NOT for designing the retrieval system.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: ai-ml
tags: [evals, metrics, llm-as-judge, regression, integrity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Eval Suite Design

The substantive evaluation capability: build trustworthy evals for LLM/ML systems — metric
selection, dataset construction, thresholds and regression suites, and eval integrity — so a
team can rely on the suite to gate a release. Distinct from the prompt under test
(prompt-engineer) and the retrieval system (rag-architect).

## When to use this skill
When building or reviewing an eval: choosing metrics, assembling a dataset and holdout, setting
thresholds and a regression suite, or auditing the eval's integrity (leakage, gaming, flaky
judges). Not for writing the prompt under test or designing retrieval.

## Instructions
1. **Pin down the decision first.** What the eval informs (ship gate, regression guard, model
   comparison, ongoing monitoring) and what "good" means for the task. Find existing eval
   code/datasets and the system under test. State scope in one line.
2. **Define the metric to match the task — prefer cheap, deterministic checks.**
   - **Exact/programmatic** — exact-match, regex, schema/JSON validity, code that runs/tests
     pass, numeric tolerance. Use wherever the answer is checkable; fast, free, not flaky.
   - **Reference-based** — F1/EM for extractive QA, BLEU/ROUGE/embedding-similarity for
     constrained generation (note their weak correlation with quality).
   - **Rubric / LLM-as-judge** — for open-ended output where no programmatic check exists. Build
     it with a calibrated discrete rubric (debiased, validated against human labels). Do not
     reach for a judge when a deterministic check would do.
3. **Build a dataset that reflects reality.** Cover the real input distribution plus hard,
   adversarial, and edge cases; include negative cases (should-refuse, out-of-scope). Hold out a
   frozen test set. Guard against **leakage**: no overlap between any few-shot examples or prompt
   content and the test set; track dataset version/hash.
4. **Set thresholds and a regression suite.** Define explicit pass/fail thresholds tied to the
   decision; capture a current baseline. Make the suite reproducible (fixed seeds/temperature,
   pinned model versions, recorded dataset hash) so a score change means a real change.
5. **Stress-test the eval itself.** An eval is software that can be wrong:
   - **Gaming** — confirm trivial/degenerate outputs (empty, verbose, "I don't know" to
     everything) score low; a metric optimizable without solving the task is broken.
   - **Flaky judges** — re-run the judge on a sample; coarsen scales or sharpen anchors if scores
     flip.
   - **Leakage/overfitting** — re-check that high scores aren't from memorized test data.
   - **Aggregation** — report per-slice scores and distributions, not one mean that hides a
     failing critical subset; include n and confidence/variance.
6. **Verify.** Run the eval end to end on the baseline, confirm the threshold reproduces, and
   sanity-check that a deliberately-bad output fails. Report numbers, not vibes (or state you
   couldn't run it and give the exact commands).

## Inputs
- The decision the eval gates, the system under test, any existing eval code/datasets, and what
  "good" means for the task.

## Output
```
Decision the eval gates: <ship/regression/compare/monitor>
Metrics: <programmatic | reference | rubric-judge> and why each
Dataset: <size, slices, hard/negative cases, holdout, version/hash, leakage check>
Thresholds: <pass/fail + current baseline>
Judge calibration: <only if an LLM judge is used — κ=<value>, n=<labeled items>>
Eval integrity: <gaming probe, judge flakiness, leakage check results>
Results: <per-slice scores + n + variance; how to reproduce>
```

## Notes
- Prefer deterministic checks over an LLM judge; only use a judge when calibrated (κ reported)
  via an LLM-eval-rubric procedure.
- Never report a single aggregate that hides a failing slice; always show distribution and n.
- Do not modify the prompt (prompt-engineer) or retrieval (rag-architect) to make scores look
  better — measure honestly and report regressions.
