---
name: agent-orchestration
description: Use when designing a multi-agent or multi-step LLM workflow — decomposing a task into steps/sub-agents, routing work to the right agent or tool, designing handoffs and shared state between steps, deciding what runs in parallel vs. sequentially, inserting verification/critic steps, handling step failures, and controlling end-to-end cost and latency. TRIGGER on "orchestrate agents", "chain these steps/tools", or "coordinate a planner + workers". Distinct from llm-application-engineering (a single model call's plumbing) — this is the coordination across many. Language- and framework-agnostic — the orchestration patterns; the framework specifics come from a separate language capability the agent also composes. Any agent that coordinates a workflow (an orchestration engineer, an agent-platform designer, a reviewer of agent graphs) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: ai-ml
tags: [orchestration, multi-agent, routing, handoff, verification, workflow]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# Agent Orchestration

The substantive capability for coordinating multi-step and multi-agent LLM workflows: decompose the
task, route each step to the right agent/tool, pass state through clean handoffs, parallelize where
safe, verify the output, and bound cost and latency — independent of the language. The concrete
orchestration framework comes from the composed language capability.

## When to use this skill
When the work spans multiple LLM steps or agents that must coordinate: planner+workers, routed
sub-tasks, pipelines with verification. Not for the plumbing of one model call (that is
llm-application-engineering, which this composes per step) and not for the MCP wire protocol (that is
mcp-integration). Pairs with [[llm-application-engineering]] (each step's call) and
[[reliability-engineering]] (failure handling under non-determinism).

## Instructions
1. **Decompose the task.** Break the goal into discrete steps each with a clear input, output, and
   success criterion. Prefer the simplest topology that works — a single well-prompted agent beats a
   multi-agent graph when the task doesn't need decomposition. Add agents/steps only where a distinct
   responsibility or a verification boundary justifies it.
2. **Route work explicitly.** Decide how each step is assigned: static pipeline, a router/dispatcher
   that picks an agent/tool by the input, or a planner that generates the steps. Make routing rules
   explicit and bounded; cap planner-driven recursion/iteration so the workflow can't loop unbounded.
3. **Design handoffs and shared state.** Define exactly what each step passes to the next: a typed,
   minimal payload, not the whole conversation. Decide where shared state lives (passed message vs. a
   shared store) and keep each step's context lean — context bloat across steps degrades quality and
   cost. Avoid hidden coupling where a step silently depends on another's internals.
4. **Choose parallel vs. sequential per dependency.** Run independent steps in parallel to cut latency;
   keep dependent steps sequential. Identify the data dependencies first — parallelizing steps that
   actually depend on each other produces races or stale inputs. Fan-out/fan-in (map then reduce) is the
   common parallel shape.
5. **Insert verification/critic steps.** For consequential output, add a check: a critic/verifier agent,
   a schema/validation gate, or a tool that confirms the result against ground truth — LLM steps are
   non-deterministic and confidently wrong. Decide the action on a failed check (retry with feedback,
   route to a fallback, escalate).
6. **Handle step failure.** Treat every step as fallible (model error, timeout, bad output, tool
   failure). Define per-step retry (bounded, with backoff), fallback path, and a global failure mode so
   one bad step degrades gracefully instead of corrupting the whole run. Lean on
   [[reliability-engineering]] for the patterns.
7. **Control cost and latency.** Budget the workflow: pick the cheapest adequate model per step (small
   model for routing/extraction, large for hard reasoning), cap total steps/tokens, cache reusable
   results, and short-circuit early when a step already satisfies the goal. State the expected cost and
   latency. Verify the workflow runs end-to-end via [[verify-by-running]].

## Inputs
- The goal/task, the available agents/tools and their capabilities, the orchestration framework, and
  the cost/latency budget and quality bar.

## Output
- The workflow design: the step/agent decomposition, the routing rules, and the topology (the
  parallel/sequential graph) with the data dependencies that justify it.
- The handoff/state contracts between steps, the verification/critic steps, and the per-step + global
  failure handling.
- The cost/latency plan (model-per-step, caps, caching) and the end-to-end verification result via
  [[verify-by-running]].

## Notes
- Prefer the simplest topology; every added agent adds cost, latency, and failure surface — justify it.
- Verify consequential output and bound every loop — unverified, unbounded agent graphs fail expensively.
- Stay language-agnostic; the specific orchestration framework belongs to the composed language
  capability, and a single step's model plumbing belongs to [[llm-application-engineering]].
