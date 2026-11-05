# Midterm scope & demo checklist

## Included first iteration
- React/TypeScript dashboard: overview, products, inventory, branding, store settings
- Two sample merchant workspaces with distinct catalogs and colors (local demo)
- Firebase client setup, Auth, Firestore schema, Cloud Function provisioning, rules, emulators

## Recommended next development tasks
1. Test all allow/deny rules with Firebase emulator tests (especially cross-tenant reads/writes).
2. Add server-side role/permission management and staff invites.
3. Implement secure Storage logo upload with proper file type, size and tenant checks.
4. Add a merchant onboarding wizard with validation and multi-game category configuration.
5. Improve accessibility/contrast checks, form feedback and responsive layouts.
6. Integrate deployment CI/CD and end-to-end tests.

## Midterm demonstration (demo mode)
1. Open Overview for Northstar Cards.
2. Navigate Products -> Add product -> verify Inventory updates.
3. Open Branding -> change primary color -> Save -> preview.
4. Select Switch/create store -> Ember Guild Cards -> verify a separate catalog.
5. Explain that demo mode illustrates UI isolation only. Real Firebase isolation depends on security rules and authenticated memberships, which need emulator tests.

## Presentation outline
1. Problem and product goal
2. Scoped features and architecture
3. Firebase data model and tenant separation
4. Authentication and Cloud Functions provisioning
5. Merchant console screens
6. Live demo and current limitations
7. Testing plan and next sprint
