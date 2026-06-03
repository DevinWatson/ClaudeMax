---
name: cloudflare-platform
description: The substantive Cloudflare edge platform capability — edge compute (Workers, Durable Objects, Workers KV, Queues, Cron Triggers), storage/data (R2 object storage, D1 SQLite, KV, Hyperdrive to origin databases), network/CDN (CDN caching, Cache Rules, Argo Smart Routing, Load Balancing), authoritative DNS (zones, records, proxying), security (WAF, rate limiting, Bot Management, DDoS protection, Access/Zero Trust, mTLS), Pages (static and full-stack deploys), bindings/secrets/environments, and tooling (wrangler CLI, wrangler.toml, the Terraform Cloudflare provider). Use when designing, building, reviewing, securing, or operating anything on Cloudflare's edge — choosing the right edge primitive, wiring bindings to R2/D1/KV/Queues, configuring cache and DNS, hardening with WAF/Access/mTLS, or authoring/validating wrangler and Terraform. Any agent touching Cloudflare can load it. NOT for AWS/GCP/Azure hyperscaler services or generic non-edge Node backends.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [cloudflare, edge, workers, durable-objects, r2, d1, workers-kv, wrangler, waf, zero-trust]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloudflare Platform

The substantive Cloudflare capability: knowing the edge primitives (Workers, Durable Objects, KV,
R2, D1, Queues), how the global network/CDN, DNS, and security layers fit together, and the platform
conventions (bindings, secrets, environments, wrangler.toml, the Terraform Cloudflare provider) that
turn isolated edge functions into a coherent, secure, observable system that runs close to users.

## When to use this skill
Whenever the work is on Cloudflare's edge: selecting an edge compute/storage primitive, wiring
bindings, configuring CDN caching and Cache Rules, managing authoritative DNS, hardening with
WAF/rate limiting/Bot Management/Access/mTLS, deploying Workers or Pages, or authoring/validating
`wrangler.toml`, wrangler commands, or Terraform `cloudflare_*` resources. This is the
Cloudflare-specific knowledge those tasks consume — not the Terraform language itself
([[terraform-iac]]) and not a general Node/web backend (Workers run on the V8-isolate edge runtime,
not Node — no full Node APIs, short CPU budgets, no long-lived process).

## Instructions
1. **Establish context before choosing primitives.** Identify the account/zone layout, the custom
   domains and routes, the workload shape (request/response at the edge, scheduled/cron, queue
   consumer, stateful coordination), data locality and consistency needs, and any origin the edge
   must reach. Read existing `wrangler.toml` / `wrangler.jsonc`, `*.tf` (`cloudflare_*`), and route
   config to learn what already exists before proposing anything.
2. **Pick the fitting edge primitive per concern, biasing to the edge:**
   - **Compute** — Workers for stateless request/response and APIs at the edge; Durable Objects for
     single-threaded stateful coordination (per-key consistency, websockets, rooms, counters);
     Cron Triggers for scheduled work; Queues + a consumer Worker for async/decoupled processing.
     Respect CPU-time limits and the isolate (non-Node) runtime — offload heavy/long work to Queues
     or an origin.
   - **Storage/data** — R2 for object storage (S3-compatible, zero egress fees); KV for
     low-latency, read-heavy, eventually-consistent edge config/cache; D1 for relational SQLite at
     the edge; Durable Objects storage for strongly-consistent per-object state; Hyperdrive to pool
     and accelerate connections to an existing origin Postgres/MySQL.
   - **Network/CDN** — tune CDN caching and **Cache Rules** (cache key, TTL, bypass), use Tiered
     Cache / Argo Smart Routing for origin offload and latency, and Load Balancing (with health
     checks, pools, steering) for multi-origin/failover.
   - **Delivery** — Pages for static and full-stack sites (with Pages Functions / Workers
     integration); Workers for API/edge logic.
3. **Wire bindings, secrets, and environments deliberately.** Connect Workers to R2/KV/D1/Queues/
   Durable Objects/Hyperdrive via typed bindings in `wrangler.toml`; keep per-environment config
   under `[env.*]`; store secrets with `wrangler secret put` (never commit them); use Service
   Bindings for Worker-to-Worker calls instead of public hops.
4. **Configure DNS and security as first-class.** Manage authoritative DNS zones/records (A/AAAA/
   CNAME/TXT/MX), choosing proxied (orange-cloud) vs DNS-only (grey-cloud) per record. Harden with
   the WAF (managed + custom rules), rate limiting, Bot Management, and Cloudflare's always-on DDoS
   protection; put internal/admin surfaces behind Access (Zero Trust) and require mTLS for
   service-to-service or origin auth where appropriate; enforce TLS (Full (strict)) end-to-end.
5. **Choose the resilience footprint explicitly.** Cloudflare runs globally by default, but call out
   single points of failure: a single origin (add Load Balancing + health checks + failover pools),
   a single D1/Durable Object as a consistency/locality bottleneck, and cache-miss storms (use
   Tiered Cache, stale-while-revalidate, sensible TTLs). Define what degrades gracefully when the
   origin is down (cache-on-error, custom error responses).
6. **Express and validate it as code.** Capture deploy config in `wrangler.toml` and account/zone
   config (DNS, WAF, cache, LB) in Terraform `cloudflare_*` resources. Validate with
   `wrangler deploy --dry-run`, `wrangler types`, local `wrangler dev`, and `terraform validate` /
   `terraform plan` before applying. Confirm any plan/dry-run output with [[verify-by-running]].

## Inputs
- The workload requirements (edge request shape, statefulness, consistency/locality, scheduled/queue
  needs), the account/zone and custom-domain/route layout, the origin(s) the edge must reach, and
  any existing `wrangler.toml`, Terraform `cloudflare_*` config, DNS, cache, and security rules.

## Output
- A primitive-by-concern recommendation (compute/storage/data/CDN/delivery) with the Cloudflare
  primitive named and the trade-off justified, including the binding wiring and the resilience
  posture (origin failover, cache strategy, consistency choices).
- DNS, WAF/rate-limit/Bot/Access/mTLS, and TLS posture scoped to least exposure.
- Where code is involved, `wrangler.toml` / Terraform `cloudflare_*` plus the validation command(s)
  (`wrangler deploy --dry-run`, `wrangler dev`, `terraform validate`/`plan`).

## Notes
- Workers are not Node: no long-lived processes, limited CPU time per request, the Web/Workers
  runtime API surface (not full Node stdlib), and isolates over containers. Design around this —
  push heavy/long work to Queues, Cron, or an origin.
- This skill is Cloudflare knowledge, not the IaC engine: pair it with [[terraform-iac]] for
  Terraform authoring, and confirm any dry-run/plan/dev output with [[verify-by-running]].
- Cost levers differ from hyperscalers: R2 has zero egress fees (vs S3), Workers/KV/D1 bill on
  requests/reads/writes and CPU time, and Argo/Load Balancing/Bot Management are add-ons — flag
  request-volume and CPU-time hotspots rather than only per-resource unit price.
