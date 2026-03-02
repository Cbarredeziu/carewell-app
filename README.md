# CareWell (mobile app)

Expo + React Native + TypeScript app for the CareWell companion. All content and UI copy are in English per the assignment requirement.

## Getting started
1) Install dependencies: `npm install`
2) Run Metro and choose a target:
   - `npm run start`
   - `npm run android`
   - `npm run ios`
3) Lint: `npm run lint`
4) Tests (placeholder): `npm test`

## Project layout
- `App.tsx`: app root with navigation and theming provider
- `src/navigation/RootNavigator.tsx`: bottom-tab navigation
- `src/screens`: Home, Meds, Symptoms, Checklist, Caregiver, Settings
- `src/theme`: theme tokens and hook (`useTheme`)
- `src/lib`: storage, notifications, seed data, types

## Current features
- Bottom tabs: Home, Meds, Symptoms, Checklist, Caregiver, Settings
- Add flows for medications, symptoms, checklist, and caregiver symptom logging
- Local persistence via AsyncStorage; daily checklist resets
- Local notifications scheduling for medication reminders

## Next steps (MVP outline)
- Add edit/delete for medications, symptoms, and checklist items
- Add onboarding to capture user profile and notification permissions
- Implement testing (unit for scheduling logic, component tests for screens)
- Prepare release artifacts: Android `.apk` (and `.ipa` if targeting iOS) plus installation guide

## APK installation (to be added on release)
1) Download the APK from the release link.
2) On Android, enable "Install unknown apps" for your file manager or browser.
3) Open the APK and complete installation.
4) Launch CareWell from your app list.
5) If you see a Play Protect warning, confirm you want to install.

## Assignment alignment
- New solution with customer value, real code, mobile UI, meaningful test data
- Version control via GitHub; zip must match repo at submission
- Documentation to supply: project profile, requirements, architecture diagrams/decisions, install & run instructions, lessons learned, 2-page abstract, repository link `.txt`
