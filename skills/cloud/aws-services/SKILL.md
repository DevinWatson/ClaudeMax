---
name: aws-services
description: The substantive AWS platform capability — compute (EC2, Lambda, ECS/Fargate, EKS), storage (S3, EBS, EFS), databases (RDS/Aurora, DynamoDB), networking (VPC, subnets, security groups, ALB/NLB, Route 53, CloudFront), IAM (roles, policies, least privilege), messaging/eventing (SQS, SNS, EventBridge, Kinesis), the Well-Architected Framework's six pillars, regions/AZs & multi-region patterns, and tooling (AWS CLI, CloudFormation/CDK/SAM). Use when designing, building, reviewing, securing, costing, or operating anything on Amazon Web Services — picking the right managed service, applying least-privilege IAM, choosing single- vs multi-AZ/region, or validating CloudFormation/CDK/SAM. Any agent that touches AWS (an architect, IaC engineer, security reviewer, cost governor, reliability/networking/observability/data engineer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, cloud, ec2, lambda, s3, vpc, iam, dynamodb, well-architected]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Services

The substantive Amazon Web Services capability: knowing the catalog of managed services, the
trade-offs between them, and the platform conventions (IAM, regions/AZs, the Well-Architected
Framework) that turn a pile of resources into a sound system.

## When to use this skill
Whenever the work is on AWS: selecting a compute/storage/database service, designing a VPC,
writing or reviewing IAM, choosing a resilience posture (single-AZ / multi-AZ / multi-region),
estimating or trimming cost, or authoring/validating CloudFormation/CDK/SAM. Not a substitute
for the Terraform language itself ([[terraform-iac]]) or generic Kubernetes operation — it is the
AWS-specific knowledge those skills consume.

## Instructions
1. **Establish context before choosing services.** Identify the region(s) and account/Organization
   layout, the workload shape (request/response, batch, streaming, stateful), the data
   classification, and the SLO/RTO/RPO. Read existing IaC (`*.tf`, `template.yaml`, CDK app) and
   tags to learn what already exists before proposing anything new.
2. **Pick the fitting managed service per concern, biasing to managed:**
   - **Compute** — Lambda for event-driven/spiky; Fargate (ECS/EKS) for containers without node
     management; EC2 only when you need the host (licensing, GPUs, special networking); EKS when
     the org standard is Kubernetes.
   - **Storage** — S3 for object/static/data-lake (choose the right storage class + lifecycle);
     EBS for block volumes attached to EC2; EFS/FSx for shared POSIX file systems.
   - **Databases** — RDS/Aurora for relational (Aurora for HA/scale-out reads); DynamoDB for
     key-value/document at scale (design the partition/sort key and access patterns first);
     ElastiCache for caching.
   - **Messaging/eventing** — SQS for decoupled queues, SNS for fan-out, EventBridge for routed
     events/schedules, Kinesis for high-throughput ordered streaming.
3. **Design the network deliberately.** Lay out the VPC with public/private/isolated subnets
   across multiple AZs; route egress through NAT only where required; scope security groups to
   least privilege (reference SGs over CIDRs, no `0.0.0.0/0` to admin ports). Front HTTP with
   ALB, TCP/UDP with NLB; use Route 53 for DNS and health-checked failover, CloudFront for
   edge caching/TLS. Prefer VPC endpoints (PrivateLink/Gateway) over public paths to AWS APIs.
4. **Apply least-privilege IAM.** Grant roles (not long-lived users/keys); scope policies to
   specific actions, resource ARNs, and conditions; avoid `*` actions/resources and wildcard
   `PassRole`. Use instance/task roles and IAM Roles for Service Accounts (IRSA) on EKS;
   federate humans via SSO. Encrypt at rest (KMS) and in transit (TLS) by default; never embed
   secrets — use Secrets Manager / SSM Parameter Store.
5. **Evaluate against the Well-Architected Framework's six pillars** — Operational Excellence,
   Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability. For each
   significant choice, name the pillar trade-off you are making and why.
6. **Choose the resilience footprint explicitly.** State single-AZ vs multi-AZ vs multi-region
   and justify it against the RTO/RPO. Spread stateless tiers across AZs; use multi-AZ for RDS;
   define backup/restore and, where required, cross-region replication or active/active.
7. **Express and validate it as code.** Capture the design in CloudFormation/CDK/SAM (or hand it
   to [[terraform-iac]]). Use the AWS CLI / `cloudformation validate-template` / `cdk synth` /
   `sam validate` to check it, and tag every resource (owner, env, cost-center).

## Inputs
- The workload requirements (shape, data classification, SLO/RTO/RPO), the target region(s) and
  account layout, and any existing IaC, IAM policies, and resource tags.

## Output
- A service-by-concern recommendation (compute/storage/db/network/messaging) with the AWS service
  named and the trade-off justified, including the resilience footprint (AZ/region) and the
  Well-Architected pillars touched.
- IAM scoped to least privilege (roles, specific actions/ARNs/conditions) and encryption posture.
- Where code is involved, CloudFormation/CDK/SAM (or Terraform) plus the validation command(s).

## Notes
- Bias toward managed/serverless services to reduce operational load; reach for EC2/self-managed
  only with a stated reason.
- This skill is AWS knowledge, not the IaC engine: pair it with [[terraform-iac]] for Terraform
  authoring, and confirm any plan/synth/validate output with [[verify-by-running]].
- Costs concentrate in data transfer (cross-AZ/region/egress), idle provisioned capacity, and
  un-lifecycled storage — flag these when relevant rather than only per-resource unit price.
