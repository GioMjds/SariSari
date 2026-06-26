import AsyncStorage from '@react-native-async-storage/async-storage';
import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import commonEn from '../locales/en/common.json';
import inventoryEn from '../locales/en/inventory.json';
import salesEn from '../locales/en/sales.json';
import utangEn from '../locales/en/utang.json';
import onboardingEn from '../locales/en/onboarding.json';

import commonTl from '../locales/tl/common.json';
import inventoryTl from '../locales/tl/inventory.json';
import salesTl from '../locales/tl/sales.json';
import utangTl from '../locales/tl/utang.json';
import onboardingTl from '../locales/tl/onboarding.json';

const LANGUAGE_KEY = 'sarisari_language_preference';

export type SupportedLanguage = 'en' | 'tl';

const resources = {
  en: {
    common: commonEn,
    inventory: inventoryEn,
    sales: salesEn,
    utang: utangEn,
    onboarding: onboardingEn,
  },
  tl: {
    common: commonTl,
    inventory: inventoryTl,
    sales: salesTl,
    utang: utangTl,
    onboarding: onboardingTl,
  },
};

export const initI18n = async (): Promise<void> => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    // If AsyncStorage read fails (extremely rare), fall back to English.
    console.warn('Could not read saved language preference:', error);
  }

  const initialLanguage: SupportedLanguage =
    savedLanguage === 'tl' ? 'tl' : 'en';

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    ns: ['common', 'inventory', 'sales', 'utang', 'onboarding'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
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
