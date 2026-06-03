---
name: aws-cloud-map
description: Use when designing, provisioning, securing, or operating AWS Cloud Map — the cloud service-discovery registry that maps logical service names to dynamic backend locations (AWS Cloud Map). Loads the Cloud Map knowledge: namespaces (public DNS, private DNS within a VPC, or API-only HTTP), services and registered instances, attributes/custom metadata, DNS records auto-managed in Route 53 (A/AAAA/SRV/CNAME) with health-check integration, the DiscoverInstances API for attribute-based queries, and tight integration with ECS service discovery and ECS Service Connect. Covers how to register dynamic instances, discover them by DNS or API with health filtering, attach custom metadata, and verify discovery resolves only healthy targets. Consumed by the AWS Cloud Map specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect); the aws-networking-engineer composes cross-cutting topology — this owns the Cloud Map service itself.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, cloud-map, networking, service-discovery, dns, microservices]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Cloud Map

A **service-discovery** registry: applications register dynamic resource locations (IPs, ports, URLs,
queue ARNs) under a logical **service name**, and clients discover the current healthy locations via
DNS or an API call instead of hard-coding endpoints.

## Core concepts and components
- **Namespace** — the discovery domain. **Public DNS** (resolvable on the internet), **private DNS**
  (resolvable inside an associated VPC via a Route 53 private hosted zone), or **HTTP / API-only** (no
  DNS; discover via the `DiscoverInstances` API).
- **Service** — a named group within a namespace (e.g. `payments`). For DNS namespaces it defines the
  record type/TTL (**A**, **AAAA**, **SRV**, **CNAME**) and optional routing policy
  (multivalue/weighted).
- **Instances** — registered endpoints with attributes such as `AWS_INSTANCE_IPV4`,
  `AWS_INSTANCE_PORT`, plus arbitrary **custom metadata** (version, region, capacity).
- **Health** — instances can use Route 53 health checks (DNS namespaces) or **custom health status**
  set via `UpdateInstanceCustomHealthStatus` (HTTP namespaces). Unhealthy instances are filtered out
  of discovery.
- **Discovery** — by DNS name (resolver returns healthy records) or `DiscoverInstances` (filter by
  custom attributes, e.g. `version=v2`).
- **Integrations** — ECS service discovery auto-registers tasks; ECS **Service Connect** builds on it.

## Configuration and sizing
- Choose namespace type by client: DNS for broad/legacy clients, HTTP/API-only when you query by
  attributes or don't want DNS records. Keep TTLs short for fast turnover but not so short they hammer
  the resolver. Use SRV records to publish dynamic ports (e.g. bridge-mode containers).

## Security and IAM
- Private DNS namespaces are reachable only from associated VPCs — keep internal services private.
  Gate `servicediscovery:RegisterInstance` / `DeregisterInstance` / `DiscoverInstances` and
  `route53:*` for the managed zone with least-privilege IAM (separate register vs discover roles).
  Enable CloudTrail.

## Cost levers
- Charged per registered instance per month + per discovery API call + (for DNS namespaces) Route 53
  hosted-zone and query costs. Deregister dead instances promptly (rely on health checks / ECS
  deregistration), and prefer reasonable TTLs to limit query volume.

## Scaling and limits
- Watch instances-per-service, services-per-namespace, and `DiscoverInstances` request-rate limits.
  Public/private DNS namespaces inherit Route 53 limits and propagation/TTL behavior.

## Operating procedure
1. **Provision** — create the namespace and service via Terraform
   `aws_service_discovery_private_dns_namespace` (or public/http) + `aws_service_discovery_service`,
   or `aws servicediscovery create-private-dns-namespace` / `create-service`.
2. **Configure** — record type/TTL/routing for DNS services, health-check config, and let workloads
   (or ECS) register instances with attributes/custom metadata.
3. **Secure** — private namespace for internal services, scoped IAM for register vs discover,
   CloudTrail.
4. **Verify** — apply [[verify-by-running]]: `discover-instances` returns only the healthy instances
   with the expected attributes; for a DNS namespace a `dig`/resolver query inside the VPC returns the
   current records; marking an instance unhealthy removes it from results — capture the actual output.

## Inputs
Namespace type (public/private DNS or HTTP), service names, record type/TTL, health model
(Route 53 vs custom), custom metadata schema, VPC associations, ECS integration.

## Output
A Cloud Map definition (namespace, services, instance/attribute schema, health config) plus
verification that discovery resolves only healthy instances by DNS and/or `DiscoverInstances`.

## Notes
- Gotchas: private DNS namespaces only resolve from associated VPCs; deleting a namespace requires
  removing services and instances first; DNS TTL caching delays failover (HTTP namespaces + custom
  health are faster for some cases); ECS auto-registration means manual edits get overwritten; SRV
  records are needed to publish dynamic container ports.
- IaC/CLI: Terraform `aws_service_discovery_private_dns_namespace`,
  `aws_service_discovery_public_dns_namespace`, `aws_service_discovery_http_namespace`,
  `aws_service_discovery_service`, `aws_service_discovery_instance`. CLI
  `aws servicediscovery create-private-dns-namespace`, `create-service`, `register-instance`,
  `discover-instances`, `update-instance-custom-health-status`. CloudFormation
  `AWS::ServiceDiscovery::PrivateDnsNamespace`, `AWS::ServiceDiscovery::HttpNamespace`,
  `AWS::ServiceDiscovery::Service`, `AWS::ServiceDiscovery::Instance`.
