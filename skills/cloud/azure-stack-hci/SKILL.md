---
name: azure-stack-hci
description: Use when designing, provisioning, configuring, or operating Azure Stack HCI (now Azure Local) — Azure's hyperconverged infrastructure (HCI) operating system that runs a validated on-premises cluster of nodes, Arc-connected back to Azure for management, billing, and updates (Azure Stack HCI). Covers the validated-node cluster, Storage Spaces Direct (S2D) software-defined storage, Hyper-V compute and SDN, Azure Arc registration + cluster lifecycle, AKS on Azure Stack HCI for containers, Azure Arc-enabled VMs/services on the cluster, cluster networking/witness, and update orchestration. Loads the knowledge to register and configure a cluster, lay out S2D storage and networking, secure it, and verify the cluster is Arc-connected and healthy. Consumed by the azure-stack-hci specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-stack-hci, hybrid, hyperconverged, arc]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Stack HCI

**Azure Stack HCI** (rebranded **Azure Local**) is Azure's **hyperconverged infrastructure** OS: a validated
on-premises **cluster of nodes** that pools compute (Hyper-V), software-defined storage (S2D), and networking, and is
**Azure Arc-connected** back to the cloud for management, billing, monitoring, and updates. This skill owns the
**single-service Azure Stack HCI layer**: the cluster, S2D, SDN, Arc registration, AKS on HCI, and lifecycle.

## Core concepts and components
- **Validated-node cluster** — 1-to-16 **validated hardware** nodes running the Azure Stack HCI OS, clustered for
  high availability. Hardware must be on the **validated catalog** (or an integrated system).
- **Storage Spaces Direct (S2D)** — pools the local NVMe/SSD/HDD across nodes into a **software-defined storage**
  fabric with cache + resiliency (mirror/parity); the basis for HA VM/container storage.
- **Hyper-V compute + SDN** — runs **Hyper-V** VMs and **Software-Defined Networking** (logical networks, network
  controller, micro-segmentation) on the cluster.
- **Azure Arc registration** — the cluster **registers with Azure** via Arc; this is mandatory for licensing/billing
  and unlocks **Arc-enabled VMs/AKS/services**, monitoring, and cloud-driven management. Disconnection beyond the
  grace window stops some operations.
- **AKS on Azure Stack HCI** — run **Kubernetes** (AKS) on the cluster for on-prem containers, managed via Arc.
- **Cluster networking + witness** — host/management/storage/compute networks (often RDMA for storage), plus a
  **cloud or file-share witness** for quorum.
- **Update orchestration** — cluster-aware **lifecycle/solution updates** (OS + drivers/firmware via the solution),
  orchestrated from Azure.

## Configuration and sizing
- Size by **node count**, per-node **CPU/RAM**, and **S2D capacity/resiliency** (mirror needs ~2-3x raw; parity is
  denser but slower). Plan **networking** (separate storage/RDMA from management/compute) and a **quorum witness**.
  Register with **Arc** during/after deployment; pick **AKS on HCI** if running containers.

## Security and IAM
- Authenticate cluster management via **Entra ID** + Azure **RBAC** through Arc; use **managed identity** for the
  Arc connection. Harden with **Secured-core** (TPM/Secure Boot/HVCI) on validated hardware, **BitLocker** on
  volumes, **micro-segmentation** via SDN, and least-privilege local admin. Keep the Arc connection healthy (cert
  rotation) and store secrets in **Key Vault**.

## Cost levers
- Billed as a **per-core monthly Azure subscription** for the HCI host plus any consumed Azure services (Arc, AKS,
  backup, monitoring). Levers: right-size **node count/cores**, choose **parity** over mirror where IOPS allow for
  density, and avoid stranded capacity by matching VM/AKS density to the pool.

## Scaling and limits
- Scale by **adding validated nodes** (up to the supported max, typically 16) to grow compute + S2D capacity.
  Limits: hardware must stay on the **validated catalog**, S2D resiliency dictates usable vs raw capacity, and the
  **Arc** connection has a disconnection **grace period** before operations are restricted.

## Operating procedure
1. **Provision/register** — deploy the Azure Stack HCI OS on **validated nodes**, form the **cluster**, and
   **register with Arc** via Terraform **azurerm** (`azurerm_stack_hci_cluster`) / `az stack-hci cluster create` (the
   OS deploy + S2D itself is largely portal/PowerShell/ARM-driven).
2. **Configure** — lay out **S2D** (pool + volumes + resiliency), **cluster networking** (storage/RDMA vs
   management/compute) and a **witness**, then enable **Arc-enabled VMs** / **AKS on HCI** as needed.
3. **Secure** — Entra **RBAC** via Arc + **managed identity**, **Secured-core**/BitLocker/HVCI, SDN
   **micro-segmentation**, and keep the **Arc** connection + certs healthy.
4. **Verify** — apply [[verify-by-running]]: confirm the cluster is **Arc-connected and healthy** (`az stack-hci
   cluster show` / portal status), check **S2D** volumes are healthy and the **witness** holds quorum, deploy a
   test **VM or AKS workload**, and capture cluster + storage health output.

## Inputs
The **validated hardware** + node count, the **S2D** capacity/resiliency plan, the **network** topology + witness,
the **Arc** registration details (subscription/resource group/identity), and whether **AKS on HCI** is in scope.

## Output
An Azure Stack HCI deployment: a healthy validated-node cluster with S2D storage, SDN networking + witness,
registered and connected to **Arc** with RBAC, optional AKS on HCI — plus verification that the cluster is
Arc-connected/healthy, S2D is healthy, quorum holds, and a test workload runs.

## Notes
- Gotchas: hardware **not on the validated catalog** is unsupported; the **Arc** connection is mandatory — drifting
  past the disconnection **grace period** restricts operations; mixing storage and management traffic (no RDMA
  separation) cripples S2D performance; **mirror vs parity** resiliency trades capacity for IOPS; OS deploy/S2D is
  largely **portal/PowerShell/ARM** (azurerm mostly registers/manages the Arc cluster object). For pure Arc
  onboarding of arbitrary servers/k8s defer to the azure-arc skill — this skill owns the HCI **cluster** itself.
  2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peers: AWS
  Outposts, GCP Anthos / GDC.
- IaC/CLI: Terraform **azurerm** (`azurerm_stack_hci_cluster`, `azurerm_stack_hci_logical_network`,
  `azurerm_stack_hci_virtual_machine_instance` where available); CLI `az stack-hci ...`; Bicep/ARM
  `Microsoft.AzureStackHCI/clusters`. Much of deploy/S2D/SDN is PowerShell/portal-driven.
