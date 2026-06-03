---
name: gcp-compute-engine
description: Use when designing, provisioning, securing, or operating Compute Engine — Google Cloud's IaaS virtual machines: machine families/types (E2/N2/N4/C3 general, C2/H3 compute, M memory, A/G accelerator) + custom machine types, images + boot/persistent/local-SSD disks + snapshots, managed instance groups (MIGs) with instance templates + autoscaling + autohealing + rolling updates (regional/zonal), Spot/preemptible VMs, sole-tenant nodes, the VM service account + scopes + OS Login + metadata/startup scripts, and live migration/maintenance. Loads the Compute Engine knowledge: pick a machine type, provision a VM or a MIG from a template, attach disks, scope IAM/firewall, set autoscaling, and verify the instance is RUNNING + reachable. Consumed by the Compute Engine specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they provision VMs (Compute Engine).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, compute-engine, iaas, virtual-machines, managed-instance-groups, spot, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Compute Engine

Google Cloud's **IaaS virtual machines**. You provision VMs (or scale them with managed instance groups),
attach disks, place them on a network, and run anything — full control over OS, runtime, and capacity.

## Core concepts and components
- **Machine families / types** — **general-purpose** (E2, N2, N4, C3/C4), **compute-optimized** (C2, H3),
  **memory-optimized** (M-series), **accelerator** (A/G with GPUs/TPUs), plus **custom machine types**
  (pick exact vCPU/RAM). Each type sets vCPU, memory, and network/egress caps.
- **Images + disks** — boot from a public/custom **image**; **persistent disks** (balanced/SSD/standard,
  zonal or **regional** replicated), **Hyperdisk**, ephemeral **local SSD**, and **snapshots** for backup.
- **Managed instance groups (MIGs)** — from an **instance template**: **autoscaling** (CPU / LB / custom
  metric), **autohealing** (health-check restart), **rolling updates** + canary, and **regional** (spread
  across zones) vs **zonal**; pair with a load balancer.
- **Provisioning models** — **standard** (on-demand) vs **Spot/preemptible** (cheap, can be reclaimed) vs
  **sole-tenant nodes** (dedicated physical host for licensing/compliance).
- **Identity + access** — each VM runs as a **service account** with **scopes**; **OS Login** for SSH via
  IAM; **metadata server** + **startup/shutdown scripts** for bootstrapping.
- **Maintenance** — **live migration** (default) or terminate on host maintenance; **Shielded VM** options
  (secure boot, vTPM) harden the instance.

## Configuration and sizing
- Pick a **machine family/type** (or custom) for the workload (general vs compute vs memory vs GPU), size
  **disks** (type + size = IOPS/throughput), choose **provisioning model** (Spot for fault-tolerant/batch,
  sole-tenant for licensing), and decide **single VM vs MIG** (MIG for HA + autoscaling). Region/zone and
  network/subnet placement matter for latency and quota.

## Security and IAM
- Provisioners need `roles/compute.instanceAdmin.v1`; the VM uses its **service account** — scope it
  least-privilege and prefer **OS Login** + IAM over project SSH keys. Use **firewall rules** / tags to
  restrict ingress, **Shielded VM** for boot integrity, private IPs + Cloud NAT (no public IP), disk
  encryption (Google-managed or CMEK), and Cloud Audit Logs.

## Cost levers
- Billed per **vCPU + memory second** by machine type while running (stopped VMs still bill disks). Levers:
  **Spot VMs** (up to ~60–91% off, reclaimable), **committed-use discounts** + sustained-use discounts,
  **custom machine types** to avoid overprovisioning, **autoscaling MIGs** to match demand, right-size
  disks, delete unattached disks/snapshots, and **stop** idle VMs.

## Scaling and limits
- **MIG autoscaling** scales instance count on CPU/LB/metric; single VMs don't autoscale. Watch regional
  **CPU/GPU quotas**, per-VM disk/IP limits, Spot reclamation (handle preemption), and that resizing a
  VM's machine type requires a stop/start.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable compute.googleapis.com`), pick a **machine
   type** + **image** + **disks**, and create a **VM** (`gcloud compute instances create`) or an
   **instance template** + **MIG** (Terraform `google_compute_instance` /
   `google_compute_instance_template` + `google_compute_region_instance_group_manager`,
   `google_project_service`).
2. **Configure** — attach/size disks, set the **service account** + scopes, startup script/metadata, OS
   Login; for a MIG set **autoscaling**, **autohealing** health check, and rolling-update policy; pick
   Spot/sole-tenant where appropriate.
3. **Secure** — least-privilege the VM SA, OS Login, **firewall rules**/tags, private IP + Cloud NAT,
   Shielded VM, CMEK/encryption.
4. **Verify** — apply [[verify-by-running]]: confirm the instance(s) reach **RUNNING**
   (`gcloud compute instances list`), SSH/connect works (`gcloud compute ssh`), the app/port is reachable
   through the firewall, and for a **MIG** that autohealing/autoscaling and a rolling update converge
   (`gcloud compute instance-groups managed list-instances`). Capture instance status and the reachability
   check.

## Inputs
Machine family/type (or custom) + sizing, image + disk specs, single-VM-vs-MIG choice, provisioning model
(standard/Spot/sole-tenant), network/subnet + firewall, service account + OS Login, startup scripts,
autoscaling/autohealing policy (MIG), region/zone, and IAM scope.

## Output
A Compute Engine deployment (VM or instance template + MIG with machine type, disks, network/firewall,
scoped SA, OS Login, Shielded VM, autoscaling/autohealing for MIGs) plus verification that instances are
RUNNING and reachable.

## Notes
- Gotchas: **stopped VMs still bill attached disks**; **Spot VMs get reclaimed** — only for fault-tolerant
  work + handle preemption; **changing machine type needs stop/start**; project-wide SSH keys are a footgun
  — use **OS Login**; pick **regional** disks/MIGs for zone-failure resilience; sole-tenant for BYOL
  licensing. Pick **Compute Engine** (full VM control) vs **GKE** (Kubernetes) vs **Cloud Run/App Engine**
  (serverless/PaaS); harden with **Shielded VM** (see gcp-shielded-vms). AWS analog is EC2; Azure is Virtual
  Machines.
- IaC/CLI: Terraform `google_compute_instance`, `google_compute_instance_template`,
  `google_compute_region_instance_group_manager` + `google_compute_autoscaler`, `google_compute_disk`,
  `google_compute_firewall`, `google_project_service`. CLI `gcloud compute instances create / list / ssh`,
  `gcloud compute instance-templates create`, `gcloud compute instance-groups managed create`.
