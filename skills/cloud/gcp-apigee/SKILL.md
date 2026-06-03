---
name: gcp-apigee
description: Use when designing, provisioning, securing, or operating Apigee — Google Cloud's full API management platform: the Apigee organization, environments and environment groups, API proxies (proxy/target endpoints, flows, conditional flows), policies (OAuth2/API key/JWT verification, quota, spike arrest, traffic management, mediation/transformation, fault handling), shared flows and flow hooks, the developer portal, API products, developer apps and API keys, analytics, and deployment, plus Apigee X vs hybrid, networking/peering, IAM, and cost (Apigee). Loads the Apigee knowledge: build a proxy with policies, publish an API product + portal, secure with OAuth2/keys, deploy to an environment, and verify a managed call. Consumed by the Apigee specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they manage APIs at scale.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, apigee, application-development, api-management, api-proxy, oauth2]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Apigee

Google Cloud's full **API management** platform. Beyond routing, it owns the complete API lifecycle:
proxies with rich policy pipelines, security and traffic management, a developer portal and API
products, monetization, and analytics — for large API programs and external developer ecosystems.

## Core concepts and components
- **Organization / environments / environment groups** — an Apigee **org** is the top container;
  **environments** (e.g. test/prod) host deployed proxies; **environment groups** map hostnames to
  environments for routing.
- **API proxies** — the deployable unit: a **proxy endpoint** (faces clients) and a **target
  endpoint** (faces the backend), each with request/response **flows** and **conditional flows**
  that execute **policies** in order.
- **Policies** — configurable steps: security (**VerifyAPIKey**, **OAuthV2**, **VerifyJWT**), traffic
  management (**Quota**, **SpikeArrest**, **ResponseCache**), and mediation/transformation
  (JSON/XML, **AssignMessage**, JavaScript/Python callouts, **RaiseFault** for error handling).
- **Shared flows + flow hooks** — reusable policy sequences attached across proxies (e.g. a common
  auth/logging flow).
- **Developer-facing model** — **API products** bundle proxy resources + quotas; **developers** and
  their **apps** receive **API keys/OAuth credentials**; the **developer portal** publishes docs and
  self-service onboarding; **monetization** meters and bills usage.
- **Analytics** — built-in API traffic, latency, and error analytics dashboards.
- **Editions** — **Apigee X** (the GCP-native managed edition) vs **hybrid** (runtime in your own
  Kubernetes).

## Configuration and sizing
- Provision the **Apigee X** org (region, networking/VPC peering, encryption), define **environments**
  and **environment groups** + hostnames. Build proxies with the right policy pipeline; factor common
  logic into **shared flows**. Bundle access as **API products** with **quotas**, and publish a
  **portal**. Sizing is via the org's provisioned capacity/throughput tier (Apigee X is largely
  managed); hybrid sizing depends on your runtime cluster.

## Security and IAM
- Enforce app auth in-proxy with **VerifyAPIKey** / **OAuthV2** / **VerifyJWT**, and protect backends
  with **SpikeArrest** + **Quota**. Manage platform access with least-privilege Apigee IAM roles
  (`roles/apigee.environmentAdmin`, `roles/apigee.developerAdmin` — avoid org admin broadly). Keep
  target backends reachable only from Apigee, use TLS to targets, store secrets in the **KVM**/Secret
  Manager (not in proxy XML), enable VPC-SC where required, and audit via Cloud Audit Logs.

## Cost levers
- Apigee is priced by **edition + API call volume / throughput tier** (it is a significant fixed +
  usage cost). Levers: use **ResponseCache** to cut backend calls, **SpikeArrest/Quota** to bound
  traffic, right-size the throughput tier, retire unused proxies/environments, and consolidate proxies
  via shared flows. Use API Gateway instead when you only need lightweight routing (far cheaper).

## Scaling and limits
- Apigee X scales within the provisioned throughput tier; hybrid scales with your runtime cluster.
  Per-org limits govern environments, proxies, revisions, and deployments; policies like SpikeArrest
  protect backends. Confirm regional availability and networking (VPC peering) before provisioning.

## Operating procedure
1. **Provision** — enable the Apigee API (`gcloud services enable apigee.googleapis.com`), provision
   the **Apigee X org** (region, VPC peering/networking, encryption), and create **environments** +
   **environment groups** with hostnames.
2. **Configure** — build an **API proxy** (proxy/target endpoints, flows) with the needed **policies**
   (auth, quota, spike arrest, mediation), factor reuse into **shared flows**, then create **API
   products**, **developers/apps**, and publish the **developer portal**.
3. **Secure** — enforce VerifyAPIKey/OAuth/JWT + SpikeArrest/Quota in proxies, scope Apigee IAM
   least-privilege, keep targets private + TLS, store secrets in KVM/Secret Manager, enable VPC-SC.
4. **Verify** — apply [[verify-by-running]]: confirm the proxy is **deployed** to the environment
   (`gcloud apigee apis ... `/`apigee deployments`), then call the env-group hostname for the proxy
   path with `curl` — once without credentials (expect 401/403) and once with a valid API key/OAuth
   token (expect 200 routed to the backend), confirming policies and quota fire — capture the actual
   output.

## Inputs
The API program scope (proxies + backends), required policies (auth/quota/spike/mediation), product +
developer/portal model, edition (Apigee X vs hybrid), region + networking, throughput/cost tier, and
IAM scope.

## Output
An Apigee setup (org + environments + environment groups, API proxy with its policy pipeline + shared
flows, API products/developers/apps, optional portal, scoped IAM, secrets in KVM) deployed to an
environment, plus verification that a managed call enforces auth/policies and routes to the backend.

## Notes
- Gotchas: Apigee is heavyweight + costly — choose **API Gateway** when you only need lightweight
  routing; org provisioning requires VPC peering/networking decisions up front and is hard to undo;
  proxies deploy as **revisions** to environments (deploy a new revision to change behavior); never
  hardcode secrets in proxy XML (use KVM/Secret Manager); SpikeArrest vs Quota are different
  mechanisms (smoothing vs counting); Apigee X vs hybrid differ substantially. Apigee is the FULL API
  management platform; the AWS equivalent is Amazon API Gateway (with usage plans), Azure is API
  Management.
- IaC/CLI: Terraform `google_apigee_organization`, `google_apigee_environment`,
  `google_apigee_envgroup`/`_envgroup_attachment`, `google_apigee_instance`, plus
  `google_project_service`; proxies/policies are bundle artifacts deployed via the API/`gcloud apigee`
  or apigeecli rather than declared in Terraform. CLI `gcloud apigee` (organizations, environments,
  deployments) and the Apigee management API/apigeecli for proxy bundles and products.
