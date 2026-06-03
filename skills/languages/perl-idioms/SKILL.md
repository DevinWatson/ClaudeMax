---
name: perl-idioms
description: Use when writing, reviewing, or debugging Perl — context (list vs scalar), references and complex data structures, regular expressions, sigils and dereferencing, subroutine signatures, modern OO (Moose/Moo) and Try::Tiny, CPAN/cpanm with local::lib, the Test2/Test::More testing culture, POD, and taint mode. Verifies with perl -c, prove, perlcritic, and perltidy. Any agent touching Perl (writer, reviewer, debugger, sysadmin/bioinformatics work) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [perl, references, regex, moose, cpan, testing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Perl Idioms

The substantive Perl capability: write clear, correct, strict-and-warnings-clean modern Perl —
getting context, references, and regular expressions right — and verify it with the project's
tooling.

## When to use this skill
When authoring, reviewing, or debugging Perl and any of these is involved: a list-vs-scalar
context surprise, a reference/dereference or nested-data-structure question, a regular-expression
correctness or performance issue, an OO design (Moose/Moo) choice, a CPAN dependency or
environment question, or a `Test2`/`Test::More` suite. Not needed for trivial one-line edits with
no context, reference, regex, or build dimension.

## Instructions
1. **Reason about context first.** Perl evaluates expressions in list or scalar context, and the
   same construct can mean different things in each (`my $n = @array` is a count; `my ($x) = @array`
   takes the first element). Identify the context an expression is evaluated in before changing it;
   use `wantarray` deliberately in subs that return context-sensitive results, and `scalar` to force
   scalar context where intent must be explicit.
2. **Always `use strict; use warnings`.** Treat their absence as a defect. Prefer lexical `my`
   variables, avoid symbolic references and package globals, and resolve every warning rather than
   silencing it — `no warnings` only with a narrow scope and a stated reason. Prefer
   `use v5.36;` (or the project's pragma) to enable signatures, `say`, and strict/warnings together.
3. **Use references and sigils correctly.** Build complex data with array/hash references
   (`\@a`, `\%h`, anonymous `[...]`/`{...}`); dereference with the postfix syntax
   (`$ref->@*`, `$ref->%*`, `$ref->{key}`, `$ref->[i]`). Keep the sigil matched to the access
   (`$h{$k}` for one element of `%h`), and avoid the old `@{[ ]}` tricks where postfix deref reads
   clearer. Watch for autovivification when probing nested structures.
4. **Treat regular expressions as a first-class strength — and a risk.** Use named captures
   (`(?<name>...)`), `/x` for readability, anchors and non-greedy quantifiers deliberately, and
   precompiled `qr//` for reuse. Guard against catastrophic backtracking (regex-DoS) from nested
   quantifiers on untrusted input; prefer atomic groups/possessive quantifiers or a parser when a
   pattern is ambiguous.
5. **Prefer modern OO and error handling.** Use Moose or Moo for classes (attributes with `has`,
   roles, type constraints, builders) rather than hand-rolled blessed-hash boilerplate; in newer
   Perls `use feature 'class'` may apply. Handle errors with `Try::Tiny` (or `Feature::Compat::Try`)
   rather than bare `eval { }; if ($@)`, which is easy to get wrong; throw exception objects, not
   strings, for anything callers must distinguish.
6. **Manage dependencies and environment deliberately.** Declare deps in `cpanfile`/`Makefile.PL`/
   `dist.ini`; install with `cpanm` into an isolated `local::lib` or a `Carton`-pinned
   (`cpanfile.snapshot`) environment rather than the system Perl. Detect the project's layout
   (`lib/`, `t/`, `bin/`, build tool) before adding code.
7. **Write tests in the project's idiom and document with POD.** Use `Test2::V0` or `Test::More`
   under `t/`, run via `prove`; cover happy path, boundaries, and error paths. Document modules and
   subs with POD (`=head1`, `=head2`, `=cut`); for code processing untrusted input consider taint
   mode (`perl -T`) and validate/untaint via capture before use.
8. **Verify.** Compile-check every changed file with `perl -c <file>`, run the suite with
   `prove -lr t/` (or `prove -l t/<file>.t`), lint with `perlcritic` and format-check with
   `perltidy`, and run `cpanm --installdeps .` when deps changed. Report the exact commands and
   their real results.

## Inputs
- The Perl source, the dependency/build manifest (`cpanfile`, `Makefile.PL`, `dist.ini`,
  `cpanfile.snapshot`) and the Perl version, and the full error text (compiler error, `die`
  message with stack, `prove` failure, `perlcritic` output) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  context decision, dereference, or regex.
- The exact verify commands run (`perl -c`, `prove`, `perlcritic`, `perltidy`, `cpanm`) and their
  results; any remaining `no warnings`, autovivification risk, or regex-DoS window flagged with why.

## Notes
- Clarity over Perl golf — readable strict code beats clever one-liners.
- Never claim a file compiles or tests pass without actually running `perl -c` / `prove`.
- Apply within the project's conventions: match its Perl version pragma, build tool, OO system
  (Moose vs Moo vs plain), and test framework rather than introducing a second style.
