---
name: c-idioms
description: Use when writing, reviewing, or debugging systems/embedded C (C11/C17) — manual memory management (malloc/free, ownership discipline), pointers and pointer arithmetic, arrays/strings and buffer-bounds safety, structs/unions/enums, the preprocessor, undefined behaviour and integer overflow/aliasing, error handling via return codes and errno, const/volatile/restrict, modular design with headers, and POSIX/system-call usage. Verifies with the project's build and sanitizers (make/CMake build, ctest/Unity/CMocka, clang-tidy, ASan/UBSan/valgrind, cppcheck). Any agent touching C (writer, reviewer, debugger, embedded/kernel team) can load it. NOT for C++ — no classes, RAII, templates, or the STL (use cpp-idioms for those).
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [c, c11, c17, memory-management, pointers, undefined-behaviour, systems, embedded]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# C Idioms

The substantive systems/embedded C capability: write clear, memory-safe, well-bounded C11/C17 and
verify it with the project's build and sanitizers. This is C, not C++ — no classes, RAII, templates,
or the STL; ownership and lifetimes are managed by hand and proven, not assumed.

## When to use this skill
When authoring, reviewing, or debugging C and any of these is involved: a manual-memory or
ownership question (malloc/free, who-frees-what), pointer arithmetic or aliasing, a buffer-bounds or
string-handling hazard, struct/union/enum or preprocessor design, suspected undefined behaviour or
integer overflow, return-code/errno error handling, const/volatile/restrict correctness, header and
module structure, a POSIX/system-call decision, or a make/CMake build or sanitizer issue. Not needed
for trivial edits with no memory, pointer, bounds, or build dimension. For C++ (RAII, smart
pointers, templates, STL) use `cpp-idioms` instead.

## Instructions
1. **Manage memory by hand with explicit ownership.** For every allocation, fix exactly one owner
   and one free path; document who frees what and when. Match each `malloc`/`calloc`/`realloc` with
   exactly one `free`, check every allocation for `NULL`, never free twice or use after free, and
   null the pointer after freeing where it could be reused. On every error/early-return path, free
   everything already allocated (a single `goto cleanup` ladder is idiomatic). Guard `realloc`
   against losing the original pointer on failure.
2. **Use pointers and pointer arithmetic deliberately.** Track what each pointer points to, whether
   it owns or merely borrows, and its valid lifetime. Only do arithmetic within a single array
   object (one-past-the-end is the only legal out-of-bounds address, and is not dereferenceable).
   Never return a pointer to a local (stack) object, and respect alignment — do not cast a pointer
   to a stricter-aligned type and dereference it.
3. **Keep arrays and strings within bounds.** Carry an explicit length with every buffer; do not
   trust NUL-termination on untrusted input. Prefer bounded operations (`snprintf`, `memcpy` with a
   checked size, `strnlen`) over `strcpy`/`strcat`/`sprintf`/`gets`. Validate every index and size
   against the buffer length before access, and account for the terminating NUL when sizing string
   buffers.
4. **Model data with structs, unions, and enums; respect layout.** Use `struct` for records,
   tagged `union`s (a discriminant enum plus the union) for variants — never read a union member
   other than the one last written — and `enum` for closed sets. Be aware of padding/alignment and
   endianness when serializing or memcpy-ing structs, and prefer designated initializers
   (`.field = ...`) for clarity and zero-init safety.
5. **Use the preprocessor sparingly and safely.** Prefer `const`/`enum`/`static inline` over
   function-like macros; when a macro is necessary, fully parenthesize every parameter and the whole
   body and beware double-evaluation of arguments. Guard every header with include guards (or
   `#pragma once` if the project uses it), and keep conditional compilation (`#ifdef`) localized.
6. **Hunt undefined behaviour, integer overflow, and aliasing.** Treat as real defects: reads of
   uninitialized memory, out-of-bounds and use-after-free/return-of-local, signed integer overflow,
   shifts by negative/oversized amounts, division by zero, invalid pointer conversions, data races,
   and strict-aliasing violations (reinterpreting memory through an incompatible pointer type — use
   `memcpy` or a `union` to type-pun). Check for overflow *before* arithmetic on sizes/indices
   (especially in allocation sizes), and be deliberate about signed/unsigned conversions and integer
   promotions.
7. **Handle errors with return codes and errno.** Establish and follow a single convention (e.g.
   `0`/negative or a status enum); check the return value of every call that can fail (including
   `malloc`, I/O, and system calls). Read `errno` only immediately after a failing call that sets it
   (and after saving it before any other library call), and propagate or translate errors rather
   than swallowing them. Free resources on the error path.
8. **Apply const/volatile/restrict correctly.** Mark pointers-to-data `const` when the callee does
   not mutate the pointee; use `volatile` only for memory-mapped I/O and signal-touched state, not
   as a concurrency primitive; use `restrict` only when you can guarantee non-aliasing, and never
   alias a `restrict`-qualified pointer.
9. **Structure modules with clean headers.** Put the public interface in a guarded header (types,
   prototypes, documented ownership/contract), keep implementation and helpers `static` in the `.c`
   file, and avoid non-`const` globals. Keep translation units cohesive and dependencies acyclic;
   expose the minimum surface.
10. **Use POSIX/system calls correctly.** Check every syscall return and handle `EINTR` (retry where
    appropriate); close every fd and release every resource on all paths; be explicit about
    buffering, blocking vs. non-blocking, and signal safety (only async-signal-safe calls in
    handlers). Match the platform's feature-test macros and standard (C11/C17, `_POSIX_C_SOURCE`).
11. **Verify with the build and sanitizers.** Detect the build system (`Makefile`, CMake
    `CMakeLists.txt`, or Meson), the compiler and C standard, and the test framework (Unity, CMocka,
    Criterion, or ctest). Build with warnings high (`-Wall -Wextra`), run the tests, run the binary
    and tests under AddressSanitizer/UndefinedBehaviorSanitizer (`-fsanitize=address,undefined`) or
    valgrind to catch memory and UB defects, and run `clang-tidy` and `cppcheck` for static analysis.
    Report the exact commands and results.

## Inputs
- The C source, the build files (`Makefile`/`CMakeLists.txt`/`meson.build`) with the compiler and C
  standard, and the full error text (compiler diagnostic, sanitizer/valgrind report, cppcheck/
  clang-tidy output, core-dump/stack trace) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  ownership decision, pointer/bounds invariant, lifetime concern, or UB fix.
- The build/test command run and its result (make/CMake build, ctest/Unity/CMocka, ASan/UBSan/
  valgrind, clang-tidy/cppcheck); any remaining leak, unchecked allocation, unbounded copy, integer
  overflow, aliasing violation, or unfreed error path flagged with why.

## Notes
- Memory safety and explicit, bounded ownership over cleverness; carry lengths, check returns, and
  free on every path.
- Never claim leak-freedom or memory-safety without reasoning through the lifetime and proving it
  with ASan/UBSan/valgrind — do not assert it.
- This is C: solve problems with structs, functions, pointers, and modules — do not reach for C++
  constructs (classes, RAII, templates, STL); that is `cpp-idioms`.
- Apply within the project's conventions — match its existing C standard, build system, error-code
  convention, and style (clang-format config).
