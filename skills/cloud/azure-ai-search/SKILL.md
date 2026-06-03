---
name: azure-ai-search
description: Use when designing, provisioning, securing, or operating Azure AI Search — Microsoft Azure's managed search and retrieval service (formerly Cognitive Search) for full-text, vector, hybrid, and semantic search powering RAG (Azure AI Search). Covers the search service and SKU/replicas/partitions, indexes and field attributes (searchable/filterable/facetable/retrievable), indexers + data sources + skillsets (AI enrichment, integrated vectorization, chunking/embeddings), vector and hybrid search with semantic reranking, RAG retrieval patterns (incl. as a data source for Azure OpenAI On Your Data), scoring profiles and analyzers, keys vs Entra ID/RBAC and managed-identity connections, Private Link, and cost. Loads the Azure AI Search knowledge: provision a service, build an index + indexer/skillset, run a query, and verify results. Consumed by the azure-ai-search specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure AI Search).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ai-search, ai-ml, search, vector-search, rag, retrieval]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure AI Search

Microsoft Azure's **managed search and retrieval service** (formerly Cognitive Search) providing
full-text, **vector**, **hybrid**, and **semantic** search over your content — the retrieval engine
that grounds RAG applications and powers app search experiences.

## Core concepts and components
- **Search service** — the regional resource sized by **SKU tier** (Free/Basic/Standard S1-S3/Storage
  Optimized) with **replicas** (query throughput + availability/SLA) and **partitions** (index size +
  indexing throughput); searchable units = replicas × partitions.
- **Index** — the schema: **fields** with types and attributes (`searchable`, `filterable`,
  `sortable`, `facetable`, `retrievable`, `key`), plus **vector fields** (with dimensions + a vector
  profile/algorithm such as HNSW) and **semantic configuration**.
- **Indexers, data sources, skillsets** — an **indexer** pulls from a **data source** (Blob/ADLS,
  Cosmos DB, SQL, etc.) on a schedule; a **skillset** runs **AI enrichment** (OCR, entity/key-phrase
  extraction) and **integrated vectorization** (chunking + embeddings, often via Azure OpenAI) at
  ingest, projecting results into the index.
- **Query types** — **full-text** (BM25 + analyzers), **vector** (kNN/ANN similarity), **hybrid**
  (text + vector fused with RRF), and **semantic ranking** (L2 reranker + captions/answers).
- **RAG retrieval** — the canonical retrieval tier for RAG; can be consumed directly or wired as the
  data source for **Azure OpenAI "On Your Data"**.
- **Relevance tuning** — **scoring profiles**, custom **analyzers**, synonym maps, and filters/facets.

## Configuration and sizing
- Pick **SKU tier** by index size + query volume; add **replicas** for QPS/SLA and **partitions** for
  storage/indexing throughput. Design the **index schema** deliberately — only mark fields
  `searchable/filterable/facetable` as needed (each adds cost/size). Choose a **vector profile**
  (HNSW params, dimensions matching your embedding model) and add a **semantic configuration** for
  reranking. Use **integrated vectorization** to chunk + embed at ingest.

## Security and IAM
- Prefer **Microsoft Entra ID + RBAC** (`Search Service Contributor`, `Search Index Data
  Reader/Contributor`) and **managed-identity** connections from indexers to data sources/Azure OpenAI
  over admin/query **keys**; disable key auth where possible. Isolate with **Private Link** /
  `publicNetworkAccess=Disabled` and shared-private-link to backing data. Scope **query keys** to
  read-only. Enforce **document-level security** via filters where multi-tenant.

## Cost levers
- Billed by **SKU tier × (replicas + partitions) hours**, not per query. Levers: right-size the tier,
  add replicas/partitions only as QPS/size demands, trim the index schema (fewer searchable/retrievable
  fields), control **AI-enrichment** cost (skillset calls bill the enriching cognitive/Azure OpenAI
  resource), and schedule indexers rather than running continuously.

## Scaling and limits
- **Index/document/storage limits scale with tier and partitions**; **QPS scales with replicas**. Free
  tier has tiny limits; tier is mostly **immutable** (resize = new service + reindex). Vector index size
  and dimensions are bounded per tier. Indexer run duration and batch size are capped.

## Operating procedure
1. **Provision** — create the **search service** at the right SKU/replicas/partitions via Terraform
   `azurerm_search_service` (or Bicep/`az search service create`); enable a **system-assigned managed
   identity** if indexers will connect to data.
2. **Configure** — define the **index** (fields + vector profile + semantic config), create the **data
   source** + **skillset** (integrated vectorization/AI enrichment) + **indexer**, and run it
   (REST/SDK or `az rest`); confirm documents are ingested and vectorized.
3. **Secure** — use **Entra ID + RBAC** and **managed-identity** connections (disable key auth), set
   **Private Link** with `publicNetworkAccess=Disabled`, and scope query keys read-only.
4. **Verify** — apply [[verify-by-running]]: confirm the indexer succeeded and the index has a
   **document count > 0** (`GET /indexes/<name>/docs/$count`), then run a representative **hybrid +
   semantic query** (`POST /indexes/<name>/docs/search`) and confirm relevant results with scores.
   Capture the doc count and the query results.

## Inputs
The content/data sources, the search modes needed (full-text / vector / hybrid / semantic), the
embedding model + dimensions, expected index size and QPS, the relevance requirements, and the
networking/identity security requirements.

## Output
An Azure AI Search setup: a sized search service, an index (with vector + semantic config), a data
source + skillset + indexer doing integrated vectorization/enrichment — isolated by Private Link, Entra
ID/RBAC, and managed-identity connections — plus verification of a non-zero doc count and a relevant
hybrid/semantic query result.

## Notes
- Gotchas: **SKU tier is effectively immutable** (resize = reindex into a new service) so size for
  growth; replicas drive **QPS/SLA**, partitions drive **size/indexing**; over-marking fields
  `searchable/retrievable` bloats the index; **AI-enrichment/integrated-vectorization bills the backing
  cognitive/Azure OpenAI resource**; vector **dimensions must match the embedding model**. This owns the
  **managed Azure AI Search service** (service, indexes, indexers/skillsets, RBAC, scaling) — not the
  app-side RAG orchestration/prompting/eval code that *calls* it. Pairs with **azure-openai** for the
  generation side of RAG. 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peer: AWS Kendra.
- IaC/CLI: Terraform `azurerm_search_service` (indexes/indexers/skillsets via REST/SDK or `azapi`);
  Bicep/ARM `Microsoft.Search/searchServices`. CLI `az search service create` + the **Search REST API**
  (`/indexes`, `/datasources`, `/skillsets`, `/indexers`, `/docs/search`); verify with the docs `$count`
  and a `search` query via `az rest` or curl.
