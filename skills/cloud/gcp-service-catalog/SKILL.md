---
name: gcp-service-catalog
description: Use when designing, provisioning, securing, or operating Service Catalog — Google Cloud's service for publishing a curated, governed catalog of approved internal solutions that admins make available for org users to discover and deploy (Service Catalog). Covers catalogs (the container), solutions and their versions (Terraform configs / Deployment Manager templates / Cloud Marketplace solutions), sharing catalogs to projects/folders/org, IAM admin vs end-user (consumer) roles, launching/deploying a solution as an enrolled deployment, governance so users deploy only approved/compliant patterns, plus quotas and limits. Loads the Service Catalog knowledge: create a catalog, add governed solutions, share it, deploy as a consumer, and verify. Consumed by the Service Catalog specialist and by the GCP role team (gcp-cloud-architect / gcp-iac-engineer) when standing up a self-service governed catalog (Service Catalog).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, service-catalog, management, governance, self-service, internal-solutions]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Service Catalog

Google Cloud's service for a **curated, governed catalog of approved internal solutions**. Platform/admin
teams publish vetted, reusable deployments (Terraform configs, templates, Marketplace solutions) into a
**catalog**, share it with parts of the org, and let users **discover and deploy** only those approved
patterns — enabling **self-service** while preserving **governance and compliance**.

## Core concepts and components
- **Catalog** — the container that an admin owns and publishes solutions into; it is **shared** to
  projects/folders/the org to control who can see/use it.
- **Solutions and versions** — a published, deployable artifact backed by a **Terraform configuration**,
  a **Deployment Manager template**, or a **Cloud Marketplace** solution; solutions are **versioned** so
  consumers deploy a known-good revision.
- **Sharing** — admins **share a catalog** with target projects/folders/organization; only shared
  audiences can discover it.
- **Admin vs consumer roles** — **admins** create catalogs and publish/govern solutions; **consumers
  (end users)** browse the shared catalog and **launch/deploy** a solution into their project, getting an
  enrolled **deployment** of the approved pattern.
- **Launch / deployment** — deploying a solution provisions the underlying resources (via the backing
  config/template) as a tracked deployment, so users get compliant infrastructure without authoring IaC.
- **Governance** — because only **vetted solutions** are published, users can self-serve **only approved,
  compliant** patterns — the core value over ad-hoc provisioning.

## Configuration and sizing
- Decide the **catalog topology** (one shared org catalog vs per-domain catalogs) and the **sharing**
  scope. Curate the **solution set** (the approved patterns) and back each with a tested **Terraform/
  Deployment Manager** config or Marketplace solution, **versioned**. Keep solutions **parameterized** so
  consumers supply inputs without breaking governance.

## Security and IAM
- Separate **admin** from **consumer** IAM: catalog **admin** roles
  (`roles/cloudprivatecatalogproducer.admin`/manager) publish and govern; **consumer** roles
  (`roles/cloudprivatecatalog.consumer` / catalog viewer) only browse and launch. Grant to **groups**,
  least privilege. The deployed solution's own IAM/least-privilege still matters (the backing config must
  be compliant). Restrict who can **publish** solutions — that is the governance gate. Audit catalog
  changes and deployments.

## Cost levers
- Service Catalog itself is **free**; cost comes from the **resources solutions deploy**. Lever:
  governance reduces waste/risk by ensuring users deploy **right-sized, approved** patterns instead of
  ad-hoc resources — bake cost-sane defaults and quotas into the published solutions.

## Scaling and limits
- Limits on **catalogs, solutions, and versions** per org/project and sharing targets apply. Sharing/
  visibility changes are **eventually consistent**. Solutions are only as good as their backing
  config/template — broken or outdated solutions propagate to every consumer who deploys them, so version
  and retire deliberately.

## Operating procedure
1. **Provision** — enable the Service Catalog (Private Catalog) API; **create a catalog** owned by the
   platform/admin team (`gcloud beta service-catalog catalogs create` / the Private Catalog API).
2. **Configure** — **publish solutions** backed by tested **Terraform/Deployment Manager** configs or
   Marketplace solutions, **version** them, and **share** the catalog to the target projects/folders/org.
3. **Secure** — assign **admin (producer)** roles only to the curation team and **consumer** roles to
   user groups (least privilege), ensure each published solution's backing config is **compliant/right-
   sized**, and restrict who can publish.
4. **Verify** — apply [[verify-by-running]]: confirm the catalog is **shared** and **visible** to a target
   project, **launch a solution as a consumer** and confirm it **deploys the approved resources**, and
   confirm a **non-shared** project **cannot see** the catalog. Capture the visible/shared catalog, the
   successful consumer deployment, and the non-shared invisibility check.

## Inputs
The set of approved/compliant solutions to publish (and their backing Terraform/DM/Marketplace configs),
the catalog/sharing topology, who curates (admins) vs who consumes, versioning policy, and the
governance/compliance bar each solution must meet.

## Output
A governed catalog with curated, versioned solutions shared to the right audience, admin-vs-consumer
least-privilege IAM, and compliant backing configs — plus verification that the catalog is visible to
shared targets, a consumer can deploy an approved solution, and non-shared targets cannot see it.

## Notes
- Gotchas: **solutions are only as good as their backing config** — a broken/outdated solution propagates
  to everyone who deploys it (version and retire deliberately); **publishing** is the governance gate —
  restrict it; **sharing visibility** is eventually consistent; admins curate, **consumers self-serve only
  approved patterns**. This is the **internal governed catalog**, distinct from **Cloud Marketplace**
  (third-party) and from **Infrastructure Manager** (which runs Terraform). 2nd consumer: the GCP role
  team (gcp-cloud-architect / gcp-iac-engineer) standing up self-service governance. Cross-cloud peer:
  AWS Service Catalog.
- IaC/CLI: managed largely via the **Private Catalog / Service Catalog API** and
  `gcloud beta service-catalog catalogs / sharing-settings`; solutions wrap **Terraform configs /
  Deployment Manager templates / Marketplace** solutions. Verify by sharing to a project, deploying a
  solution as a consumer, and confirming a non-shared project cannot see the catalog.
