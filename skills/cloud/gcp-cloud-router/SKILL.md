---
name: gcp-cloud-router
description: Use when designing, provisioning, securing, or operating Cloud Router — Google Cloud's managed, distributed BGP service that programs dynamic routes for Cloud VPN (HA VPN), Cloud Interconnect (Dedicated/Partner VLAN attachments), and Network Connectivity Center, advertises VPC subnet routes to on-prem peers, and serves as the control plane that Cloud NAT attaches to. Covers ASN selection (16/32-bit), BGP sessions and peers, dynamic routing mode (regional vs global), custom route advertisements (default plus advertised IP ranges), BGP timers and MED/priority, graceful restart, plus IAM, logging, cost, and scaling/limits. Loads the Cloud Router knowledge: create routers and BGP sessions, advertise/learn routes, tune route preference, and verify learned/advertised routes and session state. Consumed by the Cloud Router specialist and by the GCP role team (gcp-networking-engineer / gcp-iac-engineer) when building hybrid connectivity (Cloud Router).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-router, networking, bgp, dynamic-routing, hybrid-connectivity, cloud-nat]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Router

Google Cloud's fully managed, distributed BGP speaker. Cloud Router exchanges routes between your VPC
network and peer networks reached over **Cloud VPN (HA VPN)**, **Cloud Interconnect** (Dedicated/Partner
VLAN attachments), or **Network Connectivity Center**. It learns on-prem prefixes via BGP and advertises
your VPC subnet ranges back, so routing stays dynamic as networks change. Cloud Router is also the
control-plane object that **Cloud NAT** attaches to.

## Core concepts and components
- **Cloud Router** — a regional resource bound to a VPC network; runs BGP sessions and programs the
  resulting dynamic routes into the VPC.
- **ASN** — the router's BGP autonomous-system number (private 16-bit `64512-65534`, private 32-bit
  ranges, or a public ASN you own). Each BGP peer has its own ASN.
- **BGP session / interface / peer** — an `interface` ties the router to a VPN tunnel or VLAN attachment
  with a link-local IP; a `peer` defines the remote ASN and IP and exchanges routes over that interface.
- **Dynamic routing mode** — **regional** (router advertises only its own region's subnets and learned
  routes apply regionally) vs **global** (advertises all VPC subnets and learned routes apply network-wide).
- **Route advertisement** — **default** (advertise all subnet ranges) or **custom** (advertise specific
  IP ranges, e.g. for PSC/Private Google Access `199.36.153.8/30`, or to suppress some subnets).
- **Route preference** — inbound **MED** and local **priority**/route metric pick best paths across
  redundant tunnels/attachments; **BGP timers** (keepalive/hold) and **graceful restart** affect failover.

## Configuration and sizing
- Bind a Cloud Router per region per VPC. Pick a non-conflicting ASN. Use **global dynamic routing** when
  hybrid reachability must span regions; otherwise regional. Establish **redundant BGP sessions** (two HA
  VPN tunnels or two VLAN attachments in different edge availability domains) and use MED/priority to set
  active/standby vs ECMP. Advertise the minimum prefix set; add custom advertisements for restricted
  Google API ranges when needed.

## Security and IAM
- Grant least-privilege network IAM: `roles/compute.networkAdmin` to manage routers/sessions,
  `roles/compute.networkUser` for attach. Use **MD5 authentication** on BGP sessions where the peer
  supports it. Constrain advertised ranges so you do not leak internal prefixes to peers. Enable Cloud
  Router/VPN/Interconnect logging and pair with VPC-SC for data-exfiltration controls.

## Cost levers
- Cloud Router itself has no separate charge; cost comes from the **underlying VPN tunnels / Interconnect
  attachments**, **egress** over those links, and any **Cloud NAT** attached to the router. Minimize
  cross-region egress, right-size attachment capacity, and avoid redundant tunnels beyond your SLA needs.

## Scaling and limits
- Limits on **BGP peers per router**, **learned routes per router/region** (dynamic route quota), and
  **routers per region per network**. Global dynamic routing increases learned-route propagation scope.
  Learned-route quota is a common ceiling on large hybrid topologies — summarize prefixes on-prem and
  raise quota as needed. Sessions are regional; build redundancy within and across edge availability
  domains.

## Operating procedure
1. **Provision** — enable the Compute API and create the **Cloud Router**
   (Terraform `google_compute_router`) bound to the VPC/region with a chosen `bgp.asn` and dynamic routing
   mode set on the network.
2. **Configure** — add **interfaces** and **BGP peers** (`google_compute_router_interface`,
   `google_compute_router_peer`) on the HA VPN tunnels or Interconnect VLAN attachments; set
   advertised mode/ranges, MED/priority, and BGP timers; for NAT, attach `google_compute_router_nat`.
3. **Secure** — set MD5 auth where supported, restrict advertised ranges to the minimum, grant network
   IAM least-privilege, and enable router/session logging.
4. **Verify** — apply [[verify-by-running]]: confirm BGP session state is **established** and inspect
   learned/advertised routes with `gcloud compute routers get-status <router> --region <r>`, list
   resulting dynamic routes (`gcloud compute routes list`), and run a `gcloud network-management
   connectivity-tests` between a VPC endpoint and an on-prem prefix to confirm the dynamic path — capture
   the router status, route listing, and connectivity-test result.

## Inputs
Hybrid topology (HA VPN vs Interconnect vs NCC), region footprint and dynamic routing mode (regional vs
global), ASN assignments (local + peers), prefixes to advertise/learn, redundancy/failover requirements
(MED/priority, timers), NAT needs, IAM model, logging requirements, and cost ceiling.

## Output
A Cloud Router configuration (router, BGP interfaces/peers over VPN/Interconnect, advertisement policy,
route preference/timers, optional Cloud NAT attachment) with least-privilege network IAM and logging, plus
verification of session state and learned/advertised routes and a connectivity test of the dynamic path.

## Notes
- Gotchas: **regional vs global dynamic routing** is a network-level setting that surprises people — a
  regional router will not advertise other regions' subnets; learned-route **quota** silently caps large
  topologies (summarize on-prem); link-local `169.254.x.x` interface IPs must match the peer's; redundant
  tunnels need MED/priority or you get unintended ECMP; advertising **all subnets** can leak internal
  ranges to a peer; Cloud NAT depends on the router, so deleting the router breaks NAT egress.
- IaC/CLI: Terraform `google_compute_router`, `google_compute_router_interface`,
  `google_compute_router_peer`, `google_compute_router_nat`, plus `google_project_service`. CLI
  `gcloud compute routers create/add-interface/add-bgp-peer/update`, `... routers get-status`, and
  `gcloud compute routes list` for the programmed dynamic routes.
