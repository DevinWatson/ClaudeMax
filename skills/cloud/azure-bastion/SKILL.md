---
name: azure-bastion
description: Use when designing, provisioning, securing, or operating Azure Bastion — Azure's fully managed PaaS jump host that gives secure RDP/SSH to VMs over TLS (browser or native client) without exposing VM public IPs or opening inbound 3389/22 (Azure Bastion). Covers deployment into the dedicated AzureBastionSubnet (/26+), the SKUs (Developer/Basic/Standard/Premium) and their gated features (host scaling/instance count, native client, IP-based connection, shareable links, session recording, private-only), connectivity to VMs by private IP across peered spokes, Entra ID/RBAC access, and required NSG rules on the bastion subnet. Loads the knowledge: create the AzureBastionSubnet and bastion host, pick the SKU for required features, secure access, provision, and verify RDP/SSH works over TLS with no public IP on the VM. Consumed by the azure-bastion specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Bastion).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-bastion, networking, security, jump-host]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Bastion

Azure's **fully managed PaaS jump host** providing secure **RDP and SSH over TLS** to VMs — in the browser
or native client — **without exposing VM public IPs** or opening inbound RDP/SSH ports to the internet. This
skill owns the **Bastion managed-service layer** — the host, its subnet, SKU/feature selection, and secure
access. (Broad remote-access topology across a hub-spoke estate is the role team's call.)

## Core concepts and components
- **Managed jump host** — Bastion is provisioned **inside your VNet**; users reach it over **TLS (443)** and
  it brokers **RDP/SSH** to VMs by their **private IP** — so VMs need **no public IP** and **no open 3389/22**.
- **AzureBastionSubnet** — Bastion must live in a dedicated subnet named exactly **`AzureBastionSubnet`**,
  sized **/26 or larger** (smaller SKUs allow /27/26 depending on features).
- **SKUs** — **Developer** (free, lightweight, shared, limited features), **Basic** (fixed scale),
  **Standard** (host **scaling/instance count**, native client, **IP-based connection**, shareable links),
  **Premium** (adds **session recording** and **private-only** deployment). Features are **SKU-gated**.
- **Connectivity** — connect to VMs in the same VNet or **peered spokes** by private IP; with peering and a
  central Bastion you cover many VNets.
- **Access control** — **Entra ID + Azure RBAC** governs who can connect; integrates with VM login and
  just-in-time-style patterns.

## Configuration and sizing
- Create the **`AzureBastionSubnet`** (**/26**), deploy the **bastion host** with the **SKU** matching needed
  features (Standard for native client/scaling/IP-based; Premium for session recording/private-only), set the
  **instance count** for concurrency (Standard+), and configure **NSGs** on the bastion subnet to permit the
  required management/data ports.

## Security and IAM
- Bastion's value **is** security: VMs keep **no public IP** and **no inbound RDP/SSH** from the internet —
  all access is **RDP/SSH over TLS** brokered by Bastion. Govern connections with **Entra ID + RBAC**
  (Reader on the VM + Bastion + appropriate VM login role), enforce **MFA/Conditional Access** at Entra, use
  **Premium session recording** for audit, prefer **private-only** deployment (Premium) where no public
  endpoint is allowed, and configure the **required NSG rules** on `AzureBastionSubnet` (allow GatewayManager/
  AzureBastion inbound, deny otherwise). Use **shareable links/native client** cautiously per policy.

## Cost levers
- Bills on a **per-hour host fee by SKU** + **scale-unit/instance count** + **outbound data**. Levers: use a
  **single central Bastion** reached via **peering** instead of one per VNet, pick the **lowest SKU** that has
  the features you need (Developer/Basic where scaling/native client/recording aren't required), and right-size
  the **instance count** to actual concurrency.

## Scaling and limits
- Standard+ **scales by instance count** for concurrent sessions. Limits: the **`AzureBastionSubnet`** name is
  **mandatory and exact** and must be **/26+** (deployment fails otherwise); many features (**native client,
  IP-based connect, scaling, session recording, private-only**) are **SKU-gated**; **Developer SKU** is shared
  and feature-limited; reaching VMs in other VNets requires **peering**; Bastion is **regional** (per VNet
  region); shareable links/IP-based connection have their own SKU/feature prerequisites.

## Operating procedure
1. **Provision** — create the **`AzureBastionSubnet`** (/26) and the **bastion host** (SKU, public IP for
   non-private deployments) via Terraform `azurerm_bastion_host` (+ subnet/public IP), Bicep
   `Microsoft.Network/bastionHosts`, or `az network bastion create`.
2. **Configure** — set the **SKU/instance count** for required features/concurrency, enable **native client /
   IP-based connection / session recording / private-only** per SKU, and ensure **peering** to reach spoke VMs.
3. **Secure** — keep VMs with **no public IP / no open 3389-22**, govern with **Entra ID + RBAC** + **MFA/
   Conditional Access**, apply the **required NSG rules** on `AzureBastionSubnet`, and enable **session
   recording** (Premium) for audit.
4. **Verify** — apply [[verify-by-running]]: confirm the bastion host provisioned (`az network bastion show`)
   and the target VM has **no public IP / no inbound 3389-22**, then **connect via Bastion (RDP/SSH over TLS)**
   to the VM's private IP and confirm the session establishes while a direct public RDP/SSH attempt fails.
   Capture state and result.

## Inputs
The VNet (and peered spokes) hosting the target VMs, required features (native client, IP-based connect,
scaling, session recording, private-only → SKU), expected concurrency (instance count), the
`AzureBastionSubnet` range, access-control model (Entra/RBAC/MFA), NSG posture, and region.

## Output
An Azure Bastion setup: a bastion host in a correctly named/sized `AzureBastionSubnet` at the right SKU for
required features, with RBAC/Entra-governed access and MFA, required NSG rules, optional session recording/
private-only — plus verification that RDP/SSH works over TLS to private VMs while no VM has a public RDP/SSH
exposure.

## Notes
- Gotchas: the subnet must be named **exactly `AzureBastionSubnet`** and be **/26+** or deployment fails; key
  features (**native client, IP-based connect, host scaling, session recording, private-only**) are
  **SKU-gated** — pick the SKU deliberately; reaching VMs in **other VNets needs peering**; **Developer SKU**
  is shared/limited; required **NSG rules** on the bastion subnet are specific (allow GatewayManager/
  AzureBastion). Deploy **one central Bastion** over peering rather than per-VNet to cut cost. Broad
  remote-access topology is the role team's call via network-design. 2nd consumer: the Azure role team
  (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud analogues: AWS EC2
  Instance Connect / Session Manager bastion, GCP IAP for TCP forwarding.
- IaC/CLI: Terraform `azurerm_bastion_host` (+ dedicated subnet + public IP); Bicep/ARM
  `Microsoft.Network/bastionHosts`. CLI `az network bastion create` / `az network bastion rdp` / `az network
  bastion ssh`.
