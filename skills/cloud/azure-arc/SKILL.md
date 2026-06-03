---
name: azure-arc
description: Use when designing, onboarding, configuring, or operating Azure Arc — the control plane that projects servers, Kubernetes clusters, and data services running on-prem or in other clouds into Azure for unified management, policy, and monitoring (Azure Arc). Covers Arc-enabled servers (Connected Machine agent), Arc-enabled Kubernetes (cluster connect + GitOps/Flux config), Arc-enabled data services / SQL, extensions, Azure Policy and Machine Configuration at scale, and RBAC across hybrid estates. Loads the knowledge to onboard resources, project them as Azure resources, govern with policy, and verify connectivity. Consumed by the azure-arc specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect / azure-iac-engineer) when operating the managed service (Azure Arc).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-arc, management-governance, hybrid, multicloud]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Arc

**Azure Arc** is the **control plane** that projects resources running **anywhere** — on-prem, at the edge, or in
other clouds — into Azure so they can be managed, governed, and monitored with the same tools as native Azure
resources. This skill owns the **single-service Arc layer** — onboarding servers/Kubernetes/data services,
extensions, and policy at scale — for one estate or subscription.

## Core concepts and components
- **Arc-enabled servers** — install the **Connected Machine agent** (`azcmagent`) on a Windows/Linux machine; it
  appears as a `Microsoft.HybridCompute/machines` resource and can receive **extensions** (Monitor Agent, Defender,
  Machine Configuration, Custom Script).
- **Arc-enabled Kubernetes** — **cluster connect** any CNCF-conformant cluster as
  `Microsoft.Kubernetes/connectedClusters`; manage workloads via **GitOps (Flux v2) configurations** and run
  cluster extensions (Monitor, Defender, Open Service Mesh, etc.).
- **Arc-enabled data services / SQL** — run **SQL Managed Instance / PostgreSQL** on Arc Kubernetes, and project
  **SQL Server** instances for inventory, assessment, and licensing.
- **Control plane & governance** — once projected, apply **Azure Policy** + **Machine Configuration** (guest
  config), **RBAC**, **tags**, **Monitor**, and **Defender for Cloud** uniformly across the hybrid estate.

## Configuration and sizing
- Onboard machines (agent + service principal / managed onboarding), connect clusters (`az connectedk8s connect`),
  assign them to a **resource group/region** for projection, deploy needed **extensions**, and attach **policy
  initiatives** at scale via management groups. Sizing is about agent footprint + extension load, not instances.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Azure Connected Machine Onboarding / Resource Administrator**,
  **Kubernetes Cluster - Azure Arc Onboarding**. Onboarding uses a scoped **service principal** or device-code;
  the agent then authenticates as a **system-assigned managed identity** — grant it least privilege. Lock down
  outbound endpoints (or use **Arc gateway / private link**), and govern at scale with **Policy**.

## Cost levers
- The Arc **control plane is free** for servers/Kubernetes connectivity; you pay for **add-on services** consumed
  (Monitor ingestion, Defender for Servers/SQL plans, Arc data services vCores, Machine Config). Levers: enable
  only the Defender/Monitor plans you need, filter Monitor ingest, and scope data-services capacity.

## Scaling and limits
- Scales to thousands of machines/clusters; governed by **agent connectivity** (heartbeat — disconnected machines
  go **Expired**), per-region resource limits, extension compatibility per OS/distro, and required **outbound
  endpoints/firewall** rules. GitOps/Flux config and policy assignment scale via management groups.

## Operating procedure
1. **Provision/onboard** — install the Connected Machine agent (`azcmagent connect`) or
   Terraform/Bicep onboarding; connect clusters with `az connectedk8s connect`
   (`azurerm_arc_kubernetes_cluster` / `azurerm_arc_machine` where supported).
2. **Configure** — deploy **extensions** (`azurerm_arc_kubernetes_cluster_extension` /
   `azurerm_arc_machine_extension`), wire **GitOps/Flux** configurations, and assign **policy initiatives** +
   **Machine Configuration** across management groups.
3. **Secure** — scope **onboarding RBAC**, give the agent's **managed identity** least privilege, restrict
   outbound endpoints (Arc gateway / private link), and enable **Defender** plans selectively.
4. **Verify** — apply [[verify-by-running]]: confirm the resource is **Connected** (`az connectedmachine show` /
   `az connectedk8s show` status, or `azcmagent show`), confirm an extension provisioned, and confirm a policy
   evaluates. Capture state and result.

## Inputs
The **machines/clusters/data services** to onboard, the target **resource group/region**, the **onboarding
identity** model, the **extensions** + **GitOps** configs to deploy, the **policy initiatives** to apply, and the
network/endpoint constraints.

## Output
An Azure Arc setup: servers/Kubernetes/data services projected as Azure resources, extensions deployed, GitOps
configurations applied, policy + Machine Configuration governing the estate at scale, scoped onboarding RBAC and
managed-identity access — plus verification that resources report **Connected** and an extension/policy is healthy.

## Notes
- Gotchas: machines that lose heartbeat go **Expired** (agent connectivity + outbound endpoints are critical);
  **extension/OS-distro** compatibility varies; cluster connect needs the right K8s version + outbound access;
  onboarding service principals are **secrets** with limited scope; Arc data services run on **your** Kubernetes
  capacity. 2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect /
  azure-iac-engineer). Cross-cloud peers: AWS Systems Manager (hybrid managed instances), GCP Anthos / Connect.
- IaC/CLI: Terraform `azurerm_arc_machine`, `azurerm_arc_machine_extension`, `azurerm_arc_kubernetes_cluster`,
  `azurerm_arc_kubernetes_cluster_extension`, `azurerm_arc_kubernetes_flux_configuration`; Bicep/ARM
  `Microsoft.HybridCompute/machines`, `Microsoft.Kubernetes/connectedClusters`. CLI `az connectedmachine ...`,
  `az connectedk8s ...`, `azcmagent`.