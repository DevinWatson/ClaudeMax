---
name: azure-load-balancer
description: Use when designing, provisioning, securing, or operating an Azure Load Balancer — Azure's high-performance Layer-4 (TCP/UDP) load balancer that distributes traffic across a backend pool of VMs/VMSS/IPs (Azure Load Balancer). Covers public vs internal (private) load balancers, Standard vs Basic vs Gateway SKU, frontend IP configurations, backend pools (NIC or IP based), health probes (TCP/HTTP/HTTPS), load-balancing rules and HA Ports, inbound NAT rules/pools, outbound rules and SNAT port allocation, session persistence/distribution mode, availability-zone redundancy, and NSG interplay. Loads the knowledge: pick SKU and public/internal, define frontends/backend pools/probes/rules, secure, provision, and verify traffic distributes to healthy backends. Consumed by the azure-load-balancer specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Load Balancer).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-load-balancer, networking, load-balancing, layer4]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Load Balancer

Azure's **high-performance Layer-4 (TCP/UDP) load balancer** that distributes inbound traffic across a
**backend pool** of VMs/VM Scale Sets/IPs based on **health probes** and **rules**. It is an L4 device — for
HTTP routing/WAF/TLS at L7 use **Application Gateway** instead. This skill owns the **L4 load-balancer
managed-service layer** — SKU, frontends, pools, probes, and rules.

## Core concepts and components
- **Public vs internal** — a **public** LB has an internet-facing frontend public IP; an **internal (private)**
  LB has a private VNet IP for internal tiers. Same engine, different frontend.
- **SKU** — **Standard** (zone-redundant, secure-by-default closed unless allowed by NSG, large backends, SLA)
  vs **Basic** (legacy, no SLA, retiring) vs **Gateway** (for NVA/firewall insertion). Use **Standard**.
- **Frontend IP configuration** — one or more frontend IPs (public or private) the LB listens on.
- **Backend pool** — the targets (VMs/VMSS), referenced by **NIC** or **IP**; can be zone-spanning.
- **Health probes** — **TCP/HTTP/HTTPS** probes determine backend health; only healthy members receive new
  flows. Probe path/interval/threshold tuning is critical.
- **Rules** — **load-balancing rules** map frontend:port → backend pool:port (with a probe + distribution
  mode); **HA Ports** load-balance all ports (for NVAs); **inbound NAT rules/pools** forward a frontend port
  to a specific backend (e.g. SSH/RDP); **outbound rules** control **SNAT** port allocation for egress.
- **Distribution / persistence** — 5-tuple hash (default) or 2-/3-tuple **session persistence**.

## Configuration and sizing
- Pick **Standard** SKU and **public or internal**, define **frontend IP(s)**, add the **backend pool**
  (VMSS/VMs, zone-spanning for HA), author **health probes** matched to a real health endpoint, and create
  **LB rules** (+ NAT rules for management, **outbound rules** to size SNAT ports and avoid exhaustion). Use
  **availability zones** for resilience.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor). **Standard LB is closed by default** —
  traffic must be explicitly allowed by **NSGs** on the backend subnet/NICs; the LB does **not** itself filter
  beyond rules. Keep management ports (SSH/RDP) behind **inbound NAT + tight NSGs/Bastion**, prefer
  **internal** LBs for private tiers, and front internet HTTP workloads with **Application Gateway/WAF** for L7
  protection. Encryption/TLS termination is **not** an L4 LB feature.

## Cost levers
- Standard LB bills on **rules (LB + outbound) + data processed**, plus public IP cost. Levers: consolidate
  rules, right-size **outbound SNAT** (or use **NAT Gateway** for egress instead of LB outbound rules),
  prefer **internal** LBs where no public IP is needed, and avoid orphaned public IPs/unused rules.

## Scaling and limits
- Standard LB scales to **very large backend pools** and millions of flows with zone redundancy and an SLA.
  Limits: **SNAT port exhaustion** is the classic outbound failure (size outbound rules or use NAT Gateway),
  **Basic SKU is retiring / no SLA / not zone-redundant**, you **cannot mix Basic and Standard** resources in
  one path, an LB is **single-region** (use Traffic Manager/Front Door for global), and it is **L4 only** (no
  path/host routing, TLS, or WAF).

## Operating procedure
1. **Provision** — create the **LB** (SKU, public/internal) with **frontend IP config**, **backend pool**,
   **health probe(s)**, and **rules** via Terraform `azurerm_lb` + `azurerm_lb_backend_address_pool` +
   `azurerm_lb_probe` + `azurerm_lb_rule` (+ `azurerm_lb_nat_rule`/`azurerm_lb_outbound_rule`), Bicep
   `Microsoft.Network/loadBalancers`, or `az network lb create` + `az network lb probe/rule/address-pool
   create`.
2. **Configure** — attach backends (VMSS/VMs/NICs), tune **probe** path/interval/threshold to a real health
   endpoint, set **distribution/persistence**, and add **NAT** (management) and **outbound** (SNAT) rules.
3. **Secure** — apply **NSGs** to allow only intended traffic to backends (Standard LB is closed by default),
   keep management behind NAT/Bastion, use **internal** LBs for private tiers, and scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the LB and rules provisioned and **backend health is
   Up** (`az network lb show` + check probe/health), then **send traffic to the frontend** and confirm it
   distributes to **healthy** backends (and an unhealthy backend is taken out of rotation). Capture state and
   result.

## Inputs
Public vs internal exposure, the backend targets (VMSS/VMs) and zones, a real health endpoint (probe), the
port mappings (LB rules) + management access (NAT) + egress needs (outbound/NAT Gateway), persistence
requirements, SKU, NSG posture, and region.

## Output
An Azure Load Balancer setup: a Standard public/internal LB with frontend IP(s), zone-spanning backend pool,
tuned health probes, LB/NAT/outbound rules, and NSGs allowing only intended traffic — plus verification that
traffic distributes to healthy backends and unhealthy ones are removed.

## Notes
- Gotchas: **SNAT port exhaustion** is the top outbound failure — size **outbound rules** or use **NAT
  Gateway**; **Standard LB is closed by default** so NSGs must allow backend traffic; **Basic SKU is
  retiring** (no SLA, not zone-redundant); a **bad health probe** can drain all backends or mask failures —
  point it at a real endpoint; LB is **L4 only and single-region**; you **can't mix Basic/Standard**. For L7
  path/host routing, TLS termination, or WAF use **Application Gateway**; for global routing use **Front Door/
  Traffic Manager**. Broad topology is the role team's call via network-design. 2nd consumer: the Azure role
  team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS ELB
  (NLB), GCP Cloud Load Balancing.
- IaC/CLI: Terraform `azurerm_lb` + `azurerm_lb_backend_address_pool` + `azurerm_lb_probe` + `azurerm_lb_rule`
  (+ `azurerm_lb_nat_rule` / `azurerm_lb_outbound_rule`); Bicep/ARM `Microsoft.Network/loadBalancers`. CLI `az
  network lb create` / `az network lb probe/rule/address-pool create`.
