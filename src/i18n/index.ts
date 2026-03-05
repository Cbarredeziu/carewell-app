import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPPORTED_LANGUAGES = {
  es: 'Español',
  en: 'English',
  de: 'Deutsch',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const LANGUAGE_STORAGE_KEY = '@carewell_language';

export const getDeviceLanguage = (): SupportedLanguage => {
  const locales = Localization.getLocales();
  if (!locales || locales.length === 0) {
    return 'en';
  }

  const deviceLocale = locales[0].languageCode || 'en';

  if (deviceLocale === 'es') return 'es';
  if (deviceLocale === 'de') return 'de';

  return 'en';
};

export const getStoredLanguage =
  async (): Promise<SupportedLanguage | null> => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && stored in SUPPORTED_LANGUAGES) {
        return stored as SupportedLanguage;
      }
    } catch (error) {
      console.error('Error reading language preference:', error);
    }
    return null;
  };

export const setStoredLanguage = async (
  language: SupportedLanguage | null,
): Promise<void> => {
  try {
    if (language) {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } else {
      await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

export const initI18n = async (): Promise<typeof i18n> => {
  const storedLanguage = await getStoredLanguage();
  const deviceLanguage = getDeviceLanguage();
  const defaultLanguage = storedLanguage || deviceLanguage;

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: require('./locales/en.json') },
      es: { translation: require('./locales/es.json') },
      de: { translation: require('./locales/de.json') },
    },
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

  return i18n;
};

export default i18n;
