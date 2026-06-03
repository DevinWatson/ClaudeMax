---
name: gcp-cloud-service-mesh
description: Use when designing, provisioning, securing, or operating Cloud Service Mesh — Google Cloud's managed Istio/Anthos Service Mesh control plane for GKE and multi-cluster/multi-cloud fleets, in both sidecar (Envoy) and proxyless gRPC modes. Covers control-plane provisioning (managed vs in-cluster), sidecar injection and proxyless gRPC, traffic management (VirtualService/DestinationRule, request routing, canary/weighted splits, retries/timeouts, outlier detection, fault injection), mTLS and PeerAuthentication/AuthorizationPolicy (STRICT vs PERMISSIVE), telemetry (golden-signal metrics, access logs, distributed traces to Cloud Trace), and ingress/egress gateways, plus IAM/fleet, cost, and scaling/limits. Loads the mesh knowledge: enroll clusters, inject proxies, write traffic and security policies, enable telemetry, and verify routing/mTLS. Consumed by the Cloud Service Mesh specialist and by the GCP role team (gcp-networking-engineer / the kubernetes-platform team) when meshing services (Cloud Service Mesh).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-service-mesh, networking, istio, service-mesh, mtls, traffic-management]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Service Mesh

Google Cloud's managed service mesh, built on **Istio/Envoy** (formerly Anthos Service Mesh + Traffic
Director). It provides a managed control plane for **GKE** clusters and multi-cluster/multi-cloud
**fleets**, giving uniform traffic management, mutual TLS, and telemetry across services without changing
application code. It runs in **sidecar** mode (an Envoy proxy per Pod) or **proxyless gRPC** mode (the
gRPC library talks xDS directly).

## Core concepts and components
- **Control plane** — **managed** (Google-operated, recommended) or in-cluster; configures data-plane
  proxies via xDS. Clusters are enrolled through a **fleet** (GKE Hub) and a mesh feature.
- **Data plane** — **sidecar Envoy** injected per Pod (auto-injection via namespace label) or
  **proxyless gRPC** for gRPC workloads that embed xDS.
- **Traffic management** — Istio APIs: **VirtualService** (request routing, weighted/canary splits,
  retries, timeouts, fault injection), **DestinationRule** (subsets, load balancing, **outlier
  detection**/circuit breaking, connection pools), **Gateway** (ingress/egress), **ServiceEntry**.
- **Security** — **mTLS** via **PeerAuthentication** (`STRICT` vs `PERMISSIVE` during migration) and
  **AuthorizationPolicy** (L7 allow/deny by source identity, namespace, method/path). Workload identity
  comes from SPIFFE IDs / GKE Workload Identity.
- **Telemetry** — automatic **golden-signal metrics**, **access logs**, and **distributed traces** to
  **Cloud Trace**, surfaced in the Cloud Service Mesh dashboards (service topology, SLOs).

## Configuration and sizing
- Prefer the **managed control plane** and **managed data plane** (Google upgrades proxies). Enable
  auto-injection only on meshed namespaces. Size **sidecar CPU/memory requests** for proxy overhead;
  consider **proxyless gRPC** for latency-sensitive high-throughput gRPC. Define **subsets** in
  DestinationRule before weighted routing; add ingress/egress **Gateways** for north-south traffic.

## Security and IAM
- Default to **STRICT mTLS** mesh-wide once all workloads are meshed (migrate via PERMISSIVE). Write
  **AuthorizationPolicy** as default-deny then allow by workload identity/namespace. Grant fleet/mesh IAM
  least-privilege (`roles/gkehub.admin`, `roles/meshconfig.admin` scoped narrowly); rely on **GKE Workload
  Identity** for service-to-GCP-API auth. Pair with NetworkPolicy for L3/4 segmentation.

## Cost levers
- The mesh control plane is included with GKE/fleet; cost comes from **sidecar resource overhead** (CPU/mem
  per Pod), extra **egress** through gateways, and **telemetry/trace volume** (Cloud Monitoring/Trace
  ingestion). Right-size sidecars, sample traces, use proxyless gRPC where it fits, and scope telemetry.

## Scaling and limits
- Scales with the fleet; watch **proxy resource footprint** at high Pod counts, **xDS config size** (large
  meshes increase push latency — scope with **Sidecar** resources to limit visible services), and
  per-cluster Istio object quotas. Multi-cluster meshes require consistent trust domain and endpoint
  discovery; cross-cluster failover depends on locality settings.

## Operating procedure
1. **Provision** — enable the mesh feature on the fleet and clusters (managed control plane) via
   Terraform (`google_gke_hub_feature`, `google_gke_hub_membership`) or `gcloud container fleet mesh
   enable` / `update --management automatic`; label meshed namespaces for **auto-injection**.
2. **Configure** — apply Istio **VirtualService**/**DestinationRule** for routing, subsets, weighted
   canary splits, retries/timeouts, and outlier detection; add **Gateway**/**ServiceEntry** for
   ingress/egress; deploy and roll Pods to pick up sidecars (or wire proxyless gRPC).
3. **Secure** — set **PeerAuthentication** to STRICT (after PERMISSIVE migration) and author default-deny
   **AuthorizationPolicy** allowing only required identities; grant fleet/mesh IAM least-privilege.
4. **Verify** — apply [[verify-by-running]]: confirm proxies are injected and synced
   (`istioctl proxy-status`), validate routing/weights and policy with `istioctl analyze` and live
   requests, confirm **mTLS** is in effect (`istioctl authn tls-check` / connection metadata), and check
   the Cloud Service Mesh telemetry dashboards / Cloud Trace for the service — capture proxy status,
   routing test, and mTLS verification.

## Inputs
Fleet/cluster topology (single vs multi-cluster/multi-cloud), data-plane mode (sidecar vs proxyless gRPC),
traffic policy (routing, canary weights, retries/timeouts, circuit breaking), security posture (mTLS mode,
authz model), telemetry/trace needs, IAM/fleet model, and cost/footprint ceiling.

## Output
A meshed configuration (enrolled fleet/clusters with managed control plane, injected sidecars or proxyless
gRPC, traffic-management and authorization policies, STRICT mTLS, ingress/egress gateways, telemetry to
Cloud Monitoring/Trace) with least-privilege fleet/mesh IAM, plus verification of proxy sync, routing, and
mTLS.

## Notes
- Gotchas: switching PeerAuthentication to **STRICT** before every caller is meshed breaks traffic
  (migrate via PERMISSIVE); a missing **DestinationRule subset** makes VirtualService weights silently
  fail; **sidecar overhead** is real at scale (size requests, use Sidecar scoping to shrink xDS config);
  auto-injection only applies to **newly created Pods** (roll the deployment); proxyless gRPC needs library
  support and does not get L7 features sidecars do; multi-cluster meshes need a shared trust domain.
- IaC/CLI: Terraform `google_gke_hub_feature` (mesh), `google_gke_hub_membership`, plus Istio CRDs applied
  via `kubectl`/Config Connector; `gcloud container fleet mesh enable/update`. CLI/tools `istioctl
  proxy-status`, `istioctl analyze`, `istioctl authn tls-check`, and `kubectl` for Istio objects.
