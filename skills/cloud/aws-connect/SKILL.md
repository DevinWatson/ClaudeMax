---
name: aws-connect
description: Use when designing, provisioning, securing, or operating Amazon Connect — the cloud contact center, instances and phone numbers (claimed DIDs/toll-free), queues and routing profiles, contact flows (the IVR/routing graph), agents and hierarchies, Lambda + Amazon Lex integration for self-service, Contact Lens analytics, and storage of recordings/transcripts to S3 (Amazon Connect). Loads the Connect knowledge: stand up an instance, build a contact flow with queues+routing, wire Lambda/Lex, secure it, and verify a call routes. Consumed by the Connect specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle contact-center workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, connect, contact-center, ivr, telephony, business-apps]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Connect

A fully managed, pay-per-use omnichannel cloud contact center. You claim phone numbers, define how
contacts are routed and queued, build the IVR/self-service logic as contact flows, and connect
agents — with no telephony infrastructure to run. Voice plus chat, tasks, and email channels.

## Core concepts and components
- **Instance** — the contact-center tenant (identity management: Connect-managed, SAML, or existing
  directory) holding all resources.
- **Phone numbers** — claimed DIDs or toll-free numbers, associated to a contact flow.
- **Queues** — where contacts wait for an agent; **routing profiles** map agents to the queues +
  channels they serve and set priority/concurrency.
- **Contact flows** — the routing/IVR graph (prompts, branches, Lambda invokes, Lex bots, set
  queue, transfer) that drives each contact.
- **Agents / hierarchies / security profiles** — users with assigned routing profiles, organized in
  agent hierarchies, with permissions via security profiles.
- **Integrations** — **AWS Lambda** (data dips/business logic in a flow) and **Amazon Lex**
  (conversational self-service). **Contact Lens** for real-time/post-call analytics and sentiment.

## Configuration and sizing
- One instance per business unit/brand is common. Size by concurrent contacts and agent count;
  routing profiles control per-agent channel concurrency. Set service-level and queue priorities to
  shape wait times.

## Security and IAM
- Prefer SAML/SSO identity management for enterprise. Scope security profiles least-privilege;
  Lambda functions invoked from flows need a resource policy allowing `connect.amazonaws.com`.
- Encrypt recordings/transcripts in S3 with KMS; restrict the S3 storage config and Contact Lens
  output. Use attachment/recording retention policies to meet compliance.

## Cost levers
- Pay-per-use: per-minute usage + per-number/day + Lex/Lambda + Contact Lens. Levers: reduce
  handle time via self-service flows (Lex), release unused claimed numbers, and gate Contact Lens to
  the queues that need analytics.

## Scaling and limits
- Connect auto-scales contact capacity; per-instance quotas bound queues, routing profiles, phone
  numbers, and concurrent calls (raise via Service Quotas). Lambda/Lex have their own limits.

## Operating procedure
1. **Provision** — create the **instance** (choose identity management) and **claim phone numbers**
   via Terraform `aws_connect_instance` (+ `aws_connect_phone_number`) or `aws connect
   create-instance` / `claim-phone-number`.
2. **Configure** — define **queues**, **routing profiles**, agents/hierarchies, and the
   **contact flow** (associate Lambda functions and Lex bots, associate the number to the flow).
3. **Secure** — set identity management/SAML, least-privilege security profiles, the Lambda
   resource policy for `connect.amazonaws.com`, and KMS-encrypted S3 storage for recordings.
4. **Verify** — apply [[verify-by-running]]: `aws connect describe-instance` shows the instance
   `ACTIVE`, `list-queues`/`list-routing-profiles` confirm routing, `describe-contact-flow` confirms
   the flow, and a test call (or `start-outbound-voice-contact`) routes to the intended queue/agent.

## Inputs
Channels needed (voice/chat/task/email), expected concurrent contacts + agent count, identity
source, number requirements (DID/toll-free), self-service requirements (Lex/Lambda), routing/queue
rules, recording/analytics + retention requirements, encryption requirements.

## Output
A Connect instance with claimed numbers, queues + routing profiles, agents, a contact flow wiring
Lambda/Lex, secured identity + S3 recording storage, and verification of an `ACTIVE` instance plus a
test contact that routes correctly.

## Notes
- Gotchas: contact flows are often imported as JSON and are environment-specific (ARNs for
  Lambda/Lex must match the target account/Region); a Lambda needs `connect.amazonaws.com` invoke
  permission or the flow errors; deleting an instance is destructive and slow; number portability
  and toll-free provisioning can take time.
- IaC/CLI: Terraform `aws_connect_instance`, `aws_connect_queue`, `aws_connect_routing_profile`,
  `aws_connect_contact_flow`, `aws_connect_lambda_function_association`,
  `aws_connect_bot_association`, `aws_connect_phone_number`. CLI `aws connect create-instance`,
  `create-queue`, `create-contact-flow`, `associate-lambda-function`, `describe-instance`.
  CloudFormation `AWS::Connect::Instance`, `AWS::Connect::ContactFlow`, `AWS::Connect::Queue`.
