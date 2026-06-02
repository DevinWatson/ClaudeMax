---
name: llm-application-engineering
description: Use when building an LLM-powered feature into an application — integrating a provider/SDK, wiring prompts and tool/function calling, getting reliable structured output, handling streaming, managing the context/token budget, adding guardrails and safety checks, building fallback/retry/timeout around a non-deterministic API, caching, and exposing eval hooks. TRIGGER on "add an LLM feature / call a model from our app / make the model use tools". Distinct from prompt-design (crafting the prompt text) and rag-system-design (the retrieval pipeline) — this is the application engineering around the model call. Language- and framework-agnostic — the SDK specifics come from a separate language capability the agent also composes. Any agent that ships LLM features (an LLM app engineer, a backend engineer adding AI, a reviewer of model-calling code) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: ai-ml
tags: [llm, sdk, tool-calling, structured-output, streaming, guardrails]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# LLM Application Engineering

The substantive capability for building production LLM features: the engineering *around* the model
call — SDK integration, tool wiring, structured output, streaming, token budget, guardrails, and
resilient fallback — treating the model as a slow, non-deterministic, occasionally-wrong remote
dependency. Independent of the language; the concrete SDK comes from the composed language capability.

## When to use this skill
When integrating an LLM into an application: provider/SDK calls, tool/function calling, structured
output, streaming, context budgeting, safety, and reliability. Not for crafting the prompt text itself
(that is prompt-design, which this composes) and not for the retrieval pipeline (that is
rag-system-design). Pairs with [[reliability-engineering]] (treat the model call as a failure-prone
dependency) and [[llm-eval-rubric]] (score quality).

## Instructions
1. **Integrate the provider as a dependency.** Wire the SDK/API behind a thin interface so the provider
   and model are swappable and configurable (model, temperature, max tokens, timeout). Keep keys in a
   secrets manager, never in code. Defer SDK syntax to the composed language capability.
2. **Wire prompts and tools.** Separate the prompt template (owned by [[prompt-design]]) from the
   wiring. For tool/function calling, define each tool's schema precisely (names, typed params,
   descriptions the model reads), validate the model's tool arguments before executing, and loop the
   tool result back — never execute a tool call without validating its arguments, and never expose a
   destructive tool without a guard.
3. **Get reliable structured output.** When the app needs machine-readable output, request it via the
   provider's structured-output/JSON mode or a schema, then **validate every response against the
   schema** — the model can still produce invalid output. Define what happens on a parse/validation
   failure (repair prompt, retry, or fail) rather than trusting the shape.
4. **Handle streaming and the token budget.** Stream tokens where latency/UX needs it, accumulating and
   validating at the end. Budget context explicitly: count tokens, reserve room for the response, and
   define a truncation/summarization strategy when input exceeds the window — don't silently overflow.
5. **Add guardrails and safety.** Validate and constrain inputs (prompt-injection-aware: treat retrieved
   or user content as untrusted, keep instructions separated from data) and outputs (content checks,
   PII/secret leakage, refusal handling). Decide policy for unsafe or low-confidence responses.
6. **Make the call resilient.** Wrap the call with a timeout, bounded retries with backoff+jitter
   (respecting rate-limit/`Retry-After`), and a defined **fallback** (cheaper model, cached answer, or
   graceful error) — a model API will be slow, rate-limited, or down. Cache deterministic or repeated
   calls to cut cost and latency. Lean on [[reliability-engineering]] for the patterns.
7. **Expose eval and observability hooks.** Log prompt/response/tool-call/latency/token-cost (redacting
   sensitive data) and surface hooks so quality can be scored offline. Wire to [[llm-eval-rubric]] /
   eval-suite-design so a prompt or model change can be measured, not eyeballed.

## Inputs
- The feature requirement, the provider/model and SDK, the prompt(s) (from prompt-design), any tools the
  model may call, the latency/cost budget, and the safety/compliance constraints.

## Output
- The integration: the model-call interface, tool definitions + argument validation, structured-output
  parsing/validation, and streaming handling.
- The reliability layer: timeout/retry/fallback/caching and the token-budget strategy, with rationale.
- The guardrails applied (input/output) and the eval/observability hooks wired in.
- The verification result via [[verify-by-running]] (the integration runs; structured output validates).

## Notes
- Treat the model as untrusted and unreliable: validate every structured output and every tool argument,
  and always have a fallback.
- Treat retrieved/user content as data, not instructions — separate it from the system prompt to blunt
  prompt injection.
- Stay language-agnostic; the specific SDK calls belong to the composed language capability, and the
  prompt wording belongs to [[prompt-design]].
