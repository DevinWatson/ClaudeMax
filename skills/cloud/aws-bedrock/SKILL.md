---
name: aws-bedrock
description: Use when designing, provisioning, securing, or operating Amazon Bedrock — the managed service that serves foundation models (FMs) from multiple providers behind a single API (Amazon Bedrock). Loads the Bedrock knowledge: model access and the InvokeModel / Converse APIs, streaming, model providers and the Amazon Nova/Titan families, Knowledge Bases (managed RAG over a vector store such as OpenSearch Serverless/Aurora pgvector), Agents (tool/action groups + orchestration), Guardrails (content/PII/topic filters and grounding), prompt management and flows, fine-tuning/custom models and model import, evaluations, and capacity — on-demand vs Provisioned Throughput (model units) vs Batch. Covers model selection, IAM/VPC/KMS security, cost levers (token pricing, batch, provisioned throughput, prompt caching), quotas/throttling, and verification by invoking. Consumed by the Bedrock specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, bedrock, ai-ml, foundation-models, generative-ai, knowledge-bases]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Bedrock

A managed service that serves **foundation models** (text/chat/image/embeddings) from multiple
providers behind a **single API**, with managed building blocks for RAG, agents, and safety. You do not
train or host the base models — you request **model access**, invoke them, and layer Bedrock's managed
features on top (contrast: SageMaker, where you train/host custom models).

## Core concepts and components
- **Foundation models + model access** — provider models (Anthropic, Meta, Mistral, Cohere, AI21,
  Stability) and **Amazon Nova/Titan**; you must enable **model access** per model/region.
- **Inference APIs** — `InvokeModel` / `InvokeModelWithResponseStream` and the unified **Converse** API
  (consistent messages/tool-use across models), plus **embeddings** for vectors.
- **Knowledge Bases** — managed **RAG**: ingest S3 documents, chunk + embed, store in a **vector store**
  (OpenSearch Serverless, Aurora pgvector, Pinecone, etc.), and retrieve/answer with citations.
- **Agents** — orchestrate multi-step tasks with **action groups** (Lambda/OpenAPI tools) and Knowledge
  Bases; manage sessions and prompts.
- **Guardrails** — independent **content filters**, **denied topics**, **PII redaction**, word filters,
  and **contextual grounding/relevance** checks applied to prompts and responses.
- **Customization** — **fine-tuning** and **continued pre-training** producing custom models, plus
  **model import** of compatible weights; **evaluations** for model/quality comparison; **prompt
  management** and **flows**.

## Configuration and sizing
- Pick a model by capability/latency/cost, set inference params (temperature/max tokens), and choose
  **capacity**: **on-demand** (per-token, default), **Provisioned Throughput** (reserved **model
  units** for guaranteed/committed throughput, required for custom/imported models), or **Batch** for
  large async jobs at lower cost. For Knowledge Bases, choose chunking strategy, embedding model, and
  vector store. Enable **prompt caching** where supported to cut repeated-context cost.

## Security and IAM
- Gate with IAM (`bedrock:InvokeModel`, `bedrock:Retrieve*`, `bedrock-agent*`) scoped to specific model
  ARNs/resources; enable only the models you use. Reach Bedrock privately via **interface VPC
  endpoints**; encrypt custom models, KB data sources, and agent sessions with **KMS**; scope the
  Knowledge Base/Agent service roles to their S3/vector-store/Lambda resources. Attach **Guardrails** to
  enforce content/PII policy. CloudTrail logs invocations; model-invocation logging can capture prompts.

## Cost levers
- On-demand billing is **per input/output token**; biggest levers: choose a cheaper/smaller model where
  adequate, **Batch inference** for async workloads, **prompt caching** and trimmed context, and only
  buy **Provisioned Throughput** for steady high volume or custom models. Knowledge Base costs include
  embeddings + the vector store; size chunking to balance recall vs token cost.

## Scaling and limits
- On-demand has **per-model requests/min and tokens/min quotas** (throttling → retries/backoff;
  raisable via support); **Provisioned Throughput** guarantees capacity in model units. Knowledge Base
  ingestion and vector-store limits apply. Model availability is **region/model-specific** — not every
  model is in every region.

## Operating procedure
1. **Provision** — enable **model access** for the chosen models; create supporting resources (KB +
   vector store, Agent, Guardrail) via Terraform `aws_bedrockagent_knowledge_base` /
   `aws_bedrock_guardrail`, or `aws bedrock`/`aws bedrock-agent` create commands.
2. **Configure** — set inference params and capacity (on-demand/Provisioned/Batch); for RAG, configure
   the data source, embedding model, chunking, and vector store and **ingest**; wire Agents' action
   groups; attach a Guardrail.
3. **Secure** — least-privilege model/resource IAM, VPC endpoints, KMS, attached Guardrails, and
   invocation logging.
4. **Verify** — apply [[verify-by-running]]: invoke the model
   (`aws bedrock-runtime invoke-model` / `converse`) with a representative prompt and confirm a sensible
   response; for a Knowledge Base, run `aws bedrock-agent-runtime retrieve` / `retrieve-and-generate`
   and confirm grounded, cited answers; confirm the Guardrail blocks a disallowed prompt — capture the
   actual output.

## Inputs
Use case + model choice (provider/Nova/Titan), inference params, capacity mode (on-demand/Provisioned/
Batch), RAG needs (data source, embedding model, vector store, chunking), agent tools, safety policy
(Guardrails), security model (IAM/VPC/KMS), cost/throughput targets.

## Output
A Bedrock setup — enabled model access, invocation (Converse/InvokeModel) with the right capacity, and
the configured managed features (Knowledge Base RAG, Agents, Guardrails) under least-privilege IAM/VPC/
KMS — plus verification that invocation, retrieval, and guardrails behave correctly.

## Notes
- Gotchas: model access must be enabled per model/region and models are not in every region; on-demand
  quotas throttle (handle with retries/backoff); Provisioned Throughput is a real cost commitment and
  required for custom/imported models; Knowledge Base answer quality is sensitive to chunking/embedding
  choices; Guardrails are separate from the model and must be explicitly attached; the managed
  Knowledge Base is Bedrock's RAG — app-side/custom RAG belongs to the language rag-engineer roles.
- IaC/CLI: Terraform `aws_bedrockagent_agent`, `aws_bedrockagent_knowledge_base`,
  `aws_bedrockagent_data_source`, `aws_bedrock_guardrail`, `aws_bedrock_provisioned_model_throughput`.
  CLI `aws bedrock list-foundation-models`, `create-guardrail`, `create-provisioned-model-throughput`;
  `aws bedrock-runtime invoke-model` / `converse`; `aws bedrock-agent create-knowledge-base` /
  `create-agent`; `aws bedrock-agent-runtime retrieve` / `retrieve-and-generate`. CloudFormation
  `AWS::Bedrock::Guardrail`, `AWS::Bedrock::KnowledgeBase`, `AWS::Bedrock::Agent`.
