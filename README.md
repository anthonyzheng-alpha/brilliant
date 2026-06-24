# Brilliant Clone — Algebra

Interactive algebra learning app (React + Vite + TypeScript). Lessons vary from solving for unknowns, graphing, and factoring.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Firebase setup

1. Create a Firebase project and enable **Google** sign-in.
2. Create a **Firestore** database.
3. Copy `.env.example` to `.env.local` and fill in your Firebase web app config.
4. Deploy security rules (example):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Without Firebase env vars, the app runs with localStorage only (sign-in button hidden).

## Feature flags

Edit `src/lib/features.ts` to toggle gamification, Firebase, all courses, etc.

## Content

JSON under `src/content/` — courses, units, lessons, problems. Validated with Zod at import time.

Algebra favicon made by [Icons8](https://icons8.com).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build
