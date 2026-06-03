---
name: aws-rekognition
description: Use when designing, provisioning, securing, or operating Amazon Rekognition — the managed computer-vision service that analyzes images and video without building models (Amazon Rekognition). Loads the Rekognition knowledge: image analysis (label/object detection, image properties, text-in-image/OCR, content moderation, PPE detection), face operations (detection, comparison, search against collections, and Face Liveness), celebrity recognition, the stored-vs-streaming-video paths (asynchronous video analysis via S3 + SNS/SQS job completion, and Kinesis-Video-Stream connected stream processors for face search), Custom Labels for domain-specific detection, collections for face vectors, IAM/KMS security, cost (per image / per minute of video, training/inference units for Custom Labels), quotas/TPS, and verification by running detection. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Rekognition specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, rekognition, ai-ml, computer-vision, image-analysis, video-analysis]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Rekognition

A managed **computer-vision** service that analyzes **images and video** through API calls — labels,
objects, text, faces, moderation — with **no model to train or host** (except optional Custom Labels).
You send an image/video reference, choose an analysis, and get structured results with confidence
scores.

## Core concepts and components
- **Image analysis** — **label/object detection** (with bounding boxes + hierarchy), **image
  properties** (quality/color), **text detection (OCR)**, **content moderation** (unsafe-content
  categories), and **PPE detection**.
- **Face operations** — **DetectFaces** (attributes/landmarks), **CompareFaces** (1:1), **collections**
  (index face vectors → `SearchFacesByImage`/`SearchFaces` for 1:N search), and **Face Liveness**
  (anti-spoofing for verification flows).
- **Celebrity recognition** and **custom domain detection** via **Custom Labels** (train on your
  labeled images for product/defect/logo detection — produces a project version you run inference
  units against).
- **Video paths** — **stored video** is analyzed **asynchronously**: start a job on an S3 object, get a
  **JobId**, receive completion via **SNS/SQS**, then fetch results. **Streaming video** uses **stream
  processors** connected to a **Kinesis Video Stream** for live face search / connected-home label
  detection.
- **Collections** — server-side containers of indexed face vectors scoped per use case.

## Configuration and sizing
- No instances to size for the base APIs — pick the operation, set **MinConfidence** and
  (labels) **MaxLabels**, and for faces choose **FaceMatchThreshold** and **QualityFilter**. For
  **Custom Labels**, size **inference units** for throughput and only run the project version when
  needed (it bills while running). Use async video jobs with SNS/SQS for large media; use stream
  processors for live feeds.

## Security and IAM
- Gate with IAM (`rekognition:*` scoped to operations/collections) plus `s3:GetObject` on the source
  bucket and SNS/SQS permissions for video job notifications and stream processors. Encrypt source data
  and (face) collections with **KMS**; reach the service via **VPC endpoints**. Face data is biometric
  — control collection access tightly, set data-retention policy, and confirm legal/consent
  requirements before indexing faces.

## Cost levers
- Billed **per image processed** and **per minute of video**; **Custom Labels** bills **training
  hours** + **inference-unit hours** (while the model is running). Levers: batch and de-duplicate
  images, downscale to the minimum useful resolution, **stop Custom Labels project versions** when idle,
  cache results, and prefer the built-in APIs over Custom Labels unless domain-specific accuracy
  requires it.

## Scaling and limits
- Per-account **TPS quotas** per operation (raisable via support); large images/videos have size limits
  (and very large images should go through S3). Async video jobs have concurrency limits; Custom Labels
  throughput scales with inference units. Collections have face-count limits per collection.

## Operating procedure
1. **Provision** — create supporting resources: a **collection** (`aws rekognition create-collection`)
   for face search, an SNS topic + SQS queue for video jobs, and (Custom Labels) a project; via
   Terraform `aws_rekognition_collection` / `aws_rekognition_project` where available, or CLI.
2. **Configure** — choose operations and thresholds (MinConfidence/FaceMatchThreshold), wire video jobs
   to SNS/SQS or stream processors to a Kinesis Video Stream, and (Custom Labels) train + start a
   project version with inference units.
3. **Secure** — least-privilege IAM, `s3:GetObject` on sources, KMS on collections/data, VPC endpoints,
   and biometric-data retention/consent controls.
4. **Verify** — apply [[verify-by-running]]: run a representative call
   (`aws rekognition detect-labels` / `detect-moderation-labels` / `search-faces-by-image`) on a sample
   image and confirm sensible results above threshold; for video, start the job and poll
   `get-*-detection` with the JobId until results return — capture the actual output.

## Inputs
Analysis type(s) (labels/moderation/text/faces/Custom Labels), media (image vs stored video vs stream)
+ S3/KVS source, thresholds (MinConfidence/FaceMatchThreshold), collection needs, notification wiring
(SNS/SQS) for video, security/consent model, throughput (TPS / inference units) targets.

## Output
A Rekognition setup — the chosen image/video/face operations with appropriate thresholds, collections
and (if needed) a trained Custom Labels project, video jobs wired to SNS/SQS or a stream processor, and
least-privilege IAM/KMS — plus verification that detection returns sensible, above-threshold results.

## Notes
- Gotchas: stored-video analysis is async (JobId + SNS/SQS, not synchronous); Custom Labels bills while
  the project version is running — stop it when idle; face data is biometric (consent/retention/legal);
  confidence thresholds materially change results; large images should come from S3, not inline bytes;
  moderation categories evolve; Custom Labels needs a sufficiently large labeled dataset.
- IaC/CLI: Terraform `aws_rekognition_collection`, `aws_rekognition_project` /
  `aws_rekognition_stream_processor` (where available; otherwise CLI/SDK). CLI
  `aws rekognition detect-labels`, `detect-moderation-labels`, `detect-text`, `compare-faces`,
  `create-collection`, `index-faces`, `search-faces-by-image`, `start-label-detection` /
  `get-label-detection`, `create-stream-processor`. CloudFormation `AWS::Rekognition::Collection`,
  `AWS::Rekognition::Project`, `AWS::Rekognition::StreamProcessor`.
