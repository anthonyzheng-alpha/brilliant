# Brilliant Clone — Algebra

Interactive algebra learning app (React + Vite + TypeScript).

## Phases implemented

| Phase | Features |
|-------|----------|
| **P1** | Lesson player, MCQ / drag-drop / numeric, routing, localStorage progress |
| **P2** | Firebase Google sign-in, Firestore progress sync |
| **P3** | Daily streaks, lesson mastery milestones |
| **P4+** | Slider / tap-sequence, KaTeX, BalanceScale + SequenceGrid widgets, 3 courses, sequential unlock, animations |

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Firebase setup (P2)

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

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build
