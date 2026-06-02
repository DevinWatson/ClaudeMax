---
name: prompt-design
description: Use when designing, debugging, or optimizing an LLM prompt — task decomposition, system- vs user-prompt design, zero-shot vs few-shot, structured/JSON output, and a one-variable-at-a-time tighten-then-test failure loop against real inputs. TRIGGER on a fuzzy task that needs a reliable prompt, format/constraint/hallucination/refusal failures, or choosing a prompting strategy. A prompt author or a reviewer triaging why a prompt regresses can both load it. NOT for designing the retrieval system feeding the prompt and NOT for building the eval/judge that scores quality.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: ai-ml
tags: [prompt, llm, few-shot, structured-output]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Prompt Design

The substantive prompt-engineering capability: turn a fuzzy task into a precise, reliable
prompt — the wording, structure, and instruction design — and tighten it with a disciplined
failure loop. Distinct from the retrieval pipeline (rag-architect) and the scoring harness
(evals-author).

## When to use this skill
When designing, debugging, or optimizing a prompt: decomposing a task, structuring a system/user
prompt, choosing zero- vs few-shot, forcing structured output, or running a failure loop against
real inputs. Not for designing chunking/embeddings/retrieval or for building the metrics/judge.

## Instructions
1. **Pin down the contract first.** The exact task, the input variability, the required output
   shape, the success criteria, and observed failure cases. Get 3–5 real inputs (including hard
   and adversarial ones), not just a happy path. If no failing examples exist, construct them.
2. **Decompose the task.** Separate the durable role/rules (system prompt) from the per-call
   input (user prompt). For multi-step tasks, decide between one prompt with explicit steps,
   reasoning-before-answer, or a small chain of focused prompts — prefer the simplest that works.
3. **Design the prompt structure.** State the role and single objective; give explicit, ordered
   instructions and hard constraints; delimit inputs clearly (XML-ish tags or fenced blocks);
   specify the output format precisely. Put the most important instruction where the model
   attends (start/end), and tell it what to do on ambiguity (ask vs. best-effort vs. refusal
   token).
4. **Choose shots deliberately.** Start zero-shot with crisp instructions. Add few-shot only
   when the format or edge-case handling is hard to describe — then make examples diverse,
   include a hard/negative case, and keep formatting identical to the desired output. Beware
   examples that bias the model toward copying their content.
5. **Force reliable output.** For structured output, specify a strict JSON schema (or use the
   provider's JSON/tool-calling mode), give a literal skeleton, and forbid prose outside it.
   Reduce hallucination by instructing the model to ground answers in provided context and to
   say "I don't know" when unsupported.
6. **Run the failure-mode loop.** Draft → run against the real inputs → categorize failures
   (format breaks, missed constraint, hallucination, refusal, verbosity, instruction conflict)
   → change ONE thing → re-run. Track which inputs pass before/after; do not stack speculative
   edits. The loop checks concrete pass/fail (format/constraint violations), not free-form
   quality scores — stand up no LLM judge here; hand metric/dataset design to evals-author.
7. **Verify and document.** Report pass/fail across the input set, list residual failure modes,
   and annotate WHY each non-obvious instruction exists so future edits don't regress.

## Inputs
- The task definition, the input variability, the required output shape and success criteria,
  and 3–5 real inputs including hard/adversarial cases.

## Output
```
Task contract: <objective, input variability, output shape, success criteria>
Prompt: <final system + user template, with delimiters/schema>
Strategy: <zero/few-shot rationale; structured-output mechanism>
Failure loop: <inputs tested; before -> after pass count; what each edit fixed>
Residual risks: <remaining failure modes + mitigations>
```

## Notes
- Change one variable at a time and re-test; never claim an improvement you did not run.
- Prefer the simplest prompt that passes; do not add few-shot examples or reasoning steps that
  don't measurably help.
- Keep prompts model/provider-agnostic unless a provider feature is explicitly required; note
  any such dependency. Hand the resulting test set and scoring to evals-author.
