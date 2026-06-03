---
name: aws-mq
description: Use when designing, provisioning, securing, or operating Amazon MQ — managed message brokers for Apache ActiveMQ (Classic) and RabbitMQ, broker engines and instance sizing, single-instance vs active/standby and cluster (RabbitMQ) deployment modes for HA, standard messaging protocols (JMS, AMQP 0-9-1 and 1.0, MQTT, STOMP, OpenWire, WebSocket), broker configuration (revisions), users/groups and authentication, VPC placement + security groups, KMS encryption in transit/at rest, CloudWatch metrics, and maintenance windows/patching (Amazon MQ). Loads the Amazon MQ knowledge: how to stand up an HA broker, connect over a standard protocol, secure it in a VPC, and verify produce/consume. Consumed by the Amazon MQ specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they lift-and-shift broker workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, mq, message-broker, activemq, rabbitmq, application-integration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon MQ

Managed message broker for **Apache ActiveMQ (Classic)** and **RabbitMQ**. It runs standard
open-protocol brokers so you can lift-and-shift existing JMS/AMQP/MQTT/STOMP applications to
AWS without re-architecting. Use Amazon MQ when you need broker compatibility / standard
protocols; use SQS/SNS for cloud-native AWS messaging and MSK for high-throughput Kafka streaming.

## Core concepts and components
- **Broker** — a managed broker instance (or set) running a chosen **engine**: ActiveMQ
  Classic or RabbitMQ, pinned to an engine version.
- **Deployment modes** — **single-instance** (dev/test, no HA); **active/standby** (ActiveMQ,
  two AZs with automatic failover on shared EFS-backed storage); **cluster** (RabbitMQ, three
  nodes across AZs).
- **Protocols** — ActiveMQ: OpenWire, AMQP, STOMP, MQTT, WebSocket, plus JMS via OpenWire.
  RabbitMQ: AMQP 0-9-1 (and management/WebSocket). This is the key reason to choose MQ over SQS.
- **Configuration (revisions)** — broker config is versioned XML (ActiveMQ) / policies
  (RabbitMQ): destinations, queues/exchanges, policies, network connectors.
- **Users/groups** — broker-local users (or LDAP for ActiveMQ) for authentication/authorization.
- **Maintenance window** — AWS applies minor patches; you pick the weekly window.

## Configuration and sizing
- Use single-instance only for dev; production = active/standby (ActiveMQ) or 3-node cluster
  (RabbitMQ) across AZs. Size the broker instance type to peak connections/throughput and
  enable storage appropriately (EFS-backed durability for ActiveMQ active/standby).
- Tune destinations/policies in a config revision and apply during the maintenance window.

## Security and IAM
- Deploy brokers in **private subnets** with security groups limiting access to app/clients;
  prefer no public accessibility. Encrypt at rest with KMS and require TLS in transit. Manage
  broker users/credentials in Secrets Manager (avoid plaintext). IAM controls the AWS-side MQ
  management API; message-level auth is broker-local (users/groups) or LDAP for ActiveMQ.

## Cost levers
- Billed per broker-instance-hour + storage; the deployment mode multiplies instance cost
  (active/standby ~2x, cluster ~3x). Right-size the instance type, use single-instance for
  non-prod, and prefer SQS/SNS for new cloud-native workloads that don't need broker protocols.

## Scaling and limits
- A broker is vertically scaled (change instance type); RabbitMQ clusters add nodes for HA not
  linear throughput. For very high-throughput streaming use MSK (Kafka) instead. Connection and
  storage limits depend on engine + instance type.

## Operating procedure
1. **Provision** — create the broker (engine, version, deployment mode, instance type) in
   private subnets via Terraform `aws_mq_broker` or `aws mq create-broker`.
2. **Configure** — a broker configuration revision (destinations/queues/exchanges/policies),
   users/groups, maintenance window (`aws_mq_configuration`).
3. **Secure** — private subnets + tight security groups, no public access, KMS at rest, TLS in
   transit, credentials in Secrets Manager.
4. **Verify** — apply [[verify-by-running]]: confirm broker status `RUNNING` via
   `aws mq describe-broker`, connect a client over the chosen protocol to produce a message and
   consume it back, and (for HA) confirm failover/connectivity to the standby/cluster endpoint.

## Inputs
Existing broker engine + protocols (JMS/AMQP/MQTT/STOMP), HA/durability requirements,
throughput + connection count, network placement (VPC/subnets/SGs), destinations/queues/
exchanges + policies, auth model (broker users vs LDAP), encryption/compliance needs.

## Output
A broker definition (engine/version, HA deployment mode, instance size, private VPC placement),
a versioned configuration revision, users + maintenance window, KMS/TLS security, and
verification that the broker is RUNNING and a produce/consume round-trip works over the chosen
protocol.

## Notes
- Gotchas: configuration changes often require a reboot/apply during the maintenance window;
  ActiveMQ active/standby failover causes a brief connection drop (clients must reconnect/use
  failover URIs); RabbitMQ uses cluster (not active/standby) for HA; broker endpoints are
  per-protocol ports; public accessibility is a common misconfiguration — keep brokers private;
  engine version upgrades can be breaking — test first. For Kafka streaming choose MSK, for
  cloud-native pub/sub or queues choose SNS/SQS.
- IaC/CLI: Terraform `aws_mq_broker`, `aws_mq_configuration`. CLI `aws mq create-broker`,
  `describe-broker`, `create-configuration`, `update-broker`, `reboot-broker`. CloudFormation
  `AWS::AmazonMQ::Broker`, `AWS::AmazonMQ::Configuration`.
