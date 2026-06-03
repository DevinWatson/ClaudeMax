---
name: php-idioms
description: Use when writing or fixing modern PHP (8.x) code — typed properties, union/intersection and nullable types with strict_types, enums and readonly properties, the match expression, first-class callable syntax, null-safe (?->) chains, attributes, traits and interfaces, generators, and robust exception handling; plus PSR-4 autoloading and PSR-12 style, Composer dependency management, and dependency-conflict resolution. Verifies with the project's tooling (composer test / phpunit, phpstan or psalm, php-cs-fixer). Any agent touching PHP (writer, reviewer, debugger, or a Laravel/Symfony/Slim team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [php, php8, composer, psr, phpstan, psalm]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# PHP Idioms

The substantive modern-PHP capability: write clear, strictly-typed, well-structured PHP 8.x and
verify it with the project's tooling.

## When to use this skill
When authoring, reviewing, or debugging PHP and any of these is involved: a type-system question
(typed properties, union/nullable/intersection types, `strict_types`), modern-language-feature
usage (enums, `readonly`, `match`, first-class callables, null-safe `?->`, attributes,
generators), trait/interface composition, exception/error handling, PSR conformance
(PSR-4 autoloading, PSR-12 style), or a Composer dependency/version conflict. Not needed for
trivial edits with no type, structure, or build dimension.

## Instructions
1. **Declare and lean on strict typing.** Put `declare(strict_types=1);` at the top of every
   PHP file and type every property, parameter, and return. Use union (`A|B`), nullable (`?T`),
   and intersection (`A&B`) types deliberately; prefer `readonly` properties for immutable value
   objects and constructor property promotion to cut boilerplate. Avoid `mixed` and untyped
   `array` where a shape (DTO, enum, or a generic `@param` annotation) communicates intent better.
2. **Prefer modern, idiomatic PHP 8.x.** Use `enum` (backed enums for serialized values) for
   closed sets instead of class constants, the `match` expression (strict, exhaustive, no
   fallthrough) over long `switch` chains, the null-safe operator `?->` for optional chains,
   first-class callable syntax (`$fn(...)`), named arguments for clarity, and attributes
   (`#[...]`) for metadata instead of docblock magic where the framework supports them. Use
   generators (`yield`) for streaming/large sequences rather than building whole arrays.
3. **Compose with traits and interfaces correctly.** Program to interfaces; use traits for
   shared behavior, not as a substitute for composition. Resolve trait method conflicts
   explicitly with `insteadof`/`as`. Keep value objects immutable and `final` by default.
4. **Handle errors as exceptions, deliberately.** Throw specific exception types (extend
   `\RuntimeException`/`\LogicException` or a domain hierarchy), catch narrowly, and never
   swallow. Use `try/finally` for cleanup, and `\Throwable` only at top-level boundaries.
   Surface PHP warnings/notices as failures in dev rather than letting them pass silently.
5. **Conform to PSR and structure with Composer.** Map namespaces to paths with PSR-4
   `autoload`/`autoload-dev` in `composer.json`; format to PSR-12 (or the project's preset).
   Pin direct dependencies in `composer.json` and rely on `composer.lock` for reproducibility.
6. **Resolve dependency conflicts deliberately.** Use `composer why` / `composer why-not` and
   `composer outdated` to find version clashes; adjust constraints or add an explicit
   `conflict`/`replace` rather than blindly running `composer update`. Detect the PHP version
   (`composer.json` `require php`), the framework (Laravel, Symfony, Slim), and the
   autoload/test setup before changing anything.
7. **Verify.** Run the project's checks and report the exact commands and results:
   - tests — `composer test` or `vendor/bin/phpunit` (or `vendor/bin/pest`);
   - static analysis — `vendor/bin/phpstan analyse` or `vendor/bin/psalm`;
   - style — `vendor/bin/php-cs-fixer fix --dry-run --diff` (or `phpcs`).

## Inputs
- The PHP code, `composer.json`/`composer.lock` with the PHP version and framework, the relevant
  `phpstan.neon`/`psalm.xml`/`.php-cs-fixer.php` config, and the full error text (fatal error,
  stack trace, PHPStan/Psalm report, or dependency-resolution output) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious type
  declaration, enum, or trait-conflict resolution.
- The test/analysis/style commands run and their results; any remaining `mixed`, suppressed
  PHPStan/Psalm baseline entry, or swallowed exception flagged with why.

## Notes
- Clarity and type-safety over cleverness; do not add a framework or package where plain PHP
  suffices.
- Never claim type-safety without a passing PHPStan/Psalm run on the relevant path.
- Apply within the project's conventions — match its existing framework, namespace layout,
  static-analysis level, and style preset.
