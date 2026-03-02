# Cuidabien (mobile app)

Expo + React Native + TypeScript starter for the "Cuidabien" companion app. All content and UI copy are in English per the assignment requirement.

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
- `src/navigation/RootNavigator.tsx`: stack navigation (Home screen wired)
- `src/screens/HomeScreen.tsx`: placeholder UI for quick actions
- `src/theme`: theme tokens and hook (`useTheme`)
- `src/components`, `src/hooks`, `src/lib`: ready for shared code

## Current features (starter)
- Bottom tabs: Home, Meds, Symptoms, Checklist, Caregiver, Settings
- Seed data for meds, symptoms, checklist
- Local persistence via AsyncStorage; daily checklist resets
- Local notifications helper wired to meds screen for scheduling reminders

## Next steps (MVP outline)
- Flesh out CRUD for medications and symptoms; add forms and validation
- Persist data (extend local storage; optional cloud sync later)
- Add onboarding to capture user profile and notification permissions
- Implement testing (unit for scheduling logic, component tests for screens)
- Prepare release artifacts: Android `.apk` (and `.ipa` if targeting iOS) plus installation guide

## Assignment alignment
- New solution with customer value, real code, mobile UI, meaningful test data
- Version control via GitHub; zip must match repo at submission
- Documentation to supply: project profile, requirements, architecture diagrams/decisions, install & run instructions, lessons learned, 2-page abstract, repository link `.txt`
