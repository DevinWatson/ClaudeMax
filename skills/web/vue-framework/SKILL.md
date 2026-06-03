---
name: vue-framework
description: Use when working in Vue 3 — the Composition API (ref/reactive/computed/watch), `<script setup>` and single-file components, reactivity fundamentals and pitfalls (ref unwrapping, losing reactivity on destructure), props/emits/v-model contracts, slots, provide/inject, lifecycle, Pinia state, Vue Router, and Vue performance levers (v-memo, async components, keep-alive). TRIGGER on reactivity-loss bugs, "value is not reactive"/stale-render issues, SFC/`<script setup>` questions, component API design, Pinia/router wiring, or vue-tsc/vite build errors. NOT for framework-agnostic UI concerns, and Nuxt's server/data layer (SSR data, server routes, file-based routing) is the meta-framework boundary handled elsewhere. Any agent touching Vue (a Vue role, a reviewer of a Vue PR, a Nuxt team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [vue, vue3, composition-api, pinia, vue-router, reactivity]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Vue Framework

The substantive Vue 3 capability: get the *framework* concerns right — the reactivity system,
the Composition API and SFC authoring model, component contracts, shared state and routing, and
Vue-specific performance — independent of framework-agnostic UI design and independent of Nuxt's
server/data meta-framework layer.

## When to use this skill
When the problem is framework-level Vue 3 behavior: a reactivity-loss bug, a `<script setup>` or
SFC question, a props/emits/v-model or slots contract, provide/inject, a lifecycle-timing issue,
Pinia store design, Vue Router wiring, or a Vue performance tune. Not for framework-agnostic
concerns (CSS/layout, generic accessibility) and not for Nuxt's SSR data fetching, server routes,
or file-based routing — that is the Nuxt meta-framework boundary. Pairs with
[[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Establish the setup first.** Confirm Vue 3 (not 2) and read `package.json` for the build
   tool (Vite is the default), `vue`, `pinia`, `vue-router`, and whether Nuxt is present — if
   Nuxt is in use, SSR data fetching, server routes, and file-based routing belong to the Nuxt
   layer, not here. Determine the authoring style in use: `<script setup>` SFCs (preferred),
   the Options API, or plain `setup()`. Match it.
2. **Get reactivity right — the top source of "my UI doesn't update" bugs.**
   - `ref(x)` wraps any value; read/write `.value` in script, auto-unwrapped in template.
   - `reactive(obj)` deep-wraps an object; do NOT destructure it (`const { a } = state`) — that
     breaks reactivity. Use `toRefs`/`toRef` to keep refs reactive when destructuring.
   - Reassigning a `reactive` variable (`state = {...}`) loses reactivity; mutate in place or use
     a `ref` holding the object.
   - `computed(() => …)` is cached and read-only by default; use a getter/setter form when you
     need writes. Don't put side effects in a computed.
   - `watch(source, cb)` for explicit source(s) (lazy by default); `watchEffect` to auto-track
     dependencies and run immediately. Pass `{ deep, immediate, flush }` deliberately; remember
     to stop manually-created watchers when appropriate.
3. **Author the component contract explicitly.** Type `defineProps`/`defineEmits` (use the
   type-only generic form under `<script setup lang="ts">`); props are one-way and read-only —
   don't mutate them. Implement `v-model` via the `modelValue` prop + `update:modelValue` emit
   (or named models `v-model:foo` / `defineModel()` in current Vue). Expose flexibility through
   named and scoped **slots** rather than prop explosion. Use **provide/inject** (with an
   `InjectionKey<T>`) for cross-cutting dependencies — not as a substitute for a store.
4. **Use lifecycle hooks correctly.** `onMounted` for DOM/3rd-party setup, `onUnmounted` to tear
   down listeners/timers/subscriptions (prevent leaks), `onUpdated` sparingly. In `<script setup>`
   the `setup` body runs before mount — guard DOM access. Use template `ref`s for element access.
5. **Manage shared state with Pinia.** Define stores with `defineStore` (setup-store form mirrors
   Composition API). Keep state serializable, derive via getters, mutate via actions. Don't
   destructure a store reactively — use `storeToRefs` for state/getters. Prefer a store over
   prop-drilling or provide/inject for app-wide state.
6. **Wire Vue Router deliberately.** Define routes with lazy-loaded components
   (`() => import(...)`) for code-splitting; use `useRoute`/`useRouter` in `<script setup>`. Put
   auth/redirect logic in navigation guards. Avoid reading route params non-reactively (watch the
   param or use a computed). Server-side data fetching/file-based routing is Nuxt's concern.
7. **Apply Vue performance levers when measured.** Reduce reactivity and render cost: `v-memo` on
   large lists with stable sub-trees, `shallowRef`/`shallowReactive` for big external objects,
   `defineAsyncComponent` + Suspense for route/heavy-component code-splitting, `keep-alive` to
   cache toggled views, stable `:key`s on `v-for`, and avoid heavy work in computed/render. Don't
   optimize without a before/after measurement.
8. **Verify via [[verify-by-running]].** Type-check with `vue-tsc --noEmit` (catches prop/emit
   and template type errors), build with `vite build`, lint with `eslint` (`eslint-plugin-vue`),
   and run unit/component tests with `vitest` (`@vue/test-utils`). Report the exact command and
   its real result.

## Inputs
- `package.json` (Vue major, Vite, Pinia, Vue Router, Nuxt presence), the relevant SFC(s),
  any store/router config, and the failing behavior or feature requirement.

## Output
- Which reactivity/contract/state/router concern was wrong and why, then the change.
- For components touched: the props/emits/`v-model`/slots contract and any provide/inject keys.
- The `vue-tsc`/`vite build`/`vitest` result via [[verify-by-running]]; any reactivity-loss or
  stale-render bug resolved.

## Notes
- Most "not updating" bugs are reactivity loss: destructured `reactive`, reassigned reactive
  variable, or a plain (non-ref) value passed where a ref was expected — check these first.
- Don't reach for `watch` when a `computed` will do; don't put async/side effects in `computed`.
- The Nuxt meta-framework (SSR/SSG, `useFetch`/`useAsyncData`, `server/` routes, file-based
  routing, Nitro) is a separate boundary — note it and defer rather than reasoning about it here.
