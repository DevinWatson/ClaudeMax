---
name: rag-system-design
description: Use when designing or fixing a retrieval-augmented generation system — separating retrieval vs generation failure, chunking strategy, embedding choice, hybrid (BM25+dense) retrieval + reranking + filtering, context assembly, grounding/citation, and retrieval metrics (recall@k/MRR/nDCG). TRIGGER on RAG design, wrong/missing retrieved context, hallucinated or uncited answers, or ablating a retrieval knob. A RAG builder or a reviewer debugging poor answer grounding can both load it. NOT for wording the generation prompt alone and NOT for building a general eval harness.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: ai-ml
tags: [rag, retrieval, embeddings, vector-store, reranking]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# RAG System Design

The substantive retrieval-augmented-generation capability: design a retrieval system that
returns grounded, cited answers — chunking, embeddings, the index, retrieval/reranking, context
assembly, and how retrieval quality is measured. Distinct from the bare answer-prompt wording
(prompt-engineer) and the general eval framework (evals-author).

## When to use this skill
When designing or fixing a RAG system: separating retrieval from generation failure, choosing a
chunking strategy, picking embeddings, designing hybrid retrieval + reranking, assembling
context, enforcing grounding/citation, or measuring retrieval. Not for writing the final
generation prompt alone or building a broad eval suite.

## Instructions
1. **Establish the setup first.** The corpus (size, format, structure, update cadence), the
   query distribution, the store (pgvector, Qdrant, Pinecone, Weaviate, Elasticsearch/OpenSearch,
   FAISS), the embedding and generation models, and the latency/cost budget. Read existing
   ingestion/chunking/retrieval code before changing it. State scope in one line.
2. **Diagnose where it breaks first.** RAG failures are usually retrieval, not generation: the
   right chunk was never retrieved, or it was retrieved but buried/diluted. Separate **retrieval
   failure** from **generation failure** before touching anything — evaluate them independently.
3. **Chunk for the unit of meaning.** Chunk on structure (headings, sections, code blocks), not
   blind fixed windows; size to content (~200–800 tokens typical) with modest overlap; keep
   metadata (source, title, section, timestamp) on each chunk for filtering and citation.
   Consider parent/child or sentence-window retrieval when chunks are too small to answer but
   too large to embed well.
4. **Choose embeddings and retrieval deliberately.** Pick an embedding model fit for domain and
   language; match query/document instruction conventions if the model uses them. Default to
   **hybrid retrieval** (dense + BM25/sparse) with fusion (RRF), then a **cross-encoder
   reranker** over the top-k candidates. Apply metadata filters before vector search. Tune `k`
   retrieved vs. `k` passed to the model separately.
5. **Assemble context responsibly.** Deduplicate and order by relevance (mind lost-in-the-middle
   — put the strongest evidence at the edges); fit the budget; attach source IDs so the generator
   can cite. Require the answer to be grounded in retrieved context and to abstain when evidence
   is insufficient. Hand the exact generation wording to prompt-engineer.
6. **Evaluate retrieval AND answers.** Build a small labeled query→relevant-doc set and report
   **retrieval** metrics: recall@k / hit-rate@k, MRR, nDCG, context precision. For **answer
   quality** (faithfulness/groundedness vs. context, answer relevance, citation correctness),
   use a calibrated rubric/judge rather than eyeballing. Where a full eval suite is needed, hand
   metric/dataset design to evals-author.
7. **Verify by ablation.** Change one knob (chunk size, hybrid on/off, reranker on/off, k) and
   re-measure recall@k and faithfulness. Report before/after; keep only changes that move a
   metric. Run the retrieval/eval scripts and report exact commands + results (or state you
   couldn't run them).

## Inputs
- The corpus and query distribution, the store/embedding/generation models, the existing
  ingestion/chunking/retrieval code, and the latency/cost budget.

## Output
```
Diagnosis: <retrieval vs. generation failure, with evidence>
Pipeline: ingest -> chunk(<strategy/size>) -> embed(<model>) -> index(<store>) ->
          retrieve(<hybrid? filters? k>) -> rerank(<model? top-k>) -> assemble -> generate
Eval: retrieval (recall@k / MRR / nDCG on <n> queries) + answer (faithfulness/relevance via judge)
Changes + ablation: <knob changed -> metric before/after>
Risks: <stale corpus, citation gaps, latency/cost, abstention behavior>
```

## Notes
- Always separate and measure retrieval before blaming the model; never claim an improvement
  without a recall@k / faithfulness number.
- Require grounding and citations; flag any design that lets the model answer beyond retrieved
  evidence without abstaining.
- For calibrated answer-quality / faithfulness judging, combine with an LLM-eval-rubric
  procedure; hand a broad eval framework to evals-author.
