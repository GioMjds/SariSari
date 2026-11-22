// StackSans ships one file per weight and Android cannot pick a custom face by
// fontWeight, so Tailwind weight classes are swapped for the matching family class.
// Mirrors the FONT_MAP in components/elements/StyledText.tsx.
const FAMILY_BY_WEIGHT = {
  thin: 'font-stack-sans-extralight',
  extralight: 'font-stack-sans-extralight',
  light: 'font-stack-sans-light',
  normal: 'font-stack-sans',
  medium: 'font-stack-sans-medium',
  semibold: 'font-stack-sans-semibold',
  bold: 'font-stack-sans-bold',
  extrabold: 'font-stack-sans-bold',
  black: 'font-stack-sans-bold',
} as const;

type Weight = keyof typeof FAMILY_BY_WEIGHT;

const WEIGHT_CLASS =
  /(^|\s)font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?=\s|$)/;
const FAMILY_CLASS = /(^|\s)font-(stack-sans|mono)/;

/**
 * Turns an already merged class string into one that renders in StackSans.
 * An explicit family class wins; otherwise the weight class becomes a family
 * class, and text with no weight gets StackSans Regular.
 */
export function withStackSans(classes: string): string {
  if (FAMILY_CLASS.test(classes)) return classes;
  const match = WEIGHT_CLASS.exec(classes);
  if (!match) return `${classes} font-stack-sans`.trim();
  const family = FAMILY_BY_WEIGHT[match[2] as Weight];
  return classes.replace(match[0], `${match[1]}${family}`);
}
