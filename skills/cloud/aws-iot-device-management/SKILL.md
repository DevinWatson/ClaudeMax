---
name: aws-iot-device-management
description: Use when onboarding, organizing, searching, updating, or remotely accessing large device fleets with AWS IoT Device Management — fleet provisioning (provisioning templates, claim certificates, just-in-time provisioning/registration, trusted-user flows), thing groups and dynamic thing groups, jobs for remote operations/OTA at scale, fleet indexing and fleet-wide search/aggregation, and secure tunneling for remote SSH/access to devices behind firewalls (AWS IoT Device Management). Loads the Device Management knowledge: how to onboard devices at scale, organize fleets into groups, run and target jobs, search the fleet, and open secure tunnels, then verify. Consumed by the Device Management specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) building fleet operations.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, iot-device-management, fleet-provisioning, jobs, fleet-indexing, secure-tunneling]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS IoT Device Management

The **fleet operations** layer on top of AWS IoT Core: it onboards devices at scale, organizes them,
searches across them, pushes remote operations, and opens secure remote-access sessions. It does not
own connectivity itself — devices connect through IoT Core (MQTT); for on-device/edge runtime use
IoT Greengrass.

## Core concepts and components
- **Fleet provisioning** — onboard devices at scale via **provisioning templates** plus **claim
  certificates** (provisioning by claim), **just-in-time provisioning/registration (JITP/JITR)** on
  first connect, or a **trusted-user / fleet provisioning by trusted user** flow.
- **Thing groups & dynamic thing groups** — static hierarchical groups and **dynamic groups** whose
  membership is defined by a fleet-index query, used to target jobs and apply policies in bulk.
- **Jobs** — remote operations sent to a set of targets (groups/things): OTA firmware updates,
  config changes, reboots — with rollout/abort/timeout configs and continuous vs. snapshot jobs.
- **Fleet indexing** — indexes registry data, shadows, connectivity, and Device Defender violations
  so you can run fleet-wide **search and aggregation** queries.
- **Secure tunneling** — opens a bidirectional **tunnel** (source/destination access tokens) for
  remote SSH/access to a device behind a firewall/NAT without inbound ports.

## Configuration and sizing
- Choose a provisioning flow by trust model: claim certs + templates for manufactured fleets, JITP
  for devices with pre-installed certs, trusted-user for installer-driven onboarding.
- Enable only the fleet-index sources you query (registry/shadow/connectivity/violations) to control
  cost; design dynamic groups from index queries to keep job targeting automatic as the fleet grows.

## Security and IAM
- Provisioning templates should attach least-privilege per-device IoT policies and use a provisioning
  role; rotate/deactivate claim certs and revoke compromised device certs.
- Job documents reference signed artifacts (e.g., presigned S3 URLs) with scoped roles; secure
  tunneling tokens are short-lived and single-use — scope `iot:OpenTunnel`/`StartTunnel` tightly.

## Cost levers
- Billed by remote actions/jobs, fleet-indexing (indexed data + queries), and secure tunneling
  minutes. Index only needed sources, batch jobs with sensible rollout rates, and close tunnels
  promptly.

## Scaling and limits
- Scales to millions of things; quotas on concurrent jobs, job targets, dynamic groups, and tunnel
  concurrency apply. Use staged/continuous job rollouts and dynamic groups for very large fleets.

## Operating procedure
1. **Provision** — create a provisioning template (+ claim cert or JITP/trusted-user flow) via
   Terraform `aws_iot_provisioning_template` or `aws iot create-provisioning-template`; register a
   fleet and confirm devices appear in the registry.
2. **Configure** — create thing groups / dynamic thing groups, enable fleet indexing with the needed
   sources, and define jobs (`aws iot create-job`) targeting groups.
3. **Secure** — least-privilege per-device policies from the template, scoped provisioning/job roles,
   short-lived tunneling tokens, and revocation procedures.
4. **Verify** — apply [[verify-by-running]]: run a fleet-index query (`aws iot search-index`) to
   confirm membership, `aws iot describe-job-execution` to confirm a job reached a device, and
   `aws iot open-tunnel` then confirm the destination connected for a remote-access check.

## Inputs
Fleet size and manufacturing/trust model, provisioning flow, grouping/targeting scheme, the remote
operations (OTA/config) to run, which fleet attributes you need to search, and remote-access needs.

## Output
A provisioning template + onboarding flow, thing groups / dynamic groups, fleet indexing enabled with
search queries, jobs targeting the fleet, secure-tunneling access, and verification that a device
onboarded, a job executed, and the index/tunnel works.

## Notes
- Gotchas: pick the provisioning flow per trust model (claim certs must be tightly scoped and
  rotated); fleet indexing must be explicitly enabled per source and incurs cost; dynamic groups
  depend on fleet indexing; jobs need scoped roles and signed artifacts; tunnel tokens are
  single-use/short-lived; connectivity itself is IoT Core, not Device Management.
- IaC/CLI: Terraform `aws_iot_provisioning_template`, `aws_iot_thing_group`,
  `aws_iot_thing_group_membership`, `aws_iot_indexing_configuration`. CLI
  `aws iot create-provisioning-template` / `create-thing-group` / `update-indexing-configuration` /
  `search-index` / `create-job` / `describe-job-execution` / `open-tunnel`. CloudFormation
  `AWS::IoT::ProvisioningTemplate`, `::ThingGroup`, `::JobTemplate`.
