---
name: aws-ground-station
description: Use when designing, provisioning, securing, or operating AWS Ground Station — fully managed satellite ground stations as a service, satellite onboarding, contacts (scheduled antenna passes), mission profiles, dataflow endpoint groups and config (antenna downlink/uplink/decode), DigIF wideband vs narrowband, S3 recording or EC2/VPC delivery of downlinked data, and contact scheduling/cost (AWS Ground Station). Loads the Ground Station knowledge: onboard a satellite, define a mission profile + dataflow, schedule a contact, secure delivery, and verify a contact completes. Consumed by the Ground Station specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle satellite/downlink workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ground-station, satellite, downlink, specialized]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Ground Station

Fully managed **ground stations as a service**: rent antenna time to command satellites and downlink
their data into AWS, paying per antenna-minute with no antennas to build or operate. Data lands
directly in your VPC/EC2 or S3, close to the compute that processes it.

## Core concepts and components
- **Satellite** — an onboarded spacecraft (NORAD ID), authorized to you by the satellite operator;
  onboarding requires coordination with AWS and the operator.
- **Contact** — a scheduled antenna **pass** (a time window when a ground station can see the
  satellite) on a specific ground-station location.
- **Mission profile** — the reusable definition tying together the dataflow edges, tracking config,
  and timing for a class of contacts.
- **Config** — typed building blocks (antenna **downlink**/**uplink**, **decode**, tracking,
  dataflow endpoint, S3 recording) describing the RF/data path; **DigIF** delivers wideband digital
  IF, vs narrowband demodulated/decoded data.
- **Dataflow endpoint group** — the VPC/EC2 endpoints (or S3 recording config) that receive the
  downlinked data.

## Configuration and sizing
- Define configs once, compose them into a mission profile, and schedule contacts against it. Choose
  delivery: **S3 recording** (simple, managed) or **dataflow endpoint group** into EC2/VPC for
  real-time processing. Wideband DigIF needs higher-throughput receiving instances.

## Security and IAM
- Ground Station assumes an IAM role to deliver data; scope it to the target S3 bucket / dataflow
  endpoints least-privilege. Receive data inside your **VPC** with security groups locking the
  dataflow endpoints; KMS-encrypt S3 recordings. Satellite access is gated by operator authorization.

## Cost levers
- Billed per **antenna-minute** (reserved vs on-demand minutes) — the dominant cost. Levers: reserve
  minutes for predictable passes, schedule only needed contacts, right-size receiving EC2, and use
  S3 recording instead of always-on receivers when real-time isn't required.

## Scaling and limits
- Bound by ground-station location availability, antenna contention (passes are scheduled and
  finite), and onboarded-satellite quotas; Ground Station operates in specific Regions/locations.
  Raise quotas via support; satellite onboarding is a gated process.

## Operating procedure
1. **Provision** — onboard the **satellite** (with AWS + operator) and create the typed **configs**
   (antenna downlink, tracking, dataflow endpoint or S3 recording). Terraform coverage is partial —
   prefer CLI/CloudFormation (`AWS::GroundStation::Config`, `MissionProfile`, `DataflowEndpointGroup`).
2. **Configure** — create a **dataflow endpoint group** (VPC/EC2 receivers) or S3 recording config,
   and assemble a **mission profile** referencing the configs.
3. **Secure** — scope the delivery IAM role, lock dataflow endpoints with VPC security groups,
   KMS-encrypt S3 recordings, and confirm operator authorization for the satellite.
4. **Verify** — apply [[verify-by-running]]: `aws groundstation list-satellites` shows the onboarded
   satellite, `get-mission-profile` confirms the profile, `aws groundstation reserve-contact` then
   `describe-contact` reaches `COMPLETED`, and downlinked data appears in S3 / at the dataflow
   endpoint.

## Inputs
Satellite (NORAD ID + operator authorization), required ground-station locations/passes, downlink
data type (DigIF wideband vs narrowband), delivery target (S3 vs EC2/VPC dataflow), receiving
instance sizing, reserved vs on-demand minutes, encryption/compliance requirements.

## Output
An onboarded satellite, composed configs + a mission profile, a dataflow endpoint group or S3
recording config, secured IAM/VPC delivery, and verification of a scheduled `COMPLETED` contact with
downlinked data delivered.

## Notes
- Gotchas: satellite onboarding is a gated, multi-party process (not self-serve); contacts are
  scheduled passes — book ahead and around antenna contention; DigIF wideband needs high-throughput
  receivers or you drop data; Terraform coverage is partial — most resources are CLI/CloudFormation;
  Ground Station is available only in specific Regions/locations.
- IaC/CLI: Terraform coverage is partial (supporting `aws_iam_role`/VPC; limited native resources).
  CLI `aws groundstation list-satellites`, `create-config`, `create-dataflow-endpoint-group`,
  `create-mission-profile`, `reserve-contact`, `describe-contact`, `list-ground-stations`.
  CloudFormation `AWS::GroundStation::Config`, `AWS::GroundStation::MissionProfile`,
  `AWS::GroundStation::DataflowEndpointGroup`.
