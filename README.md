# Fortune Wheel

Personal web app for creating and sharing custom fortune wheels. Configure your own slices, save the wheel to Firestore, share the generated link/QR, and let everyone spin it in a dedicated view with confetti and animations.

![Fortune Wheel preview](docs/screenshot.png) <!-- optional; remove if no screenshot -->

## Features

- 🎡 **Wheel Builder** – add between 2 and 16 slices, pick colors, rename and reorder.
- ☁️ **Firebase integration** – wheels are stored in Firestore (`/wheels` collection).
- 🔗 **Sharing tools** – instant link + copy-to-clipboard (QR ready for future use).
- 🎉 **Spin mode** – smooth rotation, configurable randomness, confetti, clear winner highlight.
- 🌙 **Light/dark theme** – global toggle with persistence in `localStorage`.
- 🧭 **Routing** – React Router powered SPA with guarded 404 view.

## Tech Stack

- [React 19](https://react.dev/)
- [React Router 7](https://reactrouter.com/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Firebase (Firestore + Hosting)](https://firebase.google.com/)
- [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- [react-icons](https://react-icons.github.io/react-icons/)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Firebase setup

1. Create a Firebase project (this repo uses `fortune-82366`).
2. Enable **Firestore** in test mode (or adjust rules).
3. Paste your Web config in `src/firebase.js` (already filled in for the original project).
4. Optional: update Firestore rules for read-only wheels:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /wheels/{id} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false;
    }
  }
}
```

### 3. Run locally

```bash
npm start
```

Visit `http://localhost:3000`. The app hot-reloads on changes.

### 4. Build for production

```bash
npm run build
```

Outputs optimized static assets in the `build/` directory.

## Deployment (Firebase Hosting)

1. Install CLI & log in (one time):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Initialize hosting in the project root:
   ```bash
   firebase init hosting
   # public directory: build
   # single-page app rewrite: Yes
   # GitHub deploys: optional
   ```
3. Deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

The project ships at `https://<project-id>.web.app`.

## Available Scripts

- `npm start` – start dev server.
- `npm run build` – create production bundle.
- `npm test` – CRA default test runner.
- `npm run eject` – expose CRA configs (irreversible).

## Project structure

```
src/
├─ components/      # shared header, footer, clipboard button, etc.
├─ pages/           # Home, Builder, Spin, NotFound views
├─ firebase.js      # Firebase app + Firestore helpers
└─ index.js         # entry point (BrowserRouter, ReactDOM)
```

## Roadmap / Ideas

- QR code generation after saving wheel.
- Wheel duplication flow.
- Analytics (spin counts per wheel).
- Service worker + offline mode.

## License

MIT © 2025 Mieszko Iwaniec
