---
name: aws-transfer-family
description: Use when designing, provisioning, securing, or operating AWS Transfer Family — fully managed SFTP, FTPS, FTP, and AS2 servers/connectors fronting Amazon S3 or Amazon EFS, with service-managed or custom (Lambda/API Gateway/Directory Service) identity providers, users and home directories with logical directory mappings, workflows for post-upload processing, and endpoint types (public/VPC) (AWS Transfer Family). Loads the Transfer Family knowledge: how to stand up a managed file-transfer endpoint over S3/EFS, authenticate users, scope access to home directories, process uploads, and verify a transfer succeeds. Consumed by the Transfer Family specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they expose managed file transfer.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, transfer-family, sftp, ftps, as2, managed-file-transfer]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Transfer Family

Fully managed file transfer over **SFTP, FTPS, FTP, and AS2** with storage backed by **Amazon S3
or Amazon EFS**. It replaces self-managed file-transfer servers: AWS runs the protocol endpoint
and you map users to S3 prefixes / EFS paths. Use it for B2B/partner file exchange and ingest — it
is protocol-level managed transfer, not a CDN, not a database move (that is DMS), and not server
rehosting (that is MGN).

## Core concepts and components
- **Server** — a managed endpoint speaking one or more protocols (SFTP/FTPS/FTP/AS2). FTP/FTPS
  require a VPC endpoint; SFTP supports public or VPC.
- **Storage backend** — S3 (object) or EFS (POSIX file); chosen per server/user.
- **Identity provider** — **service-managed** (SSH keys/passwords stored by Transfer), **AWS
  Directory Service**, or **custom** (Lambda or API Gateway) for external auth (e.g. against your
  IdP/database).
- **Users + home directory** — each user has an IAM role (access scope) and a home directory;
  **logical directory mappings** present a virtual path tree without exposing real bucket layout.
- **Workflows** — managed (post-upload) and on-partial-upload steps: copy, tag, decrypt (PGP),
  custom Lambda — for processing files as they land.
- **AS2** — for EDI/B2B with signing/encryption, MDN receipts, and trading-partner profiles.

## Configuration and sizing
- Pick the protocol(s) the partner needs and the endpoint type (public SFTP vs. VPC for FTPS/FTP
  or fixed/allow-listed IPs). Use logical home directories so each user is jailed to its prefix.
- Use workflows to validate/transform/route uploads instead of polling S3 separately.

## Security and IAM
- Each user's IAM role + (optional) session policy scopes access to exactly their S3 prefix/EFS
  path — least privilege per user. Prefer SFTP/FTPS (encrypted in transit); avoid plain FTP except
  inside a trusted VPC.
- Use a custom identity provider to authenticate against your own IdP; rotate host keys; encrypt
  the S3/EFS data at rest with KMS; restrict source IPs with security groups (VPC endpoint).

## Cost levers
- Billed per protocol-enabled endpoint-hour plus data uploaded/downloaded; consolidate protocols
  on one server where possible and stop unused servers. Storage cost is normal S3/EFS pricing.

## Scaling and limits
- The endpoint scales managed by AWS; concurrency and per-user throughput are generally ample for
  B2B. AS2 has message-size considerations; logical mappings and user counts have soft limits.

## Operating procedure
1. **Provision** — create a server with the needed protocol(s), endpoint type, and identity
   provider via Terraform `aws_transfer_server` or `aws transfer create-server`.
2. **Configure** — add users with scoped IAM roles and home directories / logical mappings (or
   wire the custom identity provider); attach workflows for post-upload processing; set up AS2
   partner profiles if used.
3. **Secure** — per-user least-privilege roles + session policies, encrypted protocols, KMS at
   rest, source-IP restriction, host-key rotation.
4. **Verify** — apply [[verify-by-running]]: `aws transfer describe-server` shows the endpoint
   ONLINE, `aws transfer test-identity-provider` confirms a user authenticates and resolves the
   right home directory/role, and an SFTP `put`/`get` round-trip lands the file in the expected
   S3 prefix/EFS path (and an unauthorized path is denied).

## Inputs
Required protocol(s), partners/users + their auth method, S3/EFS backend + per-user path layout,
endpoint type and IP allow-listing, processing needs (workflows/PGP/AS2), and encryption/compliance.

## Output
A Transfer Family server (chosen protocols + endpoint type), users with scoped roles and home
directories/logical mappings, identity-provider wiring, workflows/AS2 as needed, and verification
of an ONLINE endpoint, successful auth, and a working scoped transfer round-trip.

## Notes
- Gotchas: FTP/FTPS need a VPC endpoint (no public FTP); logical directory mappings are required
  to hide real bucket structure and jail users; the user IAM role + session policy (not just the
  bucket policy) governs access; custom identity providers must return the correct
  `HomeDirectory`/`Role`/`Policy`; AS2 requires correctly exchanged certs/profiles; Transfer Family
  is managed file transfer, not bulk database migration (DMS) or server rehost (MGN).
- IaC/CLI: Terraform `aws_transfer_server`, `aws_transfer_user`, `aws_transfer_ssh_key`,
  `aws_transfer_workflow`. CLI `aws transfer create-server`, `create-user`, `describe-server`,
  `test-identity-provider`, `create-workflow`. CloudFormation `AWS::Transfer::Server`, `::User`,
  `::Workflow`.
