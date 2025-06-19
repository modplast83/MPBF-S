import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '@/locales/en.json';
import arTranslation from '@/locales/ar.json';
import mlTranslation from '@/locales/ml.json';
import urTranslation from '@/locales/ur.json';

// Set up i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation.translation
      },
      ar: {
        translation: arTranslation.translation
      },
      ml: {
        translation: mlTranslation.translation
      },
      ur: {
        translation: urTranslation.translation
      }
    },
    fallbackLng: 'en',
    debug: false,
    lng: 'en',
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;