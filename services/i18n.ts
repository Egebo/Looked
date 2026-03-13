import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../constants/translations/en.json';
import tr from '../constants/translations/tr.json';

const resources = {
    en: { translation: en },
    tr: { translation: tr },
};

const LANGUAGE_STORAGE_KEY = '@app_language';

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (!savedLanguage) {
        const locales = Localization.getLocales();
        const systemLanguage = locales[0]?.languageCode;
        savedLanguage = systemLanguage === 'tr' ? 'tr' : 'en';
    }

    await i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: savedLanguage,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18n;
