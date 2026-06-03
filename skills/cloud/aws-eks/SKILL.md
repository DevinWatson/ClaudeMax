---
name: aws-eks
description: Use when designing, provisioning, securing, or operating Amazon EKS — managed Kubernetes control plane, node groups (managed/self-managed) vs Fargate profiles, the VPC CNI, IRSA / EKS Pod Identity, add-ons, cluster autoscaling (Karpenter/Cluster Autoscaler), aws-auth/access entries, and load balancer/ingress controllers (Amazon EKS). Loads the EKS knowledge: how to stand up a cluster, attach compute, map IAM to Kubernetes RBAC, grant pods AWS access via IRSA, scale nodes, and verify the cluster and workloads. Consumed by the EKS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they run Kubernetes.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, eks, kubernetes, containers, irsa, orchestration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon EKS

Managed Kubernetes on AWS: AWS runs the control plane (API server, etcd) and you bring compute
(managed node groups, self-managed nodes, or Fargate). Choose EKS when you need the Kubernetes
API, Helm/operators, or multi-cloud portability; choose ECS when AWS-native simplicity is enough.
This skill owns the AWS-side cluster/compute/IAM plumbing; cluster-internal platform/RBAC/policy
ownership belongs to the kubernetes-platform team.

## Core concepts and components
- **Control plane** — AWS-managed, multi-AZ; you pick the version and endpoint access (public/
  private). **Add-ons** — VPC CNI, CoreDNS, kube-proxy, EBS/EFS CSI managed by EKS.
- **Compute** — **managed node groups** (EC2, AWS-lifecycle-managed), **self-managed nodes**, or
  **Fargate profiles** (per-pod serverless). **Karpenter** for fast, flexible node provisioning.
- **VPC CNI** — pods get VPC IPs directly (plan subnet CIDR for pod density).
- **IRSA / EKS Pod Identity** — map a Kubernetes service account to an IAM role so pods get
  least-privilege AWS creds without node-wide permissions.
- **Access** — `aws-auth` ConfigMap or the newer **access entries** map IAM principals to K8s RBAC.

## Configuration and sizing
- Pick instance types per workload (Graviton/Spot via Karpenter for cost); size node groups or
  let Karpenter consolidate. Reserve IP headroom for the VPC CNI (prefix delegation for density).
- Pin and plan version upgrades (control plane then nodes then add-ons), one minor at a time.

## Security and IAM
- **IRSA/Pod Identity** for pod-level AWS access — never give nodes broad IAM. Restrict the
  cluster endpoint (private + CIDR allowlist), enable control-plane audit logging to CloudWatch.
- Map IAM to RBAC via access entries; encrypt secrets with KMS (envelope encryption); scope SGs
  and use security groups for pods where needed.

## Cost levers
- Hourly control-plane fee per cluster (consolidate non-prod). Spot + Graviton + Karpenter
  consolidation for nodes; Fargate for spiky/isolated pods. Right-size requests/limits.

## Scaling and limits
- **Karpenter** or **Cluster Autoscaler** scale nodes; HPA/KEDA scale pods. VPC CNI IP exhaustion
  is the classic scaling wall — use prefix delegation or custom networking. Version support window
  is limited — stay current.

## Operating procedure
1. **Provision** — create the cluster (version, VPC/subnets, endpoint access, KMS, logging) and
   attach compute (managed node group / Fargate profile / Karpenter) via Terraform
   `aws_eks_cluster` + `aws_eks_node_group` (or the `eks` module) / `eksctl` / `aws eks`.
2. **Configure** — install/managed add-ons (VPC CNI, CoreDNS), set up IRSA/Pod Identity, access
   entries, and the AWS Load Balancer Controller / ingress.
3. **Secure** — IRSA least privilege, private/restricted endpoint, audit logs, KMS secret
   encryption, IAM→RBAC access entries.
4. **Verify** — apply [[verify-by-running]]: `aws eks describe-cluster` shows `ACTIVE`,
   `kubectl get nodes` shows nodes `Ready`, a test Deployment + Service rolls out and is reachable,
   and an IRSA pod can call its allowed AWS API but nothing more.

## Inputs
Kubernetes version, workload profiles, compute model (managed nodes/Fargate/Karpenter), VPC/subnet
CIDR + IP density needs, which pods need AWS access (IRSA), endpoint exposure, ingress strategy.

## Output
A cluster + compute definition, add-on and IRSA/access-entry config, autoscaling/networking
setup, and verification of an ACTIVE cluster, Ready nodes, a reachable workload, and scoped pod IAM.

## Notes
- Gotchas: VPC CNI IP exhaustion; mismatched control-plane/node/add-on versions; broken
  `aws-auth`/access entries lock you out of `kubectl`; node IAM over-permission instead of IRSA;
  endpoint left fully public; Fargate has no DaemonSet/privileged support.
- IaC/CLI: Terraform `aws_eks_cluster`, `aws_eks_node_group`, `aws_eks_fargate_profile`,
  `aws_eks_addon`, `aws_iam_openid_connect_provider` (IRSA); the `terraform-aws-modules/eks` module.
  CLI `eksctl`, `aws eks describe-cluster`, `update-kubeconfig`, `kubectl`. CloudFormation `AWS::EKS::*`.
