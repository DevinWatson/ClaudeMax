---
name: phoenix-framework
description: Use when working in Phoenix (Elixir) — Ecto (schemas, changesets, composable queries, migrations, preload/N+1), contexts as domain boundaries, the Endpoint/Router and plugs, controllers and views, LiveView (mount/handle_event/handle_info, assigns, temporary_assigns, streams) and HEEx templates/components, channels/PubSub/Presence, the request lifecycle, telemetry, OTP integration (Phoenix on a supervision tree), and releases. Phoenix renders server-side LiveView/HEEx UI AND serves APIs/channels. TRIGGER on Ecto schema/changeset/query/migration or N+1 issues, context boundary questions, router/plug/controller concerns, LiveView/HEEx view work, channel/PubSub/Presence wiring, telemetry, or mix test/mix phx.routes failures. NOT for general Elixir language concerns (pattern matching, OTP/GenServer design, the pipe operator, with — that is elixir-idioms) or framework-agnostic HTTP contract design. Verifies with mix (mix test, mix phx.routes, mix format, credo, dialyzer). Any agent touching Phoenix can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [phoenix, elixir, liveview, ecto, heex, web]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Phoenix Framework

The substantive Phoenix capability: get the *framework* concerns right — Ecto and its query
behavior, contexts as domain boundaries, the Endpoint/Router/plug pipeline, controllers and views,
LiveView and HEEx, channels/PubSub/Presence, telemetry, and Phoenix's place on an OTP supervision
tree — and verify with mix. This is distinct from general Elixir language concerns (pattern
matching, the pipe operator, `with`, OTP/GenServer/supervision design, Tasks/concurrency), which
are the domain of [[elixir-idioms]].

