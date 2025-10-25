import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('language', languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const isVietnamese = () => {
    return i18n.language === 'vi';
  };

  const isEnglish = () => {
    return i18n.language === 'en';
  };

  return {
    changeLanguage,
    getCurrentLanguage,
    isVietnamese,
    isEnglish,
    currentLanguage: i18n.language
  };
};

export default useLanguage;