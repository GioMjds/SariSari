# Commands

- `npx expo start` — dev server (then `i` for iOS, `a` for Android, `w` for web)
- `npx expo run:ios` / `run:android` — native builds (needed for `expo-sqlite` and
  other modules that don't run in Expo Go)
- `npx expo lint` — ESLint
- `pnpm test` — Jest (uses `better-sqlite3` for DB tests)
- `eas build --platform android` — production build
