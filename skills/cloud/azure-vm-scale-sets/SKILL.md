---
name: azure-vm-scale-sets
description: Use when designing, provisioning, securing, or operating Azure Virtual Machine Scale Sets — Microsoft Azure's service for managing and autoscaling a group of identical or mixed VMs (Azure VM Scale Sets). Covers Uniform vs Flexible orchestration, autoscale rules (metric- and schedule-based) with min/max/default instance counts, instance health probes and automatic instance repair, upgrade modes (Manual/Automatic/Rolling) and rolling-upgrade policies, zone redundancy and fault domains, custom/gallery images and cloud-init extensions, Spot priority mix, load balancer/Application Gateway integration, Entra ID/managed identities, and cost. Loads the VMSS knowledge: define the model, set autoscale and upgrade policy, secure, and verify instances scale and stay healthy. Consumed by the azure-vm-scale-sets specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure VM Scale Sets).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-vm-scale-sets, compute, autoscaling, vmss, rolling-upgrades]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Virtual Machine Scale Sets

Microsoft Azure's service for running and **autoscaling a fleet of VMs** from a single model, with
health-based self-repair, controlled upgrades, and zone redundancy — the horizontal-scale layer above
single VMs.

## Core concepts and components
- **Orchestration mode** — **Uniform** (identical instances from one VM model, highest scale, classic
  autoscale) vs **Flexible** (manage heterogeneous instances like standalone VMs, mix sizes/zones, the
  modern default for most workloads).
- **Instance model** — the shared definition (size/SKU, image, OS/data disks, NIC config, extensions,
  cloud-init) instances are created from.
- **Autoscale** — rules driven by **metrics** (CPU, memory via agent, queue depth, custom) or a
  **schedule**, with **min / max / default** capacity and scale-in/out increments and cooldowns.
- **Instance health & repair** — **health probes** (load balancer or application health extension) mark
  instances healthy/unhealthy; **automatic instance repair** deletes-and-recreates unhealthy instances.
- **Upgrade modes** — **Manual**, **Automatic** (all at once), or **Rolling** (batched with a configurable
  **rolling-upgrade policy**: max batch %, max unhealthy %, pause) to roll out a new image/model safely.
- **Resilience & priority** — spread across **availability zones** and **fault domains**; **Spot priority
  mix** blends regular and Spot instances for cost-resilient capacity.

## Configuration and sizing
- Choose **Flexible** unless you specifically need Uniform-only features. Set the **instance model**
  (size, gallery/custom image, extensions). Define **autoscale** min/max/default and rules with cooldowns
  to avoid flapping. Configure a **health probe** and enable **automatic repair**. Set the **upgrade mode**
  (prefer **Rolling** with a tested policy) and zone spread. Decide **Spot priority mix** for cost.

## Security and IAM
- Assign a **managed identity** to instances for Azure access (no embedded secrets) and least-privilege
  **RBAC** on the scale set. Lock down NSGs; front with a **load balancer / Application Gateway** rather
  than per-instance public IPs. Enable **disk encryption** / encryption-at-host. Store secrets in **Key
  Vault**; deliver via extensions. Apply Defender for Servers.

## Cost levers
- Billed as the **sum of running instances** + disks + data. Levers: scale **min** as low as the SLA
  allows and let autoscale handle peaks; use **Spot priority mix** for interruptible capacity; **Reserved
  Instances / Savings Plans** for the steady-state floor; right-size the instance SKU; **schedule-based**
  scale-down off-hours; use ephemeral OS disks for stateless instances.

## Scaling and limits
- Uniform supports very large instance counts; **Flexible** is capped lower per scale set (check current
  limits). Per-family **vCPU quota per region/subscription** gates total capacity. Autoscale honors
  cooldowns; aggressive rules cause flapping. Rolling upgrades are bounded by the **max-unhealthy** policy,
  which can stall a rollout if instances fail health checks.

## Operating procedure
1. **Provision** — create the scale set with its **instance model** (size, image, NICs), **orchestration
   mode**, and zone spread via Terraform `azurerm_linux_virtual_machine_scale_set` /
   `azurerm_orchestrated_virtual_machine_scale_set` (Flexible) (or Bicep/`az vmss create`).
2. **Configure** — set **autoscale** (`azurerm_monitor_autoscale_setting` / `az monitor autoscale`) with
   min/max/default and rules, attach a **health probe**, enable **automatic repair**, and set the
   **upgrade mode** + rolling policy.
3. **Secure** — assign a **managed identity** and least-privilege RBAC, lock down NSGs, front with a load
   balancer, enable **disk encryption**, and store secrets in Key Vault.
4. **Verify** — apply [[verify-by-running]]: confirm the scale set and instances are provisioned and
   healthy (`az vmss list-instances`, `az vmss get-instance-view`), then **trigger scale** (drive the
   metric or `az vmss scale`) and confirm instance count changes and health probes pass; roll a model
   update and confirm the **rolling upgrade** completes. Capture instance counts and health/upgrade state.

## Inputs
The workload and instance model (size/image/extensions), orchestration mode (Flexible vs Uniform), the
autoscale targets (min/max/default, metrics/schedule), the health-probe and repair settings, the upgrade
mode/policy, zone/Spot strategy, networking, the region, and identity/encryption requirements.

## Output
An Azure VM Scale Set: a model-driven fleet in the chosen orchestration mode with autoscale rules, health
probes and automatic repair, a rolling-upgrade policy, and zone/Spot resilience — secured by managed
identity, RBAC, NSGs, and disk encryption — plus verification that instances scale and stay healthy.

## Notes
- Gotchas: **Flexible** is now the recommended mode but has lower per-set instance caps and some
  Uniform-only features differ — pick deliberately; **autoscale flapping** comes from missing cooldowns/
  hysteresis; memory metrics require the **monitoring agent**; a too-strict **max-unhealthy** rolling
  policy stalls rollouts; instances are **cattle** — never store state on instance disks; per-family
  **vCPU quota** caps total capacity. This owns the **autoscaling fleet** — for single-VM IaaS details
  (sizes, disks, images) cross-ref **azure-virtual-machines**. 2nd consumer: the Azure role team
  (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS EC2 Auto Scaling, GCP Managed
  Instance Groups.
- IaC/CLI: Terraform `azurerm_linux_virtual_machine_scale_set` /
  `azurerm_orchestrated_virtual_machine_scale_set` + `azurerm_monitor_autoscale_setting`; Bicep/ARM
  `Microsoft.Compute/virtualMachineScaleSets`. CLI `az vmss create` / `az vmss scale` /
  `az vmss list-instances` / `az vmss get-instance-view`; verify by triggering scale and checking health.
