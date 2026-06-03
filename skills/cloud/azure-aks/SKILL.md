---
name: azure-aks
description: Use when designing, provisioning, securing, or operating Azure Kubernetes Service — Azure's managed Kubernetes control plane and node pools (Azure Kubernetes Service (AKS)). Covers the managed control plane, system vs user node pools, the cluster/node autoscaler, VM sizes and spot node pools, Azure CNI vs kubenet networking and CNI Overlay, Microsoft Entra integration and Azure RBAC for Kubernetes, Workload Identity (federated pod identity), the AKS Automatic / managed add-on experience, cluster and node-image upgrades, and integration with ACR/Key Vault/Azure Monitor. Loads the knowledge: size the cluster and node pools, choose networking and identity, provision, secure, and verify the API server and nodes are healthy. Consumed by the azure-aks specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Kubernetes Service (AKS)).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-aks, containers, kubernetes, node-pools, workload-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Kubernetes Service (AKS)

Azure's **managed Kubernetes**: Azure runs the control plane (API server, etcd, scheduler) while you own
the **node pools** of VMs and the cluster configuration. This skill is the **Azure managed-AKS layer** —
cluster provisioning, node pools, upgrades, networking, and identity — not cluster-internal application
operations.

## Core concepts and components
- **Managed control plane** — Azure-operated and free for the standard tier (paid uptime SLA via the
  Standard/Premium tier); you do not patch or scale the masters.
- **Node pools** — **system** node pools (host critical add-ons) and **user** node pools (your workloads),
  each a VM Scale Set with its own SKU, count, zones, taints/labels. **Spot node pools** for interruptible
  batch.
- **Cluster autoscaler** — scales node count per pool within min/max; pair with HPA/KEDA for pod scaling.
- **Networking** — **Azure CNI** (pods get VNet IPs), **Azure CNI Overlay** (pods on an overlay, conserves
  VNet IPs), or legacy **kubenet**; choose a network policy (Azure/Calico/Cilium) and load balancer.
- **Identity** — **Microsoft Entra integration** + **Azure RBAC for Kubernetes** for who can do what;
  **Workload Identity** (OIDC federation) gives pods Entra-backed access to Azure resources without secrets.
- **AKS Automatic** — an opinionated managed mode that picks node pools, scaling, networking, and security
  defaults for you (vs the configurable Standard mode).
- **Upgrades** — control-plane and node-image upgrades (auto-upgrade channels) keep the cluster on
  supported Kubernetes versions.

## Configuration and sizing
- Pick **node SKUs** per pool to fit pod CPU/RAM (separate system vs user pools), set **autoscaler**
  min/max and **zones** for HA. Choose **Azure CNI Overlay** unless you need direct VNet pod IPs. Decide
  **AKS Automatic** vs Standard. Set an **auto-upgrade channel** and maintenance window. Wire **ACR** for
  images and **Azure Monitor / Managed Prometheus** for telemetry.

## Security and IAM
- Enable **Entra integration + Azure RBAC for Kubernetes**, disable local accounts, and use **Workload
  Identity** for pod-to-Azure access (no stored secrets). Use a **managed identity** for the cluster.
  Restrict the API server (authorized IP ranges or **private cluster**). Pull from **ACR** via the
  cluster identity. Apply Azure Policy for AKS (Gatekeeper) and Defender for Containers. Store secrets in
  **Key Vault** via the CSI Secrets Store driver.

## Cost levers
- Pay for **node VMs + disks + LB/egress** (control plane free; uptime SLA billed on Standard tier).
  Levers: **autoscaler** to scale to demand, **spot node pools** for interruptible work, right-size node
  SKUs, **Reserved Instances/Savings Plans** for steady pools, scale system pools small, and use the
  **Stop** feature for non-prod clusters to halt node billing.

## Scaling and limits
- Scale nodes via the **cluster autoscaler** per pool (min/max) and pods via **HPA/KEDA**. Limits: max
  nodes per pool/cluster, max pods per node (CNI-mode dependent), per-region VM quota per family,
  Kubernetes version support window (upgrade before EOL). Spot pools can be evicted.

## Operating procedure
1. **Provision** — create the cluster with a **system node pool**, networking (CNI Overlay), Entra
   integration, and a managed identity via Terraform `azurerm_kubernetes_cluster` (+
   `azurerm_kubernetes_cluster_node_pool` for user pools) (or Bicep
   `Microsoft.ContainerService/managedClusters`, or `az aks create`).
2. **Configure** — add **user/spot node pools**, set the **autoscaler** and zones, attach **ACR**, set the
   **auto-upgrade channel** and maintenance window, and enable monitoring.
3. **Secure** — enable **Azure RBAC for Kubernetes**, disable local accounts, configure **Workload
   Identity** (OIDC issuer + federated credentials), restrict the API server (authorized ranges/private),
   and apply Azure Policy/Defender.
4. **Verify** — apply [[verify-by-running]]: get credentials (`az aks get-credentials`), confirm the
   cluster `provisioningState` `Succeeded` and `powerState` `Running` (`az aks show`), then `kubectl get
   nodes` shows all nodes `Ready` and `kubectl get pods -A` shows system pods running. Capture node/pod
   status.

## Inputs
The workload profile (pod CPU/RAM, GPU?), node-pool layout (system/user/spot, SKUs, min/max, zones), the
networking model (CNI Overlay vs CNI vs kubenet) and network policy, identity needs (Entra RBAC, Workload
Identity), Standard vs Automatic, ACR/Key Vault/monitoring integration, the Kubernetes version + upgrade
channel, and the region.

## Output
An AKS setup: a managed cluster with sized system/user/spot node pools, autoscaler and zones, chosen CNI
networking, Entra + Azure RBAC and Workload Identity, ACR/Key Vault/monitoring wiring, and an upgrade
channel — plus verification that the API server is reachable and nodes/system pods are healthy.

## Notes
- Gotchas: this is the **managed-AKS (Azure) layer** — cluster-internal app deployment, Helm, and in-cluster
  ops belong to the **kubernetes-platform team**; **CNI mode and network plugin are largely immutable**
  after create (plan IP space up front); **system node pools cannot scale to zero**; Kubernetes versions
  fall out of support and force upgrades; Workload Identity requires the **OIDC issuer enabled at create**;
  spot pools can be evicted with no SLA. 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peers: GCP GKE, AWS EKS.
- IaC/CLI: Terraform `azurerm_kubernetes_cluster` + `azurerm_kubernetes_cluster_node_pool` +
  `azurerm_federated_identity_credential`; Bicep/ARM `Microsoft.ContainerService/managedClusters`. CLI `az
  aks create` / `az aks nodepool add` / `az aks get-credentials` / `az aks show`; verify with `kubectl get
  nodes`.
