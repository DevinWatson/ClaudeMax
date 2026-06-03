---
name: kubernetes-platform
description: The substantive cluster/platform-level Kubernetes capability — operating clusters as a platform, not deploying one app's workloads. Covers control-plane architecture (kube-apiserver, etcd, scheduler, controller-manager), node pools and node lifecycle (cordon/drain/upgrade), multi-tenancy and namespaces, RBAC and ServiceAccounts, network policies and the CNI (Calico, Cilium), ingress and service mesh (Istio, Linkerd), storage classes and CSI, autoscaling (HPA, VPA, cluster-autoscaler, Karpenter), operators and CRDs, Helm packaging, cluster version upgrades and node drains, admission control and policy (OPA Gatekeeper, Kyverno, Pod Security Standards), and tooling (kubectl, k9s, kubeadm). Use when architecting, operating, securing, scaling, upgrading, or governing a Kubernetes cluster/fleet as a platform. NOT for one application's Deployments/Services/manifests (app-workload level); distribution-agnostic — pair with provider knowledge for EKS/GKE/AKS. Any agent operating a cluster as a platform can load it.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [kubernetes, platform-engineering, control-plane, multi-tenancy, rbac, cni, autoscaling, admission-control, helm, cluster-upgrade]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Kubernetes Platform

The substantive capability for operating Kubernetes **clusters** as a platform: the control-plane
architecture, node fleet, multi-tenancy model, cluster-wide networking, storage, autoscaling,
extension (operators/CRDs), policy/admission control, and the upgrade lifecycle that turn raw nodes
into a sound, multi-tenant platform other teams build on.

## When to use this skill
Whenever the work is at the **cluster/platform** level: designing or reviewing a cluster's control
plane and node pools, carving up multi-tenancy and namespaces, setting cluster-wide RBAC, choosing
and configuring the CNI / network policies / ingress / service mesh, defining storage classes and
CSI, configuring autoscaling, installing operators/CRDs, packaging with Helm, planning a cluster
version upgrade and node drains, or enforcing admission policy.

Do **not** use this for deploying a single application's workloads (its Deployments, Services,
ConfigMaps, manifests) — that is app-workload level. This skill is also **distribution-agnostic**
(vanilla/kubeadm, k3s, RKE2, OpenShift, EKS/GKE/AKS); for a managed provider's specifics (e.g. EKS
node groups, GKE Autopilot, AKS node pools, provider IAM↔RBAC mapping) pair it with that provider's
cloud-services skill.

## Instructions
1. **Establish cluster context before changing anything.** Determine the Kubernetes version and
   distribution, the control-plane topology (managed vs self-managed; HA etcd quorum), the node
   pools (labels, taints, instance shapes), the CNI and network-policy posture, the installed
   operators/CRDs, the admission/policy stack, and the tenancy model. Read existing manifests, Helm
   values, and `kubectl get` output (e.g. `kubectl get nodes,ns,storageclass,crd`) rather than
   assuming.
2. **Architect the control plane and node fleet.** For self-managed control planes ensure an HA
   apiserver behind a load balancer, an odd-numbered etcd quorum with backups, and isolated
   scheduler/controller-manager. Design node pools by workload class (system vs general vs
   GPU/spot), using labels, taints/tolerations, and topology spread so the scheduler places work
   correctly. Define the node lifecycle: cordon -> drain (respecting PodDisruptionBudgets) ->
   replace/upgrade -> uncordon.
3. **Set the multi-tenancy and RBAC model.** Use namespaces as the tenancy unit with ResourceQuota
   and LimitRange per tenant. Grant least-privilege RBAC: prefer namespaced Roles/RoleBindings over
   ClusterRoles; bind ServiceAccounts (not user identities) for workloads; avoid `cluster-admin`
   bindings and wildcard verbs/resources. Map external identity (OIDC / provider IAM) to RBAC
   explicitly.
4. **Configure cluster networking deliberately.** Pick and configure the CNI (Calico, Cilium) and
   enforce default-deny NetworkPolicies with explicit allows between tenants. Stand up an ingress
   controller (or Gateway API) for north-south traffic and, where east-west security/observability/
   traffic-shaping warrants it, a service mesh (Istio, Linkerd) — justify the mesh rather than
   adding it by default. Confirm CoreDNS and Service/ClusterIP reachability.
5. **Provision storage and autoscaling.** Define StorageClasses backed by the right CSI driver with
   sane reclaim/expansion policy; mark a default class intentionally. Configure autoscaling at all
   three levels as needed: HPA (and/or VPA, avoiding HPA+VPA conflicts on the same metric) for pods,
   and cluster-autoscaler or Karpenter for nodes — set min/max bounds and verify the autoscaler can
   actually schedule onto the pools it scales.
6. **Extend with operators and package with Helm.** Install platform capabilities via operators/CRDs
   (cert-manager, external-dns, ingress, mesh, monitoring) and manage them with Helm charts and
   versioned values; pin chart and image versions. Treat CRDs as cluster-wide API surface — review
   their RBAC and upgrade implications.
7. **Enforce policy via admission control.** Apply Pod Security Standards (baseline/restricted) at
   the namespace level and add a policy engine (OPA Gatekeeper or Kyverno) for org guardrails
   (no privileged pods, required labels/limits, allowed registries, no `:latest`). Prefer
   validating/mutating policies over manual review.
8. **Plan and execute version upgrades safely.** Upgrade the control plane before nodes; respect the
   kubelet/apiserver skew policy (one minor version). For nodes, drain respecting PDBs and surge a
   replacement pool rather than in-place where possible. Check API deprecations
   (`kubectl deprecations` / `kubent`) and migrate removed APIs before upgrading.
9. **Express and validate as code.** Capture platform config as Helm values / manifests / IaC, and
   verify with `kubectl --dry-run=server`, `helm template`/`helm lint`, `kubeconform`, and live
   `kubectl get/describe`, `k9s`, or policy-engine test runs. Confirm every claim against actual
   cluster state via [[verify-by-running]].

## Inputs
- The cluster version/distribution and control-plane topology, the node-pool layout, the existing
  CNI/network-policy/ingress/mesh config, installed operators/CRDs, StorageClasses, autoscaler and
  admission/policy configuration, the tenancy/RBAC model, and the platform's SLO/availability target.

## Output
- A platform recommendation per concern (control plane, node pools, tenancy/RBAC, networking,
  storage, autoscaling, operators, policy, upgrade plan) with the choice named and the trade-off
  justified, distribution-agnostic unless provider specifics are in scope.
- Least-privilege RBAC and default-deny network posture, plus the admission/Pod-Security policy set.
- Where code is involved, the Helm values / manifests / IaC plus the exact validation command(s).

## Notes
- This is cluster/platform knowledge, **not** app-workload deployment: a single app's
  Deployments/Services/manifests belong to the app-workload level, not here.
- It is distribution-agnostic; for managed-Kubernetes provider specifics (EKS/GKE/AKS) pair it with
  the relevant cloud-services skill, and for the IaC engine itself pair with the Terraform skill.
- Costs and risk concentrate in idle/over-provisioned node pools, unbounded autoscaler maxes,
  cluster-wide ClusterRoleBindings, privileged pods, and risky in-place upgrades — flag these.
- Always confirm cluster state and dry-run/lint output with [[verify-by-running]] before asserting a
  change is correct.
