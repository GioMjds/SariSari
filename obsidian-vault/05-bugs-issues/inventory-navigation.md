# Inventory Navigation Bug

## Summary

Started from Analytics sub-tab then switched to Movements sub-tab swiping left, the app crashes.

## Platform

- [x] Android ✅ 2026-08-13
- [ ] iOS

## Profile Build

- [ ] Development
- [x] Preview
- [ ] Production

## Reproduction

Started on the **Analytics** sub-tab inside the Inventory top-tab stack, then swiped **left** to the **Movements** sub-tab. App crashes during the swipe transition (not after landing on Movements).

## Suspected Root Causes (preliminary, awaiting stack trace)

Two independent library issues match the symptom. Confirm with `adb logcat` before fixing.

### Suspect #1: `react-native-pager-view` 6.9.1 recycling crash (most likely)

Combination of:

- `@react-navigation/material-top-tabs@^7.6.13`
- `react-native-pager-view@6.9.1`
- New Architecture (Fabric) on Android
- TopTabs nested in a native-stack via `expo-router`

Crash signature: `java.lang.IllegalStateException: Page can only be offset by a positive amount` from `androidx.viewpager2.widget.ScrollEventAdapter.updateScrollEventValues`.

References:

- react-navigation/react-navigation#12952
- callstack/react-native-pager-view#970
- callstack/react-native-pager-view#1053

### Suspect #2: `react-native-gifted-charts` 1.4.77 unmount crash

`AnalyticsCharts.tsx` mounts `BarChart` and `PieChart` which use SVG `<foreignObject>`. When the user swipes away from Analytics, those charts unmount while a pager-view swipe is in flight; the unmount race is documented as crashing on Android inside `react-native-tab-view`.

References:

- Abhinandan-Kushwaha/react-native-gifted-charts#1183
- Abhinandan-Kushwaha/react-native-gifted-charts#1200
- v1.4.77 release notes added `disableForeignObject` prop specifically for this

## How to capture the stack trace

Project has no Sentry/Crashlytics wired up yet (`lib/logger.ts` anticipates adding one). For now, `adb logcat` from a connected device or emulator with the same Preview APK installed:

```bash
# Clear old logs first
adb logcat -c

# Stream errors and JS logs only
adb logcat *:E ReactNativeJS:V

# In another shell, on the device: open Analytics sub-tab, swipe left to Movements
# Copy the first 30 lines of the crash output and paste into this note under "Crash Trace".
```

A local release build via `npx expo start --no-dev --minify` will surface full JS traces through Metro if `adb` isn't an option.

## Crash Trace

(Paste `adb logcat` output here.)
