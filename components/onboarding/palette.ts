/**
 * Token values for props that cannot take a className (icon color,
 * placeholder color, StatusBar). Each one mirrors a tailwind.config.js
 * token; keep them in step.
 */
export const ONBOARDING_COLORS = {
  page: '#F7F6F2', // paper-200
  onAction: '#FFFFFF',
  action: '#C8460F', // persimmon-600
  muted: '#7A7165', // ink-400
  success: '#4F7A24', // sage-500
} as const;
