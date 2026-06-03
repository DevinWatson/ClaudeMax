---
name: django-framework
description: Use when working in Django (Python) — the ORM (models, migrations, querysets, select_related/prefetch_related, N+1 avoidance), function- and class-based views and Django REST Framework (DRF) serializers/viewsets, URL routing and the request/response cycle, middleware, forms & validation, the admin, settings/apps structure, auth & permissions, signals, async views & ASGI, caching, and Celery integration. Django renders server-side templates AND serves APIs via DRF. TRIGGER on Django model/migration/queryset issues, N+1 query problems, DRF serializer/viewset/permission questions, middleware or settings problems, or manage.py check/test/migration failures. NOT for general Python language concerns (typing, asyncio, packaging — that is python-idioms) or framework-agnostic HTTP contract design. Any agent touching Django (a developer, an API engineer, a reviewer, a performance or migration engineer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [django, drf, orm, python, web]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Django Framework

The substantive Django capability: get the *framework* concerns right — the ORM and its query
behavior, views and DRF, URL routing and the request/response cycle, settings and app structure,
auth, async/ASGI, caching, and background work — and verify with Django's own tooling. This is
distinct from general Python language concerns (typing, asyncio mechanics, packaging), which are
the domain of [[python-idioms]].

## When to use this skill
When the problem is framework-level Django behavior: a model/migration question, a slow or
N+1-prone queryset, a function/class-based view or DRF serializer/viewset/permission, URL
routing, middleware ordering, forms/validation, the admin, settings/apps layout, auth, signals,
an async view/ASGI concern, caching, or Celery wiring. Not for pure Python idioms (use
[[python-idioms]]) or framework-agnostic HTTP contract design (status codes, error envelopes,
versioning). Pairs with [[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Establish the project shape first.** Find the Django version (`django.VERSION`,
   `pyproject.toml`/`requirements*.txt`), the settings module(s) (`DJANGO_SETTINGS_MODULE`,
   `settings/` split by environment), the installed apps and their `apps.py`, the URL conf
   (`ROOT_URLCONF`, `urls.py` trees), middleware ordering, and whether the project runs WSGI or
   ASGI. Confirm whether the surface in question is server-rendered (templates) or an API (DRF).
2. **Reason about the ORM deliberately — the top source of correctness and performance bugs.**
   - **Models & migrations:** every schema change needs a migration; run `makemigrations` then
     `migrate`, and check `makemigrations --check --dry-run` to catch missing migrations. Watch
     for data migrations, irreversible operations, and `null`/`default` changes on populated
     tables.
   - **Querysets are lazy:** they hit the DB on iteration/`len`/`bool`/slicing. Avoid the **N+1
     problem** — use `select_related` (SQL JOIN, for FK/one-to-one) and `prefetch_related`
     (separate query, for many-to-many/reverse FK). Use `only`/`defer`, `values`/`values_list`,
     `annotate`/`aggregate`, `F()`/`Q()` expressions, and `bulk_create`/`bulk_update` for bulk
     work. Reach for `iterator()` on large result sets.
   - **Transactions & integrity:** wrap multi-write operations in `transaction.atomic`; use
     `select_for_update` where needed; never assume implicit ordering without `Meta.ordering` or
     an explicit `order_by`.
3. **Get views and DRF right.**
   - **Plain Django:** function-based views and class-based views (generic views, mixins);
     return `HttpResponse`/`JsonResponse`/`render`; respect the request/response cycle and CSRF
     for form posts.
   - **DRF:** model the API with serializers (validation in `validate_*`/`validate`, nested vs
     flat, `read_only`/`write_only`), viewsets + routers or `APIView`/generic views, permission
     classes and authentication classes, throttling, and pagination. Keep N+1 out of list
     endpoints by setting `select_related`/`prefetch_related` on the viewset queryset.
4. **Wire routing, middleware, forms, and the admin correctly.** Use `path`/`re_path` and
   `include` for URL trees and `app_name`/namespaced reverse. Order middleware intentionally
   (request flows top-down, response bottom-up). Use Django forms/`ModelForm` for validation and
   server-rendered flows; register and customize `ModelAdmin` for the admin.
5. **Handle auth, permissions, settings, and signals.** Use the auth framework (users,
   `permissions`, groups, `login_required`/`permission_required`, DRF permission classes). Keep
   secrets and environment-specific config out of code (env vars/settings split); never commit
   `SECRET_KEY` or run `DEBUG=True` in prod. Use signals (`post_save`, etc.) sparingly and
   idempotently — prefer explicit calls where the flow is clearer.
6. **Async, caching, and background work.** Use async views/ASGI only where the stack supports it
   end to end; never call the sync ORM directly inside an async view without `sync_to_async`, and
   never block the event loop (defer to [[python-idioms]] for asyncio mechanics). Use the cache
   framework (per-view, low-level `cache.get/set`, template fragment) with deliberate keys/TTLs.
   Push slow or out-of-band work to Celery tasks (idempotent, retry-aware) rather than the
   request path.
7. **Verify with Django's own tooling** via [[verify-by-running]], in the project's environment
   (venv/`uv run`/`poetry run`): `python manage.py check` (and `check --deploy` for settings),
   `python manage.py makemigrations --check --dry-run` (no missing migrations), the test suite
   (`python manage.py test` or `pytest`/`pytest-django`), and the project's `ruff`/`mypy`. Report
   the exact commands and real results.

## Inputs
- The Django version, settings module(s), installed apps, URL conf, the relevant models/views/
  serializers/migrations, and the full error text or traceback / slow-query output for anything
  being diagnosed.

## Output
- The framework-level cause (ORM query shape, boundary, middleware order, migration gap, DRF
  serializer/permission, etc.) and the change as a focused diff.
- For data-layer changes: the resulting query count/shape and the migration generated.
- The `manage.py check` / migration-check / test / lint results via [[verify-by-running]], with
  the exact commands run.

## Notes
- N+1 is the default Django performance trap — inspect the actual SQL (`django-debug-toolbar`,
  `QuerySet.query`, `connection.queries`, or `assertNumQueries` in tests) rather than guessing.
- A schema change without a migration is a latent production failure; always run the
  migration check.
- General Python concerns — type hints, asyncio internals, packaging, idiomatic stdlib use —
  belong to [[python-idioms]], not here.
- Framework-agnostic HTTP contract design (status codes, error envelopes, pagination semantics,
  versioning) is a separate REST API design concern.
