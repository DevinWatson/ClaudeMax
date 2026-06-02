---
name: java-idioms
description: Use when writing or fixing Java/JVM code — generics and bounded wildcards (PECS), concurrency under the Java Memory Model (visibility, happens-before, atomicity), modern Java idioms (records, sealed types, switch expressions, streams, Optional), and Maven/Gradle build and dependency-conflict issues. Verifies with the project's build (mvn verify / gradlew test). Any agent touching Java (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [java, jvm, generics, concurrency, maven, gradle]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Java Idioms

The substantive Java capability: write clear, correctly-generic, thread-safe modern Java and
verify it with the project's build.

## When to use this skill
When authoring, reviewing, or debugging Java and any of these is involved: a generics/wildcard
error, a concurrency correctness question, modern-language-feature usage, or a Maven/Gradle
build or dependency conflict. Not needed for trivial edits with no generics/concurrency/build
dimension.

## Instructions
1. **Reason about generics in PECS terms.** Producer-extends, consumer-super: use
   `? extends T` for sources and `? super T` for sinks. Account for type erasure, invariance of
   parameterized types, and the limits of arrays-vs-generics. Avoid raw types; justify any
   `@SuppressWarnings("unchecked")`.
2. **Reason about concurrency via the Java Memory Model.** Distinguish visibility,
   happens-before, and atomicity — not just "add a lock." Identify the shared mutable state and
   its synchronization (`synchronized`, `volatile`, `java.util.concurrent`, atomics) before
   changing anything. Prefer `java.util.concurrent` (executors, concurrent collections,
   `CompletableFuture`) over hand-rolled `wait/notify`; favor immutability; never ignore
   `InterruptedException`.
3. **Prefer modern, idiomatic Java.** Records and sealed types for data and closed hierarchies,
   switch expressions and pattern matching, `var` for obvious locals, the Streams API where it
   reads clearer than a loop, `Optional` for absent *return* values (not fields/parameters),
   and try-with-resources for anything `Closeable`.
4. **Resolve dependency conflicts deliberately.** Use `mvn dependency:tree` /
   `gradle dependencies` to find version clashes; pin or exclude explicitly rather than guessing.
   Detect the build (Maven `pom.xml` or Gradle `build.gradle[.kts]`), JDK version, and
   frameworks (Spring, Jakarta EE) in play.
5. **Verify.** Run the project's compile + test — `mvn -q verify` or `./gradlew test` (or the
   module's specific task) — and report the exact command and result.

## Inputs
- The Java code, the build file (`pom.xml`/`build.gradle[.kts]`) with JDK version, and the full
  error text (compiler error, stack trace, dependency tree) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  generic or lock.
- The build/test command run and its result; any remaining raw type, `@SuppressWarnings`, or
  race window flagged with why.

## Notes
- Clarity and thread-safety over cleverness; do not add a framework where plain Java suffices.
- Never claim thread-safety without reasoning through the memory model on the specific path.
- Apply within the project's conventions — match its existing build, framework, and style.
