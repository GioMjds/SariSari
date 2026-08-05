# SariSari Android-First Monetization & Store Launch Plan

> For agentic workers: Execute the Android phases sequentially; defer iOS work until its
> validation gate is met.

Goal: Launch SariSari as a free Android app in the Philippines with a seven-day Pro trial and a
₱199 lifetime unlock, then validate demand before expanding to iOS.

Architecture: Keep business data and all core POS operations offline and free. Add RevenueCat for
store-validated Pro entitlement, cache entitlement locally for offline use, and use a device-
local trial timestamp with no account or backend.

Tech stack: Expo SDK 54, React Native, AsyncStorage, RevenueCat react-native-purchases, Google
Play Billing, EAS Build/Submit.

## Product rules

- Free forever: POS, inventory, barcode scanning, utang, basic daily totals, and local snapshots.
- Pro Lifetime: ₱199 launch price; ₱299 only after validation. Unlock detailed report screens,
  CSV/PDF exports, Google Drive backup/restore, and advanced stock/utang alerts.

- Trial: full Pro for seven calendar days from first launch; no card and no sign-in. Reinstall/
  reset may restart it; this is an accepted offline-first v1 tradeoff.

- Entitlement: one-time product ID sarisari_pro_lifetime, mapped to RevenueCat entitlement pro.
- Store ownership: Android and future iOS purchases are separate. No account, cross-platform
  entitlement, subscription, ads, or custom payment flow in v1.

- Never block or delete core records when a trial expires. Existing cloud backups remain in the
  user’s Drive; disable new cloud sync/remote restore until Pro is unlocked.

## Android implementation and release

### 1. Establish release ownership — Week 1

- Create the dedicated support Gmail; use it in the app, Play listing, privacy policy, and
  support replies.

