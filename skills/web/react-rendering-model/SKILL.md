---
name: react-rendering-model
description: Use when writing, reviewing, or debugging framework-agnostic React — how to place state correctly, compose with hooks and components, get effects right (synchronize-with-external-system, honest dependency arrays, cleanup), reason about what triggers a re-render, and memoize only with evidence. TRIGGER when a tree re-renders too much, an effect loops or fires wrong, or you must decide where state lives. NOT for Next.js/RSC/server-actions/routing/caching. Any agent touching React (an architect, a reviewer of a React PR, a performance debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [react, hooks, state, rendering, effects]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# React Rendering Model

The substantive React capability: reason correctly about *plain* React — the parts that hold
on any renderer (DOM, Native, Next, Remix) — so components are correct first and fast second.

## When to use this skill
When authoring, reviewing, or debugging React component design: deciding where state lives,
composing hooks/components, fixing an effect that loops or fires at the wrong time, or taming
a tree that re-renders too much. Not for framework specifics (server components, routing,
server actions, data-fetch caching). Pairs with [[match-project-conventions]] and
[[verify-by-running]].

## Instructions
1. **Separate correctness from re-render cost.** A wrong-behavior/effect-loop bug and a
   too-much-work bug have different fixes — never reach for memoization to paper over a
   correctness bug. Read `package.json` for the React major (17/18/19 differ on `use`,
   Actions, automatic batching, and the React Compiler) and whether
   `eslint-plugin-react-hooks` / React Compiler is in play.
2. **Name the exact re-render trigger.** Re-renders come from state/prop/context changes, not
   "slowness": a new object/array/function identity created each render, a context value that
   changes every render, an unkeyed (or index-keyed) list, or state lifted too high. Reason
   like the Profiler's "why did this render" — not a guess.
3. **Place state correctly first.** Colocate state with the component that uses it; lift only
   to the lowest common ancestor that needs it; prefer derived state over duplicated state.
   Choose the mechanism deliberately: `useState` for simple local state; `useReducer` when
   transitions are complex or the next state depends on the previous; **Context** for
   low-frequency, widely-read values (theme, auth, locale) — never a single Context for
   high-frequency state (every consumer re-renders); split contexts or use an external store
   (Zustand/Redux/Jotai) with selector subscriptions.
4. **Get effects right.** An effect synchronizes with an external system — it is not for
   transforming props into state or responding to events. Eliminate unnecessary effects
   (derive during render, lift state, or use an event handler). For real effects, keep the
   dependency array honest — never lie to the linter; instead remove the dependency (move it
   into the effect, wrap in `useCallback`/reducer dispatch, or hold non-reactive values in a
   ref). Always handle cleanup and the StrictMode double-invoke.
5. **Compose deliberately.** Extract custom hooks to share *stateful logic*; extract components
   to share *markup*. Prefer composition (children / render props / slots) over prop-drilling
   and over premature Context.
6. **Memoize only with evidence.** Apply `memo`/`useMemo`/`useCallback` to a *measured*
   re-render or a genuinely expensive computation — not reflexively. On React 19 + React
   Compiler, prefer letting the compiler memoize and drop hand-rolled memos. Stabilize
   identities at the source (hoist constants, `useCallback` the handler) rather than memoizing
   every leaf.

## Inputs
- The component(s), their parents, and the state they consume; `package.json` for the React
  version and lint setup.

## Output
- The root cause stated in render-model terms (the exact trigger), then the change.
- One line of rationale per non-obvious memoization or dependency-array decision.
- How to confirm a re-render claim in the DevTools Profiler (highlight updates / flamegraph),
  and the lint/typecheck result via [[verify-by-running]] (`eslint-plugin-react-hooks` must
  pass with no suppressions).

## Notes
- Correctness before performance: never silence an effect-dependency warning to stop a loop.
- If the real issue is RSC boundaries, server actions, routing, or data-fetch caching, that is
  framework territory — out of scope for this skill.
