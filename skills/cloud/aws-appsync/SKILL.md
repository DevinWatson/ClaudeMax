---
name: aws-appsync
description: Use when designing, provisioning, securing, or operating AWS AppSync — managed GraphQL (and Merged/federated) APIs: schemas (SDL), resolvers (VTL and JavaScript/APPSYNC_JS, unit vs pipeline), data sources (DynamoDB, Lambda, RDS Data API, OpenSearch, HTTP, EventBridge, None), real-time GraphQL subscriptions over WebSockets, server-side and per-resolver caching, authorization modes (API key, IAM, Cognito User Pools, OIDC, Lambda authorizer) and field-level auth, WAF, and CloudWatch/X-Ray observability (AWS AppSync). Loads the AppSync knowledge: how to define a schema, wire resolvers to data sources, secure with an auth mode, enable subscriptions/caching, and verify a query/mutation/subscription. Consumed by the AppSync specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they build GraphQL APIs.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, appsync, graphql, api, resolvers, application-integration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS AppSync

Fully managed **GraphQL** service: define a schema, connect fields to data sources via
resolvers, and AppSync handles request routing, real-time subscriptions, and auth. Use AppSync
when you want a managed GraphQL API; use API Gateway for REST/HTTP/WebSocket APIs and
EventBridge/SQS/SNS for backend messaging.

## Core concepts and components
- **Schema (SDL)** — the GraphQL type system defining Query/Mutation/Subscription operations.
- **Resolver** — connects a schema field to a data source. **VTL** (Velocity) or **JavaScript
  (APPSYNC_JS)** request/response handlers; **unit** resolvers (one data source) or **pipeline**
  resolvers (a sequence of functions for orchestration).
- **Data sources** — DynamoDB, Lambda, **RDS Data API** (Aurora Serverless), OpenSearch, **HTTP**
  endpoints, EventBridge, and **None** (local/passthrough for pub/sub or transforms).
- **Subscriptions** — real-time updates over WebSockets, triggered by mutations (with optional
  subscription filters), enabling live data without polling.
- **Caching** — server-side cache at the API level or per-resolver, keyed by context, to cut
  data-source load and latency.
- **Authorization modes** — API key (public/dev), IAM, **Cognito User Pools**, **OIDC**, and
  **Lambda authorizer**; multiple modes per API and **field-level** auth directives
  (`@aws_auth`, `@aws_cognito_user_pools`, etc.).
- **Merged APIs** — compose multiple source APIs into one federated GraphQL endpoint.
- **WAF + observability** — attach WAF; CloudWatch logs/metrics and X-Ray tracing.

## Configuration and sizing
- Prefer DynamoDB/RDS Data API direct resolvers over Lambda where possible (lower latency/cost);
  use pipeline resolvers for multi-step orchestration. Enable caching for hot, read-heavy fields.
- Design subscription fields and filters deliberately — every matching mutation pushes to clients.

## Security and IAM
- Choose the right auth mode: Cognito/OIDC for end users, IAM for service-to-service, Lambda
  authorizer for custom logic; avoid long-lived API keys outside dev. Apply field-level auth to
  protect sensitive fields. The AppSync service role needs least-privilege access to each data
  source. Attach WAF for rate limiting / common-attack protection; encrypt cache; require TLS.

## Cost levers
- Billed per query/mutation/subscription operation + real-time connection-minutes + caching
  instance hours; data-source costs (DynamoDB/Lambda) are separate. Caching cuts data-source
  cost on hot reads; avoid overly broad subscriptions (connection + push cost) and chatty
  pipeline resolvers.

## Scaling and limits
- Scales automatically for queries/mutations; subscriptions scale with connection limits
  (soft, raisable). Limits on resolvers, request/response size, and resolver execution time;
  caching instance sizes bound cache capacity.

## Operating procedure
1. **Provision** — create the GraphQL API with an auth mode and schema via Terraform
   `aws_appsync_graphql_api` + `aws_appsync_schema` (or `aws appsync create-graphql-api`).
2. **Configure** — data sources (`aws_appsync_datasource`), unit/pipeline resolvers
   (`aws_appsync_resolver`, JS/VTL), subscriptions, caching, and Merged APIs as needed.
3. **Secure** — pick auth mode(s) + field-level auth, least-privilege service role per data
   source, WAF association, TLS, cache encryption.
4. **Verify** — apply [[verify-by-running]]: run a query and a mutation against the endpoint
   (with a valid auth token), confirm correct data from the data source; open a subscription and
   confirm a mutation pushes an update; confirm an unauthorized/unauthenticated request is denied.

## Inputs
The GraphQL schema/operations, backing data sources, resolver logic (direct vs Lambda vs
pipeline), real-time/subscription requirements, auth model (Cognito/OIDC/IAM/Lambda/API key) +
field-level rules, caching needs, expected operation volume, WAF/compliance requirements.

## Output
An AppSync API (schema, data sources, unit/pipeline resolvers, subscriptions, caching, auth
mode(s) + field-level auth, service role, WAF) as code, plus verification of a query/mutation,
a live subscription push, and a denied unauthorized request.

## Notes
- Gotchas: VTL resolvers are being superseded by APPSYNC_JS (prefer JS for new work);
  subscriptions are triggered only by mutations on the subscribed field and have connection
  limits; the service role is a common cause of resolver "Unable to assume role"/access errors;
  API keys expire (max ~1 year) and are not for production end-user auth; pipeline resolvers run
  functions in order and share a stash; caching can serve stale data — set TTL/keys carefully.
- IaC/CLI: Terraform `aws_appsync_graphql_api`, `aws_appsync_schema`, `aws_appsync_datasource`,
  `aws_appsync_resolver`, `aws_appsync_function`, `aws_appsync_api_cache`. CLI
  `aws appsync create-graphql-api`, `start-schema-creation`, `create-data-source`,
  `create-resolver`. CloudFormation `AWS::AppSync::GraphQLApi`, `AWS::AppSync::GraphQLSchema`,
  `AWS::AppSync::DataSource`, `AWS::AppSync::Resolver`.
