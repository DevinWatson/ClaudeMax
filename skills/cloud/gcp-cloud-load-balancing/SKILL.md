---
name: gcp-cloud-load-balancing
description: Use when designing, provisioning, securing, or operating Cloud Load Balancing — Google Cloud's managed, software-defined load balancers spanning global and regional Application Load Balancers (HTTP/S) and Network Load Balancers (TCP/UDP/SSL, proxy and passthrough). Loads the Cloud Load Balancing knowledge: choose the right LB type, build forwarding rules, target proxies, URL maps, backend services and backend buckets, configure health checks, SSL/TLS certificates and policies, session affinity, capacity/balancing modes, Cloud CDN and Cloud Armor attachment, plus IAM and cost/scaling levers. Consumed by the Cloud Load Balancing specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they front a service with a load balancer (Cloud Load Balancing).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-load-balancing, networking, backend-service, health-check, ssl, application-load-balancer]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Load Balancing

Google Cloud Load Balancing is a fully managed, software-defined load-balancing service. Global
Application Load Balancers use a single **anycast** IP across regions on Google's edge; regional and
network variants serve TCP/UDP/SSL workloads. There are no instances to manage — you assemble the LB
from forwarding rules, proxies, URL maps, and backend services.

## Core concepts and components
- **LB type matrix** — **Application Load Balancers (L7, HTTP/S)**: global external, regional external,
  regional internal, cross-region internal. **Network Load Balancers (L4)**: **proxy** (TCP/SSL, global
  or regional) and **passthrough** (external/internal, preserves client IP). Choose by protocol, scope
  (global vs regional), and external vs internal.
- **Frontend** — **forwarding rule** (IP + port + protocol) → **target proxy** (HTTP/HTTPS/TCP/SSL) →
  **URL map** (L7 host/path routing) → backend.
- **Backends** — **backend service** (instance groups, **NEGs** — zonal/serverless/internet/PSC, or GKE),
  or **backend bucket** (static content / CDN). **Health checks** gate traffic; **balancing mode**
  (RATE/UTILIZATION/CONNECTION) and capacity scaler control distribution.
- **TLS** — **SSL certificates** (Google-managed or self-managed), **SSL policies** (min TLS version,
  cipher profile), HTTP→HTTPS redirects.
- **Traffic features** — **session affinity**, connection draining, outlier detection, traffic
  splitting/weighting, and **Cloud CDN** + **Cloud Armor** attached at the backend service.

## Configuration and sizing
- Pick the LB type from protocol/scope/external-vs-internal first. Define **backend services** with the
  right **balancing mode** and capacity, attach **health checks** sized to detect failure quickly without
  flapping, and choose **NEGs** for serverless/container/hybrid backends. Add **SSL certs + SSL policy**,
  HTTP→HTTPS redirect, session affinity where needed, and attach **CDN/Armor**.

## Security and IAM
- Terminate TLS with managed/self-managed certs and enforce a strict **SSL policy** (modern min TLS).
  Attach **Cloud Armor** for WAF/DDoS and rate limiting on external L7 LBs. Use **internal** LBs for
  private traffic. Grant least-privilege IAM (`roles/compute.loadBalancerAdmin`,
  `roles/compute.networkAdmin`). Lock backends to accept traffic only from the LB (firewall rules /
  health-check ranges). Enable LB logging.

## Cost levers
- Cost comes from **forwarding-rule/proxy hours**, **data processed**, and **egress** (with tiering on
  global LBs); managed certs are free. Consolidate services behind one LB via URL-map routing, keep
  traffic regional where possible, attach **CDN** to offload origin egress, and right-size health-check
  frequency.

## Scaling and limits
- Global Application LBs scale to very high RPS automatically with anycast; capacity follows backend
  health and balancing mode. Limits: backend services, backends per service, forwarding rules, URL-map
  rules, and certificates per project; NEG endpoint limits. Raise via quota. Health-check tuning affects
  failover speed and flapping.

## Operating procedure
1. **Provision** — choose the LB type and create the **backend service** (Terraform
   `google_compute_backend_service` / `..._region_backend_service`) with **health check**
   (`google_compute_health_check`) and backends (instance groups / **NEGs** /
   `google_compute_backend_bucket`).
2. **Configure** — build the **URL map** (`google_compute_url_map`), **target proxy**
   (`...target_https_proxy`), **SSL cert + SSL policy**, and **forwarding rule**
   (`google_compute_global_forwarding_rule`); set balancing mode, session affinity, and HTTP→HTTPS
   redirect.
3. **Secure** — attach **Cloud Armor**, enforce the SSL policy, lock backends to LB/health-check ranges,
   grant least-privilege IAM, and enable logging.
4. **Verify** — apply [[verify-by-running]]: confirm the **backend health** is HEALTHY
   (`gcloud compute backend-services get-health`), curl the VIP for expected routing and a valid TLS
   handshake (`curl -v https://<vip>`), confirm HTTP→HTTPS redirect, exercise URL-map path routing and
   session affinity, and confirm Armor/CDN behavior — capture backend-health and curl output.

## Inputs
Protocol and scope (global vs regional, external vs internal, L7 vs L4), backends (instance groups /
NEGs / buckets / GKE), routing rules (hosts/paths), TLS/cert requirements and SSL policy, health-check
parameters, affinity/draining needs, CDN/Armor attachment, IAM model, and cost target.

## Output
A load balancer (correct type) — forwarding rule, target proxy, URL map, backend service(s) with health
checks and balancing mode, SSL certs + policy, session affinity, CDN/Armor attachment — with backends
locked to the LB, least-privilege IAM and logging, plus verification of backend health, routing, and TLS.

## Notes
- Gotchas: choosing the **wrong LB type** (global vs regional, proxy vs passthrough, L7 vs L4) is the most
  common mistake — derive it from protocol/scope; backends without passing **health checks** receive no
  traffic; **firewall rules must allow Google health-check ranges** or backends look unhealthy;
  **managed certs** need DNS pointing at the LB IP before they provision; balancing-mode/capacity
  misconfig causes uneven load; internal LBs need proxy-only subnets for L7.
- IaC/CLI: Terraform `google_compute_backend_service`, `google_compute_health_check`,
  `google_compute_url_map`, `google_compute_target_https_proxy`, `google_compute_ssl_policy`,
  `google_compute_managed_ssl_certificate`, `google_compute_global_forwarding_rule`,
  `google_compute_region_network_endpoint_group`. CLI `gcloud compute backend-services`,
  `... health-checks`, `... url-maps`, `... target-https-proxies`, `... forwarding-rules`,
  `... ssl-policies`; verify with `... backend-services get-health` and `curl -v`.
