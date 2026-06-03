---
name: supabase-platform
description: The substantive Supabase managed-Postgres BaaS capability — Postgres as the source of truth, Auth (GoTrue JWT, OAuth providers, magic links), Row-Level Security (RLS) policies, Realtime (Postgres changes / broadcast / presence), Storage (buckets, object policies), Edge Functions (Deno), pgvector for embeddings, the PostgREST auto-generated REST API, the supabase-js client, and tooling (supabase CLI, local dev, migrations, branching). Use when designing, building, reviewing, securing, or operating anything on Supabase — modeling tables with RLS, configuring auth and providers, wiring Realtime/Storage, writing Edge Functions, querying via supabase-js/PostgREST, or authoring/validating migrations and CLI config. Any agent building on Supabase can load it. NOT for raw self-managed PostgreSQL engine admin/tuning (a postgres data team), AWS/GCP/Azure/Cloudflare provider services, or a general web framework.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [supabase, postgres, gotrue, row-level-security, realtime, storage, edge-functions, pgvector, postgrest, supabase-js]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Supabase Platform

The substantive Supabase capability: knowing that Supabase is **managed Postgres first** with a
suite of services layered on top (Auth/GoTrue, the PostgREST auto-API, Realtime, Storage, Edge
Functions, pgvector), how Row-Level Security ties all of them together into the authorization model,
and the platform conventions (the `supabase` CLI, local dev stack, declarative migrations, and
branching) that turn a Postgres schema into a coherent, secure, client-consumable backend.

## When to use this skill
Whenever the work targets Supabase: modeling tables and writing RLS policies, configuring Auth
(JWT, OAuth providers, magic links) and mapping `auth.uid()` into policies, wiring Realtime
(Postgres changes / broadcast / presence) or Storage (buckets + object policies), authoring Edge
Functions (Deno) and choosing service-role vs anon contexts, using pgvector for embeddings/RAG,
consuming data through the PostgREST REST API or the `supabase-js` client, or authoring/validating
migrations and CLI/local-dev/branching config. This is the Supabase-specific knowledge those tasks
consume — not raw PostgreSQL engine administration/tuning ([[relational-data-modeling]] covers the
schema craft; a postgres team owns the engine), and not a general web framework (the frontend
calls Supabase; it is the backend, not the UI layer).

## Instructions
1. **Establish context before building.** Identify the project layout (`supabase/` dir, `config.toml`,
   `migrations/`, `functions/`), the existing schema and RLS state, which auth providers are enabled,
   and which clients consume the project (browser with the **anon** key under RLS, or trusted server
   with the **service-role** key that bypasses RLS). Read existing migrations, policies, and
   `supabase/config.toml` before proposing anything.
2. **Treat Postgres as the source of truth.** Model tables, types, constraints, and relationships in
   SQL migrations (defer schema craft to [[relational-data-modeling]]). The PostgREST API, Realtime,
   and generated types all derive from the schema — design the schema, and the API follows.
3. **Make RLS the authorization model — non-negotiable.** Every table exposed to the anon/auth API
   MUST have `ENABLE ROW LEVEL SECURITY` plus explicit policies; a table with RLS enabled and no
   policy denies all access, and a table without RLS enabled is fully readable/writable by the anon
   key. Write `SELECT/INSERT/UPDATE/DELETE` policies keyed on `auth.uid()`, `auth.jwt()`, and roles;
   use `WITH CHECK` on writes; keep the **service-role key server-side only** (it bypasses RLS).
4. **Configure Auth (GoTrue) deliberately.** Choose email/password, magic links, or OAuth providers;
   map authenticated identity into RLS via `auth.uid()`; store app-level profile data in a `profiles`
   table linked to `auth.users` (do not write directly to the `auth` schema). Decide JWT expiry,
   email confirmation, and redirect URLs in `config.toml`.
5. **Wire the layered services to the schema:**
   - **PostgREST API** — auto-generated REST from the schema; expose only intended tables/views,
     use RPC (`SECURITY DEFINER` functions with a pinned `search_path`) for logic that must run with
     elevated rights, and rely on RLS for row authorization.
   - **Realtime** — enable Postgres-changes on a publication for the tables clients subscribe to (RLS
     still governs what each client receives), or use broadcast/presence for ephemeral signaling.
   - **Storage** — create buckets (public vs private) and write **object-level RLS policies** on
     `storage.objects`; generate signed URLs for private access.
   - **Edge Functions** — Deno functions for webhooks, third-party calls, and server-side logic; pass
     the user JWT to honor RLS, or use the service-role key only for trusted admin paths; keep secrets
     in function env, never in client code.
   - **pgvector** — enable the `vector` extension, store embeddings, add an `ivfflat`/`hnsw` index, and
     query by distance for semantic search / RAG.
6. **Consume from clients correctly.** Use `supabase-js` with the anon key in the browser (subject to
   RLS) and the service-role key only on a trusted server; generate typed clients with
   `supabase gen types typescript`.
7. **Express and validate it as code.** Keep schema/policies/functions in `supabase/migrations` and
   `supabase/functions`; run the local stack with `supabase start`, apply with `supabase db reset` /
   `supabase migration up`, deploy functions with `supabase functions deploy`, and use **branching**
   for preview environments. Confirm any apply/reset/deploy output with [[verify-by-running]].

## Inputs
- The data model and access patterns, which clients consume the project (anon/browser vs
  service-role/server), the auth providers and identity requirements, the Realtime/Storage/Edge
  Function/pgvector needs, and any existing `supabase/config.toml`, migrations, RLS policies, and
  functions.

## Output
- A service-by-concern recommendation (schema/RLS, Auth, PostgREST/RPC, Realtime, Storage, Edge
  Functions, pgvector) with the Supabase mechanism named and the trade-off justified, including the
  RLS posture for every exposed table and the anon-vs-service-role boundary.
- Where code is involved, SQL migrations / RLS policies / Edge Functions plus the validation
  command(s) (`supabase start`, `supabase db reset`, `supabase migration up`,
  `supabase functions deploy`).

## Notes
- The single most common Supabase security failure is a table reachable by the anon key with RLS
  disabled or no policy — verify RLS on every exposed table, and confirm the service-role key never
  ships to a browser.
- This skill is Supabase knowledge, not the Postgres engine: pair it with [[relational-data-modeling]]
  for schema/index craft, and confirm any migration/reset/deploy output with [[verify-by-running]].
- Local dev mirrors prod (`supabase start` runs Postgres + Auth + Storage + Realtime + PostgREST in
  Docker); always exercise migrations and policies against the local stack before deploying, and use
  branching for previewable, isolated environments.
