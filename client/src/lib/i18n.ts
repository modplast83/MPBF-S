import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '@/locales/en.json';
import arTranslation from '@/locales/ar.json';

// Set up i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslation,
      ar: arTranslation
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

export default i18n;