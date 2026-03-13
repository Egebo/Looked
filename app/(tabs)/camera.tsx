import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraScreen() {
    const { t } = useTranslation();
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const pickAndAnalyze = async (mode: 'camera' | 'gallery') => {
        if (mode === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('camera.permission_needed'), t('camera.camera_permission_msg'));
                return;
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('camera.permission_needed'), t('camera.gallery_permission_msg'));
                return;
            }
        }

        const result = mode === 'camera'
            ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });

        if (!result.canceled && result.assets[0]?.uri) {
            router.push({ pathname: '/analysis', params: { imageUri: result.assets[0].uri } });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.content}>
                {/* Icon */}
                <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons name="tshirt-crew" size={56} color={theme.colors.primary} />
                </View>

                <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                    {t('camera.title')}
                </Text>
                <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                    {t('camera.description')}
                </Text>

                {/* Cards */}
                <View style={styles.cards}>
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: theme.colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 }]}
                        onPress={() => pickAndAnalyze('camera')}
                        activeOpacity={0.88}
                    >
                        <View style={[styles.cardIconBg, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                            <MaterialCommunityIcons name="camera" size={32} color={theme.colors.onPrimary} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.colors.onPrimary }]}>
                            {t('camera.take_photo')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 }]}
                        onPress={() => pickAndAnalyze('gallery')}
                        activeOpacity={0.88}
                    >
                        <View style={[styles.cardIconBg, { backgroundColor: theme.colors.primaryContainer }]}>
                            <MaterialCommunityIcons name="image-multiple" size={32} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                            {t('camera.pick_image')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
                    ✨ AI kombinini analiz edecek
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        padding: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapper: {
        width: 110, height: 110,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28, fontWeight: '800',
        textAlign: 'center', marginBottom: 16, letterSpacing: -0.5,
    },
    description: {
        textAlign: 'center', fontSize: 14,
        lineHeight: 22, marginBottom: 40, paddingHorizontal: 16,
    },
    cards: { flexDirection: 'row', gap: 16, width: '100%', marginBottom: 32 },
    card: {
        flex: 1, borderRadius: 28, padding: 20,
        alignItems: 'center', minHeight: 160, justifyContent: 'center', gap: 10,
    },
    cardIconBg: {
        width: 64, height: 64, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    cardTitle: { fontWeight: '800', fontSize: 14, textAlign: 'center' },
    cardSub: { fontSize: 12, textAlign: 'center' },
    hint: { fontSize: 13, opacity: 0.8 },
});
