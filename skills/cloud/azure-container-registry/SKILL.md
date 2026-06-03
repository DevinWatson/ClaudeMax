---
name: azure-container-registry
description: Use when designing, provisioning, securing, or operating Azure Container Registry — Azure's managed OCI artifact registry for container images, Helm charts, and OCI artifacts (Azure Container Registry). Covers the service tiers (Basic/Standard/Premium), repositories and tags, ACR Tasks (quick/scheduled/triggered builds, multi-step, base-image-update automation), geo-replication (Premium), content trust / image signing, vulnerability scanning (Defender), retention and untagged-manifest cleanup, private endpoints and firewall rules, anonymous pull, token/scope-map access, and authentication via managed identity / Entra / admin user. Loads the knowledge: choose a tier, set up repos/tasks/replication, provision, secure, and verify push/pull works. Consumed by the azure-container-registry specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Container Registry).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-container-registry, containers, oci-registry, acr-tasks, geo-replication]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Container Registry (ACR)

Azure's **managed OCI registry** for storing and distributing container images, Helm charts, and OCI
artifacts — with build automation (Tasks), geo-replication, signing, and scanning, integrated with Azure
identity and networking.

## Core concepts and components
- **Tiers** — **Basic** (dev, low throughput/storage), **Standard** (most production), **Premium**
  (geo-replication, private endpoints, content trust, higher throughput, scope maps/tokens).
- **Repositories & tags** — namespaced image repos with mutable or **locked/immutable tags**; manifests
  are content-addressed by digest.
- **ACR Tasks** — server-side OCI builds: **quick tasks** (`az acr build`), **multi-step** tasks, and
  **triggered** tasks (on git commit, base-image update, or schedule) for automated rebuilds.
- **Geo-replication** (Premium) — a single registry/login server replicated to multiple regions for
  low-latency pulls and regional resilience.
- **Content trust / signing** — Docker content trust (notary) and OCI signing for image provenance.
- **Scanning & retention** — vulnerability scanning via **Defender for Containers**; **retention policies**
  for untagged manifests to control storage.
- **Access** — **managed identity / Entra** auth, **token + scope-map** repo-scoped access (Premium),
  admin user (avoid in prod), and **anonymous pull** for public content.

## Configuration and sizing
- Choose a **tier** by needs (Premium for geo-replication, private endpoints, scope maps). Plan
  **repository naming**, **tag immutability**, and a **retention policy** for untagged manifests. Set up
  **ACR Tasks** for builds and base-image-update auto-rebuilds. Add **geo-replication** regions for global
  pull. Decide network exposure (public, firewall rules, or **private endpoint**).

## Security and IAM
- Prefer **managed identity / Entra RBAC** (AcrPull / AcrPush roles) over the admin user; use **scope-map
  tokens** for fine-grained repo access. Lock down networking with **private endpoints**/firewall and
  disable public access where possible. Enable **content trust/signing** and **Defender** scanning. Use
  **immutable tags** for release images. Disable anonymous pull unless intentionally public.

## Cost levers
- Billed per **tier daily rate** + **storage over the included quota** + egress + ACR Tasks compute +
  **per-replica** for geo-replication. Levers: pick the lowest tier that meets requirements, apply
  **retention/cleanup** of untagged manifests to cut storage, geo-replicate only needed regions, and use
  efficient layered/base images to reduce storage and pull cost.

## Scaling and limits
- Throughput (concurrent push/pull, read/write ops, bandwidth) scales by **tier**; storage has an included
  quota then overage billing. Limits: max replications, tokens/scope maps (Premium), Task concurrency.
  Geo-replication and private endpoints are **Premium-only**; tier upgrades are online, downgrades have
  constraints.

## Operating procedure
1. **Provision** — create the registry at the chosen **tier** via Terraform `azurerm_container_registry`
   (with `georeplications` for Premium) (or Bicep `Microsoft.ContainerRegistry/registries`, or `az acr
   create`).
2. **Configure** — set **tag immutability** and a **retention policy**, define **ACR Tasks** for builds/
   base-image updates, add **geo-replication** regions, and configure networking (private endpoint/firewall).
3. **Secure** — grant **AcrPull/AcrPush via Entra RBAC / managed identity** (disable admin user), create
   **scope-map tokens** for least-privilege repo access, enable **content trust** and **Defender** scanning,
   and lock down public network access.
4. **Verify** — apply [[verify-by-running]]: log in with the cluster/managed identity (`az acr login`),
   then **push and pull a test image** (`az acr build` or `docker push` + `docker pull`) and list the tag
   (`az acr repository show-tags`); confirm a consumer (AKS/ACA/ACI) can pull. Capture the push/pull result
   and tag listing.

## Inputs
The expected image volume/throughput and global footprint (drives tier + geo-replication), repo naming and
tag-immutability/retention policy, build automation needs (ACR Tasks), network exposure (public/private),
the auth model (Entra RBAC/managed identity/tokens), scanning/signing requirements, and the region(s).

## Output
An ACR setup: a tiered registry with repositories, tag-immutability and retention, ACR Tasks for automated
builds, optional geo-replication, secured by Entra RBAC/managed identity/scope-map tokens and private
networking with scanning/signing — plus verification that push and pull succeed and consumers can pull.

## Notes
- Gotchas: **geo-replication, private endpoints, content trust, and scope-map tokens are Premium-only**;
  the **admin user is a shared credential** — disable it and use Entra/managed identity; **deleting a
  manifest is by digest** and untagged layers linger without a retention policy; cross-region pulls without
  geo-replication add latency/egress; tag mutability lets images drift — use immutable tags for releases.
  2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS
  ECR, GCP Artifact Registry.
- IaC/CLI: Terraform `azurerm_container_registry` (+ `georeplications`, `azurerm_container_registry_token`/
  `_scope_map`); Bicep/ARM `Microsoft.ContainerRegistry/registries`. CLI `az acr create` / `az acr build` /
  `az acr login` / `az acr repository show-tags`; verify with a push/pull round-trip.
