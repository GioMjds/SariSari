import AsyncStorage from '@react-native-async-storage/async-storage';
import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import commonEn from '../locales/en/common.json';
import inventoryEn from '../locales/en/inventory.json';
import salesEn from '../locales/en/sales.json';
import utangEn from '../locales/en/utang.json';
import onboardingEn from '../locales/en/onboarding.json';
import stocktakeEn from '../locales/en/stocktake.json';
import correctionsEn from '../locales/en/corrections.json';
import settingsEn from '../locales/en/settings.json';
import receivingEn from '../locales/en/receiving.json';

import commonTl from '../locales/tl/common.json';
import inventoryTl from '../locales/tl/inventory.json';
import salesTl from '../locales/tl/sales.json';
import utangTl from '../locales/tl/utang.json';
import onboardingTl from '../locales/tl/onboarding.json';
import stocktakeTl from '../locales/tl/stocktake.json';
import correctionsTl from '../locales/tl/corrections.json';
import settingsTl from '../locales/tl/settings.json';
import receivingTl from '../locales/tl/receiving.json';

const LANGUAGE_KEY = 'sarisari_language_preference';

export type SupportedLanguage = 'en' | 'tl';

const resources = {
  en: {
    common: commonEn,
    inventory: inventoryEn,
    sales: salesEn,
    utang: utangEn,
    onboarding: onboardingEn,
    stocktake: stocktakeEn,
    corrections: correctionsEn,
    settings: settingsEn,
    receiving: receivingEn,
  },
  tl: {
    common: commonTl,
    inventory: inventoryTl,
    sales: salesTl,
    utang: utangTl,
    onboarding: onboardingTl,
    stocktake: stocktakeTl,
    corrections: correctionsTl,
    settings: settingsTl,
    receiving: receivingTl,
  },
} satisfies Record<SupportedLanguage, Record<string, unknown>>;

// Initialize at module scope. Screens mount before the saved language
// preference has been read from AsyncStorage, so the instance must be
// registered with react-i18next before the first `useTranslation()` call.
// With inline `resources` and no backend, `init` completes synchronously.
void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: [
    'common',
    'inventory',
    'sales',
    'utang',
    'onboarding',
    'stocktake',
    'corrections',
    'settings',
    'receiving',
  ],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

/**
 * Apply the saved language preference. The root layout keeps the splash
 * screen up until this resolves, so the switch away from the English
 * default is never visible.
 */
export const initI18n = async (): Promise<void> => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    console.warn('Could not read saved language preference:', error);
  }

  const initialLanguage: SupportedLanguage =
    savedLanguage === 'tl' ? 'tl' : 'en';

  if (i18n.language !== initialLanguage) {
    await i18n.changeLanguage(initialLanguage);
  }
};

export const changeAppLanguage = async (
  lang: SupportedLanguage,
): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
};

export const getCurrentLanguage = (): SupportedLanguage =>
  (i18n.language as SupportedLanguage) === 'tl' ? 'tl' : 'en';

export default i18n;
