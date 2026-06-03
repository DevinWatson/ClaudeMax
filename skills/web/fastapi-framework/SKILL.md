---
name: fastapi-framework
description: Use when working in FastAPI (Python) — path operations and routers (APIRouter), Pydantic v2 request/response models and validation, dependency injection (Depends, yield-based deps, sub-dependencies), async/await with async DB drivers and ASGI, automatic OpenAPI/Swagger docs, background tasks, middleware, auth (OAuth2/JWT, security dependencies, scopes), error handling and custom exception handlers, Pydantic Settings config, and SQLAlchemy 2.x / SQLModel integration. Verifies with uvicorn, pytest + httpx/TestClient, ruff, mypy, and schemathesis. TRIGGER on FastAPI routing/router-wiring, Pydantic v2 schema/validation, Depends/DI resolution, async/blocking-call pitfalls in handlers, OpenAPI/response-model questions, OAuth2/JWT security deps, exception-handler/error-envelope design, settings, or ASGI/uvicorn deployment. NOT for general Python language concerns (typing, asyncio internals, packaging — that is python-idioms), NOT for framework-agnostic HTTP contract design, and NOT for Django (use django-framework).
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [fastapi, python, pydantic, asgi, async, api]
version: 1.0.0
license: MIT
status: stable
maintainer: devinwatson@gmail.com
---

# FastAPI Framework

The substantive FastAPI capability: get the *framework* concerns right — path operations and
routers, Pydantic v2 models and validation, dependency injection, the async/ASGI runtime,
automatic OpenAPI generation, background tasks, middleware, OAuth2/JWT security, exception
handling, typed settings, and SQLAlchemy/SQLModel integration — and verify with the project's
runner and quality gates. This is distinct from general Python language concerns (typing,
`asyncio` internals, packaging), which are the domain of [[python-idioms]], and from
framework-agnostic HTTP contract design.

## When to use this skill

When the problem is framework-level FastAPI behavior: wiring `APIRouter`s and path operations, a
Pydantic v2 schema or validation issue, a `Depends`/dependency-resolution problem, a blocking call
on the async path, a `response_model`/OpenAPI question, an OAuth2/JWT security dependency, an
exception-handler or error-envelope concern, `BaseSettings` config resolution, or a SQLAlchemy
2.x / SQLModel session-and-async question. Not for pure Python idioms (use [[python-idioms]]),
framework-agnostic REST contract design (status codes, versioning, error envelopes as a
discipline), or Django (use `django-framework`). Pairs with [[match-project-conventions]] and
[[verify-by-running]].

## Instructions

1. **Establish the project shape first.** Find the FastAPI and Pydantic versions
   (`pyproject.toml`/`requirements*.txt` — Pydantic v1 vs v2 changes everything), the Python
   version, the dependency manager (pip/poetry/uv), the ASGI server (uvicorn/hypercorn/gunicorn
   workers), and how the app is assembled — the `FastAPI()` instance, the `APIRouter`s and their
   `include_router` prefixes/tags/dependencies, the settings source, and whether the DB driver and
   route handlers are sync or async. Note the structure (flat vs `routers/`, `schemas/`, `deps.py`).
2. **Model path operations and routers correctly.** Declare operations with
   `@router.get/post/put/patch/delete`, typed path/query parameters (with `Path`/`Query`
   validation), and a `response_model` to constrain output. Group routes in `APIRouter` modules and
   compose them with `app.include_router(router, prefix=..., tags=..., dependencies=...)`. Set
   `status_code` explicitly on creation/no-content operations; return the response model, not the
   ORM object, unless `from_attributes`/`orm_mode` is configured. Avoid path-collision and ordering
   bugs (static paths before parameterized ones).
3. **Master Pydantic v2 models — request, response, and validation.** Define request bodies and
   response schemas as `BaseModel` subclasses; in v2 use `model_config = ConfigDict(...)` (not the
   v1 `class Config`), `field_validator`/`model_validator` (not `@validator`/`@root_validator`),
   `Field(...)` constraints, and `Annotated[...]` types. Use **separate input and output models** —
   never let clients set server-controlled fields (mass-assignment): a `UserCreate` without `id`/
   `is_admin`, a `UserOut` that excludes secrets. Use `model_dump`/`model_validate` (not v1
   `.dict()`/`.parse_obj()`). Enable `from_attributes=True` to serialize ORM rows.
4. **Use dependency injection deliberately.** Express shared logic — DB sessions, the current
   user, pagination params, settings — as `Depends(...)` callables; FastAPI resolves and caches
   them per request. Use **`yield`-based dependencies** for setup/teardown (open a session, `yield`
   it, close in `finally`). Layer sub-dependencies (auth depends on a token-decode dep). Apply
   router- or app-level `dependencies=[...]` for cross-cutting checks. Override deps in tests with
   `app.dependency_overrides`.
5. **Handle async correctly on the ASGI path.** A route is `async def` only if it `await`s; a
   plain `def` route runs in a threadpool (fine for sync/blocking work). **Never block the event
   loop** — no sync DB calls, `requests`, or `time.sleep` inside an `async def` handler; use async
   drivers (`asyncpg`/`databases`/SQLAlchemy async engine, `httpx.AsyncClient`) and `await` them,
   or push blocking work to `def` handlers / `run_in_threadpool`. Defer deeper asyncio reasoning to
   [[python-idioms]].
