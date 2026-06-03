---
name: cpp-idioms
description: Use when writing, reviewing, or debugging modern C++ (C++17/20/23) — RAII and ownership, smart pointers (unique_ptr/shared_ptr), move semantics and the rule of 0/3/5, const-correctness, references vs pointers, templates and concepts, the STL and ranges, std::optional/variant/expected, value categories, and the undefined-behaviour/lifetime/aliasing hazards that make C++ unsafe. Verifies with the project's build and sanitizers (CMake build, ctest, clang-tidy, clang-format, ASan/UBSan/valgrind). Any agent touching C++ (writer, reviewer, debugger, systems/embedded/game team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [cpp, cpp17, raii, smart-pointers, templates, undefined-behaviour]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# C++ Idioms

The substantive modern C++ capability: write clear, memory-safe, correctly-owned C++17/20/23 and
verify it with the project's build and sanitizers.

## When to use this skill
When authoring, reviewing, or debugging C++ and any of these is involved: an ownership/lifetime
question, a smart-pointer or move-semantics decision, a template/concepts error, an STL/ranges
choice, suspected undefined behaviour, or a CMake/build/sanitizer issue. Not needed for trivial
edits with no ownership, template, or build dimension.

## Instructions
1. **Own resources with RAII.** Every resource (memory, file, socket, lock, handle) is owned by an
   object whose destructor releases it. Prefer the rule of 0 — let the compiler generate special
   members — and only write destructor/copy/move when managing a raw resource, in which case obey
   the rule of 3/5 completely (declare all five, or `= default`/`= delete` deliberately). Never
   leak a resource on an early return or exception path.
2. **Choose ownership explicitly with smart pointers.** `std::unique_ptr` for sole ownership (the
   default), `std::shared_ptr` only when ownership is genuinely shared, `std::weak_ptr` to break
   cycles, and raw pointers/references only as non-owning observers. Pass by reference for borrows,
   by value for sinks; never `new`/`delete` by hand or store an owning raw pointer.
3. **Use move semantics correctly.** Distinguish lvalues, xvalues, and prvalues; move when an
   object is expendable, copy when it must persist. Treat moved-from objects as valid-but-unspecified,
   use `std::move`/`std::forward` precisely (perfect forwarding with `T&&` + `std::forward<T>`), and
   never use a value after moving from it. Prefer return-by-value and rely on RVO/NRVO.
4. **Be const-correct and prefer references.** Mark methods, parameters, and locals `const` wherever
   they do not mutate; pass large objects by `const&`. Choose references over pointers when the
   referent cannot be null and ownership does not transfer; reserve pointers for nullable/optional
   or rebindable observers. Use `std::optional` for "maybe a value," `std::variant` for closed sums,
   and `std::expected` (C++23) or an error type for recoverable failures.
5. **Write generic code with templates and concepts.** Constrain templates with `concept`s and
   `requires` clauses (C++20) for clear errors and correct overload resolution; understand template
   argument deduction, CTAD, and SFINAE only where concepts cannot reach. Prefer the STL algorithms
   and `<ranges>` views over hand-written loops where they read clearer, and respect iterator/range
   validity rules.
6. **Hunt undefined behaviour and lifetime/aliasing hazards.** Watch for dangling references to
   temporaries and locals, use-after-free/move, out-of-bounds and iterator invalidation, signed
   overflow, uninitialized reads, data races, strict-aliasing and alignment violations, and
   returning references/`string_view`/`span` to expired storage. Treat any UB as a real defect, not
   a style nit.
7. **Handle concurrency with RAII.** Guard shared mutable state with `std::mutex` under
   `std::lock_guard`/`std::scoped_lock` (never a bare lock/unlock), use `std::atomic` for lock-free
   counters/flags with the right memory order, join or detach every `std::thread`, and reason about
   data races explicitly — `const` alone does not make mutable shared state thread-safe.
8. **Verify with the build and sanitizers.** Detect the build system (CMake `CMakeLists.txt`,
   compiler, C++ standard) and the package manager (Conan, vcpkg). Configure and build, run
   `ctest`, run `clang-tidy` and `clang-format --dry-run` for lint/format, and run the binary/tests
   under AddressSanitizer/UndefinedBehaviorSanitizer (`-fsanitize=address,undefined`) or valgrind
   to catch memory and UB defects. Report the exact commands and results.

## Inputs
- The C++ source, the build files (`CMakeLists.txt`, Conan/vcpkg manifests) with the compiler and
  C++ standard, and the full error text (compiler diagnostic, sanitizer/valgrind report, stack
  trace) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  ownership decision, move, template constraint, or lifetime concern.
- The build/test command run and its result (CMake build, ctest, clang-tidy, ASan/UBSan/valgrind);
  any remaining UB, owning raw pointer, missing rule-of-5 member, or race window flagged with why.

## Notes
- Memory safety and clear ownership over cleverness; do not reach for raw `new`/`delete` or manual
  reference counting where a smart pointer suffices.
- Never claim memory-safety or thread-safety without reasoning through lifetimes and the specific
  data path; prefer to confirm with ASan/UBSan/TSan rather than assert it.
- Apply within the project's conventions — match its existing C++ standard, build system, package
  manager, and style (clang-format config).
