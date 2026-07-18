import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_VARIANT, IS_PRODUCTION_BUILD } from "@/constants/env";

/**
 * BuildBadge — shows a subtle banner in Development and Preview builds.
 * Returns null in production so there's zero overhead.
 *
 * Uses absolute positioning with pointerEvents="none" so it overlays
 * cleanly without shifting or compressing screen route layouts below.
 */
export function BuildBadge() {
  const insets = useSafeAreaInsets();

  if (IS_PRODUCTION_BUILD) return null;

  const isPreview = APP_VARIANT === "preview";

  return (
    <View
      pointerEvents="none"
      style={[
        styles.badge,
        { top: Math.max(insets.top, 0) },
        isPreview ? styles.preview : styles.dev,
      ]}
    >
      <Text style={styles.text}>
        {isPreview ? "⚠ PREVIEW BUILD" : "🛠 DEV BUILD"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
    paddingVertical: 4,
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
    fontFamily: "StackSansText-Bold",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4, // Matches label token (0.14em) in DESIGN.md
  },
});

