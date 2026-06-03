---
name: gcp-cloud-cdn
description: Use when designing, provisioning, securing, or operating Cloud CDN — Google Cloud's edge content delivery network that caches content at Google's globally distributed edge points of presence in front of an external Application Load Balancer backend (backend service or backend bucket). Loads the Cloud CDN knowledge: enable CDN on a load-balancer backend, choose cache modes (CACHE_ALL_STATIC, USE_ORIGIN_HEADERS, FORCE_CACHE_ALL), tune TTLs and cache keys, serve private content with signed URLs/signed cookies, run cache invalidation, and verify cache hit behavior, plus IAM and cost/scaling levers. Consumed by the Cloud CDN specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add edge caching to a web delivery foundation (Cloud CDN).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-cdn, networking, caching, edge, signed-urls, load-balancing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud CDN

Google Cloud CDN caches your content at Google's globally distributed edge points of presence,
serving it close to users to cut latency and origin load. Cloud CDN is **not standalone** — it is
enabled **on a backend** (backend service or backend bucket) of an **external Application Load
Balancer**, so the load balancer is the entry point and CDN is a caching layer in front of it.

## Core concepts and components
- **CDN-enabled backend** — Cloud CDN is turned on per backend service / backend bucket
  (`enableCdn=true`). The fronting **external Application Load Balancer** provides the global anycast
  VIP and routing.
- **Cache modes** — **`CACHE_ALL_STATIC`** (cache static content by type plus anything origin marks
  cacheable), **`USE_ORIGIN_HEADERS`** (respect `Cache-Control`/`Expires` from origin), and
  **`FORCE_CACHE_ALL`** (cache all responses, ignoring no-store — use carefully for fully static origins).
- **TTLs** — `defaultTtl`, `maxTtl`, `clientTtl` bound how long content is cached at the edge and in
  clients; negative caching can cache error responses briefly.
- **Cache keys** — control which request components (host, protocol, query string, named cookies/headers)
  form the cache key; trimming query strings/cookies raises hit ratios.
- **Signed URLs / signed cookies** — serve private content from cache with time-limited, key-signed
  URLs or cookies (cache key policy + URL signing keys on the backend).
- **Invalidation** — `gcloud compute url-maps invalidate-cdn-cache` purges cached objects by path; it is
  for exceptional updates, not routine cache busting (use versioned URLs/TTLs instead).

## Configuration and sizing
- Choose a cache mode matching origin control (`USE_ORIGIN_HEADERS` when origin sets correct headers,
  `CACHE_ALL_STATIC` for typical static assets). Set sensible default/max TTLs, trim the cache key to the
  minimum that preserves correctness, enable **negative caching** for hot 404s, and turn on **request
  coalescing** (default) so origin sees one fetch per object. Use **versioned object paths** to avoid
  invalidation churn.

## Security and IAM
- Serve private assets with **signed URLs / signed cookies** and rotate **URL signing keys**. Keep the
  origin (backend bucket/service) locked down so only the load balancer reaches it. Grant
  least-privilege IAM (`roles/compute.loadBalancerAdmin` / `roles/compute.networkAdmin` for CDN/LB config,
  `roles/storage.admin` narrowly for backend buckets). Attach **Cloud Armor** at the LB for WAF/DDoS in
  front of the cache. Enable Cloud CDN/LB logging for auditing.

## Cost levers
- Costs are **cache egress** (by region/tier, cheaper than origin egress), **cache fill** (origin→edge),
  **cache lookups**, and **invalidations**. Raise **cache hit ratio** (good TTLs, trimmed cache keys,
  versioned URLs) to shift bytes from costly origin egress to cheaper cache egress; avoid frequent
  full-path invalidations.

## Scaling and limits
- Cloud CDN scales automatically across Google's global edge; throughput follows the external Application
  Load Balancer. Cacheable object size limits apply; invalidation is rate-limited and eventually
  consistent across edges. Cache keys and signing keys have per-backend limits.

## Operating procedure
1. **Provision** — ensure an **external Application Load Balancer** with a backend service or backend
   bucket exists, then enable CDN (Terraform `google_compute_backend_service` /
   `google_compute_backend_bucket` with `enable_cdn=true` and a `cdn_policy` block).
2. **Configure** — set `cache_mode`, `default_ttl`/`max_ttl`/`client_ttl`, **cache key policy**
   (host/query/cookies), negative caching, and request coalescing to maximize hit ratio.
3. **Secure** — add **signed URL keys** for private content, lock the origin to the LB only, attach
   **Cloud Armor**, grant least-privilege IAM, and enable logging.
4. **Verify** — apply [[verify-by-running]]: request a cacheable object twice and confirm
   `Age`/`Cache-Control` and an `x-cache`/cache-status indicating a HIT on the second fetch
   (`curl -sI`), check hit ratio in monitoring, validate a **signed URL** grants then expires access,
   and confirm an **invalidation** (`gcloud compute url-maps invalidate-cdn-cache`) purges the object —
   capture the response headers and invalidation result.

## Inputs
Fronting load balancer / backend (service or bucket), origin cacheability and header behavior, desired
cache mode and TTLs, cache-key requirements (query/cookie sensitivity), private-content needs (signed
URLs/cookies), invalidation strategy, and cost/hit-ratio targets.

## Output
A CDN-enabled load-balancer backend (cache mode, TTLs, cache key policy, negative caching), signed-URL
configuration for private content, origin lockdown and Cloud Armor attachment, least-privilege IAM and
logging, plus verification of cache HIT behavior, signed-URL access, and invalidation.

## Notes
- Gotchas: Cloud CDN requires an **external Application Load Balancer** — it is not a standalone product;
  `FORCE_CACHE_ALL` can cache private/dynamic responses (use deliberately); broad cache keys (full query
  string/cookies) destroy hit ratio; invalidation is **eventually consistent** and rate-limited — prefer
  **versioned URLs** + TTLs; signed-URL keys must be rotated and origins locked to the LB; non-cacheable
  responses (no-store, set-cookie, large objects) bypass cache.
- IaC/CLI: Terraform `google_compute_backend_service` / `google_compute_backend_bucket` (`enable_cdn`,
  `cdn_policy`), `google_compute_url_map`, `google_compute_target_https_proxy`,
  `google_compute_global_forwarding_rule`, signing keys via `add-signed-url-key`. CLI `gcloud compute
  backend-services update --enable-cdn`, `... backend-buckets`, `... url-maps invalidate-cdn-cache`,
  and `... backend-services add-signed-url-key`.
