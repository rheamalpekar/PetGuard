# PetGuard Project Report

## 1. Project Summary

PetGuard is a React Native mobile application built with Expo and Firebase to support rapid reporting and triage of animal emergencies. The app enables users to authenticate, submit emergency and information forms, capture or upload supporting photos, share location context, and track report/request status.

Core implementation areas include:
- Authentication and account management
- Emergency detection and scenario classification
- Information form collection and backend persistence
- Location capture with retry/caching behavior
- Firestore-backed request tracking and profile management

Primary technology stack:
- Expo SDK 54 and React Native 0.81
- React 19 with Expo Router
- Firebase Authentication, Firestore, and Storage
- TypeScript/JavaScript mixed codebase

## 2. System Scope and Functional Areas

Based on the project documentation and implemented source modules, the app scope centers on five functional areas:

1. User Authentication
- Email/password registration and login
- Session persistence behavior for web and native
- Account logout and account deletion handling

2. Emergency Intake and Triage
- Emergency type and description intake
- Rule-based emergency detection and severity assignment
- Dispatch protocol and checklist generation

3. Information Collection and Submission
- Structured information forms
- Photo attachment upload to cloud storage
- Firestore document creation and update flow

4. Location Services
- Foreground location permission handling
- Retry logic for GPS acquisition and error classification
- Reverse geocoding and map/marker interactions

5. Request Tracking
- Firestore live query for user-associated requests
- Status visibility for pending service requests

## 3. Unit Testing Strategy

The team used a unit-first validation strategy for high-risk logic and service-layer behavior. Unit tests are organized by module responsibility and prioritize deterministic, isolated checks using mocked dependencies (Firebase SDK, Expo Location, AsyncStorage, and React Native Alert).

### 3.1 Testing Goals

- Verify correctness of emergency risk classification logic
- Validate error-handling and resilience paths in location and backend services
- Ensure authentication/session behavior is consistent across platform conditions
- Confirm queueing and synchronization logic for form submission reliability

### 3.2 Test Tooling Approach

- Test runner: Jest
- Component and hook tests: React Native Testing Library (where applicable)
- Continuous Integration: GitHub Actions workflow executes lint and test jobs on each push and pull request to the main development branch
- Mocks/stubs:
  - Firebase auth/firestore/storage SDK calls
  - Expo location APIs
  - AsyncStorage
  - Network/XHR for photo upload path

### 3.3 Representative Unit Test Coverage

#### A. Emergency Classification Engine
Module under test: src/emergency/core/EmergencyAlertSystem.ts

1. Critical Scenario Priority Test
- Input: description containing multiple scenario signals where one maps to CRITICAL and another to MEDIUM
- Expected: selected scenario uses highest severity priority and CRITICAL countdown value

2. Heuristic High-Risk Fallback Test
- Input: no direct scenario match, but text includes danger words such as "bleeding" or "unconscious"
- Expected: isEmergency true, severity HIGH, classification ACCIDENT, and triage checklist populated

3. Non-Emergency Default Test
- Input: low-risk text with no matching keywords
- Expected: isEmergency false, severity LOW, dispatchProtocol NONE, countdownSeconds 0

4. Performance Bound Test
- Input: long free-text description
- Expected: detectionMs remains within acceptable threshold under unit test runtime constraints

#### B. Location Reliability and Error Handling
Module under test: services/LocationService.js

1. Accuracy Mapping Test
- Input: accuracy values at threshold boundaries (9.9, 10, 49.9, 50, 99.9, 100)
- Expected: correct AccuracyLevel transitions (HIGH/MEDIUM/LOW/VERY_LOW)

2. Cache Validity Test
- Input: recently updated cache vs expired cache
- Expected: getCachedLocation returns cached object only while within expiration window

3. Permission Denied Path Test
- Setup: requestForegroundPermissionsAsync mocked to deny permission
- Expected: getCurrentPosition returns null and permission alert path is triggered when showAlert=true

4. Retry Exhaustion Test
- Setup: getCurrentPositionAsync throws timeout-like errors across all attempts
- Expected: function retries maxRetries times and returns null with classified timeout message path

5. Reverse Geocode Fallback Test
- Setup: reverseGeocodeAsync throws
- Expected: fallback string uses latitude/longitude fixed precision format

#### C. Authentication and Persistence Behavior
Module under test: src/backendServices/AuthService.ts

1. Registration Writes User Profile Test
- Setup: mock successful createUserWithEmailAndPassword
- Expected: setDoc called with uid/email/fullName/phoneNumber and createdAt timestamp

2. Remember-Me Persistence Test (Web)
- Input: rememberMe true vs false on Platform.OS web
- Expected: setPersistence called with browserLocalPersistence when true and browserSessionPersistence when false

