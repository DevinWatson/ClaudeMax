---
name: aws-iot-core
description: Use when designing, provisioning, securing, or operating AWS IoT Core — the device gateway and MQTT/MQTT-over-WebSocket/HTTP broker, the device registry (things, types, groups), X.509 certificate + policy authentication/authorization, device shadows (reported/desired state), the rules engine routing messages to AWS services, fleet provisioning, jobs for remote operations, and Device Defender for fleet security (AWS IoT Core). Loads the IoT Core knowledge: how to register and securely connect devices over MQTT, route telemetry with rules, manage state with shadows, run remote jobs, and verify a device connects and publishes. Consumed by the IoT Core specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they build IoT connectivity.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, iot-core, mqtt, device-registry, device-shadow, rules-engine]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS IoT Core

The managed **cloud-side** connectivity layer for IoT: a scalable device gateway and **MQTT** (and
MQTT-over-WebSocket / HTTP) broker that lets billions of devices connect securely and exchange
messages with AWS. It is the cloud endpoint; for compute/ML *on the device or at the edge* use IoT
Greengrass (which connects back to IoT Core).

## Core concepts and components
- **Device gateway / message broker** — pub/sub over MQTT topics; devices publish telemetry and
  subscribe to commands.
- **Registry** — **things** (device identities), **thing types**, and **thing groups** for
  organization and bulk operations.
- **Authentication/authorization** — per-device **X.509 certificates** (or Cognito/custom
  authorizers) plus **IoT policies** scoping which topics a device may connect/publish/subscribe.
- **Device shadow** — a JSON document holding **reported** and **desired** state so apps and
  devices sync even when the device is offline.
- **Rules engine** — SQL-like rules on incoming MQTT messages that route/transform to other AWS
  services (Lambda, DynamoDB, S3, Kinesis, SNS, Timestream, etc.).
- **Fleet provisioning** (templates/claim certs), **Jobs** (remote operations/OTA), and **Device
  Defender** (audit + behavior anomaly detection).

## Configuration and sizing
- Register things with a consistent naming/grouping scheme; design a topic hierarchy that maps to
  tenants/device groups for clean policy scoping. Use thing groups + dynamic groups for fleet ops.
- Use **fleet provisioning** to onboard devices at scale rather than per-device manual cert
  creation; use shadows for state, not high-frequency telemetry.

## Security and IAM
- Unique per-device X.509 cert + a least-privilege IoT policy scoped to that device's topics (use
  policy variables like `${iot:Connection.Thing.ThingName}`). Never share certs across devices.
- Enforce TLS (mutual auth); enable **Device Defender** audits + detect; rules-engine actions use
  scoped IAM roles. Rotate/deactivate compromised certs immediately.

## Cost levers
- Billed by connectivity minutes, messages, rules-engine actions/executions, registry/shadow ops,
  and Device Defender. Batch/throttle telemetry, prune chatty rules, and use Basic Ingest to skip
  pub/sub charges when routing straight to a rule.

## Scaling and limits
- Scales to very large fleets; per-connection publish rate, message size (128 KB), topic, and
  shadow size limits apply. Use shared subscriptions / fan-out via the rules engine; raise account
  quotas as fleets grow.

## Operating procedure
1. **Provision** — register a thing (and thing type/group), create an X.509 certificate, and
   create + attach a scoped IoT policy via Terraform `aws_iot_thing` / `aws_iot_certificate` /
   `aws_iot_policy` or `aws iot create-thing` + `create-keys-and-certificate` + `create-policy`.
2. **Configure** — set up the topic hierarchy, device shadow, rules-engine rules to AWS targets,
   fleet-provisioning templates, and jobs as needed.
3. **Secure** — per-device least-privilege policies with policy variables, mutual TLS, Device
   Defender audit/detect, scoped rule action roles.
4. **Verify** — apply [[verify-by-running]]: `aws iot describe-endpoint --endpoint-type iot:Data-ATS`
   to get the endpoint, confirm the policy attachment with `aws iot list-attached-policies`, then
   publish/subscribe a test message (e.g. `aws iot-data publish` and check the shadow with
   `aws iot-data get-thing-shadow`) and confirm a rule delivered to its target.

## Inputs
Device fleet size + identity model, telemetry/command topic design, auth method (X.509/Cognito),
state vs. telemetry needs, downstream targets for the rules engine, provisioning approach, and
security/compliance requirements.

## Output
Registered things with per-device certs + scoped IoT policies, a topic hierarchy, device shadows,
rules-engine routing to AWS targets, Device Defender enabled, and verification that a device
connects, publishes, and a rule/shadow reflects the message.

## Notes
- Gotchas: each device needs its own cert + tight policy (use policy variables, never wildcard
  topics); shadows are for state not high-rate telemetry; MQTT message size is capped (128 KB);
  the data endpoint (`iot:Data-ATS`) differs from the control-plane endpoint; rules-engine roles
  must allow the target action; IoT Core is the cloud side — for on-device/edge compute use IoT
  Greengrass, which connects to IoT Core.
- IaC/CLI: Terraform `aws_iot_thing`, `aws_iot_thing_type`, `aws_iot_certificate`,
  `aws_iot_policy`, `aws_iot_policy_attachment`, `aws_iot_topic_rule`. CLI `aws iot create-thing`,
  `create-keys-and-certificate`, `create-policy`, `attach-policy`, `create-topic-rule`,
  `describe-endpoint`, `aws iot-data publish` / `get-thing-shadow`. CloudFormation
  `AWS::IoT::Thing`, `::Certificate`, `::Policy`, `::TopicRule`.
