---
name: azure-stack-edge
description: Use when designing, provisioning, configuring, or operating Azure Stack Edge — Azure's managed, Microsoft-supplied edge appliance (ordered through Azure) that brings compute, storage, networking, and hardware-accelerated AI (GPU/FPGA/VPU) to an on-premises or remote site and ships data to Azure (Azure Stack Edge). Covers ordering and Arc-managed device lifecycle, the Pro-GPU/Pro-R/Mini-R SKUs, local edge compute (IoT Edge modules, VMs, AKS) and edge AI inference, local SMB/NFS shares with cloud tiering, network/bandwidth and data-transfer/upload to Azure Storage, and Edge Storage Accounts. Loads the knowledge to order/activate a device, configure edge compute + shares, secure it, and verify edge workloads run and data lands in Azure. Consumed by the azure-stack-edge specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-stack-edge, hybrid, edge, edge-ai]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Stack Edge

**Azure Stack Edge** is a **managed, Microsoft-supplied edge appliance** ordered through the Azure portal that brings
**compute, storage, networking, and hardware-accelerated AI** (GPU/FPGA/VPU) to an on-prem or remote site, runs
local workloads, and **transfers data to Azure**. This skill owns the **single-service Azure Stack Edge layer**:
ordering/lifecycle, edge compute, local shares + tiering, and data transfer.

## Core concepts and components
- **Managed appliance + lifecycle** — you **order** the device as an Azure resource; it arrives, you **activate** it
  against the resource, and Microsoft owns the hardware/firmware. The device object is managed (and Arc-integrable)
  from Azure.
- **SKUs** — **Pro-GPU** (rack, NVIDIA GPU for inference/heavy edge), **Pro-R** (ruggedized for harsh/field sites),
  and **Mini-R** (portable/ruggedized, smallest footprint). Choose by environment + accelerator need.
- **Edge compute** — run **IoT Edge modules**, **VMs**, and **AKS/Kubernetes** locally; the GPU/FPGA accelerates
  **edge AI inference** (vision/ML) close to data.
- **Local shares + cloud tiering** — expose **SMB/NFS** shares locally; data written can **tier/upload to Azure
  Storage** automatically (Edge cloud shares), giving local-fast access with cloud durability.
- **Edge Storage Accounts** — present an Azure-Storage-compatible **blob** endpoint locally so apps write blobs at
  the edge that sync to a cloud storage account.
- **Networking + data transfer** — configure device **network interfaces**, bandwidth schedules, and the
  **upload/transfer** pipeline to Azure Storage (for offline-tolerant, bandwidth-aware sync).

## Configuration and sizing
- Pick the **SKU** by site environment + accelerator need and by **local compute/storage** required; order, install,
  and **activate** the device against its Azure resource. Configure **network interfaces** + bandwidth schedules,
  create **local shares / Edge Storage Accounts** with the target cloud storage account, and deploy **edge compute**
  (IoT Edge/VM/AKS) workloads.

## Security and IAM
- Authenticate the device's Azure resource via **Entra ID** + **RBAC**; use the **activation key** once and protect
  the device **local admin** + web UI credentials. Encrypt local data **at rest**, use **TLS** for shares/endpoints,
  scope the linked **Storage account** access (keys/SAS/managed identity), and integrate with **Arc** for governed
  management. Keep firmware updated via the managed update flow.

## Cost levers
- Billed as a **monthly device subscription** per SKU plus consumed Azure services (Storage for tiered/uploaded data,
  egress where applicable, AKS/IoT). Levers: pick the **smallest SKU** that fits, use **bandwidth schedules** to
  control transfer windows, tier cold data to cheaper Storage, and avoid stranded local capacity.

## Scaling and limits
- Each device is a **fixed-capacity appliance** (per-SKU CPU/RAM/GPU/storage caps); scale out by **ordering more
  devices**, not by resizing one. Limits: per-SKU compute/storage ceilings, accelerator type fixed per SKU, and
  transfer throughput bounded by **site bandwidth** and the configured schedule.

## Operating procedure
1. **Order/activate** — order the chosen **SKU** as an Azure **Data Box Edge / Stack Edge** resource (largely
   **portal/ARM**-driven; Terraform **azurerm** `azurerm_databox_edge_device` provisions the device resource), then
   **activate** the physical device against it with the activation key.
2. **Configure** — set **network interfaces** + bandwidth schedules, create **local SMB/NFS shares** and/or **Edge
   Storage Accounts** bound to a cloud **Storage account**, and deploy **edge compute** (IoT Edge modules / VM / AKS)
   including any **GPU inference** workload.
3. **Secure** — Entra **RBAC** on the device resource, protect activation/local-admin creds, **encryption at rest**
   + TLS, scope the linked Storage account, and connect to **Arc** for governance.
4. **Verify** — apply [[verify-by-running]]: confirm the device shows **activated/healthy** in Azure, write to a
   **local share / Edge Storage Account** and confirm the blob/file **uploads/tiers to Azure Storage**, run an
   **edge compute / GPU inference** workload and confirm output, and capture device + transfer status.

## Inputs
The site **environment** (rack/rugged/portable) and **accelerator** need (drives SKU), local **compute/storage**
required, the **network**/bandwidth plan, the target **Storage account** for shares/upload, and the **edge
workloads** (IoT Edge/VM/AKS/inference).

## Output
An Azure Stack Edge deployment: an ordered + activated device on the right SKU, configured network + local shares /
Edge Storage Accounts bound to cloud Storage, deployed edge compute/GPU workloads, RBAC + encryption + Arc — plus
verification that the device is healthy, data lands in Azure Storage, and an edge workload runs.

## Notes
- Gotchas: the **SKU is fixed** — you scale by ordering more devices, not resizing; **ordering/activation** has lead
  time and the activation key is single-use; the **accelerator** (GPU/FPGA) is SKU-bound — pick correctly up front;
  unmanaged **bandwidth** saturates the site link (use schedules); much of provisioning/activation is
  **portal/ARM-driven** (azurerm `azurerm_databox_edge_device` covers the device resource, not full config). For pure
  Arc onboarding of arbitrary servers defer to the azure-arc skill; this skill owns the **edge appliance** itself.
  2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peer: AWS
  Snowball Edge.
- IaC/CLI: Terraform **azurerm** (`azurerm_databox_edge_device`, `azurerm_databox_edge_order`); CLI
  `az databoxedge ...`; Bicep/ARM `Microsoft.DataBoxEdge/dataBoxEdgeDevices`. Share/compute/storage-account config is
  largely portal/REST-driven.