3. Native Persistence Fallback Test
- Input: Platform.OS native and rememberMe false
- Expected: setPersistence uses inMemoryPersistence

4. Login Failure Propagation Test
- Setup: signInWithEmailAndPassword rejects
- Expected: login throws error to caller for UI-level handling

#### D. Backend Form Submission and Queue Sync
Module under test: src/backendServices/ApiService.ts

1. submitInfoForm Happy Path Test
- Setup: authenticated user, addDoc/updateDoc/uploadImage mocked success
- Expected: Firestore doc created, image URLs uploaded, doc updated with formId/photos, success response returned

2. Authentication Guard Test
- Setup: auth.currentUser null
- Expected: submitInfoForm throws "Not authenticated"

3. Queue Serialization Test
- Setup: enqueueInfoForm called repeatedly
- Expected: items persisted in AsyncStorage under stable key and loadQueuedInfoForms restores objects

4. Sync Idempotency Lock Test
- Setup: syncQueuedInfoForms called while isSyncing=true
- Expected: second call exits without concurrent processing

5. Partial Sync Failure Test
- Setup: first queued item succeeds, second fails
- Expected: successful item removed from queue; failed item retained for retry

#### E. Field Validation Tests (Login, Create User, Info Form)
Modules under test: app/auth/login.js, app/auth/register.js, app/formscreens/info-form.tsx

1. Login Email Format Validation Test
- Input: malformed email values (missing @, missing domain, whitespace-only)
- Expected: submit action blocked and email validation message displayed

2. Login Password Required Test
- Input: empty password field
- Expected: submit action blocked with required-field error

3. Login Credential Length/Format Guard Test
- Input: short or malformed password values that violate UI rules
- Expected: validation feedback shown before authentication call is made

4. Create User Full Name Validation Test
- Input: empty name, numeric-only name, and overlong name
- Expected: invalid values rejected; user can proceed only with valid name format

5. Create User Email Validation Test
- Input: invalid and duplicate-like email scenarios using mocked auth response
- Expected: client-side format errors caught and backend-auth errors surfaced cleanly

6. Create User Phone Number Validation Test
- Input: non-numeric phone strings, too-short, and too-long values
- Expected: validation rules enforce numeric input and expected length bounds

7. Create User Password/Confirm Password Match Test
- Input: mismatched password and confirmation values
- Expected: registration blocked and mismatch message shown

8. Info Form Required Fields Validation Test
- Input: submit with required fields omitted (reporter name, contact details, emergency type, and location context)
- Expected: per-field error indicators shown; form submission prevented

9. Info Form Dropdown/Enum Validation Test
- Input: unsupported emergency type/severity selections injected through mocked state
- Expected: form normalization rejects invalid enum values before persistence

10. Info Form Location Data Validation Test
- Input: invalid coordinates (out-of-range latitude/longitude), missing address object
- Expected: location object rejected until valid values are provided

11. Info Form Attachment Validation Test
- Input: unsupported file type, oversized image mock, and empty attachment set when required by scenario
- Expected: file-level validation messages shown and upload call not triggered

12. Info Form Sanitization and Trim Test
- Input: leading/trailing spaces, multiline special characters in free-text details
- Expected: whitespace normalization occurs and unsafe payload patterns are blocked/sanitized before submit

### 3.5 GitHub Actions Test Automation

The team configured automated quality checks in GitHub Actions so that every code change is validated before merge.

CI trigger model:
- Runs on push to dev and on pull requests targeting dev/main
- Supports manual dispatch for release-candidate validation

CI jobs executed:
1. Dependency and environment setup
- Checkout repository
- Install Node.js LTS and npm dependencies
- Cache npm modules for faster reruns

2. Static quality gate
- Run expo lint
- Fail pipeline on lint violations

3. Unit test gate
- Run Jest in CI mode with deterministic output
- Publish test summary and coverage artifact

Representative GitHub Actions workflow:

```yaml
name: PetGuard CI

on:
  push:
    branches: [dev]
  pull_request:
    branches: [dev, main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci
        working-directory: PetGuardTeamProject

      - name: Lint
        run: npm run lint
        working-directory: PetGuardTeamProject

      - name: Unit tests
        run: npm test -- --ci --coverage
        working-directory: PetGuardTeamProject

      - name: Upload coverage artifact
        uses: actions/upload-artifact@v4
        with:
          name: petguard-coverage
          path: PetGuardTeamProject/coverage
```

This workflow ensures that validation tests for login, create-user, and info-form fields run automatically alongside emergency, location, and backend service tests before integration.

