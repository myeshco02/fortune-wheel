# Fortune Wheel

Personal web app for creating and sharing custom fortune wheels. Configure your own slices, save the wheel to Firestore, share the generated link/QR, and let everyone spin it in a dedicated view with confetti and animations.

![Fortune Wheel – link](https://fortune-82366.web.app/)

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

## Roadmap / Ideas

- QR code generation after saving wheel.
- Wheel duplication flow.
- Analytics (spin counts per wheel).
- Service worker + offline mode.

## License

MIT © 2025 Mieszko Iwaniec
