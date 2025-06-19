import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enJSON from '@/locales/en.json';
import arJSON from '@/locales/ar.json';
import mlJSON from '@/locales/ml.json';
import urJSON from '@/locales/ur.json';

// Clear any existing i18n instance
if (i18n.isInitialized) {
  i18n.changeLanguage('en');
}

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
    },
    react: {
      useSuspense: false
    }
  });

console.log('i18next resources loaded:', {
  en: !!enJSON?.translation?.auth,
  ar: !!arJSON?.translation?.auth,
  ml: !!mlJSON?.translation?.auth,
  ur: !!urJSON?.translation?.auth
});

export default i18n;