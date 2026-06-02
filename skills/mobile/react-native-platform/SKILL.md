---
name: react-native-platform
description: Use when working on React Native mobile-platform specifics — the JS↔native boundary (TurboModules/Fabric/JSI vs legacy bridge), Metro/Hermes, platform-specific code, native navigation (react-navigation/native-stack), and Expo vs bare workflow. TRIGGER on native-module/bridging work, build/Metro/Hermes issues, platform divergence, or RN-specific runtime perf. Any agent touching RN at the native/build layer (writer, reviewer, perf debugger) can load it. NOT for plain web-React render/hook/state problems (that is generic React) and NOT for pure single-platform native UI.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: mobile
tags: [react-native, expo, hermes, turbomodules, metro]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# React Native Platform

The substantive React Native *mobile-platform* capability: the parts that do not exist in web
React — the JS↔native boundary, native modules/bridging, the Metro bundler, the Hermes engine,
platform-specific code, native navigation, and the Expo vs bare workflow.

## When to use this skill
When working on RN-specific concerns: writing/fixing a native module or bridge, a
build/Metro/Hermes problem, genuine platform divergence (iOS vs Android), native navigation, or
RN-specific runtime performance. Do NOT use it for problems that are really plain-React render
model / state placement / hook composition (those hold on any renderer and belong to generic
React reasoning), nor for pure single-platform native UI (SwiftUI / Kotlin-Compose).

## Instructions
1. **Establish the workflow and architecture first.** Read `package.json` (RN version — New
   Architecture/Fabric/TurboModules differs by version), `app.json`/`app.config.*` (Expo) or
   `ios/`+`android/` (bare), and `metro.config.js`. Confirm: Expo managed vs bare/prebuild, New
   Architecture on/off, Hermes on/off. Classify the issue as **bridging/native module**,
   **navigation**, **platform-specific**, **build/Metro**, or **runtime perf**. If it is really
   plain-React render/state, say so and defer.
2. **Choose the right workflow.** Recommend Expo (managed + EAS) by default for velocity; move
   to bare/prebuild only when a config plugin can't express a needed native change. Prefer
   `npx expo prebuild` / config plugins over hand-editing native dirs.
3. **Bridge correctly.** On the New Architecture, write **TurboModules** and **Fabric**
   components with codegen specs (`Native*` TS spec files) rather than the legacy bridge. Keep
   the JS↔native crossing minimal — batch calls, avoid chatty per-frame messaging, move hot
   paths to JSI/native. For legacy modules, mind threading and serialization limits.
4. **Handle platform differences explicitly.** Use `Platform.select` / `.ios.tsx` / `.android.tsx`
   for genuine divergence; respect safe areas and per-OS gestures. Don't fork the whole
   component when a prop branch suffices.
5. **Use native navigation properly.** React Navigation with `@react-navigation/native-stack`
   (native screens via `react-native-screens`) for native feel; type the param lists. Reserve
   `react-native-reanimated`/`gesture-handler` for UI-thread animations to avoid bridge jank.
6. **Diagnose performance on-device.** Confirm Hermes is enabled and shipping bytecode; profile
   with the Hermes profiler / Flipper (or bundled RN DevTools on newer RN). Common wins: enable
   New Arch, move list rendering to `FlashList`/`FlatList` with stable keys + `getItemLayout`,
   offload animation to Reanimated worklets, trim the JS bundle (Metro `inlineRequires`, RAM
   bundles). Measure JS thread vs UI thread frame drops separately.
7. **Verify.** Run the relevant build: `npx react-native run-ios`/`run-android` (bare) or
   `npx expo run:ios`/`eas build` (Expo), plus `npm test` and `npx tsc --noEmit`. Reset Metro
   cache (`--reset-cache`) when diagnosing stale-bundle issues. Report exact commands + results.

## Inputs
- The RN/Expo config and version, the native module / navigation / build code in question, and
  the full build/runtime error or profiler trace; for native crashes, the symbolicated stack.

## Output
- The layer the problem lives in (bridge / navigation / platform / build / perf), then the
  change as focused diffs with rationale.
- The exact build/test commands run and their results.
- If the real fix is plain-React render/state, an explicit handoff note rather than a patch.

## Notes
- Prefer Expo config plugins over manual native edits; flag any change that forces ejection.
- Keep the JS↔native boundary thin; batch crossings and keep hot paths off the legacy bridge.
- For a reported bug/crash, combine with a reproduce-then-fix loop (Jest/RNTL test or a minimal
  repro app) before patching.
