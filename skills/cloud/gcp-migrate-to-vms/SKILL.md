---
name: gcp-migrate-to-vms
description: Use when planning or executing a Migrate to Virtual Machines (M4VM) lift-and-shift — Google Cloud's tool for migrating running VMs (VMware/on-prem, AWS, Azure) onto Compute Engine: the source connection + Migrate Connector, migration groups, replication (initial full + incremental delta sync) to keep cutover downtime low, test-clone (validate without touching the source), target VM details (machine type, disks, network, service account, OS adaptation/license), cutover, and rollback. Loads the Migrate to VMs knowledge: connect a source, group + replicate VMs, test-clone, set target details, cut over with minimal downtime, and verify the migrated VM is RUNNING + reachable. Consumed by the Migrate to VMs specialist and by the GCP role team (gcp-cloud-architect / gcp-iac-engineer) when they lift-and-shift VMs to Compute Engine (Migrate to Virtual Machines).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, migrate-to-vms, lift-and-shift, compute-engine, migration, replication, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Migrate to Virtual Machines (M4VM)

Google Cloud's **lift-and-shift** service for migrating running VMs (VMware/on-prem, AWS, Azure) onto
**Compute Engine** with minimal downtime — continuous replication while the source stays live, then a
short cutover. No application changes; the VM moves as-is.

## Core concepts and components
- **Migration source + Migrate Connector** — a connector/appliance deployed in the source environment
  (vCenter, AWS, Azure) that streams disk data to Google Cloud.
- **Migration groups** — group related VMs (e.g. an app tier) so they migrate and cut over together with
  consistent ordering.
- **Replication** — an **initial full sync** of disks then ongoing **incremental delta sync**, so the
  bulk of data is copied while the source runs; only the final delta is applied at cutover (low downtime).
- **Test-clone** — spin up a non-disruptive **clone** on Compute Engine to validate the migrated VM
  (boot, app, network) **without touching the running source**, before committing.
- **Target VM details** — the resulting Compute Engine VM: **machine type**, **disks**, **network/subnet**,
  **service account**, labels, plus **OS adaptation** (install guest agent, drivers) and license handling
  (BYOL vs Google-provided).
- **Cutover + rollback** — finalize the migration (stop source, apply last delta, start the GCE VM); keep
  the source until validated so you can **roll back**.

## Configuration and sizing
- Choose **target machine type + disk types** to match (or right-size) the source (this is the moment to
  rightsize — don't blindly mirror), set **network/subnet + service account**, decide **OS adaptation** /
  license, and group VMs into **migration groups** by app/cutover order. Plan the cutover window around the
  delta-sync size.

## Security and IAM
- The migration needs VM Migration roles (`roles/vmmigration.*`) + the Migrate Connector's source creds;
  the target VM uses its **service account** — scope it least-privilege. Use private networking + firewall,
  **Shielded VM** on the target, disk encryption (CMEK), and Cloud Audit Logs. Protect the connector creds.

## Cost levers
- Migration itself (replication) is low-cost; the **target Compute Engine VMs** drive ongoing cost — so
  **right-size** at cutover (don't 1:1 mirror oversized source VMs), apply **committed-use discounts**, use
  appropriate disk types, and consider **Spot** only for fault-tolerant tiers. Delete the connector +
  finalize migrations after cutover to stop overhead.

## Scaling and limits
- Replication throughput is bounded by source bandwidth + the connector; migrate in **waves/groups**. Watch
  large delta syncs (longer cutover), regional **Compute Engine quotas** for the targets, OS/driver
  compatibility (some OSes need adaptation), and that **test-clones consume target resources** until deleted.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable vmmigration.googleapis.com`), deploy the
   **Migrate Connector** in the source, register the **source**, and scope IAM (VM Migration roles +
   target network/SA).
2. **Group + replicate** — create **migration groups**, start **replication** (initial full + incremental
   delta), and set **target VM details** (machine type, disks, network, SA, OS adaptation/license).
3. **Test-clone + secure** — run a **test-clone** to validate boot/app/network without touching the source;
   apply least-privilege target SA, firewall, Shielded VM, CMEK.
4. **Verify + cut over** — apply [[verify-by-running]]: validate the **test-clone** (it boots, the app runs,
   it's reachable through the firewall — `gcloud compute instances list`, `gcloud compute ssh`), then **cut
   over** and confirm the production target VM reaches **RUNNING** and serves traffic, keeping the source
   for **rollback** until validated. Capture the clone validation and the post-cutover instance status +
   reachability.

## Inputs
The source VM(s) + connector/credentials, migration-group plan + cutover order, target details (machine
type, disks, network/subnet, service account, OS adaptation/license), right-sizing decisions, the cutover
window, and IAM scope.

## Output
Migrated Compute Engine VM(s) (right-sized machine type + disks, network/firewall, scoped SA, Shielded VM)
with a validated test-clone and a low-downtime cutover, plus verification that the target is RUNNING and
reachable and a rollback path until validated.

## Notes
- Gotchas: **right-size at cutover** — don't 1:1 mirror oversized source VMs; always **test-clone** before
  cutover; keep the **source for rollback** until the target is validated; cutover downtime ~ the final
  **delta-sync** size, so sync close to cutover; some OSes need **adaptation/drivers**; this is
  **lift-and-shift** (VM stays a VM) — to modernize a workload into containers use **Migrate to Containers**
  (gcp-migrate-to-containers). The migrated VM is plain Compute Engine — operate it via that skill
  (gcp-compute-engine). AWS analog is the Application Migration Service (MGN); Azure is Azure Migrate.
- IaC/CLI: predominantly a console/`gcloud vmmigration` workflow (the API is `vmmigration.googleapis.com`);
  Terraform support is limited — use `gcloud` for source/group/replication/cutover and Terraform
  (`google_compute_instance`, `google_project_service`) for surrounding target infra.
