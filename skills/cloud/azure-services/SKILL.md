---
name: azure-services
description: The substantive Microsoft Azure platform capability — compute (Virtual Machines, App Service, Azure Functions, AKS, Container Apps), storage (Blob, Managed Disks, Files), databases (Azure SQL, Cosmos DB, Database for PostgreSQL/MySQL), data/analytics (Synapse, Data Factory, Event Hubs, Service Bus), networking (Virtual Network, Load Balancer, Application Gateway, Azure DNS, Front Door), identity/IAM (Entra ID, RBAC, managed identities), governance (Management Groups, Subscriptions, Azure Policy), the Azure Well-Architected Framework, regions/availability zones, and tooling (az CLI, ARM/Bicep, Terraform). Use when designing, building, reviewing, securing, costing, or operating anything on Azure — picking the right managed service, applying least-privilege RBAC, choosing zonal vs zone-redundant vs multi-region, or validating az/Bicep/Terraform. Any agent touching Azure (architect, IaC, security reviewer, cost governor, reliability/networking/observability/data engineer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, cloud, virtual-machines, app-service, aks, cosmos-db, synapse, virtual-network, entra-id, well-architected-framework]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Services

The substantive Microsoft Azure capability: knowing the catalog of managed services, the trade-offs
between them, and the platform conventions (Entra ID/RBAC, governance hierarchy, regions/availability
zones, the Azure Well-Architected Framework) that turn a pile of resources into a sound system.

## When to use this skill
Whenever the work is on Azure: selecting a compute/storage/database service, designing a Virtual
Network, writing or reviewing RBAC and managed identities, choosing a resilience posture (single-zone
/ zone-redundant / multi-region), estimating or trimming cost, or authoring/validating Bicep/ARM or
Terraform. Not a substitute for the Terraform language itself ([[terraform-iac]]) or generic
Kubernetes operation — it is the Azure-specific knowledge those skills consume.

## Instructions
1. **Establish context before choosing services.** Identify the management-group / subscription /
   resource-group layout, the region(s) and availability zone(s), the workload shape
   (request/response, batch, streaming, stateful), the data classification, and the SLO/RTO/RPO.
   Read existing IaC (`*.bicep`, ARM `*.json`, `*.tf`) and resource tags to learn what already
   exists before proposing anything.
2. **Pick the fitting managed service per concern, biasing to managed:**
   - **Compute** — Azure Functions for event-driven/spiky; App Service for web apps/APIs without
     infra management; Container Apps for serverless containers/microservices; AKS when the org
     standard is Kubernetes; Virtual Machines only when you need the host (licensing, GPUs, special
     networking).
   - **Storage** — Blob Storage for object/static/data-lake (choose the right access tier +
     lifecycle management); Managed Disks for block volumes attached to VMs; Azure Files for shared
     SMB/NFS.
   - **Databases** — Azure SQL Database for managed relational; Cosmos DB for globally distributed,
     multi-model with tunable consistency; Database for PostgreSQL/MySQL for managed open-source
     relational; Azure Cache for Redis for caching.
   - **Data/analytics & eventing** — Synapse Analytics for the warehouse/analytics; Data Factory for
     batch/ELT orchestration; Event Hubs for high-throughput event ingestion/streaming; Service Bus
     for decoupled enterprise messaging (queues/topics).
3. **Design the network deliberately.** Lay out the Virtual Network with subnets and Network Security
   Groups scoped to least privilege (no `0.0.0.0/0`/`Internet` to admin ports); front HTTP(S) with
   Application Gateway (WAF) or, for global multi-region edge/routing, Front Door; use Load Balancer
   for L4 TCP/UDP; use Azure DNS for DNS. Prefer Private Endpoints / Private Link over public paths
   to Azure PaaS services, and route egress through NAT Gateway / Azure Firewall where required.
4. **Apply least-privilege RBAC.** Grant built-in or custom roles at the smallest scope
   (subscription/resource-group/resource); avoid Owner/Contributor at broad scope. Use managed
   identities (system- or user-assigned) instead of service-principal secrets or stored credentials;
   never embed secrets in code — store them in Key Vault. Govern with Management Groups,
   Subscriptions, and Azure Policy (initiatives) for guardrails. Encrypt at rest (platform-managed or
   customer-managed keys via Key Vault) and in transit (TLS) by default.
5. **Evaluate against the Azure Well-Architected Framework's pillars** — Reliability, Security, Cost
   Optimization, Operational Excellence, and Performance Efficiency. For each significant choice, name
   the pillar trade-off you are making and why.
6. **Choose the resilience footprint explicitly.** State single-zone vs zone-redundant vs
   multi-region and justify it against the RTO/RPO. Spread stateless tiers across availability zones
   (zone-redundant VM Scale Sets, zone-redundant App Service/AKS); use zone-redundant or geo-redundant
   data services (zone-redundant Azure SQL, Cosmos DB multi-region writes, GRS/RA-GRS storage) for HA;
   define backup/restore and, where required, multi-region active/active behind Front Door.
7. **Express and validate it as code.** Capture the design in Bicep/ARM or Terraform. Use the `az`
   CLI / `az deployment ... what-if` / `terraform validate`/`plan` to check it, and tag every
   resource (owner, env, cost-center).

## Inputs
- The workload requirements (shape, data classification, SLO/RTO/RPO), the target region(s)/zone(s)
  and management-group / subscription / resource-group layout, and any existing IaC, RBAC
  assignments, and resource tags.

## Output
- A service-by-concern recommendation (compute/storage/db/network/data) with the Azure service named
  and the trade-off justified, including the resilience footprint (zone/zone-redundant/multi-region)
  and the Well-Architected Framework pillars touched.
- RBAC scoped to least privilege (built-in/custom roles, managed identities, Key Vault for secrets)
  and encryption posture.
- Where code is involved, Bicep/ARM/Terraform plus the validation command(s).

## Notes
- Bias toward managed/serverless services to reduce operational load; reach for Virtual
  Machines/self-managed only with a stated reason.
- This skill is Azure knowledge, not the IaC engine: pair it with [[terraform-iac]] for Terraform
  authoring, and confirm any plan/validate/what-if output with [[verify-by-running]].
- Costs concentrate in egress/inter-region network traffic, idle provisioned capacity
  (reservations/savings plans vs pay-as-you-go), un-lifecycled storage tiers, and Synapse
  dedicated-SQL-pool / serverless query scanning — flag these when relevant rather than only per-
  resource unit price.
