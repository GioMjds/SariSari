/**
 * Sari mascot palette. Sampled from the static art in
 * `assets/images/sari-emotions/` so the vector rig matches the PNGs.
 */
export const SARI_COLORS = {
  outline: '#3B1D17',
  glass: '#EEF4F7',
  glassShade: '#D3DAE5',
  highlight: '#FFFFFF',
  limb: '#F8FBFC',
  lid: '#C65A3A',
  lidTop: '#D9714F',
  shadow: '#C65A3A',
  tongue: '#D9714F',
  blush: '#F4A58E',
  wood: '#8A5530',
  lens: '#CFE3EE',
  bandage: '#EE8B72',
  bandagePad: '#D9714F',
  sweat: '#BFE0F0',
} as const;

/** Every part is drawn in a 200 x 200 viewBox. */
export const SARI_VIEWBOX = 200;
