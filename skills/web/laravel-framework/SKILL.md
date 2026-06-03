---
name: laravel-framework
description: Use when working in Laravel (PHP) — Eloquent ORM (relationships, migrations, scopes, N+1 via eager loading with with/load), the service container and DI, facades, routing and middleware, controllers and form-request validation, Blade plus Livewire/Inertia, Eloquent-vs-query-builder, queues/jobs and Horizon, events/listeners, Artisan, policies/gates (authz), API resources with Sanctum/Passport, and caching. Laravel renders server-side UI (Blade/Livewire/Inertia) AND serves APIs. TRIGGER on Eloquent model/migration/scope issues, N+1 problems, container/facade questions, routing/middleware/form-request concerns, Blade/Livewire/Inertia views, queue/job/Horizon wiring, policy/gate authz, API resource design, or artisan test/migrate failures. NOT for general PHP language concerns (typed properties, enums, match, traits, Composer, PSR — that is php-idioms) or framework-agnostic HTTP contract design. Any agent touching Laravel can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [laravel, eloquent, blade, livewire, php, web]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Laravel Framework

The substantive Laravel capability: get the *framework* concerns right — Eloquent and its query
behavior, the service container and dependency injection, routing/middleware, controllers and
form-request validation, Blade/Livewire/Inertia views, queues and events, authorization, API
resources, and caching — and verify with Laravel's own tooling. This is distinct from general PHP
language concerns (typed properties, enums, `match`, traits, Composer, PSR), which are the domain
of [[php-idioms]].

