import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { APP_VARIANT, IS_PRODUCTION_BUILD } from "@/constants/env";

/**
 * BuildBadge — shows a subtle banner in Development and Preview builds.
 * Returns null in production so there's zero overhead.
 *
 * Usage: drop it anywhere in your root layout (e.g. above the tab bar).
 */
export function BuildBadge() {
  if (IS_PRODUCTION_BUILD) return null;

  const isPreview = APP_VARIANT === "preview";

  return (
    <View style={[styles.badge, isPreview ? styles.preview : styles.dev]}>
      <Text style={styles.text}>
        {isPreview ? "⚠ PREVIEW BUILD" : "🛠 DEV BUILD"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: "100%",
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  dev: {
    backgroundColor: "#1D4ED8", // blue-700 — dev
  },
  preview: {
    backgroundColor: "#B45309", // amber-700 — preview
  },
  text: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
