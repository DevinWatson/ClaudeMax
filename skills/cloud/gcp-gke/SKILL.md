---
name: gcp-gke
description: Use when designing, provisioning, securing, or operating Google Kubernetes Engine (GKE) — Google Cloud's managed Kubernetes: the Standard (you manage node pools) vs Autopilot (Google manages nodes/capacity, pay-per-pod) modes, cluster topology (zonal vs regional control plane, public vs private clusters), node pools (machine type, autoscaling, spot, surge upgrades, node auto-provisioning), release channels + cluster/node version upgrades, Workload Identity (map K8s SAs to Google SAs), GKE networking (VPC-native/alias IPs, GKE Ingress + Gateway API, network policy, Dataplane V2/Cilium), and the GKE add-ons. Loads the GKE knowledge: provision a cluster + node pools (or Autopilot), wire Workload Identity + networking, manage upgrades, and verify nodes/workloads are Ready. Consumed by the GKE specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they provision the managed Kubernetes layer (GKE).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, gke, kubernetes, autopilot, node-pools, workload-identity, application-hosting]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Google Kubernetes Engine (GKE)

Google Cloud's **managed Kubernetes**. Google runs the control plane; you provision clusters and (in
Standard mode) node pools, then deploy standard Kubernetes workloads. This skill owns the **GCP-side
managed-GKE layer** — cluster/node provisioning, upgrades, Workload Identity, and GKE networking — not
distribution-agnostic in-cluster ops (RBAC, app manifests, Helm), which belong to the Kubernetes
platform team.

## Core concepts and components
- **Modes**:
  - **Standard** — you create and manage **node pools** (machine type, count, autoscaling, disks); pay
    per node + control-plane fee; full node control (DaemonSets, privileged, custom kernels).
  - **Autopilot** — Google manages nodes/capacity; you **pay per pod** (vCPU/memory/storage requested);
    hardened defaults, no node management; constrained (no DaemonSets touching host, limits on
    privileged pods).
- **Cluster topology** — **zonal** (single-zone control plane) vs **regional** (HA control plane across
  zones); **public** vs **private cluster** (nodes have no public IPs; control-plane access via
  authorized networks / private endpoint).
- **Node pools** — groups of identical nodes: **machine type**, **autoscaling** (min/max), **Spot**
  nodes, taints/labels, **surge upgrades**, and **node auto-provisioning** (NAP) to create pools on demand.
- **Upgrades** — **release channels** (Rapid / Regular / Stable) auto-upgrade the control plane + nodes;
  **maintenance windows** + surge settings bound disruption; node pools upgrade independently.
- **Workload Identity** — bind a **Kubernetes service account** to a **Google service account** so pods
  call Google APIs without node keys (the recommended identity model).
- **Networking** — **VPC-native** clusters with **alias IP** ranges for pods/services; **GKE Ingress** +
  **Gateway API**; **network policy** / **Dataplane V2** (eBPF/Cilium); private Google access.

## Configuration and sizing
- Pick **Autopilot** (hands-off, per-pod billing, most workloads) vs **Standard** (need DaemonSets, GPUs/
  TPUs, custom nodes, Spot, fine node control). For Standard, size **node pools** (machine type, disk,
  autoscaling min/max, Spot for fault-tolerant work). Choose **regional** for HA. Plan pod/service CIDRs
  (VPC-native) up front — they're hard to change.

## Security and IAM
- Cluster admin needs `roles/container.admin`; deployers `roles/container.developer`. Use **Workload
  Identity** (never node SA keys), **private clusters** + **authorized networks**, **Shielded GKE nodes**,
  Binary Authorization for image provenance, network policy for pod isolation, Secret Manager / CSI for
  secrets, and Cloud Audit Logs. Least-privilege the node SA.

## Cost levers
- **Autopilot** bills per **pod resource request** (no idle node cost) — right-size requests. **Standard**
  bills per **node** + a per-cluster management fee. Levers: **node autoscaling** + **Spot** nodes for
  fault-tolerant work, cluster autoscaler/NAP to bin-pack, right-size machine types, and committed-use
  discounts; one zonal control plane is free of the management fee in some cases — regional adds HA cost.

## Scaling and limits
- **Cluster autoscaler** scales node pools; **HPA/VPA** scale pods; Autopilot scales nodes invisibly.
  Watch pod/service **CIDR exhaustion** (VPC-native sizing), per-node pod limits, node-pool max sizes,
  control-plane version skew on upgrades, and Autopilot's workload constraints.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable container.googleapis.com`), create the cluster
   **Autopilot** (`gcloud container clusters create-auto`) or **Standard** (`... create` + node pools),
   choosing zonal/regional, private/public, release channel, and VPC-native ranges (Terraform
   `google_container_cluster` / `google_container_node_pool`, `google_project_service`).
2. **Configure** — set node pools (machine type, autoscaling, Spot, surge), enable **Workload Identity**,
   network policy / Dataplane V2, maintenance window, and get credentials
   (`gcloud container clusters get-credentials`).
3. **Secure** — Workload Identity bindings, private cluster + authorized networks, Shielded nodes,
   least-privilege node SA, network policy; defer in-cluster RBAC/policy to the Kubernetes platform team.
4. **Verify** — apply [[verify-by-running]]: confirm the cluster + node pools are healthy
   (`gcloud container clusters describe`, `kubectl get nodes` all **Ready**), Workload Identity works
   (a pod with the bound KSA calls a Google API), and a smoke workload schedules + becomes Ready
   (`kubectl get pods`); on upgrades confirm the control-plane/node versions and that nodes cordoned/
   drained cleanly. Capture node status and the workload Ready state.

## Inputs
Autopilot-vs-Standard choice, zonal/regional + public/private topology, node-pool specs (machine type,
autoscaling, Spot), VPC-native CIDR plan, release channel + maintenance window, Workload Identity
bindings, networking/network-policy needs, and IAM scope.

## Output
A GKE cluster (Autopilot or Standard with node pools), Workload Identity bindings, networking + network
policy, release channel + maintenance window, scoped node SA, plus verification that nodes are Ready,
Workload Identity works, and a smoke workload schedules.

## Notes
- Gotchas: **pod/service CIDRs are sized at creation** (VPC-native) — undersizing blocks scale; **Autopilot
  constrains** DaemonSets/privileged/host access — use Standard for those; **regional** = HA control plane
  but more cost; **release channels auto-upgrade** — set maintenance windows or you'll be surprised; use
  **Workload Identity**, never node SA keys; in-cluster concerns (RBAC, Helm, app manifests, service mesh)
  belong to the Kubernetes platform team — this skill owns the GCP managed-GKE layer. Pick **GKE** for the
  Kubernetes API vs **Cloud Run** (serverless containers) vs **App Engine** (PaaS). AWS analog is EKS;
  Azure is AKS.
- IaC/CLI: Terraform `google_container_cluster`, `google_container_node_pool`,
  `google_service_account` + `google_service_account_iam_member` (Workload Identity),
  `google_project_service`. CLI `gcloud container clusters create / create-auto / get-credentials /
  upgrade`, `gcloud container node-pools create`, `kubectl`.
