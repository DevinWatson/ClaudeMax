---
name: aws-pinpoint
description: Use when designing, provisioning, securing, or operating Amazon Pinpoint — multichannel customer engagement across email, SMS/MMS, push (APNs/FCM), voice, and custom channels, projects/applications, endpoints and user attributes, segments (dynamic/imported), campaigns and multi-step journeys, message templates, A/B testing, and analytics/event streaming to Kinesis (Amazon Pinpoint). Loads the Pinpoint knowledge: create a project, ingest endpoints, build segments, run a campaign/journey, secure it, and verify a send. Consumed by the Pinpoint specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle customer engagement.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, pinpoint, customer-engagement, campaigns, segments, business-apps]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Pinpoint

A multichannel customer engagement service for targeted, measurable outbound communication. You
ingest audience data, build segments, and orchestrate campaigns and journeys across email, SMS,
push, and voice — with analytics. For raw transactional/bulk email sending use Amazon SES; Pinpoint
sits above it for engagement and can use SES as its email channel.

## Core concepts and components
- **Project (application)** — the container for channels, endpoints, segments, and campaigns.
- **Channels** — email, **SMS/MMS**, **push** (APNs/FCM/ADM/Baidu), voice, and custom; each must be
  enabled and configured (the email channel uses a verified SES identity).
- **Endpoints** — a destination + attributes (address, channel type, user/attributes, metrics); an
  endpoint can belong to a **user** (multiple endpoints per user).
- **Segments** — **dynamic** (filter on attributes/behavior) or **imported** (from S3); the targeting
  audience.
- **Campaigns** — a message to a segment on a schedule (with optional **A/B testing** and holdout).
- **Journeys** — multi-step, branching engagement flows (wait, multivariate split, send) over time.
- **Templates** — reusable message templates; **analytics/event streaming** to Kinesis Firehose.

## Configuration and sizing
- One project per app/brand. Enable only the channels you use; configure the email channel against a
  verified SES identity and SMS with the right origination (long code/short code/10DLC/sender ID).
  Size by endpoints and monthly targeted messages.

## Security and IAM
- Scope IAM to the project (`mobiletargeting` actions); the import/event roles need least-privilege
  S3/Kinesis access. SMS requires registered origination identities (10DLC/short codes) per country
  rules — unregistered traffic is filtered.
- Treat endpoint PII carefully; encrypt event-stream and import S3 with KMS; honor opt-outs.

## Cost levers
- Pay per channel message + monthly targeted audience (MTA) + endpoints. Levers: tighten segments to
  reduce wasted sends, use journeys to throttle/dedupe, prune stale endpoints, and pick the cheapest
  effective channel per message.

## Scaling and limits
- Per-project quotas bound endpoints, segments, campaigns, and import sizes; channel throughput is
  bounded by the underlying channel (SES send rate, SMS spend limit, push provider limits). Raise via
  Service Quotas / support.

## Operating procedure
1. **Provision** — create the **project (application)** and enable the needed **channels** via
   Terraform `aws_pinpoint_app` (+ `aws_pinpoint_email_channel` / `_sms_channel` / `_gcm_channel` /
   `_apns_channel`) or `aws pinpoint create-app` / `update-email-channel`.
2. **Configure** — ingest **endpoints** (or import from S3), build **segments**, author **templates**,
   and create a **campaign** or **journey** targeting a segment.
3. **Secure** — scope project IAM, configure registered SMS origination, KMS-encrypt import/event-
   stream storage, honor opt-outs, and enable event streaming to Kinesis for analytics.
4. **Verify** — apply [[verify-by-running]]: `aws pinpoint get-app` confirms the project,
   `get-segment` / `get-campaign` confirm the audience and campaign, and a test
   `aws pinpoint send-messages` (or campaign execution) delivers to a test endpoint with a delivery
   event in the analytics stream.

## Inputs
Channels needed, audience size + source (endpoint ingest vs S3 import), email SES identity, SMS
origination/country requirements, segmentation rules, campaign vs journey orchestration, analytics
destination, PII/opt-out and encryption requirements.

## Output
A Pinpoint project with enabled channels, ingested endpoints, segments, templates, and a campaign or
journey, secured IAM + registered origination + KMS, and verification of the project/segment plus a
successful delivered test message with analytics events.

## Notes
- Gotchas: the email channel requires a verified SES identity (deliverability rules from SES still
  apply); SMS needs registered origination (10DLC/short codes) or messages are filtered; deleting a
  project drops endpoints/segments; journeys and campaigns target a snapshot/dynamic segment — know
  which; Pinpoint is being de-emphasized in favor of newer engagement services in some Regions.
- IaC/CLI: Terraform `aws_pinpoint_app`, `aws_pinpoint_email_channel`, `aws_pinpoint_sms_channel`,
  `aws_pinpoint_gcm_channel`, `aws_pinpoint_apns_channel`, `aws_pinpoint_event_stream`. CLI
  `aws pinpoint create-app`, `update-email-channel`, `create-segment`, `create-campaign`,
  `create-journey`, `send-messages`, `get-app`. CloudFormation `AWS::Pinpoint::App`,
  `AWS::Pinpoint::Campaign`, `AWS::Pinpoint::Segment`.