- Enroll as an individual in Google Play Console using the legal personal name, pay the one-time
  US$25 registration fee, and complete identity/device verification and the payments profile.
  Google enrollment requirements
  (https://support.google.com/googleplay/android-developer/answer/6112435)

- Confirm that com.giomjds.sarisari is registered to this account before first upload; retain it
  permanently.

- Publish and verify a public privacy-policy page at the URL configured in app.json. It must
  accurately cover local SQLite records, camera/barcode access, receipt images, optional Google
  Drive backup, RevenueCat purchase handling, support contact, and deletion/backup-removal
  instructions.

- Set up Google OAuth consent and the Drive client used by the existing backup implementation. Do
  not commit client secrets or store service-account JSON in the repository.

### 2. Add a focused monetization boundary — Weeks 1–4

- Add a lib/monetization module and Jest tests. Its public interface is:
  - type ProFeature = 'reports' | 'exports' | 'cloud_backup' | 'advanced_alerts'
  - type AccessLevel = 'free' | 'trial' | 'pro'
  - getAccessState(now): { level: AccessLevel; trialEndsAt: number | null }
  - canUse(feature, access): boolean

- Persist only the local trial-start timestamp in AsyncStorage. Start it once; after seven days,
  return free. A malformed or unavailable timestamp must fail open to Free access, never block
  POS.

- Configure RevenueCat once in the root layout using an environment-provided Android public SDK
  key. Keep the cached confirmed pro entitlement available when offline; failed entitlement
  refreshes must retain the last confirmed state.

- Implement purchase and Restore Purchases actions. Grant Pro only after RevenueCat confirms pro;
  cancellation, pending payment, unavailable Play Store, and network errors keep existing access
  and show a recoverable message.

- Add a coherent paywall: Pro benefits, seven-day trial status/expiry, ₱199 one-time price, Buy
  Lifetime Pro, Restore Purchases, and Close.

- Gate the existing long-form reports and analytics, PDF/CSV export actions, Drive link/sync/
  remote restore, and advanced alerts. Keep daily home totals and local snapshot creation/
  restoration outside all gates.

- Inject access checks into the existing Drive backup scheduler so trial expiry stops cloud
  uploads even when the app resumes in the background.

- Update the Settings screen with a Pro section, purchase status, Restore Purchases, and locked-
  but-explained Drive backup controls.

### 3. Make the production build store-ready — Weeks 3–5

- Add react-native-purchases and its Expo configuration; use development builds and physical
  Android devices for purchase testing.

- Change the production EAS profile from APK output to the default signed Android App Bundle
  (.aab). Keep APK-only profiles for local/internal installation.

- Add a production submission profile that uploads to the Play internal track as a draft first.
- Verify the generated build targets Android API 36 or higher before the August 31, 2026 Play
  deadline. Google target API requirement
  (https://developer.android.com/google/play/requirements/target-sdk)

- Create the sarisari_pro_lifetime one-time product in Play Console at ₱199 for the Philippines,
  map it to RevenueCat, and configure Google Play service credentials in RevenueCat and EAS with
  least-privilege access.

- Use EAS Submit for the AAB upload; it supports first uploads to Play’s internal track, but the
  listing remains a Play Console responsibility. Expo submission guide
  (https://docs.expo.dev/submit/android/)

### 4. Prove the release in testing — Weeks 5–8

- Run internal testing first: fresh install, elapsed trial, expired trial, successful purchase,
  cancelled purchase, pending purchase, app restart, offline reopen, restore after reinstall, and
  cloud backup blocked/unblocked behavior.

- Recruit at least 12 Filipino Android testers before closed testing begins. Keep every tester
  opted in continuously for 14 days, collect feedback from real sari-sari owners, and retain the
  notes needed for the production-access questionnaire. Google closed-testing requirement
  (https://support.google.com/googleplay/android-developer/answer/14151465)

- Create Play license testers so paid-flow tests do not charge them.
- Run pnpm typecheck, pnpm test, and a production EAS build before every beta release.
- Add tests for all access-state transitions, feature-gate enforcement, cached entitlement
  fallback, denied cloud scheduler execution, and purchase-error recovery. Test that POS,
  inventory, utang, and local restores work in every access state.

### 5. Complete Play listing and launch — Weeks 9–12

- Build a Philippines-only Play listing in English and Tagalog: clear title, short/full
  descriptions, support Gmail, privacy-policy URL, icon, feature graphic, and screenshots using
  seeded—not real customer—data.

- Complete App Content: content rating, target audience, ads declaration, app access,
  permissions, and Data Safety. Declare actual off-device handling from Google Drive and
  RevenueCat; local-only data is not “collected” merely because it is processed on-device. Review
  every SDK and permission before submission. Google Data Safety guidance
  (https://support.google.com/googleplay/android-developer/answer/10787469)

- Apply for production access after the closed-test requirement completes, answer from real test
  evidence, then ship a controlled production rollout.

- Keep ₱199 until at least 50 completed trials, a 10% or higher trial-to-purchase rate, and no
  unresolved purchase, backup, or financial-recording defect. Then raise the Philippine price to
  ₱299.

## Operations and iOS gate

- Review Google Play and RevenueCat results monthly: installs, completed trials, Pro purchases/
  restores, refund requests, crashes, and support themes. Use feedback rather than invasive extra
  analytics for product decisions.

- Maintain a brief support and restore-purchase FAQ; handle privacy requests through the support
  Gmail.

- Start iOS only after 50 active Android early users, ≥10% trial conversion, and no serious
  record-loss or entitlement defects.

  EAS, validate with TestFlight, complete App Privacy/accessibility/listing details, and submit
  for App Review. Apple will show the individual’s legal seller name. Apple enrollment
  (https://developer.apple.com/programs/enroll/) Apple privacy details
  (https://developer.apple.com/app-store/app-privacy-details/)

- Do not provide Android Pro to iOS users without a later, explicitly designed account-and-sync
  system.

## Assumptions

- The launch market is the Philippines only.
- The publisher is an individual using their legal name.
- The existing Google Drive backup is retained as a Pro feature; local snapshots remain free.
- Taxes, payout-bank setup, and Philippine business registration are the owner’s responsibility;
  obtain local accounting/legal advice before accepting commercial income.

- The current uncommitted workspace changes remain outside this work unless they directly overlap
  a monetization or release change.
