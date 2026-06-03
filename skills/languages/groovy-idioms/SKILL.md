---
name: groovy-idioms
description: Use when writing, reviewing, or debugging Groovy code — dynamic vs static dispatch (@CompileStatic/@TypeChecked), closures and functional collection methods (each/collect/findAll/inject), GStrings and string handling, optional typing and def, the Groovy truth / Elvis / safe-navigation operators, builder and DSL authoring (Gradle build scripts, Jenkinsfile pipelines, Spock specs), operator overloading and metaprogramming (ExpandoMetaClass, AST transforms), GDK extensions, and Java interop. Verifies with the project's build (groovy/gradle run, Spock/JUnit, gradle test) and CodeNarc. Any agent touching Groovy (writer, reviewer, debugger, a Gradle/Jenkins/Spock team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [groovy, jvm, gradle, jenkins, spock, dsl, metaprogramming]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Groovy Idioms

The substantive Groovy capability: write clear, idiomatic Groovy — knowing when to stay dynamic
and when to lock down with static compilation — and verify it with the project's build.

## When to use this skill
When authoring, reviewing, or debugging Groovy and any of these is involved: a dynamic-vs-static
dispatch question (`@CompileStatic`/`@TypeChecked`), closure or functional-collection usage,
GString/string handling, optional typing (`def`) and coercion, the Groovy truth / Elvis / safe
navigation operators, builder or DSL authoring (a Gradle build script, a Jenkinsfile pipeline, a
Spock spec), operator overloading or metaprogramming (`ExpandoMetaClass`, AST transforms), GDK
extension usage, a Java-interop boundary, or a Gradle build/dependency issue. Not needed for
trivial edits with no typing, dynamic-dispatch, DSL, or build dimension.

## Instructions
1. **Decide dynamic vs static deliberately.** Groovy is dynamic by default — method calls resolve
   at runtime through the metaclass. For hot paths, library code, and anywhere you want
   compile-time checking and Java-like speed, annotate with `@CompileStatic` (full static
   compilation) or `@TypeChecked` (static type checking, still dynamic dispatch). Know what each
   one disables: dynamic features (runtime method injection, dynamic property access, builder
   magic) stop working under `@CompileStatic`, so apply it per-method/per-class, not blindly.
   Keep DSL and metaprogramming code dynamic; make computational/business logic static.
2. **Use closures and the functional GDK methods.** Reach for `each`/`eachWithIndex`, `collect`,
   `findAll`/`find`, `inject` (fold), `groupBy`, `collectEntries`, `sum`, `any`/`every` over
   manual loops. Understand closure delegation — `delegate`, `owner`, `this`, and
   `resolveStrategy` (`OWNER_FIRST` default, `DELEGATE_FIRST` for DSLs) — because that is what
   makes builders and DSLs work. Use the implicit `it` for single-arg closures; name parameters
   when it aids clarity.
3. **Handle strings with GStrings correctly.** Use `"...${expr}..."` (lazy, interpolated GString)
   vs `'...'` (plain `String`, no interpolation) deliberately; use `"""..."""`/`'''...'''` for
   multiline and slashy `/.../ ` or dollar-slashy strings for regexes to avoid backslash noise.
   Know that a `GString` is not a `String` — force `.toString()` at Java-interop boundaries and
   at map keys where identity/equality matters.
4. **Lean on optional typing, Groovy truth, and the null-safe operators.** Use `def` (or an
   explicit type) where it reads clearer; prefer explicit types in public APIs and under
   `@CompileStatic`. Apply Groovy truth (empty collections/strings, zero, and null are falsy),
   the Elvis operator `?:` for defaults, the safe-navigation operator `?.` to avoid NPEs, and
   the spread operators `*.`/`*` where they read clearly. Watch coercion surprises (`==` calls
   `equals`, `as` coercion, auto-boxing) — be explicit when interop correctness depends on it.
5. **Author builders and DSLs — the Groovy strength.** Use `groovy.util.NodeBuilder`/
   `MarkupBuilder`/`JsonBuilder` and closure-delegation DSLs for declarative config. This is the
   model behind Gradle build scripts, Jenkins declarative/scripted pipelines, and Spock specs:
   set the closure's `delegate` and `resolveStrategy` so unqualified calls resolve to your DSL
   object. Keep DSL surfaces dynamic; document the delegate's available methods/properties.
6. **Use operator overloading and metaprogramming where it earns its keep.** Implement
   `plus`/`getAt`/`call`/`compareTo` etc. for natural operator semantics. For runtime behavior
   injection use `ExpandoMetaClass` (and categories) sparingly and locally; for compile-time
   behavior use AST transforms (`@Immutable`, `@Canonical`, `@ToString`, `@Builder`,
   `@Delegate`, `@Memoized`, `@Slf4j`, `@TupleConstructor`) — prefer these built-in transforms
   over hand-written boilerplate. Avoid global metaclass mutation that leaks across the JVM.
7. **Respect Java interop.** Groovy compiles to JVM bytecode and calls Java directly; watch the
   GString-vs-String boundary, checked-exception transparency (Groovy does not force them),
   default `public` visibility, property access compiling to getters/setters, and `BigDecimal`
   default for decimal literals. Detect the build (Gradle `build.gradle`, often the Groovy DSL),
   the Groovy version, and the framework in play (Grails, Micronaut, Ratpack, Spock, Gradle,
   Jenkins). Resolve dependency conflicts with `./gradlew dependencies` rather than guessing.
8. **Verify.** Run the project's build + tests — `./gradlew build` / `./gradlew test`, `groovy
   Script.groovy` for a standalone script, the Spock/JUnit task — plus `CodeNarc` if configured,
   and report the exact command and result.

## Inputs
- The Groovy code, the build file (`build.gradle`/`settings.gradle`) with the Groovy version, the
  context (Gradle build script, Jenkinsfile, Spock spec, Grails/Micronaut app), and the full
  error text (compiler error, `MissingMethodException`/`MissingPropertyException` stack trace,
  dependency tree) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  closure-delegation, `@CompileStatic` boundary, or metaprogramming decision.
- The build/test (and CodeNarc) command run and its result; any remaining dynamic-dispatch risk,
  leaked GString, global metaclass mutation, or unchecked coercion flagged with why.

## Notes
- Clarity over cleverness; reserve metaprogramming and dynamic tricks for DSLs and genuine
  boilerplate removal — make ordinary logic static and explicit.
- Never claim a `@CompileStatic` block still has its dynamic features; verify the dynamic paths
  (builders, injected methods) are not silently broken by static compilation.
- Apply within the project's conventions — match its existing build, framework (Gradle/Jenkins/
  Spock/Grails), and style.
