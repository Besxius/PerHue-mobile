import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locales } from './locales';

// Function to get stored language
const getStoredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem('language');
    return storedLanguage || 'en';
  } catch (error) {
    console.error('Error getting stored language:', error);
    return 'en';
  }
};

// Initialize i18n
const initI18n = async () => {
  const lng = await getStoredLanguage();
  
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    lng: lng,
    resources: locales,
    interpolation: {
      escapeValue: false,
    },
  });
};

// Initialize the i18n system
initI18n();

export default i18n;
