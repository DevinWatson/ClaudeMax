---
name: gcp-cloud-workstations
description: Use when designing, provisioning, securing, or operating Cloud Workstations — Google Cloud's managed, secure, cloud-based development environments: workstation cluster (on a VPC), workstation configurations (the template — machine type, boot/persistent disk, container image / custom dev image, idle + running timeouts, service account), individual workstations (the running instances), the IDE access model (browser, JetBrains, local SSH/IDE via gateway), private/VPC-SC networking, and policy controls. Loads the Cloud Workstations knowledge: define a config, launch a workstation, secure access + image, and verify a developer can connect and build. Consumed by the Cloud Workstations specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they standardize managed dev environments (Cloud Workstations).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-workstations, application-development, dev-environment, ide, vpc]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Workstations

Google Cloud's managed, secure, cloud-hosted **development environments**. Platform admins define
**configurations** (templates); developers launch **workstations** (running instances) from them and
connect via a browser IDE, JetBrains, or a local IDE/SSH over a gateway — keeping source and tooling
inside the org's VPC and policy boundary.

## Core concepts and components
- **Workstation cluster** — the regional control plane attached to a **VPC** / subnetwork; can be
  **private** (no public ingress) for VPC-SC / private-only access.
- **Workstation configuration** — the **template**: **machine type**, **boot disk** + **persistent
  home disk** (size + reclaim policy), the **container image** (a Google base image or a **custom dev
  image** with your tools/runtimes pre-baked), **idle timeout** + **running timeout** (auto-stop),
  the workstation **service account**, and env/labels.
- **Workstation** — an individual running instance created from a config, owned by a developer; can be
  started/stopped; the persistent home disk survives stops.
- **Access / IDE** — **browser-based** (Code-OSS), **JetBrains** Gateway, or **local IDE / SSH** via
  the workstations gateway with TLS; access controlled by IAM (`workstations.user`).
- **Networking** — runs on the cluster's VPC; private clusters keep traffic off the public internet.

## Configuration and sizing
- Size the **machine type** to the build/dev workload (CPU/RAM; GPU options for ML), the **home disk**
  to the codebase + caches, and set **idle/running timeouts** to auto-stop and control cost. Bake tools
  into a **custom container image** for fast, reproducible onboarding. Pick the region close to
  developers and pin the cluster to the corp VPC.

## Security and IAM
- Admins manage configs with `roles/workstations.admin`; developers get `roles/workstations.user` on
  their workstation/config (controls who can create/use/connect). Use a **private cluster** + VPC-SC to
  keep source off the public internet; scope the **workstation service account** least-privilege (it is
  the identity for in-workstation gcloud/API calls); pull base images from Artifact Registry; enable
  audit logging. Persistent disks can be CMEK-encrypted.

## Cost levers
- Billed for the **management** fee per active workstation plus the underlying **Compute** (vCPU/RAM,
  disks) while running. Levers: aggressive **idle timeout** + **running timeout** so idle workstations
  auto-stop, right-size the machine type, keep persistent home disks lean, and stop/delete unused
  workstations. Stopped workstations bill only for the persistent disk.

## Scaling and limits
- Each developer gets their own workstation; scale is per-developer (no shared autoscaling pool).
  Per-project/region quotas bound the number of clusters/configs/workstations and Compute capacity in
  the region (raise via quotas). Startup time depends on image size — slim custom images start faster.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable workstations.googleapis.com`; Terraform
   `google_project_service`), create the **workstation cluster** on the corp **VPC/subnet** (private if
   required), and scope the **workstation service account**.
2. **Configure** — create a **workstation configuration** (`gcloud workstations configs create` or
   Terraform `google_workstations_workstation_config`): machine type, boot + persistent disk, the
   **container image** (custom dev image), **idle/running timeouts**, SA, labels.
3. **Secure** — grant developers `workstations.user`, keep the cluster **private** + VPC-SC, scope the
   workstation SA least-privilege, source images from Artifact Registry, enable audit logs.
4. **Verify** — apply [[verify-by-running]]: create a **workstation** and **start** it
   (`gcloud workstations create / start`), confirm it reaches **`RUNNING`**, then confirm a developer
   can **connect** (browser/SSH) and run the toolchain (e.g. clone + build) inside it — capture the
   running state and a successful in-workstation command.

## Inputs
The dev toolchain/runtimes to bake into the image, machine-type/disk needs, the VPC + private/VPC-SC
requirements, IDE access model, idle/running timeout policy, who needs access, region, and IAM scope.

## Output
A Cloud Workstations setup (cluster on the VPC, a configuration with image + machine + disks +
timeouts + scoped SA, developer IAM) plus verification that a workstation reached `RUNNING` and a
developer connected and ran the toolchain.

## Notes
- Gotchas: forgetting **idle/running timeouts** leaves workstations running and billing Compute; a
  **public** cluster exposes dev environments — prefer **private** + VPC-SC for source-bearing
  environments; a bloated **custom image** slows startup; the **persistent home disk** survives stops
  (state) but the boot disk is reset — put durable state in `/home`; the **workstation SA** is the
  in-workstation identity, scope it. Cloud Workstations is a managed *dev environment*, not a hosting
  runtime (use Cloud Run / GKE / App Engine to run apps). AWS analog is Cloud9 / WorkSpaces; Azure is
  Dev Box / Codespaces.
- IaC/CLI: Terraform `google_workstations_workstation_cluster`, `_workstation_config`, `_workstation`,
  plus `google_project_service`, `google_service_account` + IAM. CLI `gcloud workstations clusters /
  configs / create / start / stop / list / describe`, `gcloud workstations ssh / start-tcp-tunnel`.
