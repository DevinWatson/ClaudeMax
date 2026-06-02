---
name: go-idioms
description: Use when writing or fixing Go — goroutine/channel/context concurrency correctness (data races, deadlocks, goroutine leaks, send-on-closed-channel), error wrapping, idiomatic interface design, and module/build issues. Reasons about happens-before, threads context properly, and verifies with go build/vet and go test -race. Any agent touching Go (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [go, golang, concurrency, context, errors]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Go Idioms

The substantive Go capability: write simple, explicit, concurrency-correct Go and verify it
with the race detector and vet.

## When to use this skill
When authoring, reviewing, or debugging Go and any of these is involved: a concurrency report
(race, deadlock, leak), context propagation/cancellation, error-handling design, an interface
boundary, or a module/build issue. Not needed for trivial edits with no concurrency or design
dimension.

## Instructions
1. **Diagnose concurrency precisely.** Reason about happens-before and the specific hazard —
   data race, deadlock, goroutine leak, send-on-closed-channel, or unsynchronized map access.
   Identify the goroutines, the shared state, and the synchronization (channels, `sync.Mutex`,
   `sync.WaitGroup`, `sync/atomic`) before proposing a change.
2. **Honor context.** Thread `context.Context` as the first parameter, respect cancellation and
   deadlines, propagate it through call chains, and never store a context in a struct. Ensure
   every goroutine you start has a clear, guaranteed exit (no leaks).
3. **Handle errors idiomatically.** Wrap with `fmt.Errorf("...: %w", err)`, inspect with
   `errors.Is`/`errors.As`, and never silently swallow an error. Prefer returning errors over
   panics; reserve `panic` for truly unrecoverable states. Use `defer` for cleanup, mindful of
   evaluation timing and loop-variable capture.
4. **Write idiomatic Go.** Accept interfaces, return concrete structs; keep interfaces small
   and defined by the consumer. Avoid premature abstraction, reflection, and unnecessary
   generics. Zero values that are useful, and the stdlib over dependencies.
5. **Manage modules deliberately.** Read `go.mod` (module path, Go version); resolve build/dep
   issues via `go mod tidy`/`go get` and explicit versions rather than guessing.
6. **Verify.** Run `go build ./...`, `go vet ./...`, `gofmt -l`/`goimports`, and crucially
   `go test -race ./...` on tests that exercise the concurrent path. Report the exact commands
   and results.

## Inputs
- The Go code, `go.mod` (module path and Go version), and the full output (race report, vet
  output, stack trace) for anything being diagnosed.

## Output
- The real cause (with the happens-before reasoning for concurrency) and the change as a
  focused diff, with a one-line rationale per non-obvious decision.
- The build/vet/race-test commands run and their results; any remaining race window, leaked
  goroutine, or unhandled error flagged with why.

## Notes
- Simplicity over cleverness; do not add a dependency the stdlib already covers.
- Never claim concurrency safety without running `-race` on a test that exercises the path.
- Apply within the project's conventions — match its existing error and logging style.
