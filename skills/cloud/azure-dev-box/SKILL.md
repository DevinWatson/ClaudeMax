---
name: azure-dev-box
description: Use when designing, provisioning, configuring, or operating Microsoft Dev Box — Azure's managed, cloud-hosted developer workstation service (Microsoft Dev Box). Covers the dev center, projects, dev box definitions (image + compute/storage SKU), dev box pools (region + network), network connections (Azure AD / hybrid-joined VNets), the developer self-service portal, auto-stop/hibernation schedules, and Intune/Entra device management. Loads the knowledge to stand up a dev center, define images and pools, wire networking, set cost schedules, and verify a developer can self-provision a working box. Consumed by the azure-dev-box specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-dev-box, devops, developer-workstation, virtual-desktop]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Dev Box

**Microsoft Dev Box** provides **managed, cloud-hosted developer workstations** — preconfigured, project-specific
VMs that developers self-provision on demand. This skill owns the **single-service Dev Box layer** — the dev
center, projects, dev box definitions, pools, network connections, schedules, and the self-service flow.

## Core concepts and components
- **Dev center** — the top-level organizing resource that holds **dev box definitions**, **network connections**,
  catalogs, and the projects that consume them.
- **Project** — maps to a team/app; grants developers access and sets **dev box limits** per user; associates the
  **pools** developers can pick from.
- **Dev box definition** — the **image** (Marketplace/Microsoft-hosted or custom from Azure Compute Gallery) plus
  the **compute + storage SKU** (vCPU/RAM/disk) that a dev box is built from.
- **Dev box pool** — pairs a **definition** with a **region** and a **network connection** (and a schedule);
  developers create boxes from a pool. Local-admin and stop-on-disconnect are set here.
- **Network connection** — **Azure AD join** (Microsoft-hosted network) or **hybrid Azure AD join** to an existing
  **VNet** for on-prem/private connectivity; reused across pools.
- **Schedules** — **auto-stop** (and hibernation) at a daily time per pool to cut compute cost.

## Configuration and sizing
- Create the **dev center**, add **network connection(s)**, build **dev box definitions** (image + SKU), create
  **pools**, attach pools to **projects**, and set per-user **limits** + **auto-stop**. Sizing = choosing the SKU
  (8/16/32 vCPU tiers) to match the workload (build/IDE/emulators) and disk size for the codebase.

## Security and IAM
- Authenticate via **Entra ID**; assign **DevCenter Project Admin** / **Dev Box User** roles via RBAC. Boxes are
  **Entra-joined** (or hybrid-joined) and managed by **Intune** for compliance/policy. Use a **managed identity**
  on the dev center for gallery/catalog access; scope **local-admin** carefully and prefer conditional access on
  the dev box portal.

## Cost levers
- Billed by **compute (while running) + storage (always)**. Levers: aggressive **auto-stop/hibernation**, right-size
  the **SKU** per project, cap **per-user dev box limits**, and choose hibernation-capable images so resume is fast
  without paying for idle running.

## Scaling and limits
- Per-region dev box quotas (vCPU), per-user/per-project limits, network-connection caps, and image/definition
  counts. Scale by adding pools/regions; hibernation lets more boxes exist cheaply.

## Operating procedure
1. **Provision** — create the **dev center** via **azurerm** (`azurerm_dev_center`) or `az devcenter admin
   devcenter create`; add a **managed identity**.
2. **Configure** — create the **network connection** (`azurerm_dev_center_network_connection` +
   `azurerm_dev_center_attached_network`), **dev box definition** (`azurerm_dev_center_dev_box_definition`),
   **project** (`azurerm_dev_center_project`), and **pool** (`azurerm_dev_center_project_pool`) with an
   **auto-stop schedule**; set per-user limits.
3. **Secure** — wire **Entra/RBAC** (Project Admin / Dev Box User), Entra/hybrid join, Intune compliance, scope
   local-admin.
4. **Verify** — apply [[verify-by-running]]: confirm the project/pool exist (`az devcenter admin pool list`),
   provision a dev box as a test user (`az devcenter dev dev-box create`), confirm it reaches a running state and
   that the **auto-stop schedule** is attached, then capture the result.

## Inputs
The **dev center**, the **network connection** model (Entra vs hybrid + VNet), the **dev box definitions** (image +
SKU), the **pools** + **schedules**, the **projects** + per-user limits, and the **RBAC** assignments.

## Output
A Dev Box setup: a dev center with network connection(s), sized dev box definitions, pools with auto-stop, projects
with per-user limits, and least-privilege RBAC — plus verification that a developer can self-provision a running
box bound to the schedule.

## Notes
- Gotchas: forgetting **auto-stop** burns compute 24/7; under-sized SKU/disk frustrates builds; **hybrid join**
  requires line-of-sight to a domain controller over the VNet; image patching drift on custom gallery images;
  per-user limits not set lets boxes proliferate; Intune enrollment delays first login. 2nd consumer: the Azure
  role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peer: GCP Cloud Workstations.
- IaC/CLI: Terraform **azurerm** (`azurerm_dev_center`, `azurerm_dev_center_project`,
  `azurerm_dev_center_dev_box_definition`, `azurerm_dev_center_network_connection`,
  `azurerm_dev_center_project_pool`); CLI `az devcenter admin ...` / `az devcenter dev ...`; Bicep
  `Microsoft.DevCenter/*`.
