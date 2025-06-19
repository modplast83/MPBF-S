import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enJSON from '@/locales/en.json';
import arJSON from '@/locales/ar.json';
import mlJSON from '@/locales/ml.json';
import urJSON from '@/locales/ur.json';

// Debug log to check what's being imported
console.log('EN Translation loaded:', enJSON);
console.log('AR Translation loaded:', arJSON);

// Set up i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enJSON,
      ar: arJSON,
      ml: mlJSON,
      ur: urJSON
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