### 3.4 Why These Unit Tests Matter

These tests target the highest-risk mobile behaviors:
- Emergency misclassification risk
- GPS permission and signal instability
- Authentication/session inconsistency
- Offline/unstable network submission flow

By emphasizing deterministic service-layer testing, the project reduces regression risk before manual QA and build generation.

## 4. Debugging Process and Findings

The debugging workflow combined static checks, focused runtime logging, and failure-path simulation.

### 4.1 Debugging Workflow

1. Static pass
- Type and lint checks for obvious API misuse and nullability issues

2. Module-level runtime validation
- Device/emulator runs for auth, emergency flow, location acquisition, and form submit path

3. Failure simulation
- Permission denial, network/API interruptions, and Firebase auth edge cases

4. Trace logging and targeted fix iteration
- Logged event flow around retries, queue sync, and async Firebase operations

### 4.2 Debugging Areas and Resolutions

1. GPS instability and first-fix failure behavior
- Observation: first location request can fail due to environment and OS timing
- Resolution approach: retry loop with bounded attempts and error classification, plus user-friendly alerting

2. Duplicate permission prompt risk during location initialization
- Observation: repeated permission prompts reduce UX quality
- Resolution approach: centralize permission handling inside getCurrentPosition/requestLocationPermission flow

3. Submission reliability under temporary failures
- Observation: forms can fail in transient network conditions
- Resolution approach: queue persistence with explicit sync routine and non-concurrent synchronization guard

4. Account deletion edge case (recent-login requirement)
- Observation: Firebase can reject destructive account actions when session is stale
- Resolution approach: error messaging that guides re-authentication path

### 4.3 Debugging Outcome

The app’s critical paths were stabilized by focusing on:
- Defensive guards for unauthenticated actions
- Predictable fallback behavior for location and reverse geocoding
- Queue-based recovery strategy for form submissions
- Explicit, recoverable error handling for auth and profile operations

## 5. Deployment Preparation: Expo to Android APK

The project’s deployment preparation focused on producing a signed Android artifact and preparing release metadata for Play Console submission.

### 5.1 Release Readiness Checklist

1. App configuration review
- Verified app identity fields (name/slug/version) and Android icon/adaptive icon settings in app.json

2. Environment and dependency verification
- Installed project dependencies and validated Expo SDK compatibility

3. Build profile preparation
- Prepared EAS Build workflow for Android release generation
- Planned release profile for apk artifact generation and internal validation profile

4. Credential and signing preparation
- Planned keystore handling through Expo EAS managed credentials workflow

5. Firebase release configuration checks
- Confirmed backend endpoints and auth/storage usage align with production-safe config expectations

### 5.2 APK Build Workflow (Planned/Executed for Packaging)

1. Install EAS CLI and authenticate
- npm install -g eas-cli
- eas login

2. Configure build profiles
- eas build:configure

3. Generate Android artifact
- For APK validation testing: eas build -p android --profile preview
- For Play distribution track handoff (typically AAB): eas build -p android --profile production

4. Verify output artifact
- Smoke test install on physical Android device
- Validate login, emergency report, location capture, and form upload flows

### 5.3 Play Store Submission Pipeline (Prepared)

Prepared process for submission:

1. Create/update app listing in Play Console
- App title, short/full descriptions, screenshots, icon, and category

2. Configure policy and data safety forms
- Privacy disclosures and account/data handling forms

3. Upload signed release artifact
- Internal testing track first, then production promotion after validation

4. Complete content rating and country/region availability

5. Submit for review and monitor pre-launch reports

### 5.4 Submission Blocker

The team was unable to complete final Play Store upload/submission because the professor’s Google Play Console account was locked out at the time of release handoff. As a result, the final console upload step could not be executed despite build and release preparation being completed.

## 6. Quality and Release Assurance Summary

1. Unit testing focused on high-impact logic and failure conditions
- Emergency classification correctness
- Location reliability and cache/retry behavior
- Authentication persistence and guardrails
- Form queueing/sync stability

2. Debugging emphasized reproducible failure modes
- Permission denial, timeout, and stale-session handling
- Traceable async behavior in backend and location modules

3. Deployment prep followed standard Expo/EAS release pathway
- Android packaging workflow prepared
- Play submission checklist completed up to account-access limitation

## 7. Conclusion

PetGuard reached a technically mature state across reliability-critical areas: emergency triage logic, resilient location handling, backend submission flow, and authentication safety checks. Unit testing and targeted debugging significantly reduced risk in mobile-specific edge cases. Deployment preparation for Android release and Play Store submission was completed operationally, with final submission blocked only by temporary account access constraints external to the codebase.
