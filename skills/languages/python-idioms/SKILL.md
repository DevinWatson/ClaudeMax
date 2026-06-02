---
name: python-idioms
description: Use when writing or fixing Python — type hints and mypy/pyright errors, async/asyncio pitfalls, the data model (dunders, dataclasses, protocols), packaging/dependency questions (pip/poetry/uv), and idiomatic stdlib-first code. Diagnoses typing/import errors precisely, prefers the simplest Pythonic form, and verifies with ruff/mypy/pytest in the project's environment. Any agent touching Python (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [python, typing, asyncio, packaging, pytest]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Python Idioms

The substantive Python capability: write clear, correctly typed, idiomatic Python; reason
about its data model and async runtime; and use its canonical tooling to verify.

## When to use this skill
When authoring, reviewing, or debugging Python and any of these is involved: a mypy/pyright
typing error, an `asyncio`/event-loop problem, a confusing import/packaging issue, or a
choice between idiomatic forms. Not needed for trivial edits with no typing/async/packaging
dimension.

## Instructions
1. **Diagnose precisely.** For typing errors, reason in mypy/pyright terms — generic
   invariance, `Optional`/`None` narrowing, `Protocol` (structural) vs. nominal types,
   `@overload` resolution, `TypeVar` bounds, `ParamSpec`. For import errors, distinguish
   package layout, namespace packages, and circular imports.
2. **Prefer the simplest idiomatic form.** Comprehensions and generators over manual loops,
   `dataclasses`/`enum`/`pathlib`/`itertools`/`functools` and the stdlib before third-party
   deps, context managers for resources, EAFP where it reads cleaner than LBYL. Add precise
   type hints; avoid `Any` and `# type: ignore` and justify any that remain. Use
   `from __future__ import annotations` where it helps.
3. **Handle async correctly.** Never block the event loop with sync I/O or `time.sleep`; use
   `asyncio.gather`/`TaskGroup`, await every coroutine, run blocking work in `to_thread`/an
   executor, and avoid mixing event loops. Flag unawaited coroutines and sync-over-async.
4. **Use the data model deliberately.** Implement the dunders that fit (`__eq__`/`__hash__`
   together, `__repr__`, context-manager and iterator protocols); prefer `__slots__` or a
   frozen dataclass where appropriate; do not abuse metaclasses where a class decorator or
   `__init_subclass__` suffices.
5. **Be packaging-aware.** Read `pyproject.toml`/`setup.cfg`/`requirements*.txt` for the Python
   version, dependency manager (pip/poetry/uv/pipenv), and configured linters/type-checkers.
   Resolve dependency issues via the project's manager and lockfile rather than loosening pins.
6. **Verify in the project's environment.** Run its checks — typically `ruff check` (and
   `ruff format --check`), `mypy`/`pyright`, and `pytest` — via the project's venv/`uv run`/
   `poetry run`, not a bare global interpreter. Report the exact commands and results.

## Inputs
- The Python code, the project's config (`pyproject.toml`/`setup.cfg`/requirements), and the
  full error text (mypy/pyright output, traceback) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  decision.
- The lint/typecheck/test commands run and their results; any remaining `Any`/`# type: ignore`
  flagged with why.

## Notes
- Readability and correctness over cleverness; do not add a dependency to save a few lines.
- Apply within the project's conventions — match its existing typing strictness and tooling
  rather than imposing a different stack.
