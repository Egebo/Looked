import '@/services/i18n'; // Ensure i18n is initialized
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'tr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const { i18n } = useTranslation();
    const [language, setLanguageState] = useState<Language>(i18n.language as Language);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLang === 'en' || savedLang === 'tr') {
                    if (i18n.language !== savedLang) {
                        await i18n.changeLanguage(savedLang);
                        setLanguageState(savedLang);
                    }
                } else {
                    // Default to i18n detected language
                    setLanguageState(i18n.language as Language);
                }
            } catch (error) {
                console.error('Failed to load language:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadLanguage();
    }, [i18n]);

    const setLanguage = async (newLang: Language) => {
        try {
            await i18n.changeLanguage(newLang);
            setLanguageState(newLang);
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
        } catch (error) {
            console.error('Failed to save language:', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useAppLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useAppLanguage must be used within a LanguageProvider');
    }
    return context;
};
