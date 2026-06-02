---
name: llm-eval-rubric
description: Use when building an LLM-as-judge or rubric-based evaluation of model output quality — defines scoring criteria, calibrates the judge against human labels, and guards against judge bias, gaming, and flaky scores. Use for the judging procedure itself, not for choosing task metrics or designing the system under test; skip it when a deterministic or programmatic check would suffice.
allowed-tools: Read
category: ai-ml
tags: [llm, eval, rubric, judge]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# LLM Eval Rubric

A repeatable procedure for scoring free-form model output with an LLM-as-judge or an
explicit rubric, so the scores are trustworthy, reproducible, and hard to game.

## When to use this skill
- You must score open-ended output (answers, summaries, code, RAG responses) where
  exact-match does not apply and a human/automated judgment is needed.
- You are standing up an LLM-as-judge and need it calibrated and bias-resistant.
- Do NOT use this to pick which metric matters (that is the eval/system designer's call)
  or to write the prompt under test.

## Instructions
1. **Define a discrete rubric, not a vibe.** Enumerate 3–6 named criteria (e.g.
   `factual_accuracy`, `grounding`, `completeness`, `format_compliance`). For each, give
   a concrete definition and a small ordinal scale (prefer 1–3 or 1–5; binary for
   pass/fail gates). Write 1–2 anchor examples per score so the boundary is unambiguous.
2. **Make the judge deterministic and structured.** Run the judge at `temperature=0`,
   require structured JSON output (`{criterion: score, rationale: ...}`), and force the
   rationale to be produced BEFORE the score (chain-of-thought reduces snap judgments).
   Score one criterion at a time when criteria interact.
3. **Neutralize known judge biases:**
   - **Position bias** (pairwise): swap A/B order and average, or randomize.
   - **Length/verbosity bias**: instruct to ignore length; penalize padding explicitly.
   - **Self-preference**: do not let a model judge its own family when comparing models.
   - **Leniency**: provide negative anchors so low scores are actually used.
4. **Calibrate against human labels.** Hand-label 30–50 items, run the judge, and measure
   agreement (Cohen's κ for ordinal, accuracy/F1 for binary). If κ < 0.6, tighten the
   rubric and anchors and re-measure — do NOT ship an uncalibrated judge.
5. **Test for gaming and flakiness.** Re-run the judge 3× on a sample; flag criteria whose
   score flips (flaky judge → coarsen the scale or sharpen anchors). Probe with adversarial
   cases (confidently-wrong, verbose-but-empty, refusal) to confirm they score low.

## Inputs
- The outputs to score, the task definition, and (for calibration) a small human-labeled set.

## Output
```
Rubric:
  - <criterion>: <scale> — <definition>; anchors: <low> / <high>
Judge config: model=<...>, temperature=0, output=JSON{rationale,score}, debias=<...>
Calibration: n=<labeled>, agreement=<κ / acc>, verdict=<trustworthy | needs-tightening>
Flakiness: <stable | which criteria flip>
```

## Notes
- An LLM-as-judge is a model under test too: version the judge prompt and re-calibrate when
  you change it. Report agreement numbers; never present judge scores as ground truth.
