---
name: ruby-idioms
description: Use when writing or fixing Ruby — metaprogramming behavior (method lookup, method_missing/respond_to_missing?, define_method), blocks vs. procs vs. lambdas, Enumerable and expressive idioms, mixin/module composition, Bundler/gem dependency issues, and Rails-aware concerns (N+1, ActiveRecord lifecycle). Verifies with the project's specs and rubocop. Any agent touching Ruby (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [ruby, metaprogramming, enumerable, bundler, rspec]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Ruby Idioms

The substantive Ruby capability: reason about Ruby's object model, write expressive
idiomatic code, wield metaprogramming with restraint, and verify with the project's suite.

## When to use this skill
When authoring, reviewing, or debugging Ruby and any of these is involved: surprising
metaprogramming behavior, block/proc/lambda semantics, module composition, a Bundler/gem
issue, or Rails-aware concerns. Not needed for trivial edits with no metaprogramming or
design dimension.

## Instructions
1. **Diagnose via the object model.** Establish the method-lookup path — `self`, the singleton
   class, the ancestor chain, and `include`/`prepend`/`extend` order — before reasoning about
   what runs. Explain `method_missing`/`respond_to_missing?` and `define_method` vs. `def`.
2. **Know blocks vs. procs vs. lambdas.** Distinguish arity strictness and `return` semantics
   (a lambda returns from itself; a proc/block returns from the enclosing method). Use
   `yield`/`&block` idiomatically and prefer passing blocks over building closures by hand.
3. **Prefer the simplest expressive form.** Lean on `Enumerable` (`map`/`select`/`reduce`/
   `each_with_object`/`group_by`), keyword arguments, and composition (modules/mixins) over
   inheritance. Reach for metaprogramming only when it removes real duplication — always pair
   `method_missing` with `respond_to_missing?`, and prefer `define_method` over `eval`.
4. **Be Rails-aware when relevant.** Watch for N+1 queries (use `includes`/`preload`), respect
   the ActiveRecord callback lifecycle, avoid fat models/controllers (extract concerns or
   service objects), and do not monkey-patch core classes without strong justification.
5. **Manage gems cleanly.** Use Bundler; read `Gemfile`/`Gemfile.lock` and `.ruby-version`;
   resolve conflicts via `bundle update <gem>` and the lockfile rather than loosening
   constraints blindly.
6. **Verify.** Run the project's suite (`bundle exec rspec` or `rake test`) and
   `bundle exec rubocop`, always via `bundle exec`, and report the exact commands and results.

## Inputs
- The Ruby code, the `Gemfile`/`Gemfile.lock`, `.ruby-version`, any `.rubocop.yml`, and the
  full error/stack trace being diagnosed.

## Output
- The real cause (with the lookup-path reasoning for metaprogramming) and the change as a
  focused diff, with a one-line rationale per non-obvious metaprogramming choice.
- The spec/rubocop commands run and their results; any monkey-patch or dynamic dispatch
  flagged with why it is justified.

## Notes
- Readability over cleverness; metaprogramming that obscures more than it saves is a regression.
- Never monkey-patch core/library classes or use `eval` without flagging the risk.
- Apply within the project's conventions — detect plain Ruby vs. Rails and match its style.
