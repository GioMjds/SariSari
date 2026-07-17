import Constants from "expo-constants";

/**
 * Which build variant is running.
 * Injected at build time via APP_VARIANT in eas.json → app.config.js → extra.appVariant.
 * Falls back to "production" for local dev without a variant set.
 */
export const APP_VARIANT =
  (Constants.expoConfig?.extra?.appVariant as string) ?? "production";

export const IS_DEV_BUILD = APP_VARIANT === "development";
export const IS_PREVIEW_BUILD = APP_VARIANT === "preview";
export const IS_PRODUCTION_BUILD = APP_VARIANT === "production";
