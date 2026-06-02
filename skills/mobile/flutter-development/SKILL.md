---
name: flutter-development
description: Use when writing, reviewing, or debugging Flutter/Dart — widget/element/render-object tree composition, state management (Riverpod/Bloc/Provider/setState), build/layout/paint performance, and platform channels (MethodChannel/Pigeon). TRIGGER on wrong/stale UI or setState-after-dispose, a state-architecture choice, jank / excessive rebuilds, or native platform integration. Any agent touching Flutter (writer, reviewer, perf debugger) can load it. NOT for native SwiftUI/Kotlin or React Native.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: mobile
tags: [flutter, dart, riverpod, bloc, performance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Flutter Development

The substantive Flutter/Dart capability: reason about the widget / element / render-object
trees, the build/layout/paint pipeline, and idiomatic Dart with sound null safety, and write
composable, `const`-correct widgets with state management chosen deliberately.

## When to use this skill
When authoring, reviewing, or debugging Flutter/Dart and any of the following is involved:
wrong/stale UI, `setState` after dispose or key issues, a state-architecture decision, jank /
excessive rebuilds, or platform integration. Not needed for trivial edits with no widget-tree,
state, perf, or platform-channel dimension.

## Instructions
1. **Establish the project context first.** Read `pubspec.yaml` (Flutter/Dart SDK constraints,
   dependencies) and `analysis_options.yaml` (lints). Identify the state-management approach
   already in use (Provider, Riverpod, Bloc/Cubit, `setState`, GetX) and match it — do not
   introduce a competing one. Read the widget(s), their parents, and the state they depend on.
   Classify the issue as **correctness**, **state architecture**, **performance**, or **platform
   integration**.
2. **Compose widgets correctly.** Split large `build` methods into small widgets (not helper
   methods) so Flutter can skip rebuilding subtrees; mark immutable subtrees `const`. Choose
   `StatelessWidget` vs `StatefulWidget` deliberately and dispose controllers/listeners in
   `dispose()`. Use `Key`s only where identity matters across reorders.
3. **Pick state management for the situation.**
   - **Riverpod** for testable, compile-safe DI state (prefer over legacy Provider for new
     code); use granular providers + `select` to scope rebuilds.
   - **Bloc/Cubit** when you want explicit event→state transitions and a replayable stream.
   - Plain `setState`/`ValueNotifier` for local, ephemeral widget state.
   Keep business logic out of widgets; expose immutable state objects.
4. **Diagnose performance with evidence.** Jank comes from rebuilding/relayouting too much or
   expensive work in `build`, not "Flutter being slow." Use DevTools: the **Performance** view
   (UI vs raster thread, "Track widget rebuilds"), the **CPU profiler**, and
   `flutter run --profile` on a real device (never judge perf in debug/JIT). Fix by narrowing
   rebuild scope (`const`, `Consumer`/`select`, `RepaintBoundary`), avoiding `Opacity`/`saveLayer`
   in hot paths, and using lazy builders (`ListView.builder`).
5. **Integrate with platforms cleanly.** Use `MethodChannel`/`EventChannel` (or Pigeon for
   type-safe bindings) for platform channels; keep the Dart side async and handle the
   no-implementation error. Don't block the platform thread.
6. **Verify.** Run `flutter analyze` (zero issues), `flutter test`, and a build for the target
   (`flutter build apk`/`ipa`/`appbundle`) or `flutter run --profile` for perf work. Run
   `dart format`. Report the exact commands and results.

## Inputs
- The widget(s), their parents, and the state they depend on; the SDK constraints and existing
  state-management choice; the full crash/analyzer output or DevTools trace being diagnosed.

## Output
- The root cause in widget/render-tree or state-architecture terms, then the change as focused
  diffs with a one-line rationale per non-obvious widget split or provider scope.
- The exact `flutter`/`dart` commands run and their results; how to verify any jank claim in
  DevTools (UI vs raster thread); any analyzer issue left.

## Notes
- Respect SDK constraints in `pubspec.yaml` and the existing state-management choice; don't add
  a second state library.
- Correctness before performance; never scatter `RepaintBoundary`/`const` to mask a rebuild or
  lifecycle bug. Judge performance only in profile/release mode, never debug.
- For a reported bug/crash, combine with a reproduce-then-fix loop using a `flutter_test` /
  `WidgetTester` case (`testWidgets`) before patching.
