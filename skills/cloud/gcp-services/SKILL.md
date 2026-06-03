---
name: gcp-services
description: The substantive GCP platform capability — compute (Compute Engine, Cloud Run, GKE, Cloud Functions), storage (Cloud Storage, Persistent Disk), databases (Cloud SQL, Spanner, Firestore, Bigtable), data/analytics (BigQuery, Dataflow, Pub/Sub), networking (VPC, Cloud Load Balancing, Cloud DNS, Cloud CDN), IAM (roles, service accounts, least privilege, workload identity), the Google Cloud Architecture Framework, regions/zones & multi-region patterns, and tooling (gcloud CLI, Deployment Manager/Terraform). Use when designing, building, reviewing, securing, costing, or operating anything on Google Cloud — picking the right managed service, applying least-privilege IAM, choosing zonal vs regional vs multi-region, or validating gcloud/Deployment Manager/Terraform. Any agent that touches GCP (an architect, IaC engineer, security reviewer, cost governor, reliability/networking/observability/data engineer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud, compute-engine, cloud-run, gke, bigquery, vpc, iam, spanner, architecture-framework]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# GCP Services

The substantive Google Cloud capability: knowing the catalog of managed services, the trade-offs
between them, and the platform conventions (IAM, regions/zones, the Google Cloud Architecture
Framework) that turn a pile of resources into a sound system.

## When to use this skill
Whenever the work is on GCP: selecting a compute/storage/database service, designing a VPC,
writing or reviewing IAM and service accounts, choosing a resilience posture (zonal / regional /
multi-region), estimating or trimming cost, or authoring/validating Deployment Manager/Terraform.
Not a substitute for the Terraform language itself ([[terraform-iac]]) or generic Kubernetes
operation — it is the GCP-specific knowledge those skills consume.

## Instructions
1. **Establish context before choosing services.** Identify the project/folder/Organization
   layout, the region(s) and zone(s), the workload shape (request/response, batch, streaming,
   stateful), the data classification, and the SLO/RTO/RPO. Read existing IaC (`*.tf`,
   Deployment Manager config) and labels to learn what already exists before proposing anything.
2. **Pick the fitting managed service per concern, biasing to managed:**
   - **Compute** — Cloud Functions for event-driven/spiky; Cloud Run for stateless containers
     without infra management; GKE (Autopilot preferred) when the org standard is Kubernetes;
     Compute Engine only when you need the host (licensing, GPUs, special networking).
   - **Storage** — Cloud Storage for object/static/data-lake (choose the right storage class +
     lifecycle/Autoclass); Persistent Disk for block volumes attached to instances; Filestore for
     shared NFS.
   - **Databases** — Cloud SQL for managed relational; Spanner for global, horizontally scalable
     relational with strong consistency; Firestore for serverless document; Bigtable for
     high-throughput wide-column/time-series; Memorystore for caching.
   - **Data/analytics & eventing** — BigQuery for the warehouse/analytics; Dataflow for batch and
     streaming transforms; Pub/Sub for decoupled messaging and event ingestion.
3. **Design the network deliberately.** Lay out the VPC (prefer custom-mode) with regional subnets;
   route egress through Cloud NAT only where required; scope firewall rules to least privilege
   (tags/service accounts over CIDRs, no `0.0.0.0/0` to admin ports). Front HTTP(S) with the global
   external Application Load Balancer, TCP/UDP with the Network Load Balancer; use Cloud DNS for
   DNS, Cloud CDN for edge caching. Prefer Private Google Access / Private Service Connect over
   public paths to Google APIs.
4. **Apply least-privilege IAM.** Grant predefined or custom roles (avoid primitive
   owner/editor/viewer); bind to service accounts, not user keys; never download long-lived SA
   keys — use Workload Identity Federation (and Workload Identity on GKE). Scope bindings to the
   smallest resource (project/folder/org) and use conditions where useful. Encrypt at rest (CMEK
   where required) and in transit (TLS) by default; store secrets in Secret Manager, never in code.
5. **Evaluate against the Google Cloud Architecture Framework's pillars** — Operational Excellence,
   Security/Privacy/Compliance, Reliability, Cost Optimization, and Performance Optimization. For
   each significant choice, name the pillar trade-off you are making and why.
6. **Choose the resilience footprint explicitly.** State zonal vs regional vs multi-region and
   justify it against the RTO/RPO. Spread stateless tiers across zones in managed instance
   groups; use regional resources (regional MIGs, regional Cloud SQL/GKE) for HA; define
   backup/restore and, where required, multi-region buckets, Spanner multi-region, or active/active.
7. **Express and validate it as code.** Capture the design in Terraform or Deployment Manager.
   Use the `gcloud` CLI / `terraform validate`/`plan` / `gcloud deployment-manager deployments`
   to check it, and label every resource (owner, env, cost-center).

## Inputs
- The workload requirements (shape, data classification, SLO/RTO/RPO), the target region(s)/zone(s)
  and project/folder/org layout, and any existing IaC, IAM bindings, and resource labels.

## Output
- A service-by-concern recommendation (compute/storage/db/network/data) with the GCP service named
  and the trade-off justified, including the resilience footprint (zone/region/multi-region) and the
  Architecture Framework pillars touched.
- IAM scoped to least privilege (predefined/custom roles, service accounts, Workload Identity) and
  encryption posture.
- Where code is involved, Terraform/Deployment Manager plus the validation command(s).

## Notes
- Bias toward managed/serverless services to reduce operational load; reach for Compute
  Engine/self-managed only with a stated reason.
- This skill is GCP knowledge, not the IaC engine: pair it with [[terraform-iac]] for Terraform
  authoring, and confirm any plan/validate output with [[verify-by-running]].
- Costs concentrate in egress/inter-region network traffic, idle provisioned capacity (committed
  use vs on-demand), un-lifecycled storage, and BigQuery on-demand query scanning — flag these
  when relevant rather than only per-resource unit price.
