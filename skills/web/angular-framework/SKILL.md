---
name: angular-framework
description: Use when working in modern Angular (16+/17+) — standalone components and the template model, signals and the new reactivity (signal/computed/effect, signal inputs/model, RxJS↔signal interop), dependency injection and providers (inject(), provideX), RxJS and observables, reactive vs template-driven forms, the router and lazy loading, change detection (zoneless/OnPush), NgModule→standalone migration, and the Angular CLI/schematics. TRIGGER on signal/reactivity bugs, change-detection or "view not updating" issues, standalone-vs-NgModule questions, DI/provider/injection-context errors, RxJS subscription/leak problems, form-control wiring, router/lazy-load setup, or ng build / tsc / ng test / ng lint errors. NOT for framework-agnostic UI concerns (CSS/layout, generic accessibility) and NOT for React/Next.js or Vue — those are separate framework boundaries. Any agent touching Angular (an Angular role, a reviewer of an Angular PR, an Nx team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [angular, signals, rxjs, standalone, dependency-injection, change-detection]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Angular Framework

The substantive modern Angular (16+/17+) capability: get the *framework* concerns right — the
standalone component and template model, signals and the new reactivity, dependency injection and
providers, RxJS/observables and their signal interop, forms, the router and lazy loading, and
change detection — independent of framework-agnostic UI design and independent of other frameworks
(React/Next.js, Vue).

## When to use this skill
When the problem is framework-level Angular behavior: a signal/reactivity or change-detection bug
("view not updating"), a standalone-vs-NgModule question, a DI/provider or injection-context error,
an RxJS subscription/leak issue, signal↔observable interop, a reactive- or template-driven-form
contract, router/lazy-load wiring, OnPush/zoneless tuning, an NgModule→standalone migration, or a
CLI/schematics task. Not for framework-agnostic concerns (CSS/layout, generic accessibility) and
not for React/Next.js or Vue — those are separate framework boundaries. Pairs with
[[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Establish the setup first.** Read `package.json` and `angular.json` to confirm the Angular
   major (16+/17+), whether the app is standalone-bootstrapped (`bootstrapApplication` in
   `main.ts`) or NgModule-based (`AppModule` + `platformBrowserDynamic`), whether Zone.js is present
   or the app is zoneless (`provideExperimentalZonelessChangeDetection`), the package manager, and
   the test runner (Karma/Jasmine vs Jest). Match the authoring style already in use; prefer
   standalone for new code unless the project is module-based.
2. **Get signals and reactivity right — the modern source of "view not updating" bugs.**
   - `signal(x)` holds writable state; read with `s()`, write with `s.set(v)` / `s.update(fn)`.
   - `computed(() => …)` is lazy, memoized, read-only; it tracks the signals read inside it. Keep
     it pure — no side effects.
   - `effect(() => …)` runs side effects when its tracked signals change; it must be created in an
     injection context (constructor/field initializer) or passed an `injector`, and it cleans up on
     destroy. Don't write a signal inside an effect without `allowSignalWrites` and a clear reason.
   - Signal **inputs** (`input()`, `input.required<T>()`) replace `@Input()` for new code; **model**
     (`model()`) gives two-way binding; **outputs** use `output()`. Derive from inputs with
     `computed`, not by mutating them.
   - Bridge RxJS with `toSignal(obs$)` (auto-unsubscribes) and `toObservable(sig)` from
     `@angular/core/rxjs-interop`; prefer `toSignal` over manual `subscribe` in components.
3. **Author the standalone component/template model explicitly.** Use `standalone: true` with an
   explicit `imports:` array (components, directives, pipes — no NgModule). In templates, prefer the
   new control flow (`@if` / `@for` with a `track` expression / `@switch`, `@defer` for lazy
   rendering) over the legacy `*ngIf`/`*ngFor` where the project has adopted it. Bind inputs/outputs
   and use template reference variables; avoid heavy expressions in templates.
4. **Use dependency injection and providers deliberately.** Prefer the `inject()` function in
   injection contexts over constructor injection where the project allows it. Scope providers
   intentionally: `providedIn: 'root'` for app singletons, route- or component-level `providers` for
   narrower scope; use `provideX()` functions (`provideHttpClient`, `provideRouter`, …) in the
   standalone bootstrap rather than `forRoot()` modules. Understand injection-context rules —
   `inject()` and `effect()` only work during construction unless given an injector.
5. **Manage async with RxJS, leak-free.** Use observables for streams/HTTP; compose with operators
   (`switchMap`/`mergeMap`/`concatMap` chosen by cancellation semantics, `map`, `filter`,
   `catchError`, `combineLatest`). Avoid leaks: use the `async` pipe or `toSignal` instead of manual
   `subscribe`; if you must subscribe, tear down with `takeUntilDestroyed()` or an `OnDestroy`. Don't
   nest subscriptions — flatten with higher-order mapping operators.
6. **Wire forms to the right model.** Use **reactive forms** (`FormControl`/`FormGroup`/`FormArray`,
   typed forms, `FormBuilder`) for non-trivial forms — explicit, testable, typed. Use
   template-driven (`ngModel`) only for simple cases. Apply built-in and custom validators; read
   state via `valueChanges`/`statusChanges` or signals.
7. **Wire the router and lazy loading.** Define routes with `provideRouter(routes)`; lazy-load with
   `loadComponent: () => import(...)` (standalone) or `loadChildren` for route groups; use functional
   guards/resolvers (`CanActivateFn`, `ResolveFn`) with `inject()`. Read params reactively
   (`ActivatedRoute` observables or `toSignal`). Code-split heavy routes.
8. **Control change detection.** Prefer `ChangeDetectionStrategy.OnPush` so views update only on
   input changes, signal reads, and async-pipe emissions — the default for signal-based components.
   For zoneless apps (`provideExperimentalZonelessChangeDetection`), signals/async pipe drive
   updates; avoid relying on Zone.js side effects. Use `markForCheck` only when you understand why;
   avoid `detectChanges` in normal flow.
9. **Migrate NgModule→standalone incrementally when asked.** Use schematics
   (`ng generate @angular/core:standalone`) to migrate in passes (standalone declarations → remove
   NgModules → standalone bootstrap), and migrate `@Input()`→`input()` / constructor-inject→`inject()`
   with the official migrations where available. Keep each pass building and tested.
10. **Verify via [[verify-by-running]].** Type-check/build with `ng build` (or `tsc --noEmit`),
    run unit tests with `ng test` (Karma/Jasmine or the project's Jest setup), and lint with
    `ng lint`. Report the exact command and its real result.

## Inputs
- `package.json` and `angular.json` (Angular major, standalone vs NgModule, zoneless, test runner),
  the relevant component(s)/template(s), services/providers, route config, and the failing behavior
  or feature requirement.

## Output
- Which reactivity/DI/change-detection/RxJS/form/router concern was wrong and why, then the change.
- For components touched: the inputs/outputs/model contract, the providers/DI scope, and the
  change-detection strategy.
- The `ng build`/`tsc`/`ng test`/`ng lint` result via [[verify-by-running]]; any signal/reactivity
  or change-detection bug resolved.

## Notes
- Most modern "not updating" bugs are reactivity/change-detection: a non-signal value mutated under
  OnPush, an `effect` outside an injection context, or a missing `track` on `@for` — check these
  first. In Zone.js apps the cause is often a callback running outside Angular's zone.
- Prefer `toSignal`/`async` pipe over manual subscriptions; an unmanaged `subscribe` is the usual
  leak source.
- `inject()` and `effect()` must run in an injection context — passing an explicit `Injector` is the
  escape hatch when they don't.
- Choose `switchMap` (cancel previous), `mergeMap` (concurrent), `concatMap` (queue), `exhaustMap`
  (ignore-while-busy) by the cancellation/ordering semantics you need — a frequent source of bugs.
