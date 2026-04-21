# Wedsite

A custom wedding website built for an intimate, boutique event. Currently configured for **Jack & Kelsey — March 13, 2027** in Irmo, SC, but designed from the ground up to be repurposed as a reusable template for any wedding.

Built with React + Vite + Tailwind CSS v4 + Firebase, with a tactile "pressed stationery" aesthetic: paper grain textures, letterpress typography, and layered paper shadows — no image assets required for the texture system.

---

## Features

- **Guest verification wall** — guests must authenticate before accessing protected pages (schedule, RSVP)
- **Multi-step RSVP** — name lookup → attendance → dietary restrictions → confirmation, backed by Firestore
- **Admin dashboard** — protected route (by Firebase UID) for viewing and managing all RSVPs
- **Countdown timer** — live countdown to the wedding date
- **Information hub** — schedule, hotel blocks, local guide, and FAQ accordion
- **Registry page** — links to external registries or a honeymoon fund
- **Our Story page** — narrative and photo timeline
- **Tactile design system** — SVG procedural noise textures, letterpress text shadows, and multi-layer paper shadows, all via CSS (no images, Retina-ready)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 (Vite plugin) |
| Backend | Firebase (Auth, Firestore, Storage) |
| Routing | React Router v7 |
| Hosting | Firebase Hosting or Vercel |

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd wedsite
npm install
```

### 2. Configure wedding details

Edit `src/constants/weddingInfo.js` — this is the single source of truth for names, date, venue, and meal options. No hunting through components.

```js
export const PARTNER_ONE_FIRST_NICKNAME = 'Jack'
export const PARTNER_TWO_FIRST = 'Kelsey'
export const WEDDING_DATE = new Date('2027-03-13T15:00:00')
export const VENUE_NAME = 'The River Road and Jasmine Houses and Gardens'
// ...
```

### 3. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
2. Enable the following services:
   - **Authentication** — enable Email/Password (and optionally Anonymous for the guest gate)
   - **Firestore Database** — start in production mode
   - **Storage** — for future photo uploads
3. Copy your Firebase config keys into a `.env` file at the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> `.env` is gitignored. Never commit your Firebase keys.

### 4. Set Firestore security rules

Lock down the database so only authenticated guests can read, and only authenticated users can write RSVPs:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rsvps/{docId} {
      allow read, write: if request.auth != null;
    }
    match /guests/{docId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### 5. Set your admin UID

In `src/components/AdminRoute.jsx`, the admin route checks the signed-in user's Firebase UID against an allowed list. After creating your admin account in the Firebase console, paste your UID into the allowed list there.

### 6. Run locally

```bash
npm run dev
```

---

## Project Structure

```
src/
  components/       # Shared UI (Navbar, Footer, AccordionItem, ProtectedRoute, AdminRoute)
  constants/        # weddingInfo.js — all event-specific data in one place
  context/          # AuthContext — Firebase auth state
  hooks/            # useRSVP.js — RSVP form logic
  pages/
    admin/          # AdminLogin, AdminDashboard (protected by UID)
    GuestGate.jsx   # Passcode/email verification wall
    Home.jsx        # Hero, countdown, welcome
    Information.jsx # Schedule, hotels, local guide, FAQ
    OurStory.jsx    # Narrative + photo timeline
    Registry.jsx    # Registry links / honeymoon fund
    RSVP.jsx        # Multi-step RSVP form
  firebase.js       # Firebase init (reads from .env)
  index.css         # Tailwind theme + tactile texture system
```

---

## Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Vercel

Connect the repo to Vercel. Set all `VITE_FIREBASE_*` variables in the Vercel project environment settings. Vercel will auto-deploy on every push to `main`.

---

## Reusing as a Template

All event-specific content lives in `src/constants/weddingInfo.js` and the `TODO` comments scattered through `src/pages/`. To adapt for a new wedding:

1. Update `weddingInfo.js`
2. Replace placeholder hotel and restaurant data in `Information.jsx`
3. Swap the engagement photo in `Home.jsx` (the placeholder `div` is already marked)
4. Point registry links in `Registry.jsx` to new URLs
5. Create a fresh Firebase project and update `.env`
