---
name: rails-framework
description: Use when working in Ruby on Rails — Active Record (associations, migrations, scopes, validations, callbacks, N+1 avoidance via includes/preload/eager_load), MVC and convention-over-configuration, controllers and strong parameters, RESTful routing (resources), Action View/ERB and Hotwire (Turbo/Stimulus), Active Job/Sidekiq, Action Cable, concerns, Rails API mode, caching, and the asset pipeline. Rails renders server-side UI (ERB/Hotwire) AND serves APIs. TRIGGER on Active Record model/migration/scope issues, N+1 problems, controller/strong-params/routing questions, ERB/Hotwire view concerns, Active Job/Action Cable wiring, or bin/rails test/migrate failures. NOT for general Ruby language concerns (metaprogramming, blocks/procs, Enumerable, Bundler — that is ruby-idioms) or framework-agnostic HTTP contract design. Any agent touching Rails (a developer, API engineer, reviewer, accessibility, performance, observability, or migration engineer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [rails, activerecord, hotwire, ruby, web]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Rails Framework

The substantive Ruby on Rails capability: get the *framework* concerns right — Active Record and
its query behavior, MVC and convention-over-configuration, controllers and routing, Action
View/ERB and Hotwire, background jobs and real-time, caching and the asset pipeline — and verify
with Rails' own tooling. This is distinct from general Ruby language concerns (metaprogramming,
blocks/procs/lambdas, Enumerable, Bundler/gems), which are the domain of [[ruby-idioms]].

## When to use this skill
When the problem is framework-level Rails behavior: an Active Record model/migration/scope/
association/validation/callback question, a slow or N+1-prone query, a controller/strong-params/
routing concern, an Action View/ERB or Hotwire (Turbo/Stimulus) view, an Active Job/Sidekiq or
Action Cable wiring question, a concern/service-object boundary, Rails API mode, caching, or the
asset pipeline. Not for pure Ruby idioms (use [[ruby-idioms]]) or framework-agnostic HTTP contract
design (status codes, error envelopes, versioning). Pairs with [[match-project-conventions]] and
[[verify-by-running]].

## Instructions
1. **Establish the project shape first.** Find the Rails version (`Gemfile`/`Gemfile.lock`,
   `bin/rails --version`), the Ruby version (`.ruby-version`), whether the app is full-stack or
   `--api` mode (`config/application.rb`, `config.api_only`), the database adapter
   (`config/database.yml`), the routes (`config/routes.rb`, `bin/rails routes`), the autoload mode
   (Zeitwerk), and the front-end stack (Hotwire/Turbo/Stimulus, importmap/jsbundling, Sprockets vs
   Propshaft). Confirm whether the surface in question renders ERB views or serves JSON.
2. **Reason about Active Record deliberately — the top source of correctness and performance bugs.**
   - **Models, associations & migrations:** every schema change needs a migration
     (`bin/rails g migration`, then `bin/rails db:migrate`); keep `schema.rb`/`structure.sql` in
     sync and check `bin/rails db:migrate:status`. Model `belongs_to`/`has_many`/`has_one`/
     `has_many :through`/`has_and_belongs_to_many` correctly, set foreign-key and `null`/index
     constraints in migrations, and beware irreversible operations and data backfills on populated
     tables.
   - **Querying is lazy and chainable:** relations execute on enumeration/`to_a`/`load`/`count`.
     Avoid the **N+1 problem** — use `includes` (lets Rails choose preload vs eager_load),
     `preload` (separate queries), or `eager_load` (LEFT OUTER JOIN, needed when filtering on the
     association). Use `select`/`pluck` to trim columns, `find_each`/`in_batches` for large sets,
     scopes for reusable query fragments, and `joins`/`merge`/`where`/`group`/`having` for shaping.
   - **Validations, callbacks & integrity:** prefer validations and DB constraints together; keep
     callbacks (`before_save`, `after_commit`, etc.) thin and idempotent — extract heavy logic to
     service objects (see [[ruby-idioms]]). Wrap multi-write operations in `transaction`; use
     `lock`/`with_lock` for pessimistic locking where needed.
3. **Get controllers, routing, and strong parameters right.**
   - **Routing:** model RESTful `resources`/`resource`, use `member`/`collection` routes
     deliberately, namespace and scope routes, and verify with `bin/rails routes`. Keep routes
     shallow and resourceful rather than ad hoc.
   - **Controllers:** keep them thin — one action, one job. Always filter mass-assignment with
     **strong parameters** (`params.require(:x).permit(...)`); never `permit!` untrusted input.
     Use `before_action` filters for auth and loading, respond with `respond_to`/`render`, and
     return correct status codes.
4. **Render server-side UI with Action View, ERB, and Hotwire.** Use ERB templates, partials, and
   layouts; extract view logic to helpers/presenters rather than embedding it in templates. With
   **Hotwire**: use Turbo Drive for navigation, Turbo Frames for scoped updates, and Turbo Streams
   for server-pushed DOM changes; use Stimulus controllers for sprinkles of behavior. Keep
   server-rendered markup semantic and accessible (defer accessibility judgement to a WCAG audit).
   In **API mode**, render JSON deliberately (serializers/`jbuilder`) and skip the view layer.
5. **Handle background work, real-time, concerns, and caching.** Push slow or out-of-band work to
   **Active Job** (with Sidekiq/other adapter) — jobs must be idempotent and retry-aware; never
   block the request. Use **Action Cable** for WebSocket channels where real-time is needed.
   Factor shared model/controller behavior into **concerns** (`ActiveSupport::Concern`) only when
   it removes real duplication. Cache with fragment/Russian-doll caching in views, low-level
   `Rails.cache.fetch`, and HTTP caching; choose deliberate keys and TTLs and beware stale cache.
   Configure the asset pipeline (Propshaft/Sprockets, importmap/bundling) per the project.
6. **Verify with Rails' own tooling** via [[verify-by-running]], always through `bundle exec` /
   `bin/`: run the test suite (`bin/rails test` or `bundle exec rspec`), `bundle exec rubocop`,
   `bundle exec brakeman` for security, and the migration checks
   (`bin/rails db:migrate` forward and `db:rollback` to prove reversibility,
   `bin/rails db:migrate:status` for pending/drift). Report the exact commands and real results.

## Inputs
- The Rails version, Ruby version, API-vs-full-stack mode, database adapter, `config/routes.rb`,
  the relevant models/controllers/views/migrations/jobs, and the full error text or backtrace /
  slow-query (SQL) output for anything being diagnosed.

## Output
- The framework-level cause (Active Record query shape, association, callback, routing, strong
  params, view/Hotwire, job, cache key, migration gap, etc.) and the change as a focused diff.
- For data-layer changes: the resulting query count/shape and the migration generated.
- The `bin/rails test`/RSpec / rubocop / brakeman / migration-check results via
  [[verify-by-running]], with the exact commands run.

## Notes
- N+1 is the default Rails performance trap — inspect the actual SQL (Bullet gem, log output,
  `relation.to_sql`, or query counts in tests) rather than guessing; reach for `includes`/`preload`/
  `eager_load` based on whether you filter on the association.
- A schema change without a migration (or with `schema.rb` drift) is a latent production failure;
  always run the migration check and keep the schema file committed.
- General Ruby concerns — metaprogramming, blocks/procs/lambdas, Enumerable idioms, mixin/module
  composition, Bundler/gem resolution — belong to [[ruby-idioms]], not here.
- Framework-agnostic HTTP contract design (status codes, error envelopes, pagination semantics,
  versioning) is a separate REST API design concern.
