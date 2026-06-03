---
name: gcp-vertex-ai-vision
description: Use when designing, provisioning, securing, or operating Vertex AI Vision — Google Cloud's platform for ingesting and analyzing live and recorded video streams: streams, applications (the processing graph of ingest → models → output), pre-built and custom vision models (occupancy/PPE/object detection, person/vehicle counting), the Vision Warehouse for searchable media storage and analytics, and BigQuery/Pub/Sub sinks (Vertex AI Vision). Loads the Vertex AI Vision knowledge: register a stream, build an application graph, attach models, store results in the Warehouse, and verify analytics. Consumed by the Vertex AI Vision specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle video-analytics workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, vertex-ai-vision, ai-ml, video-analytics, streaming, vision-warehouse]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Vertex AI Vision

A managed platform for ingesting, analyzing, and storing video at scale — both live camera streams
and recorded footage. You compose an analytics pipeline as an **application** graph, attach vision
models, and route results to the **Vision Warehouse**, BigQuery, or Pub/Sub. It targets video
intelligence (people/vehicle/object analytics) rather than single-image API calls.

## Core concepts and components
- **Streams** — registered video inputs; live RTSP/camera feeds (ingested via the `vaictl` tool or
  SDK) or recorded media.
- **Applications** — the processing **graph**: an ingest node feeds one or more model nodes, whose
  outputs go to sinks (Vision Warehouse, BigQuery, Pub/Sub, or a media output). You deploy an
  application to run continuously over its streams.
- **Models** — **pre-built** models (occupancy analytics / person + vehicle detection, PPE
  detection, person blur, object detector) and **custom models** trained in Vertex AI and imported
  into the graph.
- **Vision Warehouse** — managed storage + indexing for ingested media and annotations, enabling
  search/query over video by content and metadata.
- **Outputs/sinks** — annotated streams, BigQuery tables of analytics, and Pub/Sub event streams.

## Configuration and sizing
- Size by number of streams, resolution/frame rate, and which models run per stream (each model node
  adds processing cost). Choose the region close to the cameras/ingest. Decide sinks up front
  (Warehouse for searchable storage, BigQuery for analytics, Pub/Sub for real-time events). Use
  `vaictl` to send live feeds; throttle frame rate to control cost where full FPS isn't needed.

## Security and IAM
- Run the application with a dedicated **service account** scoped to the streams, Warehouse, BigQuery
  dataset, and Pub/Sub topic it needs — avoid broad project-wide roles. Restrict who can register
  streams and read Warehouse media (it may contain PII/faces — consider the person-blur model). Use
  CMEK where supported and audit access via Cloud Audit Logs; lock down camera-ingest credentials.

## Cost levers
- Cost scales with hours of video processed per model node and stored media in the Warehouse. Levers:
  run only the models you need per stream, reduce ingested frame rate/resolution, set Warehouse
  retention, and stop applications when streams are idle. BigQuery/Pub/Sub egress adds incremental
  cost.

## Scaling and limits
- Throughput scales with the number of concurrent streams and model nodes; per-project quotas govern
  streams, applications, and processing capacity. Live ingest depends on stable network bandwidth
  from the camera site. Raise quotas via the quotas page.

## Operating procedure
1. **Provision** — enable the Vision AI API, create the runtime **service account**, and create the
   target **Vision Warehouse**, BigQuery dataset, and/or Pub/Sub topic sinks.
2. **Configure** — register the **stream(s)**, build the **application** graph (ingest → model
   node(s) → sink(s)) choosing pre-built or imported custom models, deploy the application, and start
   ingesting with `vaictl` or the SDK.
3. **Secure** — scope the service account least-privilege, restrict stream/Warehouse access, apply
   person-blur/CMEK for sensitive footage, and protect camera credentials.
4. **Verify** — apply [[verify-by-running]]: confirm the application is deployed/running and the
   stream is active (`gcloud` / Vision AI API list), then ingest a sample clip and confirm
   annotations land in the chosen sink (query the Vision Warehouse or the BigQuery analytics table)
   with sensible detections — capture the actual output.

## Inputs
Stream sources (live RTSP / recorded), number of streams + resolution/FPS, which analytics/models are
needed, sinks (Warehouse / BigQuery / Pub/Sub), region, IAM/service-account scope, privacy/retention
requirements, and cost constraints.

## Output
A Vertex AI Vision setup (registered streams, an application graph with model nodes and sinks, a
Vision Warehouse and/or BigQuery/Pub/Sub outputs) with a least-privilege service account, plus
verification of a running application producing sensible annotations in the chosen sink.

## Notes
- Gotchas: live ingest needs the `vaictl` tool and stable bandwidth from the camera site; each model
  node multiplies processing cost; Warehouse media can contain PII/faces (apply person-blur and tight
  IAM); region availability of pre-built models varies; this is for VIDEO streams/analytics — for
  single-image labeling/OCR use Vision API, and custom models are trained in Vertex AI then imported.
- IaC/CLI: Terraform coverage for Vision AI is limited — provision supporting resources
  (`google_project_service`, `google_service_account`, `google_storage_bucket`,
  `google_bigquery_dataset`, `google_pubsub_topic`) in Terraform and create streams/applications via
  the Vision AI API / console / `vaictl`. CLI/tooling: `gcloud services enable visionai.googleapis.com`,
  the `vaictl` command-line tool for ingest, and the Vision AI REST/SDK for applications, streams, and
  Warehouse queries.