6. **Lean on automatic OpenAPI/docs.** The schema is generated from your type hints, `response_model`,
   and Pydantic models — keep them accurate so `/docs` (Swagger) and `/redoc` are correct. Add
   `summary`/`description`/`tags`/`responses={...}` and `Field(examples=...)` for a usable contract;
   document non-200 responses you actually return. Treat the generated `/openapi.json` as the
   contract for client generation and contract testing.
7. **Use background tasks and middleware appropriately.** For fire-and-forget work that may run
   after the response, inject `BackgroundTasks` and `add_task(...)` — for heavy/durable work prefer
   a real task queue (Celery/RQ/arq) instead. Add cross-cutting behavior with middleware
   (`@app.middleware("http")` or ASGI middleware) and configure `CORSMiddleware` with an explicit
   allow-list of origins/methods/headers — never reflect arbitrary origins with credentials.
8. **Secure the application.** Implement auth with the security utilities: `OAuth2PasswordBearer`
   for bearer tokens, a `get_current_user` dependency that decodes/validates the JWT (verify
   signature, `exp`, audience/issuer) and loads the principal, and `Security(...)` with scopes for
   fine-grained authorization. Hash passwords (passlib/bcrypt); keep secrets in settings/env, never
   in source. Always authorize the resource owner server-side to prevent IDOR; enforce auth via a
   dependency, not by trusting client-supplied identity. Raise `HTTPException(401/403)` with the
   correct `WWW-Authenticate` header.
9. **Handle errors with exception handlers.** Raise `HTTPException` for expected client errors;
   register `@app.exception_handler(...)` for custom/domain exceptions and override the
   `RequestValidationError` handler to shape a **consistent error envelope** across the API. Don't
   leak stack traces or internal messages to clients; log the detail server-side and return a
   stable, typed error body.
10. **Externalize configuration with Pydantic Settings.** Use `pydantic_settings.BaseSettings`
    (Pydantic v2) for typed, validated config loaded from env vars / `.env`, exposed through a
    cached `get_settings` dependency (`@lru_cache`). Keep secrets out of source; validate at startup
    so misconfiguration fails fast rather than at first request.
11. **Integrate the database (SQLAlchemy 2.x / SQLModel).** Use the SQLAlchemy 2.0 typed style
    (`Mapped[...]`/`mapped_column`) or SQLModel (which unifies the Pydantic model and the table).
    Provide the session via a `yield` dependency; use the **async** engine/session
    (`create_async_engine`, `AsyncSession`) only with `async def` handlers and an async driver, or
    the sync engine with `def` handlers — do not mix. Manage transactions and `commit`/`rollback`
    explicitly, keep N+1 out of list endpoints (eager-load relationships), and run schema migrations
    with Alembic.
12. **Deploy on ASGI.** Run with uvicorn (dev: `uvicorn app.main:app --reload`); in production run
    uvicorn workers under gunicorn or a process manager, behind a reverse proxy, with appropriate
    worker counts and `--proxy-headers`. Use FastAPI lifespan (`lifespan=`) or startup/shutdown to
    open/close pools and resources.
13. **Verify with the project's runner and quality gates** via [[verify-by-running]]: run the app
    (`uvicorn app.main:app`), the tests (`pytest` with `httpx.AsyncClient`/`TestClient` against the
    app), `ruff check` (+ `ruff format --check`) and `mypy`, and — where configured — `schemathesis`
    fuzzing against `/openapi.json`, in the project's environment (venv/`uv run`/`poetry run`).
    Report the exact commands and real results.

## Inputs

- The FastAPI and Pydantic versions, the project config
  (`pyproject.toml`/`requirements*.txt` with the dependency manager and configured linters/type
  checkers), the relevant `main.py`/`app` factory, `APIRouter` modules, Pydantic schemas,
  dependencies (`deps.py`), settings, security/auth code, DB session/models, and the full error
  text or traceback / failing request-response for anything being diagnosed.

## Output

- The framework-level cause (router wiring, Pydantic v2 schema/validation, dependency resolution,
  blocking-call-on-async, security dependency, exception handler, settings, session/transaction,
  ASGI config) and the change as a focused diff, with a one-line rationale per non-obvious choice.
- For data-layer changes: the session/transaction strategy and the query/eager-load approach used.
- The run/test/lint/typecheck (and schemathesis, where configured) results via [[verify-by-running]],
  with the exact commands.

## Notes

- **Pydantic v1 vs v2 is the biggest correctness trap.** Confirm the major version before touching
  models: `class Config` → `model_config = ConfigDict(...)`, `@validator` → `@field_validator`,
  `.dict()`/`.json()` → `model_dump()`/`model_dump_json()`, `orm_mode` → `from_attributes`.
- **Blocking the event loop** silently kills throughput: a sync DB call or `requests` inside an
  `async def` handler stalls the whole loop. Either go fully async or use a `def` handler.
- Use **separate input/output Pydantic models** to prevent mass-assignment and avoid leaking
  server-controlled or sensitive fields through the response.
- General Python concerns — typing, `asyncio` internals, packaging/dependency conflicts — belong to
  [[python-idioms]], not here. Framework-agnostic HTTP contract design (status-code discipline,
  versioning strategy, pagination semantics) is a separate REST API design concern.