## When to use this skill
When the problem is framework-level Phoenix behavior: an Ecto schema/changeset/query/migration or
N+1-prone preload, a context (domain-boundary) layout question, a Router/plug/controller concern, a
LiveView lifecycle or HEEx/component question, a channel/PubSub/Presence wiring question, telemetry
instrumentation, releases, or a `mix test`/`mix phx.routes` failure. Not for pure Elixir/BEAM idioms
— pattern matching, the pipe operator, `with`, OTP/GenServer/supervision-tree design, Tasks (use
[[elixir-idioms]]) — or framework-agnostic HTTP contract design (status codes, error envelopes,
versioning). Pairs with [[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Establish the project shape first.** Find the Phoenix and Elixir/OTP versions (`mix.exs`,
   `mix.lock`), whether the app is an umbrella, the Ecto adapter and repos (`config/*.exs`,
   `Repo`), the routes (`lib/*_web/router.ex`, `mix phx.routes`), the context modules under
   `lib/<app>/`, and whether the surface in question is LiveView/HEEx, a controller view, a JSON
   API, or a channel. Confirm the supervision tree in `application.ex` (Endpoint, Repo, PubSub,
   Presence, any GenServers).
2. **Reason about Ecto deliberately — the top source of correctness and performance bugs.**
   - **Schemas, changesets & migrations:** every schema change needs a migration
     (`mix ecto.gen.migration`, then `mix ecto.migrate`); make migrations reversible (`change`, or
     `up`/`down`) and beware irreversible operations and backfills on populated tables. Cast and
     validate all external input through **changesets** (`cast`, `validate_*`, `unique_constraint`/
     `foreign_key_constraint` to surface DB errors as changeset errors); never persist raw params.
   - **Querying is composable and explicit:** build queries with the `Ecto.Query` DSL and compose
     them with pipeable query functions in the context. Avoid the **N+1 problem** — use `preload`
     (separate queries or a join via `preload: [...]` inside the query) and `Repo.preload`,
     choosing a join+preload when you also filter on the association. Use `select`/`select_merge`
     to trim columns, `Repo.stream`/`:batch` for large sets, and `Repo.transaction`/`Ecto.Multi`
     for multi-write atomicity.
3. **Treat contexts as the domain boundary.** A context (`lib/<app>/accounts.ex`) is the public API
   to a slice of the domain; web code (controllers, LiveViews) calls the context, never `Repo`
   directly. Keep schemas and queries behind the context, return tagged tuples or structs, and
   resist leaking Ecto.Query into the web layer. Split or merge contexts to match real domain
   boundaries, not table count.
4. **Get the Router, plugs, controllers, and views right.**
   - **Endpoint & Router:** the Endpoint runs the plug pipeline (`lib/<app>_web/endpoint.ex`); the
     Router defines pipelines (`:browser`, `:api`) and scopes. Verify routes with `mix phx.routes`.
     Write or place **plugs** deliberately — authentication, `fetch_current_user`, CSRF
     (`protect_from_forgery` is in `:browser`), and request shaping belong in plugs.
   - **Controllers & views:** keep controller actions thin — pattern-match params, call the
     context, and `render`/`redirect` with the correct status. Render with view modules / HEEx
     templates (or JSON views for APIs); keep view logic in the view module, not the template.
5. **Build LiveView and HEEx correctly — the primary UI surface.**
   - **Lifecycle:** `mount/3` runs twice (static render then connected socket) — guard
     connected-only work with `connected?(socket)`; do authentication and authorization in `mount`
     (and `on_mount` hooks), never assume the client. Handle UI events in `handle_event/3`, server
     and PubSub messages in `handle_info/2`, and keep `render/1` pure over `assigns`.
   - **Assigns & payload:** put only what the template needs in `assigns`; use `temporary_assigns`
     for large lists you do not need to keep in socket state, and **streams** (`stream/3`,
     `stream_insert`, `stream_delete`) for large or append-heavy collections to keep the diff and
     socket memory small.
   - **HEEx & components:** write semantic HEEx; extract reusable markup into function components
     (`attr`/`slot`, `~H`) and live components where stateful. HEEx auto-escapes interpolation —
     only `raw/1` deliberately and never on untrusted input. Keep server-rendered markup semantic
     and accessible (defer accessibility judgement to a WCAG audit).
6. **Wire channels, PubSub, and Presence for real-time.** Use `Phoenix.PubSub` to broadcast across
   processes/nodes, channels (`Phoenix.Channel`) for socket topics, and `Phoenix.Presence` for
   tracking. Authorize on `join`, validate every inbound message, and never trust client payloads.
   Subscribe LiveViews to PubSub topics in `mount` (connected only) and react in `handle_info`.
7. **Understand the request lifecycle and OTP integration.** A request flows Endpoint → plug
   pipeline → Router → controller/LiveView; the `%Plug.Conn{}` (or LiveView `%Socket{}`) carries
   state. Phoenix runs *on* a supervision tree (`application.ex`): Endpoint, Repo, PubSub,
   Presence, and any app GenServers are supervised children — design and crash-isolation of those
   processes is an [[elixir-idioms]] concern; their wiring into Phoenix is here.
8. **Instrument with telemetry and ship via releases.** Phoenix emits `:telemetry` events
   (endpoint, router, LiveView, Ecto repo query) — attach handlers / `Telemetry.Metrics` in the
   telemetry supervisor. Build production artifacts with `mix release` (and `mix phx.gen.release`),
   running migrations via a release command, not at boot.
9. **Verify with mix** via [[verify-by-running]]: run `mix test` (including `Phoenix.LiveViewTest`
   and `Phoenix.ConnTest` cases), `mix phx.routes` to confirm routing, `mix format --check-formatted`,
   and `mix credo` / `mix dialyzer` where the project configures them; run `mix ecto.migrate` /
   `mix ecto.rollback` to prove migration reversibility. Report the exact commands and real results.

## Inputs
- The Phoenix and Elixir/OTP versions, umbrella-vs-single app, the Ecto adapter/repos, the
  `router.ex`, the relevant context/schema/migration/controller/LiveView/channel modules, and the
  full error text or stacktrace / slow-query (logged SQL) output for anything being diagnosed.

## Output
- The framework-level cause (Ecto query shape, changeset, context boundary, router/plug,
  controller, LiveView lifecycle/assigns/stream, HEEx, channel/PubSub, migration gap, telemetry)
  and the change as a focused diff.
- For data-layer changes: the resulting query count/shape and the migration generated, with its
  reversibility.
- The `mix test` / `mix phx.routes` / `mix format` / credo / dialyzer / migration-check results via
  [[verify-by-running]], with the exact commands run.

## Notes
- N+1 is the default Ecto trap — inspect the logged SQL or use a join+preload rather than guessing;
  reach for `Repo.preload` vs an in-query `preload`/join based on whether you filter on the
  association.
- A schema change without a migration (or with an irreversible migration that has no `down`) is a
  latent production failure; always run the migrate/rollback check.
- `mount/3` runs twice and the client is untrusted — authorize in `mount`/`on_mount` and guard
  connected-only work with `connected?/1`; never rely on the static render for security.
- Atoms are not garbage-collected — never call `String.to_atom/1` on untrusted input from params,
  channel messages, or LiveView events (use `String.to_existing_atom/1`); this is an atom-
  exhaustion risk that surfaces at the framework boundary.
- General Elixir/BEAM concerns — pattern matching, the pipe operator, `with`, OTP/GenServer and
  supervision-tree *design*, Tasks/concurrency — belong to [[elixir-idioms]], not here.
- Framework-agnostic HTTP contract design (status codes, error envelopes, pagination semantics,
  versioning) is a separate REST API design concern.
