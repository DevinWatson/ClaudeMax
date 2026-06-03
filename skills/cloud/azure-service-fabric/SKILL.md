---
name: azure-service-fabric
description: Use when designing, provisioning, securing, or operating Azure Service Fabric — Azure's distributed-systems platform for packaging, deploying, and managing microservices and stateful services on a cluster (Azure Service Fabric). Covers node types (VM Scale Set backed, seed nodes, reliability/durability tiers), the application/service model, programming models (Reliable Services stateless/stateful, Reliable Actors, guest executables, containers), monitored health-based rolling upgrades, partitioning/replication and placement constraints, the Naming/Failover/Cluster Resource Managers, security (X.509 certs, Entra, NSGs), and managed clusters. Loads the knowledge: size node types, model the application, set upgrade/placement policy, provision, secure, and verify the cluster and services are healthy. Consumed by the azure-service-fabric specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Service Fabric).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-service-fabric, containers, microservices, stateful-services, reliable-actors]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Service Fabric

Azure's **distributed-systems platform** for building and operating microservices and **stateful** services
on a cluster of machines. It handles placement, failover, rolling upgrades, and state replication — and can
run native Reliable Services/Actors, containers, or guest executables.

## Core concepts and components
- **Cluster & node types** — a set of machines; each **node type** is backed by a **VM Scale Set** with a
  **durability** tier (how safe VM-level ops are) and the cluster has a **reliability** tier (how many
  **seed nodes**) governing resilience. The **primary node type** hosts system services.
- **Application & service model** — an **application** packages one or more **services**; services are
  **stateless** or **stateful** and can be **partitioned** with **replicas** for scale and HA.
- **Programming models** — **Reliable Services** (stateless/stateful), **Reliable Actors** (virtual-actor
  pattern), **guest executables**, and **containers** (Linux/Windows).
- **Cluster managers** — the **Naming**, **Failover**, and **Cluster Resource Manager** services place,
  balance, and recover services across nodes per **placement constraints**.
- **Upgrades** — **monitored, health-based rolling upgrades** for both applications and the cluster,
  with automatic rollback on health failure.
- **Managed clusters** — a simplified provisioning model that manages the underlying scale sets/LB/NSG for
  you (vs classic clusters where you manage them directly).

## Configuration and sizing
- Define **node types** (VM SKU, count, durability) — a robust **primary** node type for system services
  plus workload node types — and the cluster **reliability** tier. Model the **application/services**, set
  **partitioning + replica counts** for stateful services, and **placement constraints**. Choose **managed
  clusters** for simpler ops. Configure **monitored upgrade** policy (health checks, timeouts, rollback).

## Security and IAM
- Secure the cluster with **X.509 certificates** (cluster + client) and/or **Entra ID** for client/admin
  access with **RBAC** roles (admin vs read-only). Lock down management endpoints with **NSGs**; store
  certs/secrets in **Key Vault**. Use **managed identity** for app access to Azure services. Enable
  encryption and reverse-proxy/TLS for service endpoints.

## Cost levers
- Service Fabric itself is free — you pay for the **underlying VM Scale Set nodes + disks + LB + egress**.
  Levers: right-size node-type SKUs and counts, scale workload node types independently, use **Reserved
  Instances/Savings Plans** for steady clusters, keep the primary node type minimal-but-resilient, and
  consolidate low-traffic services via density rather than extra nodes.

## Scaling and limits
- Scale **out** by adding nodes to a node type (scale-set scaling) or **out** services by partition/replica
  count; the Cluster Resource Manager rebalances. Limits: **reliability tier requires a minimum seed-node
  count** (e.g. 5 for the highest), stateful replica counts bound by node count, primary node type changes
  are disruptive, and per-region VM quota gates node growth.

## Operating procedure
1. **Provision** — create the cluster (node types, reliability/durability, cert/Entra security) via the
   **managed-cluster** resources in Terraform (`azurerm_service_fabric_managed_cluster` +
   `azurerm_service_fabric_managed_cluster_node_type`) or Bicep/ARM
   `Microsoft.ServiceFabric/managedClusters` (or `az sf cluster create`).
2. **Configure** — define the **application/services**, set **partitioning + replica counts** and
   **placement constraints**, and configure the **monitored upgrade** policy; deploy the application package.
3. **Secure** — apply **X.509 cluster/client certs** and/or **Entra RBAC**, lock down NSGs, store certs in
   **Key Vault**, and assign a **managed identity** for app Azure access.
4. **Verify** — apply [[verify-by-running]]: confirm the cluster `provisioningState`/health state is OK and
   nodes are **Up** (Service Fabric Explorer or `sfctl cluster health` / `az sf` query), then confirm the
   **application and services report Healthy** with replicas placed (`sfctl service health`); for an
   endpoint, curl it via the reverse proxy. Capture cluster/app health.

## Inputs
The service topology (stateless/stateful, actors, containers), node-type layout (SKU/count/durability) and
cluster reliability target, partitioning/replica strategy for stateful services, placement constraints,
upgrade policy, security model (X.509 vs Entra), Key Vault/identity needs, and the region.

## Output
A Service Fabric setup: a (managed) cluster with sized node types and reliability/durability, a deployed
application with partitioned/replicated services and placement constraints, monitored upgrade policy,
secured by certs/Entra RBAC and NSGs — plus verification that the cluster, application, and services are
Healthy.

## Notes
- Gotchas: this is a **specialized stateful microservices platform** — most new microservice/container
  workloads are better served by **azure-aks** or **azure-container-apps**; the **primary node type and
  reliability tier are hard to change** post-create; the **reliability tier dictates a minimum node count**
  (under-provisioning blocks system-service quorum); **stateful replica counts are bound by node count**;
  cert rotation requires care to avoid lockout; classic vs managed clusters differ significantly. 2nd
  consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect).
- IaC/CLI: Terraform `azurerm_service_fabric_managed_cluster` +
  `azurerm_service_fabric_managed_cluster_node_type`; Bicep/ARM
  `Microsoft.ServiceFabric/managedClusters`. CLI `az sf` / `sfctl cluster health` / `sfctl service
  health`; verify via Service Fabric Explorer or `sfctl` health queries.
