---
name: gcp-identity-aware-proxy
description: Use when designing, provisioning, securing, or operating Identity-Aware Proxy (IAP) — Google Cloud's context-aware access layer that authenticates and authorizes requests to applications and VMs before they reach the resource, implementing BeyondCorp zero-trust (Identity-Aware Proxy). Covers IAP-secured web apps behind HTTPS load balancers, IAP TCP forwarding for SSH/RDP/admin access without public IPs, the IAP OAuth client/brand, the iap.httpsResourceAccessor / tunnelResourceAccessor IAM roles, Access Context Manager access levels (device, IP, geo, time) for conditional access, and signed-header/JWT identity propagation, plus cost and limits. Loads the IAP knowledge: front a resource with IAP, bind accessor IAM with access levels, and verify allow/deny. Consumed by the IAP specialist and by the GCP role team (gcp-security-reviewer / gcp-cloud-architect) when wiring zero-trust access (Identity-Aware Proxy).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, identity-aware-proxy, security, zero-trust, beyondcorp, access-levels, context-aware-access]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Identity-Aware Proxy (IAP)

Google Cloud's **context-aware access** front door. IAP sits in front of an application or VM and
**authenticates the caller and checks authorization before the request reaches the backend** — the
foundation of Google's **BeyondCorp zero-trust** model (access by identity + context, not network
location).

## Core concepts and components
- **IAP-secured web apps** — IAP guards backends behind an **external HTTPS load balancer** (backend
  service / serverless NEG to Cloud Run, App Engine, GKE, or VMs). Enabling IAP on the backend forces
  Google sign-in + authorization on every request.
- **IAP TCP forwarding** — reach **SSH/RDP/admin ports** on VMs and internal services **without public
  IPs**, tunneling through IAP (`gcloud compute ssh --tunnel-through-iap`). Replaces bastion hosts.
- **OAuth brand / client** — IAP uses an OAuth consent **brand** and an OAuth **client ID/secret** for
  the sign-in flow; required to enable IAP on web apps.
- **Authorization (IAM)** — bind principals to **`roles/iap.httpsResourceAccessor`** (web) or
  **`roles/iap.tunnelResourceAccessor`** (TCP) on the IAP resource. This is the allow list.
- **Access levels (Access Context Manager)** — conditional access policies (corp **IP** ranges,
  **device** trust via Endpoint Verification, **geo**, **time**) attached via IAM **conditions** to
  require context, not just identity.
- **Identity propagation** — IAP injects a **signed header** / **JWT** (`x-goog-iap-jwt-assertion`)
  the backend verifies to trust the authenticated user, plus the `x-goog-authenticated-user-*` headers.

## Configuration and sizing
- Front the app with an **HTTPS LB** (managed cert), configure the OAuth brand/client, enable IAP on
  the **backend service**, then grant accessor IAM **scoped with access levels**. For admin access, use
  **TCP forwarding** + tunnelResourceAccessor instead of public SSH. Backends should **only accept IAP**
  traffic (verify the JWT; restrict ingress to the LB).

## Security and IAM
- IAP is the zero-trust enforcement point: grant accessor roles to **groups** with **access-level
  conditions** (device/IP/geo). The backend **must validate the IAP JWT** — otherwise direct backend
  access bypasses IAP. Lock down the backend so it is reachable **only** via the IAP'd LB / IAP tunnel.
  Keep the OAuth client secret secure. Audit accessor bindings and access-level scope regularly.

## Cost levers
- IAP itself has **no per-request charge**; you pay for the **load balancer**, backends, and any
  Access Context Manager usage. The lever is the LB/backend footprint, not IAP.

## Scaling and limits
- IAP scales with the load balancer; access-level and IAM **binding limits** apply. JWT/identity
  propagation adds negligible latency. TCP forwarding throughput is bounded per tunnel — for bulk
  transfer prefer other paths. Access-level changes are **eventually consistent** (propagation delay).

## Operating procedure
1. **Provision** — enable `iap.googleapis.com`; configure the OAuth **brand** + **client**; stand up
   the **external HTTPS load balancer** + backend (Cloud Run/App Engine/GKE/VM) for web apps, or
   identify the VMs/ports for TCP forwarding.
2. **Configure** — **enable IAP** on the backend service (Terraform `google_iap_*`/LB backend
   `iap` block), or rely on IAP tunneling for TCP; define **Access Context Manager access levels** and
   attach them via IAM conditions; wire the backend to **verify the IAP JWT**.
3. **Secure** — grant `iap.httpsResourceAccessor`/`tunnelResourceAccessor` to groups with access-level
   conditions; restrict the backend to accept only IAP traffic; remove public SSH/IPs in favor of
   tunneling; protect the OAuth client secret.
4. **Verify** — apply [[verify-by-running]]: hit the app **as an authorized user** (expect 200 + valid
   `x-goog-iap-jwt-assertion`) and **as an unauthorized user / from a disallowed context** (expect the
   IAP **deny** / sign-in challenge); run `gcloud compute ssh --tunnel-through-iap` to confirm TCP
   access works only for authorized principals; confirm an **access level** blocks a non-compliant
   context. Capture the allow and the deny.

## Inputs
The resources to protect (web backends and/or VMs), the principals/groups that may access them, the
context conditions required (device/IP/geo/time), the OAuth brand/client, and the backend's ability to
verify the IAP JWT.

## Output
IAP enabled in front of the target resources (web backends and/or TCP forwarding), accessor IAM bound
to groups with Access Context Manager access-level conditions, the backend hardened to accept only IAP
traffic, plus verification of an authorized allow and an unauthorized/contextual deny.

## Notes
- Gotchas: enabling IAP without **restricting the backend** lets callers bypass IAP by hitting the
  backend directly — the backend **must verify the JWT** and reject non-IAP traffic; IAP web requires an
  **external HTTPS LB** (not raw services); access-level changes are **eventually consistent**; the
  OAuth **brand is org-internal vs external** — choose correctly; TCP forwarding still needs the target
  firewall to allow IAP's source range (`35.235.240.0/20`). 2nd consumer: the GCP role team wires zero-
  trust access posture, not just the specialist.
- IaC/CLI: Terraform `google_iap_web_backend_service_iam_member`, `google_iap_tunnel_instance_iam_member`,
  `google_iap_brand`, `google_iap_client`, and `google_access_context_manager_access_level` /
  `access_policy`; enable IAP via the LB backend `iap {}` block. CLI `gcloud iap web` /
  `gcloud iap tcp`, `gcloud compute ssh --tunnel-through-iap`, and
  `gcloud access-context-manager levels` to configure and verify.
