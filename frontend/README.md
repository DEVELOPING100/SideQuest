# SideQuest mobile frontend

React Native + Expo SDK 57 with Expo Router. Vite has been replaced by Metro.

## Run in Expo Go

From this folder:

```sh
npm install
npx expo start --go --clear
```

Use an Expo Go build compatible with SDK 57. Keep your phone and computer on the
same Wi-Fi network, then scan the terminal QR code. The app opens Person 1’s interactive preferences prototype. “Build my quest”
validates the form and shows a preview summary; it does not call the backend.

## Structure

- `src/app/_layout.jsx`: root navigation stack.
- `src/app/index.jsx`: preferences route.
- `src/screens/PreferencesScreen.jsx`: interactive preferences prototype.
- `src/components/`: future shared UI components.
- `src/hooks/` and `src/utils/`: future reusable state and validation logic.
- `src/api.js`: preserved API functions and request/response shapes.
- `src/assets/hero.png`: preserved existing image.

Keep helpers and screen implementation files outside `src/app`; Router treats files
inside that folder as routes. Add Person 1 routes only during the later UI step.

## Backend connection (only needed when screens start calling the API)

Copy `.env.example` to `.env` and replace its example IP with the computer hosting
Spring Boot, for example `EXPO_PUBLIC_API_URL=http://192.168.1.20:8080/api`.
A phone's `localhost` points at the phone, not your computer. The backend must be
reachable on the local network. Restart Expo after changing environment settings.
The preferences prototype does not call the backend or require this variable.
Never put private API keys or Supabase secrets into `EXPO_PUBLIC_*` variables.

Existing endpoint functions, payloads and error handling are retained. The shared
check-in/passport helpers have not been developed or migrated as part of Person 1's
scope. In particular, `checkInAtStop` still uses browser geolocation and needs a
separate native-location migration by its owner before being used on mobile.
No check-in, stamp, passport, or completion routes are registered here.

## Verification

```sh
npm run lint
npx expo install --check
npx expo-doctor
npx expo export --platform ios --platform android
```

The export command checks native JavaScript bundling; testing the QR code in Expo Go
is still needed to confirm behavior on a physical device.
