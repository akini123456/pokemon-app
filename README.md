# CardForge — TCG Merchant Dashboard (midterm starter)

A **React + TypeScript** merchant admin prototype and **Firebase foundation** for a multi-tenant trading-card commerce platform.

## What works

- **Local demo (no account required):** store switching, overview metrics, product add/edit/delete, inventory list, brand colors, store information. Demo data is saved in browser localStorage. Two sample stores help illustrate separate catalogs.
- **Firebase-connected mode (requires your own Firebase project):** email/password registration and login, Cloud Function store provisioning, store-scoped Firestore product updates, membership-aware store retrieval and tenant-scoped security rules.
- **Included backend:** Auth, Firestore, Storage (locked down), Cloud Functions, emulator configuration.

## What is NOT finished

This is an initial classroom starter, **not a production-ready service**. Real payments, orders, staff invites, logo uploads, mobile app, app publication, analytics, notifications, comprehensive permission tests and full security hardening are not implemented. Firestore rules restrict access, but should be tested via emulator before claiming verified isolation. Firebase mode product deletion is deliberately disabled in the UI; local demo supports it. Creating a new Firebase account is NOT the same as creating a store.

## Run locally (Windows / macOS / Linux)

1. Install Node.js 22+ and VS Code.
2. Open this folder in VS Code.
3. In terminal: `npm install`
4. Run: `npm run dev`
5. Open http://localhost:5173

**Do not create an `.env` file yet** if you just want to use the demo. No Firebase access is needed for the demo.

## Optional: connect your own Firebase project

1. In Firebase Console, create a Firebase project and register a **Web app**.
2. Enable **Authentication > Email/Password**, **Cloud Firestore**, and **Cloud Functions** (Cloud Functions deployment may require billing; local emulators are a good alternative).
3. Copy `.env.example` to `.env`, fill its `VITE_FIREBASE_*` values from the Firebase Web app configuration.
4. `npm install` and `cd functions && npm install && npm run build && cd ..`
5. `npx firebase login` then `npx firebase use --add` to select your Firebase project.
6. For emulator testing, set `VITE_USE_FIREBASE_EMULATORS=true` and run `npx firebase emulators:start --only auth,firestore,functions,storage` in one terminal, and `npm run dev` in a second terminal. Requires Java for the Firestore emulator. Emulators are not a substitute for production testing.
7. For deployed Firebase mode, deploy rules/functions with `npx firebase deploy --only firestore:rules,functions,storage`; **review project selection and security rules before deploying**.

**Important:** Firebase web configuration values are identifiers, not server secrets, but don't commit your `.env`; never put service-account private keys in client code. Firestore rules are what protect store data. A Vite developer server is not a deployed production app.

## Architecture

```text
src/App.tsx (merchant UI)
     |-- Local demo -> browser localStorage
     |-- Firebase mode -> Firebase Auth -> membership index /users/{uid}/memberships
     |                                 -> /stores/{storeId} -> products
     |                                 -> callable createMerchantStore function
firestore.rules -> deny-by-default, store membership checks
storage.rules   -> deny-all until upload functionality is implemented
```

See `docs/MIDTERM_SCOPE.md` for roadmap and presentation notes.

## Before pushing to GitHub

Run `npm run typecheck` and `npm run build`, ensure `.env` is ignored, and commit source code + Firebase rules + README (not `node_modules` or `dist`).

## Code formatting

The source uses clear TypeScript names, consistent formatting, and small reusable components where practical. To automatically format the entire project after installing dependencies:

```bash
npm run format
```

Check formatting without changing files:

```bash
npm run format:check
```

These commands use Prettier. The application logic stays the same.
