---
name: gcp-cloud-storage
description: Use when designing, provisioning, securing, or operating Cloud Storage — Google Cloud's object storage service for buckets and objects (Cloud Storage). Covers buckets and locations (region/dual-region/multi-region), storage classes (Standard/Nearstline/Coldline/Archive) and Autoclass, object lifecycle management (transition/delete/abort), object versioning, soft delete, retention policies and bucket lock, uniform bucket-level access vs fine-grained ACLs and IAM, signed URLs and signed policy documents, CMEK/CSEK encryption, public access prevention, requester pays, transfer (gsutil/gcloud storage, Storage Transfer Service), and cost/scaling. Loads the Cloud Storage knowledge: create buckets with the right class/location, set lifecycle/versioning/retention, lock down access, and verify. Consumed by the Cloud Storage specialist and by the GCP role team (gcp-cloud-architect / gcp-security-reviewer) when storing objects (Cloud Storage).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-storage, storage, object-storage, buckets, lifecycle, signed-urls]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Storage

Google Cloud's **object storage** service. It stores immutable **objects** in flat **buckets**
addressed by a global namespace, with multiple **storage classes**, lifecycle automation, versioning,
retention/compliance controls, and rich access management. It is the default home for unstructured
data, backups, data-lake landing zones, and static assets.

## Core concepts and components
- **Bucket** — a globally unique-named container with a fixed **location** (**region**, **dual-region**,
  or **multi-region**) and a **default storage class**. Objects inherit/override the class.
- **Storage classes** — **Standard** (hot), **Nearline** (~30-day), **Coldline** (~90-day), **Archive**
  (~365-day) trade lower storage price for higher retrieval cost + minimum-storage-duration.
  **Autoclass** moves objects between classes automatically by access pattern.
- **Lifecycle management** — rules to **transition** objects to colder classes or **delete** them by age/
  version/class, and **abort incomplete multipart uploads**. The main cost-control lever.
- **Versioning + soft delete** — keep noncurrent object versions (recover from overwrite/delete); **soft
  delete** retains deleted data for a retention window for recovery.
- **Retention + bucket lock** — a **retention policy** prevents deletion before an age; **bucket lock**
  makes it **immutable/WORM** for compliance. Object holds pin individual objects.
- **Access control** — **uniform bucket-level access** (IAM only — recommended) vs **fine-grained
  ACLs**; **public access prevention** to block `allUsers`; **signed URLs** / signed **policy documents**
  for time-limited delegated access without IAM.
- **Encryption** — Google-managed by default; **CMEK** (KMS key) or **CSEK** (customer-supplied) for
  control. **Requester pays** shifts egress/op cost to the caller.

## Configuration and sizing
- Choose **location** for latency/availability/cost (multi/dual-region for HA, region for locality and
  data residency) and a **default class** matching access frequency (or **Autoclass** when unsure). Use
  **uniform bucket-level access** + IAM (not ACLs). Add **lifecycle** rules to age data to colder classes
  / delete, enable **versioning**/**soft delete** for recovery, and **retention/bucket lock** for
  compliance. Use **signed URLs** for delegated, time-boxed access.

## Security and IAM
- Prefer **uniform bucket-level access** with least-privilege roles (`roles/storage.objectViewer`/
  `objectAdmin`/`admin`) over object ACLs. Turn on **public access prevention**; never grant `allUsers`/
  `allAuthenticatedUsers` unintentionally. Use **CMEK** for key control; sign URLs with a least-privilege
  service account and short expiry. Enable **data-access audit logs** for sensitive buckets; lock the
  bucket (retention) for WORM compliance.

## Cost levers
- Storage price by **class** + region; **retrieval/early-deletion fees** on cold classes; **egress** and
  **operations (Class A/B)** charges. Levers: **lifecycle** transitions/deletes, **Autoclass**, avoid
  early deletion of cold objects (minimum-storage-duration), co-locate compute to cut egress, and
  **requester pays** to offload cost.

## Scaling and limits
- Effectively **unlimited** capacity and high request throughput with auto-scaling; very high sustained
  request rates may need a **ramp-up** and good **key-name distribution**. Object size is bounded (single
  object up to 5 TiB). Strongly **consistent** for reads/writes/listing. Bucket name is **immutable** and
  globally unique; location/UBLA are largely **set-at-creation**.

## Operating procedure
1. **Provision** — enable `storage.googleapis.com`; create the **bucket** with the right **location**,
   **default storage class** (or Autoclass), and **uniform bucket-level access**, via Terraform
   `google_storage_bucket`.
2. **Configure** — add **lifecycle** rules (transition/delete/abort), enable **versioning** and **soft
   delete**, set **retention policy / bucket lock** if needed, configure **CMEK**, and set up transfer
   (`gcloud storage`, Storage Transfer Service) as required.
3. **Secure** — enforce **public access prevention**, bind least-privilege IAM (no `allUsers`), enable
   data-access audit logs for sensitive data, and issue **signed URLs** with a least-privilege SA + short
   expiry instead of broad grants.
4. **Verify** — apply [[verify-by-running]]: `gcloud storage cp`/`ls` to confirm authorized
   read/write works and an unauthorized principal is **denied**, confirm the **storage class/location**
   and **public-access-prevention** via `gcloud storage buckets describe`, exercise a **signed URL**
   (valid before expiry, fails after), and confirm a **lifecycle/retention** rule is in effect. Capture
   the allow, the deny, and the bucket-policy describe.

## Inputs
The data type/access pattern (hot vs archival), residency/HA needs (region vs dual/multi-region),
recovery/compliance requirements (versioning/soft-delete/retention), who needs access and how (IAM vs
signed URLs), encryption requirements (CMEK), and cost constraints.

## Output
A bucket with the appropriate location/storage class (or Autoclass), lifecycle/versioning/soft-delete/
retention configured, uniform bucket-level access with least-privilege IAM and public access prevention,
CMEK where required, and any signed-URL/transfer setup, plus verification of authorized access, denied
unauthorized access, and the effective bucket policy.

## Notes
- Gotchas: **bucket names are global + immutable** and **location is fixed at creation**; cold classes
  have **retrieval + early-deletion fees** (minimum-storage-duration) — don't store hot data in Archive;
  prefer **uniform bucket-level access** over ACLs; **public access prevention** + no `allUsers` avoids
  accidental public buckets; **signed URLs** need a least-privilege signer + short expiry; **retention/
  bucket lock is irreversible** once locked. 2nd consumer: the GCP role team designs data/storage
  layout, not just the specialist. Cross-cloud peers: AWS S3, Azure Blob Storage.
- IaC/CLI: Terraform `google_storage_bucket` (`lifecycle_rule`, `versioning`, `soft_delete_policy`,
  `retention_policy`, `uniform_bucket_level_access`, `public_access_prevention`, `encryption` CMEK),
  `google_storage_bucket_iam_member`, `google_storage_bucket_object`. CLI `gcloud storage` (cp/ls/
  buckets describe/buckets update), `gcloud storage sign-url`, and Storage Transfer Service to operate
  and verify.
