import { useAuth } from '@/context/AuthContext';
import { useAppLanguage } from '@/context/LanguageContext';
import { useAppTheme } from '@/context/ThemeContext';
import { auth } from '@/services/firebase';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, List, SegmentedButtons, Surface, Text, useTheme } from 'react-native-paper';

import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function ProfileScreen() {
    const { user } = useAuth();
    const theme = useTheme();
    const { themePreference, setThemePreference } = useAppTheme();
    const { language, setLanguage } = useAppLanguage();
    const { t } = useTranslation();

    const handleLogout = async () => {
        try {
            // First sign out from Firebase
            await signOut(auth);
            // Then sign out from Google to allow account switching next time
            await GoogleSignin.signOut();
            router.replace('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if Google signout fails, we should still go to login if Firebase signout succeeded
            router.replace('/auth/login');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Avatar.Text
                    size={80}
                    label={user?.email?.substring(0, 2).toUpperCase() || '??'}
                    style={{ backgroundColor: theme.colors.primary }}
                />
                <Text variant="titleLarge" style={{ marginTop: 20, fontWeight: 'bold', color: theme.colors.onBackground }}>
                    {t('profile.title')}
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
                    {user?.email}
                </Text>
            </View>

            <View style={styles.section}>
                <Text variant="titleMedium" style={{ marginBottom: 15, fontWeight: 'bold', color: theme.colors.onBackground }}>
                    {t('profile.theme_settings')}
                </Text>
                <SegmentedButtons
                    value={themePreference}
                    onValueChange={(value) => setThemePreference(value as any)}
                    buttons={[
                        {
                            value: 'system',
                            label: t('profile.theme.system'),
                            icon: 'theme-light-dark',
                        },
                        {
                            value: 'light',
                            label: t('profile.theme.light'),
                            icon: 'weather-sunny',
                        },
                        {
                            value: 'dark',
                            label: t('profile.theme.dark'),
                            icon: 'weather-night',
                        },
                    ]}
                />
            </View>

            <View style={styles.section}>
                <Text variant="titleMedium" style={{ marginBottom: 15, fontWeight: 'bold', color: theme.colors.onBackground }}>
                    {t('profile.language_settings')}
                </Text>
                <Surface style={{ borderRadius: 12, overflow: 'hidden' }} elevation={1}>
                    <List.Item
                        title={t('profile.languages.tr')}
                        onPress={() => setLanguage('tr')}
                        right={props => language === 'tr' ? <List.Icon {...props} icon="check" color={theme.colors.primary} /> : null}
                    />
                    <List.Item
                        title={t('profile.languages.en')}
                        onPress={() => setLanguage('en')}
                        right={props => language === 'en' ? <List.Icon {...props} icon="check" color={theme.colors.primary} /> : null}
                    />
                </Surface>
            </View>

            <View style={styles.actions}>
                <Button
                    mode="outlined"
                    icon="logout"
                    onPress={handleLogout}
                    textColor={theme.colors.error}
                    style={{ borderColor: theme.colors.error }}
                >
                    {t('profile.logout')}
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 50,
        marginBottom: 50,
    },
    section: {
        marginBottom: 30,
    },
    actions: {
        gap: 15,
    },
});