## When to use this skill
When the problem is framework-level Laravel behavior: an Eloquent model/migration/scope/
relationship/accessor/cast question, a slow or N+1-prone query, a service-container binding or
facade concern, a routing/middleware/form-request question, a Blade/Livewire/Inertia view, a
queue/job/Horizon or event/listener wiring question, a policy/gate authorization decision, an API
resource (Sanctum/Passport) design, caching, or an `artisan test`/`migrate` failure. Not for pure
PHP idioms (use [[php-idioms]]) or framework-agnostic HTTP contract design (status codes, error
envelopes, versioning). Pairs with [[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Establish the project shape first.** Find the Laravel version (`composer.json`,
   `php artisan --version`), the PHP version (`composer.json` `require php`), the front-end stack
   (Blade only, Livewire, or Inertia with React/Vue), the database connection
   (`config/database.yml`-style `config/database.php`, `.env`), the routes
   (`routes/web.php`, `routes/api.php`, `php artisan route:list`), the queue driver
   (`config/queue.php`), and the auth/API stack (Sanctum/Passport). Confirm whether the surface in
   question renders Blade/Livewire/Inertia views or returns JSON via API resources.
2. **Reason about Eloquent deliberately — the top source of correctness and performance bugs.**
   - **Models, relationships & migrations:** every schema change needs a migration
     (`php artisan make:migration`, then `php artisan migrate`); use `php artisan migrate:status`
     to check pending/drift and design reversible `down()` methods. Model
     `hasOne`/`hasMany`/`belongsTo`/`belongsToMany`/`hasManyThrough`/morph relations correctly,
     set foreign-key, `nullable`, and index constraints in migrations, and beware destructive
     operations and backfills on populated tables. Use `$fillable`/`$guarded` deliberately, casts
     and accessors/mutators for typed attribute shaping.
   - **Querying is lazy and chainable:** Eloquent builds queries that execute on `get`/`first`/
     `paginate`/enumeration. Avoid the **N+1 problem** — eager load with `with(...)` on the query,
     `load(...)` on a loaded model, `withCount`, and constrained eager loads; prefer
     `select`/`pluck` to trim columns and `chunk`/`cursor`/`lazy` for large sets. Use scopes for
     reusable query fragments. Choose **Eloquent vs the query builder** (`DB::table`) deliberately:
     Eloquent for models/relations/events, the query builder for bulk or set-based operations
     where model hydration is wasteful.
   - **Integrity:** pair validation with DB constraints; wrap multi-write operations in
     `DB::transaction`; use `lockForUpdate`/`sharedLock` for pessimistic locking where needed.
3. **Use the container, routing, middleware, and validation correctly.**
   - **Service container & DI:** type-hint dependencies for autowiring; bind interfaces to
     implementations in a service provider (`bind`/`singleton`); use **facades** as a static
     proxy to container services, knowing the resolved class behind each. Don't `new` a service
     the container should resolve.
   - **Routing & middleware:** define resourceful routes (`Route::resource`/`apiResource`),
     group by middleware and prefix, and verify with `php artisan route:list`. Apply middleware
     for auth, throttling, and cross-cutting concerns; keep it ordered deliberately.
   - **Controllers & form requests:** keep controllers thin — one action, one job. Validate and
     authorize input with **form requests** (`php artisan make:request`) or `$request->validate`;
     never mass-assign unfiltered input (respect `$fillable`).
4. **Render server-side UI with Blade, Livewire, or Inertia.** Use Blade templates, components,
   slots, and layouts; Blade `{{ }}` auto-escapes — reserve `{!! !!}` for trusted HTML only. With
   **Livewire**, build stateful server-driven components (properties, actions, `wire:model`);
   with **Inertia**, return page components with props bridging to a React/Vue front end. Keep
   server-rendered markup semantic and accessible (defer accessibility judgement to a WCAG audit).
   For JSON, return **API resources** (`JsonResource`/`ResourceCollection`) rather than raw models.
5. **Handle queues, events, authorization, and caching.** Push slow or out-of-band work to
   **queued jobs** (`ShouldQueue`) — jobs must be idempotent and retry-aware (`tries`, `backoff`,
   `failed`); monitor with **Horizon** on Redis. Use **events/listeners** (and `ShouldQueue`
   listeners) to decouple side effects. Authorize with **policies and gates**
   (`php artisan make:policy`, `authorize`/`can`/`@can`) — never trust the client. Cache with
   `Cache::remember`, tagged caches, and HTTP/response caching; choose deliberate keys and TTLs
   and beware stale cache. For tokens, use **Sanctum** (SPA/API tokens) or **Passport** (OAuth2).
6. **Verify with Laravel's own tooling** via [[verify-by-running]], always through `vendor/bin` /
   `php artisan`: run the test suite (`php artisan test`, or `vendor/bin/pest` /
   `vendor/bin/phpunit`), the migrations (`php artisan migrate` forward and `migrate:rollback` to
   prove reversibility, `php artisan migrate:status` for drift), static analysis
   (`vendor/bin/phpstan analyse` / Larastan), and style (`vendor/bin/pint --test`). Report the
   exact commands and real results.

## Inputs
- The Laravel version, PHP version, front-end stack (Blade/Livewire/Inertia) vs API, the database
  connection, `routes/*.php`, the relevant models/controllers/form-requests/views/migrations/jobs/
  policies, and the full error text or stack trace / slow-query (SQL) output for anything being
  diagnosed.

## Output
- The framework-level cause (Eloquent query shape, relationship, cast, container binding, facade,
  route/middleware, form-request, Blade/Livewire/Inertia view, job, event, policy, cache key,
  migration gap, etc.) and the change as a focused diff.
- For data-layer changes: the resulting query count/shape and the migration generated.
- The `php artisan test`/Pest / Larastan/PHPStan / Pint / migration-check results via
  [[verify-by-running]], with the exact commands run.

## Notes
- N+1 is the default Laravel performance trap — inspect the actual SQL (`DB::listen`, the debugbar,
  `->toSql()`, Telescope, or query counts in tests) rather than guessing; reach for
  `with`/`load`/`withCount` and constrained eager loads.
- A schema change without a migration (or with migrations out of sync) is a latent production
  failure; always run the migration check and keep a working `down()` where reversibility matters.
- General PHP concerns — typed properties, enums, `match`, traits/interfaces, exception handling,
  Composer/PSR — belong to [[php-idioms]], not here.
- Framework-agnostic HTTP contract design (status codes, error envelopes, pagination semantics,
  versioning) is a separate REST API design concern.
