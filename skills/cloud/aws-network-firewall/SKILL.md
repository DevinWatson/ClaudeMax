---
name: aws-network-firewall
description: Use when designing, provisioning, securing, or operating AWS Network Firewall — the managed, stateful VPC firewall and IDS/IPS (AWS Network Firewall). Loads the Network Firewall knowledge: the firewall + per-AZ firewall endpoints in a dedicated subnet, firewall policy, stateless rule groups (5-tuple, evaluated first) vs stateful rule groups (5-tuple / domain-list / native Suricata IPS), rule evaluation order and default actions, the centralized-inspection VPC pattern with Transit Gateway/GWLB and appliance-mode routing, TLS inspection, alert/flow/TLS logging, and managed rule groups. Covers how to route VPC traffic through the firewall, write stateless + stateful + Suricata rules, build egress domain filtering, and verify allowed traffic passes while denied traffic is dropped and logged. Consumed by the AWS Network Firewall specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology — this owns the Network Firewall service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, network-firewall, networking, ids-ips, suricata, egress-filtering]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Network Firewall

A **managed, stateful network firewall and IDS/IPS** for VPCs. You route subnet traffic through
**firewall endpoints**, and a **firewall policy** evaluates it against stateless and stateful rule
groups — including native **Suricata** rules — to pass, drop, or alert.

## Core concepts and components
- **Firewall** — the deployed resource, with a **firewall endpoint (ENI) per AZ** placed in a
  dedicated **firewall subnet**. You insert it into the data path via route tables (the
  edge/distributed or centralized-inspection pattern).
- **Firewall policy** — references stateless + stateful rule groups and sets **default actions** and
  the **stateful engine order** (default action order vs strict order).
- **Stateless rule groups** — evaluated **first**, match the **5-tuple**, action `pass` / `drop` /
  `forward-to-stateful`; cheap, connectionless.
- **Stateful rule groups** — connection-aware; three forms: **5-tuple**, **domain list** (allow/deny
  by hostname, e.g. egress allow-listing), or **Suricata-compatible** rules for full IPS signatures.
- **Managed rule groups** — AWS-maintained threat signatures and domain lists.
- **TLS inspection** — decrypt/re-encrypt to inspect HTTPS (using ACM certs).
- **Logging** — alert, flow, and TLS logs to S3 / CloudWatch Logs / Kinesis Firehose.
- **Centralized inspection** — a dedicated inspection VPC fronted by the firewall, reached via Transit
  Gateway (appliance-mode) or GWLB, filtering east-west and egress traffic for many VPCs.

## Configuration and sizing
- Place firewall endpoints in a dedicated /28+ firewall subnet per AZ and re-route the protected
  subnets (and IGW edge route table) through them. Decide **rule order** (strict order for explicit
  precedence). Use domain-list stateful rules for egress allow-listing; add managed/Suricata groups
  for IPS. The service scales automatically per endpoint; deploy one endpoint per AZ for HA.

## Security and IAM
- Default-deny egress with a domain allow-list is the high-value pattern. Keep the firewall subnet
  separate from workloads. Enable alert + flow logging. Use appliance-mode on TGW attachments so
  return traffic hits the same endpoint. Gate `network-firewall:*` with least-privilege IAM; enable
  CloudTrail.

## Cost levers
- Charged per firewall-endpoint-hour + per-GB processed (+ logging destination costs). Centralize
  inspection so endpoints are shared across VPCs rather than per-VPC, scope traffic that must traverse
  the firewall, and prune unused rule groups. TLS inspection adds processing cost.

## Scaling and limits
- Watch rules/rule-groups-per-policy and capacity units per rule group (you pre-allocate capacity).
  Throughput scales per endpoint; add endpoints/AZs for more. Asymmetric routing breaks stateful
  inspection — use appliance-mode.

## Operating procedure
1. **Provision** — create rule groups, the firewall policy, and the firewall via Terraform
   `aws_networkfirewall_rule_group` / `aws_networkfirewall_firewall_policy` /
   `aws_networkfirewall_firewall` or `aws network-firewall create-rule-group` /
   `create-firewall-policy` / `create-firewall`.
2. **Configure** — stateless + stateful (5-tuple / domain-list / Suricata) rules and default actions,
   rule order, TLS inspection, logging; then re-route protected/edge subnets through the firewall
   endpoints (and appliance-mode on TGW for centralized).
3. **Secure** — default-deny egress with domain allow-list, managed threat rule groups, alert/flow
   logging, dedicated firewall subnet.
4. **Verify** — apply [[verify-by-running]]: route tables direct traffic through the firewall
   endpoints; an allowed flow/domain passes while a denied one is **dropped** and appears in the alert
   log; `describe-firewall` shows status `READY` and endpoints per AZ; return traffic is symmetric —
   capture the actual output.

## Inputs
Inspection model (distributed vs centralized), protected subnets/AZs, egress allow-list domains,
required IPS/managed rule groups, TLS-inspection need, logging destinations, TGW/GWLB integration.

## Output
A Network Firewall definition (firewall + per-AZ endpoints, policy, stateless/stateful/Suricata rule
groups, logging, route-table insertion), plus verification that allowed traffic passes and denied
traffic is dropped and logged.

## Notes
- Gotchas: stateless rules run before stateful and can bypass inspection if they `pass` too broadly;
  asymmetric routing silently breaks stateful matching (use appliance-mode on TGW); you must
  re-route subnets through the firewall or it inspects nothing; rule groups consume pre-allocated
  capacity; domain-list rules need stateful engine; deleting a firewall while routes point at its
  endpoints blackholes traffic.
- IaC/CLI: Terraform `aws_networkfirewall_firewall`, `aws_networkfirewall_firewall_policy`,
  `aws_networkfirewall_rule_group`, `aws_networkfirewall_logging_configuration`,
  `aws_networkfirewall_tls_inspection_configuration`. CLI `aws network-firewall create-firewall`,
  `create-firewall-policy`, `create-rule-group`, `update-logging-configuration`, `describe-firewall`.
  CloudFormation `AWS::NetworkFirewall::Firewall`, `AWS::NetworkFirewall::FirewallPolicy`,
  `AWS::NetworkFirewall::RuleGroup`, `AWS::NetworkFirewall::LoggingConfiguration`.
