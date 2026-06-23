/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ─── Brand: Persimmon (vivid, saturated primary) ─────────────
        // Replaces the muddy terracotta scale. Single saturated hue
        // with a clear ramp. Use 500 for solid fills, 600 for hover,
        // 700 for pressed/strong text, 100/50 for subtle surfaces.
        'persimmon-50': '#FFF1EA',
        'persimmon-100': '#FFE0D1',
        'persimmon-200': '#FFC4A8',
        'persimmon-300': '#FF9E76',
        'persimmon-400': '#FA7A4B',
        'persimmon-500': '#E85A1F', // ★ Brand Persimmon
        'persimmon-600': '#C8460F',
        'persimmon-700': '#A1370C',
        'persimmon-800': '#7A2909',
        'persimmon-900': '#4F1B06',

        // ─── Brand: Cinnamon (deeper, for ink-strong surfaces) ──────
        // Use for header bars, dark cards, big totals. Sits between
        // persimmon and ink — feels rich, not stark.
        'cinnamon-50': '#F6E3D6',
        'cinnamon-100': '#E9C5AD',
        'cinnamon-200': '#D49570',
        'cinnamon-300': '#B86B3F',
        'cinnamon-400': '#8E4A23',
        'cinnamon-500': '#623418', // ★ Deep Cinnamon
        'cinnamon-600': '#4D2810',
        'cinnamon-700': '#391C0A',
        'cinnamon-800': '#261206',
        'cinnamon-900': '#150903',

        // ─── Sage (secondary, kept lean) ────────────────────────────
        // Used only sparingly — for "cash" payment type and success.
        // The scale is shorter because sage is an accent, not a hero.
        'sage-50': '#EEF4E5',
        'sage-100': '#D7E5BF',
        'sage-200': '#B7CF91',
        'sage-300': '#92B662',
        'sage-400': '#6E9A3D',
        'sage-500': '#4F7A24', // ★ Sage
        'sage-600': '#3D5E1B',
        'sage-700': '#2C4413',

        // ─── Ink (text + structure) ─────────────────────────────────
        // Replaces warm-* for text. Slightly cooler than the old
        // warm-900 to read crisper on cream paper.
        'ink-50': '#F7F5F1',
        'ink-100': '#EAE6DF',
        'ink-200': '#D2CCC1',
        'ink-300': '#A89F90',
        'ink-400': '#7A7165',
        'ink-500': '#564E45',
        'ink-600': '#3D372F',
        'ink-700': '#28231D',
        'ink-800': '#191612',
        'ink-900': '#0E0C0A', // ★ Ink (near-black)

        // ─── Paper (surfaces) ──────────────────────────────────────
        // The "paper" palette the receipt lives on. Cream is the page,
        // parchment is a slightly darker card surface.
        'paper-50': '#FBF7EE', // ★ Brightest paper
        'paper-100': '#F6F0E2',
        'paper-200': '#EFE6D2', // ★ Cream / page background
        'paper-300': '#E5D8BC',
        'paper-400': '#D4C39E',

        // ─── Semantic ──────────────────────────────────────────────
        'semantic-success': '#4F7A24', // aligned with sage-500
        'semantic-danger': '#C13030',
        'semantic-danger-50': '#FDECEC',
        'semantic-danger-100': '#FAD8D8',
        'semantic-warning': '#C77B0E',
        'semantic-warning-50': '#FCF1DE',
        'semantic-warning-100': '#F8E2BC',
        'semantic-info': '#2E6FA8',
        'semantic-info-50': '#E6F0F9',
        'semantic-info-100': '#D0E2F0',

        // ─── Dark mode tokens (reserved for future use) ────────────
        // App stays light (no darkMode flip in this config). These
        // ramps are defined so screens can opt in later without
        // touching tailwind.config.js. The companion CSS variables
        // live in global.css.
        'dark-persimmon-50': '#3A1A0C',
        'dark-persimmon-100': '#4F200E',
        'dark-persimmon-200': '#6E2C12',
        'dark-persimmon-300': '#A03D17',
        'dark-persimmon-400': '#D55A26',
        'dark-persimmon-500': '#FF8B5A', // ★ Brighter persimmon for dark surfaces
        'dark-persimmon-600': '#FFA679',
        'dark-persimmon-700': '#FFC3A0',
        'dark-persimmon-800': '#FFD8C0',
        'dark-persimmon-900': '#FFE8D8',
        'dark-sage-50': '#1B2A0A',
        'dark-sage-100': '#263A10',
        'dark-sage-200': '#36511A',
        'dark-sage-300': '#4F7027',
        'dark-sage-400': '#6E9240',
        'dark-sage-500': '#92B662',
        'dark-sage-600': '#B0CC85',
        'dark-sage-700': '#CFE0A8',
        'dark-paper-50': '#28231D',
        'dark-paper-100': '#322C24',
        'dark-paper-200': '#3D362C',
        'dark-paper-300': '#4A4238',
        'dark-paper-400': '#5A5044',
        'dark-ink-50': '#1A1714',
        'dark-ink-100': '#25211C',
        'dark-ink-200': '#332E27',
        'dark-ink-300': '#524A40',
        'dark-ink-400': '#7A7165',
        'dark-ink-500': '#A89F90',
        'dark-ink-600': '#C9C0B2',
        'dark-ink-700': '#E0D9CD',
        'dark-ink-800': '#F0EBE1',
        'dark-ink-900': '#FBF7EE',

        // ─── Compatibility aliases ────────────────────────────────
        // Keep these so existing screens don't break while we migrate.
        // `primary-*` now maps to persimmon. `secondary-*` to sage.
        // `warm-*` to ink. `surface-warm` to persimmon-100.
        // `background` to paper-200.
        primary: {
          50: '#FFF1EA',
          100: '#FFE0D1',
          200: '#FFC4A8',
          300: '#FF9E76',
          400: '#FA7A4B',
          500: '#E85A1F',
          600: '#C8460F',
          700: '#A1370C',
          800: '#7A2909',
          900: '#4F1B06',
        },
        secondary: {
          50: '#EEF4E5',
          100: '#D7E5BF',
          200: '#B7CF91',
          300: '#92B662',
          400: '#6E9A3D',
          500: '#4F7A24',
          600: '#3D5E1B',
          700: '#2C4413',
          800: '#1F320D',
          900: '#121E07',
        },
        warm: {
          50: '#F7F5F1',
          100: '#EAE6DF',
          200: '#D2CCC1',
          300: '#A89F90',
          400: '#7A7165',
          500: '#564E45',
          600: '#3D372F',
          700: '#28231D',
          800: '#191612',
          900: '#0E0C0A',
        },
        'surface-warm': '#FFE0D1',
        background: '#EFE6D2',
        'surface-subtle': '#FBF7EE',
      },
      fontFamily: {
        'stack-sans': ['StackSansText-Regular'],
        'stack-sans-extralight': ['StackSansText-ExtraLight'],
        'stack-sans-light': ['StackSansText-Light'],
        'stack-sans-medium': ['StackSansText-Medium'],
        'stack-sans-semibold': ['StackSansText-SemiBold'],
        'stack-sans-bold': ['StackSansText-Bold'],
      },
      borderRadius: {
        md: '6px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        pill: '9999px',
        card: '16px',
      },
      boxShadow: {
        // Layered paper shadows — multiple inset/extruded layers
        // simulate the depth of stacked receipt paper.
        paper:
          '0 1px 0 rgba(86, 78, 69, 0.04), 0 2px 6px rgba(86, 78, 69, 0.06)',
        'paper-lift':
          '0 1px 0 rgba(86, 78, 69, 0.05), 0 6px 16px rgba(86, 78, 69, 0.10), 0 16px 28px rgba(86, 78, 69, 0.06)',
        'paper-deep':
          '0 2px 0 rgba(86, 78, 69, 0.06), 0 12px 24px rgba(86, 78, 69, 0.12), 0 28px 48px rgba(86, 78, 69, 0.10)',
        card: '0 1px 2px rgba(86, 78, 69, 0.06)',
        raised: '0 4px 12px rgba(86, 78, 69, 0.10)',
        modal: '0 6px 20px rgba(86, 78, 69, 0.16)',
        // Brand-tinted shadow for the hero receipt card
        'persimmon-glow': '0 8px 24px rgba(232, 90, 31, 0.18)',
        // Brand-tinted shadow for sage surfaces (success states)
        'glow-sage': '0 8px 24px rgba(79, 122, 36, 0.18)',
      },
      fontSize: {
        display: [
          '40px',
          { lineHeight: '1.05', fontWeight: '800', letterSpacing: '-0.02em' },
        ],
        hero: [
          '56px',
          { lineHeight: '1.0', fontWeight: '800', letterSpacing: '-0.03em' },
        ],
        h1: [
          '28px',
          { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.01em' },
        ],
        h2: ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        h3: ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        // Editorial utility: tiny, all-caps, letter-spaced labels
        label: [
          '10px',
          { lineHeight: '1.3', fontWeight: '700', letterSpacing: '0.14em' },
        ],
        mono: [
          '12px',
          { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.04em' },
        ],
      },
    },
  },
  plugins: [],
};
