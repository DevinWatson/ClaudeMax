---
name: svelte-framework
description: Use when working in Svelte 5 — the runes reactivity model ($state/$derived/$effect/$props/$bindable), components and snippets, props and bindings, stores (writable/derived/readable), the context API, transitions/animations, and the compiled no-virtual-DOM performance model. TRIGGER on "my UI doesn't update"/stale-render bugs, rune vs Svelte 4 (`$:`/stores) questions, component/snippet or props/bindings contract design, store or context wiring, or svelte-check/vite build errors. NOT for framework-agnostic UI concerns, and SvelteKit's server/data layer (load functions, form actions, file-based routing, hooks) is the meta-framework boundary handled elsewhere. Any agent touching Svelte (a Svelte role, a reviewer of a Svelte PR, a SvelteKit team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [svelte, svelte5, runes, reactivity, stores, sveltekit]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Svelte Framework

The substantive Svelte 5 capability: get the *framework* concerns right — the compiler-based
reactivity model (runes), the component and snippet authoring model, props and bindings, shared
state via stores and context, transitions, and Svelte's compiled no-virtual-DOM performance
characteristics — independent of framework-agnostic UI design and independent of SvelteKit's
server/data meta-framework layer.

## When to use this skill
When the problem is framework-level Svelte behavior: a reactivity bug (UI not updating), a runes
question (`$state`/`$derived`/`$effect`/`$props`), a component/snippet or props/bindings contract,
store or context-API design, a transition/animation question, or a Svelte performance tune. Not
for framework-agnostic concerns (CSS/layout, generic accessibility) and not for SvelteKit's `load`
functions, form actions, server hooks, or file-based routing — that is the SvelteKit meta-framework
boundary. Pairs with [[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Establish the version and setup first.** Read `package.json` for `svelte` (is it 5.x with
   runes, or 4.x with `$:`/`export let`/stores?), the build tool (Vite is the default), and whether
   `@sveltejs/kit` is present — if SvelteKit is in use, `load` functions, form actions, server
   hooks, and file-based routing belong to the SvelteKit layer, not here. Determine the authoring
   style: runes mode (Svelte 5, preferred for new code) or legacy reactivity (Svelte 4). Match it.
2. **Get reactivity right — the top source of "my UI doesn't update" bugs.** In **Svelte 5 (runes)**:
   - `$state(x)` makes a variable deeply reactive; reassign or mutate it directly — no `.value`.
     Arrays/objects are proxied, so `arr.push(...)` is reactive. Destructuring a `$state` object
     into local `const`s captures a snapshot and loses reactivity — keep the container or use
     `$derived`. Use `$state.raw(...)` for large non-reactive structures, `$state.snapshot(...)` to
     get a plain (non-proxied) copy.
   - `$derived(expr)` / `$derived.by(() => …)` for computed values — recomputed lazily, cached, must
     be pure (no side effects).
   - `$effect(() => …)` runs after the DOM updates for synchronization with external systems; return
     a teardown function for cleanup. Do NOT use it to derive state (use `$derived`) — effects that
     write state they also read cause loops. Use `$effect.pre` for pre-DOM work.
   - In **Svelte 4 (legacy)**: `let` is reactive on assignment only (`arr = [...arr, x]`, not
     `arr.push`); `$:` declares reactive statements/derivations. Note this contrast when migrating.
3. **Author the component contract explicitly.** In Svelte 5, declare inputs with
   `let { foo, bar = default, ...rest } = $props()` (type the destructure under `lang="ts"`); props
   are read-only by default. For two-way binding expose `$bindable()` and bind with `bind:value`.
   In Svelte 4 these are `export let` + `bind:`. Component events: prefer callback props in Svelte 5
   over `createEventDispatcher` (legacy). Pass markup as **snippets** (`{#snippet}` / `{@render}`)
   and snippet props instead of the legacy slot/`<slot>` system — snippets are the Svelte 5
   replacement for slots and can take arguments.
4. **Manage shared state with stores and the context API.** Stores remain valid in Svelte 5:
   `writable(init)`, `readable(init, start)`, `derived(stores, fn)` from `svelte/store`; subscribe
   in markup with the `$store` auto-subscription (which also auto-unsubscribes). In Svelte 5 you can
   also share reactive state via `$state` in a `.svelte.js`/`.svelte.ts` module or via the context
   API. Use `setContext(key, value)` / `getContext(key)` for cross-cutting dependencies scoped to a
   component subtree — set context during component init only; it is not a reactive channel by
   itself (put a store or `$state` object into it for reactivity).
5. **Use transitions and animations idiomatically.** Apply `transition:`/`in:`/`out:` (e.g. `fade`,
   `fly`, `slide` from `svelte/transition`), `animate:flip` for list reordering keyed by `(item.id)`,
   and `class:`/inline `style:` directives for reactive styling. Keep transitions cheap and respect
   reduced-motion preferences.
6. **Apply Svelte performance levers when measured.** Svelte compiles components to imperative DOM
   updates with **no virtual DOM**, so fine-grained reactivity is the main lever: keep `$state`
   surfaces small and use `$state.raw` for large immutable data; give `{#each}` blocks a stable
   key (`{#each items as item (item.id)}`) to avoid re-creating nodes; lazy-load heavy
   components/routes via dynamic `import()`; avoid unnecessary `$effect`s that thrash the DOM. Don't
   optimize without a before/after measurement.
7. **Verify via [[verify-by-running]].** Type-check and lint the component contract with
   `svelte-check` (catches prop/binding and template type errors) and `eslint`
   (`eslint-plugin-svelte`), build with `vite build`, and run unit/component tests with `vitest`
   (`@testing-library/svelte`) and/or end-to-end flows with `playwright`. Report the exact command
   and its real result.

## Inputs
- `package.json` (Svelte major — 4 vs 5/runes, Vite, SvelteKit presence), the relevant `.svelte`
  component(s), any store/context module (`.svelte.js`/`.svelte.ts`), and the failing behavior or
  feature requirement.

## Output
- Which reactivity/contract/state concern was wrong and why (e.g. a destructured `$state`, an
  effect deriving state, a non-keyed `{#each}`), then the change.
- For components touched: the `$props`/`$bindable`/snippet contract and any context keys.
- The `svelte-check`/`vite build`/`vitest` result via [[verify-by-running]]; any reactivity or
  stale-render bug resolved.

## Notes
- Svelte 4 vs 5 is the key fork: runes (`$state`/`$derived`/`$effect`/`$props`/`$bindable`) replace
  `let`-reassignment reactivity, `$:`, `export let`, and (with snippets) slots. Establish the major
  before reasoning about a bug — advice that is correct for one is often wrong for the other.
- Most "not updating" bugs in runes mode are reactivity loss: a destructured `$state` object, a
  plain (non-`$state`) variable expected to be reactive, or deriving state inside an `$effect`
  instead of `$derived` — check these first.
- Don't reach for `$effect` when `$derived` will do; never put side effects in `$derived`.
- The SvelteKit meta-framework (SSR/SSG, `load` functions, form actions, `+page`/`+layout` and
  `+server` routes, `hooks`, file-based routing, adapters) is a separate boundary — note it and
  defer rather than reasoning about it here.
