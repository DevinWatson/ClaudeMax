---
name: aws-forecast
description: Use when designing, provisioning, securing, or operating Amazon Forecast — the managed time-series forecasting service that builds forecasts from historical data without ML model code (Amazon Forecast). Loads the Forecast knowledge: the dataset group with target-time-series plus related-time-series and item-metadata datasets and their schemas/domains (RETAIL, INVENTORY_PLANNING, custom, etc.), predictors (AutoPredictor with algorithm ensembling, or legacy manual algorithms ARIMA/DeepAR+/Prophet/ETS/NPTS), forecast horizon and frequency, accuracy metrics (wQL/WAPE/RMSE/MASE) and backtesting, forecast quantiles (P10/P50/P90), what-if analyses, exporting forecasts to S3, IAM/KMS security, cost (training/import + forecast generation), quotas, the maintenance-mode/limited-new-onboarding status, and verification by generating and querying a forecast. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect). Consumed by the Forecast specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, forecast, ai-ml, time-series, forecasting, demand-planning]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Forecast

A managed **time-series forecasting** service that trains forecasting models from your historical data
and generates probabilistic forecasts, with **no ML model code to write**.

> Status note: Amazon Forecast is in **limited new onboarding / maintenance** — it is **not available to
> new customers** and existing usage is in maintenance. Confirm account access before designing around
> it, flag this prominently to consumers, and for new builds prefer **SageMaker Canvas time-series** or
> other forecasting approaches.

## Core concepts and components
- **Dataset group + datasets** — a **dataset group** (tied to a **domain** such as RETAIL,
  INVENTORY_PLANNING, WEB_TRAFFIC, or CUSTOM) holds a required **Target Time Series** dataset and
  optional **Related Time Series** and **Item Metadata** datasets, each with a declared **schema** and
  **frequency**.
- **Predictors** — **AutoPredictor** automatically selects/ensembles algorithms; legacy mode lets you
  pick **ARIMA / DeepAR+ / Prophet / ETS / NPTS**. You set the **forecast horizon** and **frequency**.
- **Accuracy + backtesting** — evaluation via **wQL** (weighted quantile loss), **WAPE**, **RMSE**,
  **MASE** computed through **backtest windows**.
- **Forecasts** — generated at **quantiles** (e.g., P10/P50/P90) for probabilistic planning; query via
  `QueryForecast` or **export** to S3.
- **What-if analyses** — model scenario changes (price/promotion) against a baseline forecast.

## Configuration and sizing
- Define schemas + frequency, import the **target** (and optional related/metadata) time series, train a
  **predictor** (AutoPredictor recommended), set the **horizon**, generate a **forecast** at the needed
  **quantiles**, then query or export to S3. Nothing to size directly — cost/throughput scale with data
  volume and forecast count.

## Security and IAM
- Gate with IAM (`forecast:*`) plus a **role** granting S3 read for imports and write for exports.
  Encrypt data/artifacts with **KMS** and lock down S3 buckets. Forecast inputs (sales, demand) can be
  commercially sensitive — restrict access.

## Cost levers
- Bills on **data import/storage**, **predictor training-hours**, and **forecast generation** (by number
  of series/quantiles). Levers: limit the number of forecasted series and quantiles, retrain only when
  data materially changes, delete old predictors/forecasts/dataset groups, and avoid unnecessary related
  datasets that add training time.

## Scaling and limits
- Per-account limits on dataset groups, predictors, and forecasts; minimum history length per series for
  reliable training; horizon capped relative to history. Raise quotas via Service Quotas/support
  (subject to maintenance-mode constraints).

## Operating procedure
1. **Provision** — create the **dataset group**, datasets + **schemas**, and the import/export **IAM
   role**; via Terraform (`aws_forecast_*` resources are not generally available — coverage is minimal),
   or `aws forecast create-*`.
2. **Configure** — import target (and related/metadata) time series, train an **AutoPredictor**, set
   horizon/frequency, generate a **forecast** at chosen quantiles, and configure S3 **export**.
3. **Secure** — least-privilege IAM + import/export role, KMS on data, locked S3 buckets.
4. **Verify** — apply [[verify-by-running]]: after training, check predictor **accuracy metrics**
   (wQL/WAPE), generate the forecast, then `aws forecastquery query-forecast --forecast-arn ...
   --filters ...` (or inspect the S3 export) and confirm sensible quantile values for a sample item over
   the horizon — capture the actual output.

## Inputs
Time-series data (target + optional related/metadata) + schemas + frequency, domain, forecast
horizon/quantiles, accuracy targets, export destination, security/compliance (KMS), account/region
availability of the service.

## Output
A Forecast setup — a dataset group with imported time series, a trained predictor with acceptable
backtest accuracy, generated quantile forecasts queried or exported to S3, and least-privilege IAM/KMS —
plus verification that forecasts are sensible against accuracy metrics.

## Notes
- Gotchas: the service is **not open to new customers** (maintenance mode) — confirm access first and
  recommend alternatives for greenfield; too-short history yields poor accuracy; AutoPredictor is
  preferred over hand-picking algorithms; horizon is bounded by history length; forecast generation cost
  grows with series × quantiles; exports need the role's S3 write permission or they fail.
- IaC/CLI: dedicated Terraform/CloudFormation coverage for Forecast is **minimal/absent** — provision via
  CLI/SDK and manage surrounding S3/IAM/KMS with IaC. CLI `aws forecast create-dataset-group` /
  `create-dataset` / `create-dataset-import-job` / `create-auto-predictor` / `create-forecast` /
  `create-forecast-export-job` / `get-accuracy-metrics`; query `aws forecastquery query-forecast`.
