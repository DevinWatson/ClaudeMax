---
name: azure-container-instances
description: Use when designing, provisioning, securing, or operating Azure Container Instances — Azure's serverless single-container (and container-group) runtime with no orchestrator to manage (Azure Container Instances). Covers container groups (one or more co-located containers sharing a lifecycle/network/volume), CPU/memory sizing, OS type (Linux/Windows), restart policies (Always/OnFailure/Never), public IP and DNS labels, VNet injection for private networking, mounted volumes (Azure Files/emptyDir/secret), environment variables and secrets, image pulls from ACR, managed identity, and per-second billing. Loads the knowledge: size a container group, choose restart/network/volumes, provision, secure, and verify the container is running and reachable. Consumed by the azure-container-instances specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Container Instances).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-container-instances, containers, serverless, container-groups]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Container Instances (ACI)

Azure's **serverless container runtime**: run a single container or a small **container group** directly,
billed per second, with no VM or orchestrator to operate. Ideal for short-lived jobs, build/CI tasks,
simple APIs, and burst/sidecar workloads.

## Core concepts and components
- **Container group** — the deployment unit: one or more **co-located containers** that share a lifecycle,
  a network (single IP/ports), and optional volumes (analogous to a Kubernetes pod). Single-container
  groups are the common case.
- **Sizing** — each container requests **CPU cores and memory (GB)**; the group's total is the sum. GPU
  SKUs are available in some regions. **OS type** is Linux or Windows (set per group).
- **Restart policy** — **Always** (long-running services), **OnFailure** (run-to-completion jobs that
  retry), or **Never** (one-shot tasks). Drives whether ACI is a service or a batch task.
- **Networking** — a **public IP + DNS label** for internet exposure, or **VNet injection** for private
  access (no public IP); ports are exposed at the group level.
- **Volumes** — mount **Azure Files** shares, `emptyDir`, `secret`, or `gitRepo` volumes into containers.
- **Image source** — Docker Hub or **ACR** (pull via managed identity or registry credentials).

## Configuration and sizing
- Choose the **restart policy** by intent (service vs job). Size **CPU/memory** per container to the
  workload (under-sized containers OOM-kill). Pick **public IP + DNS label** or **VNet injection**. Mount
  **Azure Files** for persistence (the container filesystem is ephemeral). Set **environment variables**
  (mark sensitive ones as secure) and pull images from **ACR**.

## Security and IAM
- Pull from **ACR** using a **managed identity** (no stored registry creds). Use **secure environment
  variables** or mounted **secret** volumes for secrets (prefer Key Vault references where possible). Use
  **VNet injection** to keep the group private. Scope **RBAC** to the resource group. Containers run with
  the group's identity for outbound Azure access.

## Cost levers
- Billed **per second of vCPU and GB-seconds of memory while the group runs**, plus image pull/egress. No
  charge when a `Never`/`OnFailure` group has terminated. Levers: right-size CPU/memory, use **OnFailure/
  Never** restart for jobs so they stop billing on completion, prefer ACI over a always-on VM/cluster for
  bursty or infrequent work, and delete idle `Always` groups.

## Scaling and limits
- ACI does **not autoscale** a group — it runs the requested size. Scale by deploying **more container
  groups** (drive from a queue/orchestrator) or graduate to **Azure Container Apps / AKS** for managed
  autoscaling. Limits: max CPU/memory per group, regional GPU/SKU availability, per-region container-group
  quota; cold start on first deploy.

## Operating procedure
1. **Provision** — create the **container group** (image, CPU/memory, OS, restart policy, ports) via
   Terraform `azurerm_container_group` (or Bicep `Microsoft.ContainerInstance/containerGroups`, or `az
   container create`).
2. **Configure** — set **environment variables** (secure where sensitive), mount **Azure Files**/secret
   volumes, set the **public IP + DNS label** or **VNet injection**, and configure log analytics.
3. **Secure** — assign a **managed identity** for ACR/Key Vault access, mark secrets secure, keep the group
   in a **VNet** if private, and scope RBAC.
4. **Verify** — apply [[verify-by-running]]: confirm the group is provisioned and the container state is
   `Running` (or `Terminated` with exit code 0 for a job) via `az container show`, then check
   `instanceView` and `az container logs`; for a service, **curl the FQDN/IP:port** and confirm a healthy
   response. Capture state, exit code, and logs/response.

## Inputs
The image (and registry), the workload intent (service vs job → restart policy), CPU/memory per container,
OS type, networking (public IP/DNS vs VNet), volumes/secrets needed, environment/config, ACR/identity
requirements, and the region.

## Output
An ACI setup: a sized container group with the chosen restart policy, networking (public or VNet), mounted
volumes/secrets, ACR pull via managed identity — plus verification that the container is Running/completed
and (for services) reachable.

## Notes
- Gotchas: the container filesystem is **ephemeral** (mount Azure Files for persistence); ACI **does not
  autoscale** — for autoscaling serverless microservices use **azure-container-apps**, for full
  orchestration use **azure-aks**; **VNet-injected groups cannot have a public IP**; undersized memory
  causes silent OOM restarts; **Windows container groups** have feature limits; cold start adds latency.
  2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peer: AWS
  Fargate (task-level).
- IaC/CLI: Terraform `azurerm_container_group`; Bicep/ARM
  `Microsoft.ContainerInstance/containerGroups`. CLI `az container create` / `az container show` / `az
  container logs`; verify by curling the group FQDN or checking the terminated exit code.
