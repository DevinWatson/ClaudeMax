---
name: gcp-media-cdn
description: Use when designing, provisioning, securing, or operating Media CDN — Google Cloud's high-scale media-delivery CDN built on the same edge infrastructure as YouTube, optimized for large-file and streaming (VOD/live, HLS/DASH) egress. Covers EdgeCacheService / EdgeCacheOrigin / EdgeCacheKeyset resources, route-based request matching and header/path rewrites, multi-tier edge caching with cache-fill and origin shielding, long-tail cache behavior, signed requests/cookies and token authentication for content protection, TLS/managed certs, plus IAM, logging, cost (cache egress vs cache fill), and scaling/limits. Loads the Media CDN knowledge: define origins/services/routes, tune caching and shielding, protect content with signed requests, and verify cache hits and signed-URL enforcement. Consumed by the Media CDN specialist and by the GCP role team (gcp-networking-engineer / gcp-iac-engineer) when delivering media at scale (Media CDN).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, media-cdn, networking, cdn, media-delivery, edge-cache, origin-shielding]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Media CDN

Google Cloud's **high-scale media-delivery CDN**, built on the same global edge network that serves
YouTube. It is purpose-built for **large-object and streaming egress** (VOD and live, HLS/DASH) where
hit ratio, deep edge caching, and origin offload matter most. It is distinct from Cloud CDN (which fronts
a load-balancer backend); Media CDN is a standalone media-optimized edge product.

## Core concepts and components
- **EdgeCacheService** — the top-level delivery service: holds the **routing** config (host rules and
  path matchers), TLS/cert binding, and references to origins; gets one or more anycast IPs.
- **EdgeCacheOrigin** — an origin definition (GCS bucket, external HTTP(S), or another origin) with
  **failover/retry**, timeouts, and protocol settings.
- **EdgeCacheKeyset** — public keys / shared secrets used to validate **signed requests** for content
  protection.
- **Routes / route rules** — match by host/path/header/query and apply **header actions**, **URL
  rewrites/redirects**, **CDN policy** (cache mode, TTLs, **cache key** policy, negative caching), and
  origin selection.
- **Caching tiers & shielding** — multi-tier edge caching with **cache fill** from a shielding tier to
  collapse origin requests; tuned for **long-tail** media catalogs.
- **Content protection** — **signed requests / signed cookies / token auth** (keyed by an EdgeCacheKeyset)
  to gate access and expire URLs.

## Configuration and sizing
- Model **origins** with failover and sensible timeouts; define an **EdgeCacheService** with route rules
  that set cache mode (`CACHE_ALL_STATIC` / `USE_ORIGIN_HEADERS` / `FORCE_CACHE_ALL`), TTLs, and a tight
  **cache key** (strip volatile query params, keep only relevant ones). Enable **origin shielding** to
  reduce origin load for long-tail content. Use managed TLS certs on the service.

## Security and IAM
- Protect premium content with **signed requests/cookies** (EdgeCacheKeyset); never ship signing keys in
  plaintext IaC (use Secret Manager). Lock the origin to accept only CDN traffic. Grant least-privilege
  IAM (`roles/networkservices.edgeCacheAdmin` / viewer) narrowly. Enable request logging for abuse/audit;
  pair with Cloud Armor edge security policies where supported.

## Cost levers
- The dominant cost is **cache egress** (data served to clients, tiered by region) plus **cache-fill
  egress** from origin and **request** volume. The biggest lever is **hit ratio**: tighten cache keys,
  set long TTLs for immutable media segments, enable shielding to cut cache-fill, and serve from GCS
  origins to keep fill cheap. Avoid `FORCE_CACHE_ALL` on dynamic content.

## Scaling and limits
- Designed for very high concurrency and throughput (YouTube-scale edge). Watch quotas on
  **EdgeCacheServices / origins / keysets** and **routes per service**, signing-key counts, and
  per-project request rates. Cache-fill capacity and origin throughput become the practical ceiling —
  shield and pre-warm hot content for live events.

## Operating procedure
1. **Provision** — enable the Network Services API and create the **EdgeCacheOrigin(s)**
   (Terraform `google_network_services_edge_cache_origin`) and, for signed content, an
   **EdgeCacheKeyset** (`google_network_services_edge_cache_keyset`).
2. **Configure** — create the **EdgeCacheService**
   (`google_network_services_edge_cache_service`) with host rules, path matchers, route rules (cache mode,
   TTLs, cache key, header/rewrite actions), origin selection, shielding, and TLS; bind the keyset to
   protected routes.
3. **Secure** — require **signed requests/cookies** on premium routes, store signing keys in Secret
   Manager, lock origins to CDN traffic, grant edge-cache IAM least-privilege, and enable request logging.
4. **Verify** — apply [[verify-by-running]]: request a media object twice and confirm a **cache HIT**
   (cache-status/`Age` header), validate a **signed URL** grants then expires access (and an unsigned
   request is rejected on protected routes), and confirm shielding reduces origin hits — capture the
   response headers and signed-request test output.

## Inputs
Media workload (VOD/live, HLS/DASH, object sizes), origin topology (GCS vs external, failover), routing and
rewrite rules, cache policy (mode, TTLs, cache key), content-protection needs (signed requests/cookies,
keyset), TLS/cert plan, IAM model, logging requirements, and cost/hit-ratio targets.

## Output
A Media CDN delivery configuration (EdgeCacheService with routes/host rules, EdgeCacheOrigin(s) with
failover, cache policy and origin shielding, EdgeCacheKeyset + signed-request enforcement, managed TLS)
with least-privilege IAM and request logging, plus verification of cache HITs and signed-URL enforcement.

## Notes
- Gotchas: Media CDN is **not** Cloud CDN — it does not attach to a load-balancer backend; broad **cache
  keys** wreck hit ratio (the #1 cost driver); `FORCE_CACHE_ALL` on dynamic/personalized content serves
  the wrong bytes; **signing keys** must live in Secret Manager, not IaC; without **origin shielding**,
  long-tail catalogs hammer the origin; pre-warm/scale origin for live-event spikes; config changes can
  take time to propagate to all edges.
- IaC/CLI: Terraform `google_network_services_edge_cache_service`,
  `google_network_services_edge_cache_origin`, `google_network_services_edge_cache_keyset`, plus
  `google_project_service` (networkservices). CLI `gcloud network-services edge-cache-services /
  edge-cache-origins / edge-cache-keysets`, and `curl -sI` (twice) to confirm cache HITs and signed-request
  behavior.
