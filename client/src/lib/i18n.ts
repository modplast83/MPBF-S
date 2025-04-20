import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '@/locales/en.json';
import arTranslation from '@/locales/ar.json';

// Set up i18next
i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    resources: {
      en: enTranslation,
      ar: arTranslation,
    },
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    // Custom detection options
    detection: {
      // order and from where user language should be detected
      order: ['localStorage', 'navigator'],
      
      // keys or params to lookup language from
      lookupLocalStorage: 'language',
      
      // cache user language on
      caches: ['localStorage'],
      
      // only detect languages that are in the whitelist
      checkWhitelist: true
    },
  });

export default i18n;