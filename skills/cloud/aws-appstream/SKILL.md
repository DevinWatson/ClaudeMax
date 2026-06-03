---
name: aws-appstream
description: Use when designing, provisioning, securing, or operating Amazon AppStream 2.0 — non-persistent application/desktop streaming, fleets (Always-On/On-Demand/Elastic), stacks and user access (user pools/SAML 2.0/API), Image Builder and custom images, fleet auto-scaling, session storage (home folders to S3, Google Drive/OneDrive), VPC networking, and usage reports (Amazon AppStream 2.0). Loads the AppStream knowledge: build an image, run a fleet+stack, scale it, secure access, and verify a streaming session. Consumed by the AppStream specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle application streaming.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, appstream, application-streaming, fleets, stacks, end-user-computing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon AppStream 2.0

Fully managed, non-persistent application and desktop streaming. Users stream a centrally managed
application (or full desktop) from a fleet of streaming instances to any HTML5 browser or the native
client — nothing is installed locally and instances are recycled between sessions. Use this for
non-persistent app delivery; use Amazon WorkSpaces for persistent per-user VDI.

## Core concepts and components
- **Image** — an AMI-like snapshot of installed applications + the AppStream agent, produced by an
  **Image Builder** (a temporary instance you install software on, then create an image from).
- **Fleet** — the pool of streaming instances that run sessions. Types: **Always-On** (instances
  always running, instant start, pay for running), **On-Demand** (stopped until requested, ~1–2 min
  start, cheaper idle), **Elastic** (no image/Image Builder; app packaged in S3, instances managed
  by AWS, pay-per-session).
- **Stack** — the user-facing environment that pairs with a fleet and carries policies (storage,
  clipboard, file transfer, print) and **user access** (built-in **user pool**, **SAML 2.0** SSO, or
  the CreateStreamingURL **API/streaming URL**).
- **Auto-scaling** — scaling policies on fleet capacity (target capacity, step/target-tracking on
  CapacityUtilization) to match concurrent demand.
- **Session storage** — **home folders** persisted to S3, plus optional Google Drive / OneDrive.

## Configuration and sizing
- Pick the instance family by workload (general purpose, compute, memory, graphics/G4 for GPU apps).
- Choose fleet type by usage shape: Always-On for steady/low-latency, On-Demand for spiky, Elastic
  for simple session-packaged apps without managing an image. Set min/max/desired capacity and a
  disconnect/idle timeout to release seats.

## Security and IAM
- Stream inside a VPC; use the fleet's network interfaces with security groups + subnets reaching
  app dependencies; prefer SAML 2.0 federation over the built-in user pool for enterprise SSO.
- Restrict stack policies (clipboard, file transfer, print) to least privilege; the fleet IAM role
  grants in-session AWS access — scope it tightly. Encrypt home-folder S3 with KMS.

## Cost levers
- Fleet type and capacity are the biggest levers: On-Demand/Elastic for spiky usage, aggressive idle
  disconnect timeouts, and auto-scaling min capacity near zero off-hours. Right-size the instance
  family; graphics instances are expensive — only for GPU apps.

## Scaling and limits
- Concurrent sessions are bounded by fleet max capacity and per-account instance/fleet quotas
  (raise via Service Quotas). Image Builder and image counts are quota-limited per Region.

## Operating procedure
1. **Provision** — launch an **Image Builder**, install applications + create an image (or for
   Elastic, package the app to S3). Create the **fleet** (type, instance family, capacity) via
   Terraform `aws_appstream_fleet` (+ `aws_appstream_image_builder`) or `aws appstream create-fleet`.
2. **Configure** — create the **stack**, associate the fleet, set storage/clipboard/transfer
   policies, attach auto-scaling policies, and enable home folders to S3.
3. **Secure** — place the fleet in the VPC with least-privilege security groups, wire SAML 2.0 SSO,
   scope the fleet IAM role and stack policies, and KMS-encrypt home-folder storage.
4. **Verify** — apply [[verify-by-running]]: `aws appstream describe-fleets` shows the fleet
   `RUNNING`, `describe-stacks` confirms the stack/policies, `aws appstream create-streaming-url`
   yields a session URL, and a streaming session launches the application for an authorized user.

## Inputs
Applications to stream, expected concurrent users + usage shape, fleet type preference, instance
family/GPU needs, identity source (user pool vs SAML), storage/clipboard/transfer policy, VPC and
app-dependency reachability, encryption requirements.

## Output
An image (or Elastic app package), a fleet (type + sized capacity + auto-scaling) associated to a
stack with access + policies, VPC/security config, and verification of a `RUNNING` fleet plus a
working authorized streaming session.

## Notes
- Gotchas: fleets are non-persistent — nothing survives a session except home folders (set them up
  or users lose data); image updates require rebuilding via Image Builder and updating the fleet;
  Always-On bills even idle; On-Demand has a cold start; Elastic fleets cannot use a custom image.
- IaC/CLI: Terraform `aws_appstream_fleet`, `aws_appstream_stack`,
  `aws_appstream_fleet_stack_association`, `aws_appstream_image_builder`,
  `aws_appstream_directory_config`. CLI `aws appstream create-fleet/create-stack/associate-fleet`,
  `start-fleet`, `create-streaming-url`, `describe-fleets`. CloudFormation `AWS::AppStream::Fleet`,
  `AWS::AppStream::Stack`, `AWS::AppStream::ImageBuilder`.
