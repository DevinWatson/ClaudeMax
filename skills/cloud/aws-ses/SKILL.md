---
name: aws-ses
description: Use when designing, provisioning, securing, or operating Amazon SES — transactional and bulk email sending via SMTP and the API, verified identities (domains/email addresses), DKIM/SPF/DMARC authentication, configuration sets and event publishing (bounces/complaints/deliveries to SNS/EventBridge/Kinesis), dedicated vs shared IPs, sandbox/sending quotas, and deliverability/reputation (suppression list, Virtual Deliverability Manager) (Amazon SES). Loads the SES knowledge: verify a domain, authenticate it, send via SMTP/API, monitor bounces/complaints, and verify deliverability. Consumed by the SES specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle email sending.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ses, email, deliverability, dkim, business-apps]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon SES

A high-scale, pay-as-you-go email service for transactional and bulk/marketing email. Send via SMTP
or the SES API; SES handles delivery, while you own authentication, reputation, and bounce/complaint
handling. For multichannel campaign engagement (segments/journeys/SMS/push) use Amazon Pinpoint —
which can use SES as its email channel.

## Core concepts and components
- **Identities** — verified **domains** or **email addresses** you are allowed to send from.
- **Authentication** — **DKIM** (Easy DKIM publishes CNAMEs to sign mail), **SPF** (custom
  MAIL FROM domain), and **DMARC** (alignment policy in DNS) — all three for inbox placement.
- **Sending interfaces** — **SMTP** endpoint (SMTP credentials derived from IAM) and the **SES
  API** (`SendEmail`/`SendRawEmail`/`SendBulkEmail`, templates).
- **Configuration sets** — named groups that attach **event destinations** publishing send events
  (sends, deliveries, bounces, complaints, opens, clicks) to SNS / EventBridge / Kinesis Firehose /
  CloudWatch, plus IP pool and suppression options.
- **IPs** — shared (default) or **dedicated IPs** (managed/standard) that you warm up.
- **Deliverability** — account-level **suppression list**, **Virtual Deliverability Manager**, and
  the reputation dashboard tracking bounce/complaint rates.

## Configuration and sizing
- New accounts are in the **sandbox** (only verified recipients, low quota) — request production
  access. Sending quota = max send rate + daily cap; grows with good reputation. Use dedicated IPs
  only at sustained volume (warm-up required).

## Security and IAM
- Grant `ses:SendEmail`/`SendRawEmail` least-privilege; restrict with `ses:FromAddress` and
  `ses:FeedbackAddress` conditions. SMTP credentials are IAM-derived — rotate and scope them.
- Always configure DKIM + SPF + DMARC; without them mail is filtered/spoofable. Publish a custom
  MAIL FROM domain for SPF alignment.

## Cost levers
- Pay per message + data; attachments add cost. Levers: suppress known-bad addresses (lowers bounce
  cost and protects reputation), avoid dedicated IPs below the volume that justifies warm-up, and
  batch with `SendBulkEmail`/templates.

## Scaling and limits
- Max send rate (msgs/sec) and daily sending quota are the hard limits — raise via support as
  reputation improves. Per-Region quotas; high bounce/complaint rates trigger sending pauses.

## Operating procedure
1. **Provision** — verify the sending **domain identity** and enable **Easy DKIM** via Terraform
   `aws_ses_domain_identity` + `aws_ses_domain_dkim` (publish the DNS records) or `aws sesv2
   create-email-identity`. Request production access out of the sandbox.
2. **Configure** — create a **configuration set** with an event destination (SNS/EventBridge) for
   bounces/complaints, set the custom MAIL FROM domain, and (if needed) a dedicated IP pool.
3. **Secure** — publish SPF + DMARC DNS, scope IAM/SMTP credentials with `ses:FromAddress`, and
   subscribe to and process bounce/complaint events.
4. **Verify** — apply [[verify-by-running]]: `aws sesv2 get-email-identity` shows the identity
   `VerificationStatus: SUCCESS` with DKIM `SUCCESS`, `get-account` confirms out-of-sandbox sending,
   and a test `aws sesv2 send-email` delivers and emits a delivery event on the configuration set.

## Inputs
Sending domain(s), transactional vs bulk volume + send rate, DNS control for DKIM/SPF/DMARC, event
handling destination (SNS/EventBridge), shared vs dedicated IP needs, templates, suppression policy,
encryption/compliance requirements.

## Output
A verified, DKIM/SPF/DMARC-authenticated sending identity, a configuration set publishing
bounce/complaint events, scoped IAM/SMTP credentials, and verification of identity verification,
out-of-sandbox status, and a successful delivered test send.

## Notes
- Gotchas: forgetting to leave the sandbox blocks real recipients; missing DKIM/SPF/DMARC kills
  deliverability; high bounce/complaint rates pause your account — process feedback and use the
  suppression list; dedicated IPs need a multi-week warm-up; SMTP and IAM credentials are distinct.
- IaC/CLI: Terraform `aws_ses_domain_identity`, `aws_ses_domain_dkim`,
  `aws_ses_domain_mail_from`, `aws_sesv2_configuration_set`,
  `aws_sesv2_configuration_set_event_destination`, `aws_sesv2_email_identity`,
  `aws_ses_receipt_rule`. CLI `aws sesv2 create-email-identity`, `put-email-identity-dkim-attributes`,
  `create-configuration-set`, `send-email`, `get-account`. CloudFormation
  `AWS::SES::EmailIdentity`, `AWS::SES::ConfigurationSet`.
