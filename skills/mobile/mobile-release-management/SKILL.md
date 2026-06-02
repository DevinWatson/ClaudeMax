---
name: mobile-release-management
description: Use when shipping a mobile app to the App Store / Play Store — iOS code signing (certs/provisioning/entitlements, Fastlane match), Android keystore + Play App Signing, store submission and the common review rejections, version vs build-number management, phased/staged rollout, and crash-free-sessions gating. TRIGGER on signing setup, building/uploading a store artifact, a submission/review checklist, or planning a staged rollout with abort criteria. A release engineer or a CI/Fastlane reviewer can both load it. NOT for writing app feature/UI code.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: mobile
tags: [release, fastlane, app-store, play-store, signing, rollout]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Mobile Release Management

The substantive release/distribution capability: drive a tested mobile build to a live store
release — code signing, store submission, versioning, staged rollout, and crash-rate gating —
without writing app feature code.

## When to use this skill
When setting up or fixing code signing, building/uploading a store artifact, preparing for
store review, bumping versions/build numbers, or planning and gating a phased/staged rollout.
Not for app UI/logic changes (route those to the platform development capability).

## Instructions
1. **Establish platform, toolchain, and stage first.** Identify the platform(s) and toolchain:
   native (Xcode/Gradle), RN, or Flutter, and whether CI uses **Fastlane**, **EAS Submit**, or
   manual upload. Read the version source of truth (`MARKETING_VERSION`/`CURRENT_PROJECT_VERSION`
   in Xcode, `versionName`/`versionCode` in `build.gradle`, `version:` in `pubspec.yaml`, or
   `app.json`). Confirm the stage: signing, building, uploading to a test track, submitting for
   review, or managing a phased rollout already in progress.
2. **Bump versions correctly.** The user-facing version (semantic, e.g. `1.4.0`) is independent
   from the build number, which must be **monotonically increasing and unique per upload** —
   iOS `CFBundleVersion`/`CURRENT_PROJECT_VERSION`, Android `versionCode`. A rejected or
   re-uploaded build still needs a higher build number. Confirm the bump in every place (native
   + JS/Dart) so they don't drift.
3. **Get signing right.**
   - **iOS:** distinguish certificates (Apple Distribution), provisioning profiles, and the App
     ID/entitlements. Prefer **automatic signing** in CI via Fastlane **match** (a shared,
     encrypted cert/profile repo) over hand-managed `.p12`/`.mobileprovision`. Confirm bundle
     ID, team, and entitlements match the profile; export with the correct `exportOptions.plist`
     method (`app-store-connect`).
   - **Android:** sign the release with the upload keystore; enable **Play App Signing** (Google
     holds the app signing key, you hold the upload key). Never commit the keystore or passwords
     — keep them in CI secrets. Confirm `versionCode` exceeds the last uploaded.
4. **Build and upload.** Produce the store artifact: iOS `.ipa` (`xcodebuild -exportArchive` /
   `fastlane gym`), Android `.aab` (`./gradlew bundleRelease` / `fastlane gradle`). Upload via
   `fastlane pilot`/`deliver`, `xcrun altool`/`notarytool` or Transporter for iOS; `fastlane
   supply` or Play Console for Android. Push to a test track first (TestFlight / Play internal or
   closed) before production.
5. **Run the pre-submission review checklist.** Catch common rejections before they cost a cycle:
   - **Privacy:** App Store privacy nutrition label + `NSUsageDescription` strings for every
     accessed API (camera, location, tracking); ATT prompt if using IDFA. Play **Data safety**
     form + a declared privacy policy URL.
   - **Account/data:** account-deletion path if accounts exist (required by both stores).
   - **Permissions/policy:** justify sensitive permissions (background location, all-files,
     accessibility); no private APIs; complete export-compliance (encryption) answers.
   - **Metadata:** screenshots for required device sizes, accurate description, age rating, no
     placeholder content; working demo credentials for reviewers.
6. **Roll out in stages with gates.** Release to a fraction first: **Play** staged rollout (e.g.
   1% → 5% → 20% → 50% → 100%) via the production track; **iOS** App Store **phased release**
   (7-day automatic ramp) plus TestFlight beforehand. Define a **crash-free-sessions gate** (e.g.
   hold/halt if crash-free drops below a threshold in Crashlytics / Xcode Organizer / Play
   vitals) before advancing each step. Know the abort path: **halt rollout** (Play) / **pause
   phased release** (App Store) before shipping a hotfix.
7. **Verify and record.** Confirm the build appears in the store dashboard at the expected
   version+build, the correct track/phase, and signing is valid. Capture the release notes and
   the rollout plan. (For any build/upload command, run it and report the exact command + real
   output, or state you could not run it and give the exact commands.)

## Inputs
- The platform(s), toolchain, and CI lanes; the version source of truth; the signing material
  references (as CI secrets); the current release stage and dashboard state where accessible.

## Output
```
Release status: platform(s), version + build number, track/phase, rollout %
Commands/lanes run: fastlane … / xcodebuild / ./gradlew bundleRelease / xcrun … (+ results)
Pre-submission checklist: each step-5 item as PASS or OUTSTANDING <gap>
Rollout plan: platform, track, initial %, crash-free-sessions gate threshold, abort action
Unverified: anything behind an account/dashboard you could not access
```

## Notes
- Never print, commit, or echo signing secrets (keystore passwords, `.p12`, App Store API keys);
  reference them as CI secrets only.
- Always ship to a test track and a staged/phased rollout with a crash-rate gate before 100%;
  confirm the abort path exists first. Never reuse or lower a build number.
- For destructive/irreversible store actions (full release, removing a build, key rotation),
  confirm before proceeding.
