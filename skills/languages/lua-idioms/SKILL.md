---
name: lua-idioms
description: Use when writing, reviewing, or debugging Lua — tables as the universal data structure, metatables and metamethods (OOP via __index), first-class functions and closures, the colon method syntax, 1-based indexing and sequence/nil pitfalls, multiple returns and varargs, coroutines, pcall/error handling, the require module system, the C API and LuaJIT FFI, Lua 5.1/5.4 and LuaJIT differences, and common embedding contexts (Neovim, OpenResty/Nginx, Redis, game engines). Verifies with the project's runtime and tools (lua/luajit, busted/luaunit, luacheck, stylua, LuaRocks). Any agent touching Lua (writer, reviewer, debugger, Neovim/OpenResty/game team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [lua, luajit, metatables, coroutines, openresty, neovim]
version: 1.0.0
license: MIT
status: stable
---

# Lua Idioms

The substantive Lua capability: write clear, correct, idiomatic Lua — fluent in tables,
metatables, closures, coroutines, and error handling — targeting the right Lua dialect and
embedding host, and verify it with the project's runtime and tools.

## When to use this skill
When authoring, reviewing, or debugging Lua and any of these is involved: table/metatable
behavior, OOP via metatables, a closure/upvalue question, 1-based indexing or a sequence/`nil`
hole bug, multiple returns or varargs, coroutine flow, `pcall`/`error` handling, the module
system, C API / LuaJIT FFI boundaries, a Lua 5.1 vs 5.4 vs LuaJIT difference, or an embedding
context (Neovim, OpenResty, Redis, a game engine). Not needed for trivial edits with no
table/metatable/error/dialect dimension.

## Instructions
1. **Identify the dialect and host first.** Determine whether the target is Lua 5.1, 5.2/5.3,
   5.4, or LuaJIT, and the embedding context (standalone, Neovim, OpenResty/Nginx, Redis,
   game engine). This decides what is available: integer subtype and `//` (5.3+), `goto`
   (5.2+), bitwise operators (5.3+), and `<close>`/`__close` (5.4); `setfenv`/`getfenv`,
   implicit `arg`, and `unpack` vs `table.unpack` (5.1/LuaJIT vs 5.2+); the `ffi`, `bit`, and
   JIT semantics (LuaJIT only). Do not use a feature the target dialect lacks.
2. **Model data with tables deliberately.** Tables are the only data structure — array part
   (sequence) and hash part in one. Treat a "sequence" as keys `1..n` with no holes: a `nil`
   in the middle makes `#t` and `ipairs` undefined past the hole. Use `ipairs`/`#` only for
   true sequences; use `pairs` for maps (and never rely on `pairs` order). Prefer `table.insert`
   / explicit indexing over manual length tracking, and remember that storing `nil` deletes a key.
3. **Use metatables and metamethods correctly.** For OOP, set `Class.__index = Class` and
   construct with `setmetatable({}, Class)`; understand that `__index` is consulted only on a
   miss and may be a table (delegation) or a function (computed). Know the common metamethods
   (`__index`, `__newindex`, `__call`, `__eq`, `__lt`, `__add`, `__tostring`, `__len`, `__gc`,
   `__close`) and that metatable lookup does not chain unless you build the chain. Use `rawget`/
   `rawset`/`rawequal` to bypass metamethods when you must avoid recursion.
4. **Treat functions as first-class and reason about closures/upvalues.** Functions capture
   upvalues by reference; closures sharing an upvalue see each other's mutations, and a loop
   variable captured per-iteration differs between 5.1 (shared) and later semantics — bind a
   fresh local inside the loop when you need per-iteration capture. Prefer the colon syntax
   `obj:method(...)` (sugar for `obj.method(obj, ...)`) and keep `self` consistent; define with
   `function T:m()` to get an implicit `self`.
5. **Handle multiple returns and varargs precisely.** A call in the *last* position expands to
   all its returns; anywhere else it truncates to one. Use `select('#', ...)` to count varargs
   (it preserves embedded `nil`s, unlike `#{...}`), `table.pack`/`table.unpack` (5.2+) or
   `unpack` (5.1/LuaJIT) to move between varargs and tables, and parenthesize `(f())` to force
   a single value. Return `nil, errmsg` for recoverable failure following the standard-library
   convention.
6. **Use coroutines for cooperative concurrency.** `coroutine.create`/`resume`/`yield`/`status`
   give symmetric cooperative multitasking — there is no preemption and no OS thread. Values
   pass both ways across `yield`/`resume`; an error inside a coroutine surfaces through `resume`
   as `false, err` (not a raised error). Use `coroutine.wrap` for an iterator-style coroutine,
   and remember you cannot `yield` across a C-call boundary on stock Lua 5.1 (LuaJIT and 5.2+
   relax this).
7. **Get error handling right.** Errors propagate via `error(obj[, level])` and are caught with
   `pcall`/`xpcall`; `error` with a string prepends position info unless `level` is 0, and any
   value (including a table) can be raised. Use `xpcall` with a handler to capture a traceback
   (`debug.traceback`) at the point of failure. Follow the library convention: return
   `nil, message` for *expected* failures and reserve `error` for programming/contract violations.
   `assert(v, msg)` raises when `v` is falsy and otherwise returns its arguments.
8. **Use the module system idiomatically.** A module is a file that returns a table; load it
   with `require('name')`, which caches in `package.loaded` (so the body runs once) and resolves
   via `package.path`/`package.cpath`. Avoid global side effects and the deprecated `module()`
   function; return a local table. For LuaRocks projects, respect the rockspec's module layout
   and dependencies.
9. **Cross the C boundary carefully.** On the C API, respect the virtual stack and balance
   pushes/pops; on LuaJIT prefer the `ffi` library (`ffi.cdef`, `ffi.new`, `ffi.cast`) for
   native calls — mind cdata ownership/lifetime, struct alignment, and that FFI calls are not
   sandboxable. Keep hot loops JIT-friendly on LuaJIT (avoid constructs that abort the trace,
   such as `pcall` in the hot path or NYI library calls).
10. **Verify.** Run the project's actual runtime and tooling and report the exact command and
    result: execute with `lua`/`luajit`, run tests with `busted` (or `luaunit`), lint with
    `luacheck`, format-check with `stylua --check`, and use `luarocks` for the dependency/build
    surface. Prefer the project's own script (Makefile target, `.busted`, `.luacheckrc`,
    rockspec) over a generic invocation.

## Inputs
- The Lua source, the dialect/host (Lua version or LuaJIT; standalone vs Neovim/OpenResty/Redis/
  game engine), the project config (`.luacheckrc`, `.busted`, `stylua.toml`, rockspec), and the
  full error text (stack trace, `luacheck` output) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  metatable, closure-capture, or dialect-specific decision.
- The runtime/test/lint command run and its result; any remaining global leak, sequence hole,
  uncaught coroutine error, or dialect-incompatible feature flagged with why.

## Notes
- Clarity over cleverness; do not reach for metatables or coroutines where a plain table or a
  loop reads better.
- Never claim correctness across dialects without checking the feature exists in the target
  (e.g. `goto`, integer division, `<close>`, `ffi`).
- Apply within the project's conventions — match its existing module layout, dialect, embedding
  host (Neovim API, OpenResty `ngx.*`, Redis `redis.call`), and style.
