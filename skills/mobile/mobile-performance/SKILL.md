---
name: mobile-performance
description: Use when diagnosing or fixing mobile-client performance — profile first, then attack the right axis. Covers frame rate / jank during scroll and animation, app startup / cold-launch time, list and scroll smoothness, memory growth & retain cycles / leaks, battery / energy drain, and binary / app-size. TRIGGER on a dropped-frames or stutter report, slow launch, janky list, OOM or rising memory, excessive battery use, or a bloated app download. Language/framework-agnostic — the framework specifics (which profiler, which lifecycle, which fix) come from the composed framework capability. NOT for store submission/signing (use mobile-release-management) or for writing new features.
allowed-tools: Read, Grep, Glob, Bash
category: mobile
tags: [performance, jank, frame-rate, startup, memory, battery, app-size, profiling]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Mobile Performance

The substantive mobile-client performance capability: measure with a profiler before changing
anything, identify which axis is actually slow (frames, startup, scroll, memory, battery, or
size), apply the fix that matches that axis, and re-measure to prove the win. The platform
specifics — which profiler to launch, which lifecycle to respect, which idiom to apply — come
from the composed framework capability; this skill supplies the discipline and the axis map.

## When to use this skill
When the concern is *performance of a running app*: dropped frames / stutter during scroll or
animation, slow cold or warm launch, janky or slow lists, growing memory / leaks / retain
cycles / out-of-memory, battery or energy drain, or a bloated binary / download size. Not for
correctness bugs, feature work, or store release. Pairs with [[verify-by-running]] (the
measurement runs are the verification) and the framework development capability (for the
platform-specific root cause and fix).

## Instructions
1. **Profile first — never guess.** "It feels slow" is not actionable. Reproduce the symptom on
   a representative device (a low/mid-tier physical device, not just a fast simulator/emulator),
   in a **release/optimized build** for timing claims (debug builds distort startup, scroll, and
   memory), and capture a baseline number with the right tool for the axis. Classify the symptom
   into exactly one primary axis before touching code — the fixes differ per axis. Defer to the
   framework capability for which profiler to launch and how to read its trace.
2. **Frame rate / jank.** The budget is per-frame: ~16.6 ms at 60 Hz, ~8.3 ms at 120 Hz. A
   dropped frame means work overran that budget on the UI/main thread. Find the long frames in a
   frame/timeline trace, then move work off the critical path: get heavy computation, decoding,
   and I/O off the main thread; cut overdraw and deep/expensive layout passes; avoid re-running
   layout/render work that didn't change. Confirm against the per-frame budget, not a vibe.
3. **Startup / launch time.** Separate **cold** (process start), **warm**, and **hot** launches —
   optimize cold first. Measure time-to-first-frame / time-to-interactive, then trim the startup
   critical path: defer non-essential initialization off the launch path (lazy/background init),
   shrink synchronous main-thread work before first frame, and avoid eager work for features not
   yet on screen. Re-measure cold launch specifically.
4. **Scroll / list performance.** Long lists must recycle/virtualize — never render the whole
   collection. Ensure stable item identity, cheap per-item layout, asynchronous + downsized image
   decode (decode to the display size, cache decoded bitmaps), and no synchronous I/O or
   allocation in the scroll/bind path. Verify smoothness with a frame trace during a fling, not a
   static screenshot.
5. **Memory & retain cycles / leaks.** Distinguish steady-state footprint, transient spikes, and a
   genuine *leak* (memory that should be freed but isn't). Take heap snapshots before/after the
   suspect flow and diff retained objects; trace retain cycles (strong reference loops — closures,
   delegates, observers, listeners that outlive their owner) and break them with the platform's
   weak/unowned reference idiom. Release large buffers (images, caches) under pressure. A flow
   that grows unbounded across repetitions is a leak, not a footprint.
6. **Battery / energy.** Energy cost is dominated by wakeups, radio, GPS/sensors, and sustained
   CPU/GPU. Batch and coalesce network and timer/wakeup work, avoid polling and busy loops,
   release sensors/location when not needed, and move sustained background work to the platform's
   deferrable/batched scheduler. Measure with the platform's energy profiler over a realistic
   session, not a microbenchmark.
7. **App / binary size.** Measure the actual download and install size (per-architecture / split
   delivery where applicable), then find the heaviest contributors: oversized or unoptimized
   image/media assets, duplicate or heavyweight dependencies, unstripped symbols/debug info, and
   un-shrunk code/resources. Cut the biggest contributors first, enable the platform's
   shrink/strip/split, and re-measure the download size delta in bytes.
8. **Re-measure to prove the win.** Re-run the *same* measurement on the *same* device and build
   configuration under the *same* conditions, and report the before/after delta for the targeted
   axis (ms per frame, cold-launch ms, retained MB, mAh/energy, download MB). A change with no
   measured improvement on the targeted axis is not done. Run the measurement via
   [[verify-by-running]] and report the exact command/profiler and its real output.

## Inputs
- The symptom and the device/build it reproduces on; the profiler trace, heap snapshot, frame
  timeline, or size report (or the exact command to capture one); the relevant code on the hot
  path (the view/screen, the list adapter/source, the startup/init path, or the leaking flow);
  and the framework capability for the platform-specific root cause and fix.

## Output
- The chosen primary axis (frames / startup / scroll / memory / battery / size), the baseline
  number, and the tool/trace that identified the bottleneck.
- The root cause stated in performance terms (over-budget frame, eager startup work, retain
  cycle, unrecycled list, oversized asset, …), then the change as focused diffs.
- Before/after for the targeted axis, measured the same way both times (via [[verify-by-running]]),
  plus any trade-off and remaining opportunities ranked by expected impact.

## Notes
- Never claim a speedup you did not measure; always cite the device, build configuration, tool,
  and conditions. A profile from a debug build or a flagship-only device is not representative.
- Optimize the axis that is actually the bottleneck; don't micro-optimize a cold path or regress
  one axis (e.g. inflate memory or app size) to chase another.
- Profile-first applies even under time pressure: an unprofiled "optimization" is a guess and
  frequently makes things worse.
- The framework specifics — which profiler (e.g. Instruments vs. Android Studio Profiler /
  perfetto), which lifecycle, which weak-reference idiom, which shrink toolchain — belong to the
  composed framework capability; this skill stays platform-agnostic.
