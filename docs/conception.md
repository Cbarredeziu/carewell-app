# Cuidabien — Conception Phase

## Project profile
- Objective: Help chronic-care patients follow medication and self-care routines, and let caregivers see adherence and symptoms.
- Scope (MVP): medication schedules with local notifications; symptom logging with history; daily self-care checklist; caregiver summary view (read-only). Out of scope: real-time sync/cloud share, telehealth, payments.
- Target users: adults with chronic conditions (e.g., diabetes, hypertension) and their informal caregivers.
- Risks: notification permissions denied; user drop-off if onboarding is long; data loss if storage clears; accessibility gaps; schedule drift due to timezone changes.
- Mitigations: concise onboarding with permission rationale; local storage backups/export (later); large touch targets and high contrast; schedule recalculation on app focus/timezone change.

## Methodology
- Lightweight agile/Kanban: short iterations, prioritized backlog, continuous testing, versioned in GitHub. Rationale: fast feedback and incremental delivery for a small mobile MVP.

## Requirements (draft)
### Functional
1. Manage medications: create/update/delete meds with dose, times, days, start/end, notes.
2. Reminders: local notifications for due meds; mark dose as taken/skipped; show next doses.
3. Symptom log: quick entry with severity (1–5), note, timestamp; list/history.
4. Daily checklist: configurable items (e.g., hydration, movement, meds done) with daily reset.
5. Caregiver summary: read-only view of today’s adherence and recent symptoms (local for MVP).
6. Onboarding: collect name/conditions and ask for notification permission with rationale.

### Non-functional
- Usability: clear, accessible UI (large touch areas, high contrast, minimal steps).
- Performance: main screens load in under 1s with local data; notifications reliable offline.
- Offline: full functionality offline; data persisted locally.
- Privacy: all data stays on device; no cloud sync in MVP; clear messaging about local-only storage.
- Reliability: reminders scheduled for all future doses until end date; handle timezone changes on app resume.

### Acceptance criteria (per assignment intent)
- Runs on mobile (Expo/React Native); ships APK/IPA for submission.
- Provides the core features above with meaningful seeded data (no lorem ipsum).
- Self-explanatory UI; install/run instructions included.
- Source in public GitHub; zip identical to repo.
- Documentation delivered: project profile, requirements, architecture overview/decisions, tests plan, install/run guide, 2-page abstract, lessons learned.

## Architecture overview (MVP)
- Client-only app (React Native/Expo, TypeScript).
- Navigation: bottom tab (Home, Meds, Symptoms, Checklist, Caregiver, Settings) with stack screens per flow.
- Data/persistence: AsyncStorage (local); types for Medication, DoseEvent, SymptomEntry, ChecklistItem.
- Notifications: expo-notifications for local scheduling/canceling.
- Theming: custom theme provider for colors/spacing; light mode default.

### Key design decisions (current)
- Local-only storage to reduce complexity and privacy risk; can add cloud sync later.
- Expo managed workflow for faster delivery and OTA updates (if allowed); native eject not required now.
- Notifications via expo-notifications to keep within Expo-managed capabilities.
- TypeScript for safety and clearer domain modeling.

## Test approach (MVP)
- Unit tests: pure functions for scheduling, data transforms.
- Component tests: key screens (med list, symptom form) with React Native Testing Library.
- Manual flows: onboarding, add med, receive notification, mark taken, log symptom, toggle checklist, view caregiver summary.
- Data seeding: include realistic sample meds and symptoms to demonstrate value.

## Initial backlog (ordered)
1) Set up navigation tabs and placeholder screens.
2) Define domain types and storage utilities (AsyncStorage), seed data.
3) Medications CRUD + schedule local notifications; upcoming doses list.
4) Symptom log create/list; severity badges.
5) Daily checklist with reset per day.
6) Caregiver summary (aggregated adherence + recent symptoms).
7) Onboarding with notification permission prompt.
8) Accessibility/UX polish and instructions; generate APK for review.

## Deliverables for phase handoff
- This conception document (profile, methodology, requirements, architecture, tests plan, backlog).
- Diagrams (to add): system context and block diagram (app, storage, notifications, navigation).
- Next: start Development phase tasks per backlog.
