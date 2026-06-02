---
name: fhir-interoperability
description: Use when modeling, validating, or debugging HL7 FHIR (R4/R4B/R5) integrations — choosing the right resource and elements with correct cardinality and value-set bindings, wiring references/contained/conditional references and Bundles (transaction vs batch), conforming to profiles (US Core/IPS/vendor) via meta.profile and must-support slices, building search queries and REST writes, and binding codes to LOINC/SNOMED/ICD-10/RxNorm/UCUM. SYNTHETIC DATA ONLY — never request, echo, or store real PHI. TRIGGER on FHIR resource modeling, profile conformance, search, or terminology binding. Any healthcare-data agent (FHIR expert, EHR-integration helper, interoperability reviewer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: domain
tags: [fhir, healthcare, hl7, interoperability]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# FHIR Interoperability

The substantive capability for HL7 FHIR work: model resources correctly, wire references
and Bundles, conform to profiles, build search/REST interactions, bind terminology, and
validate — all on synthetic data only.

## PHI safety (read first, enforce always)
- **Never request, accept, paste, echo, or store real patient data (PHI).** FHIR data is
  HIPAA-sensitive. If a user supplies what looks like real PHI (real names, MRNs, SSNs,
  DOBs, addresses), **stop, do not echo it back, and ask them to replace it with synthetic
  data.**
- Use only **synthetic** examples — fictional names, placeholder ids (`Patient/example`),
  obviously fake dates. Recommend Synthea (https://synthetichealth.github.io/synthea/) for
  realistic synthetic datasets.
- Do not connect to, or instruct connecting to, a production EHR/FHIR server holding real
  PHI. Demos run against public sandboxes (HAPI test server, SMART Health IT sandbox).

## When to use this skill
When integrating with or modeling data for a FHIR API: resource design/validation,
references and contained resources, profile conformance, search queries and Bundles, or
code-system binding. Confirm the **FHIR version** (R4 baseline; R5/R4B differ in some
resources and search params) and the **server/profile flavor** (vanilla HAPI, US Core,
IPS, or a vendor like Epic/Cerner) first.

## Instructions
1. **Model the resource(s) correctly.** Use the right resource and required elements; honor
   cardinality and value-set bindings (e.g. `Observation.status` is required and bound to
   `observation-status`).
   - **References:** prefer relative literal references (`"reference": "Patient/123"`) within
     a server; use `contained` only for resources with no independent identity; use
     logical/conditional references (`Patient?identifier=...`) in transaction Bundles. Set
     `Reference.type`/`display` where profiles require them.
   - **Identifiers vs ids:** `id` is the server-assigned logical id; `identifier` is the
     business identifier (MRN, NPI) with a `system` (URI) + `value`. Do not conflate them.
2. **Conform to profiles.** When US Core / IG profiles apply, set `meta.profile`, satisfy
   must-support elements and required slices (e.g. US Core Patient requires `identifier`,
   `name`, `gender`, plus race/ethnicity `extension` slices). Validate against the IG, not
   just base FHIR.
3. **Bind terminology.** Use the correct system: **LOINC** for labs/observations
   (`http://loinc.org`), **SNOMED CT** (`http://snomed.info/sct`) for clinical
   findings/procedures, **ICD-10-CM** for diagnoses, **RxNorm** for meds, **UCUM** for units.
   Always pair `code` + `system` + `display`; flag any unbound or invented codes.
4. **Search & REST.** Use correct params and modifiers. Example — a patient's recent HbA1c:
   `GET [base]/Observation?patient=Patient/example&code=http://loinc.org|4548-4&date=ge2026-01-01&_sort=-date&_count=20`
   Use chaining (`Observation?patient.name=...`), `_include`/`_revinclude`, `_count` +
   `Bundle.link[next]` for pagination, and `system|code` token form. For writes use
   conditional create/update (`If-None-Exist`, `If-Match` with ETag/`versionId`).
5. **Bundles.** Choose `transaction` (atomic, supports conditional refs + `urn:uuid:`
   placeholders resolved server-side) vs `batch` (independent entries) deliberately. Set each
   `entry.request` method/url; use `urn:uuid:` fullUrls to link new resources within one
   transaction.
6. **Validate.** Validate every resource you produce — run a FHIR validator (HAPI CLI /
   `$validate` against a sandbox) when tooling is available, and report the OperationOutcome.
   If you cannot validate, say so rather than claiming validity.

## Inputs
- The FHIR version, the server/profile flavor, any local IGs/StructureDefinitions/
  CapabilityStatement/example resources, and the modeling or query goal — all synthetic.

## Output
- The resource(s)/query/Bundle as JSON (FHIR is JSON-first), using synthetic data only.
- A short rationale for non-obvious modeling choices (reference style, profile slices,
  code system).
- Validation result (validator output or `$validate` OperationOutcome), or an explicit
  note that validation was not run and why.
- The relevant spec/IG element cited (resource + element path, e.g. `Observation.code`).

## Notes
- PHI safety overrides everything: synthetic data only, never echo real PHI.
- State the FHIR version and profile assumptions; flag where R4/R5 behavior diverges.
- Never invent codes, value-set URLs, or search params — verify against the version's
  spec/IG.
