import { AnalysisResult, analyzeOutfit } from '@/services/ai';
import { saveHistory } from '@/services/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { Button, Text, useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');

function ScoreRing({ score, theme }: { score: number; theme: any }) {
    const scoreColor = score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336';
    return (
        <View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress
                value={score}
                radius={40}
                duration={1500}
                progressValueColor={theme.colors.onSurface}
                maxValue={100}
                title={'100'}
                titleColor={theme.colors.onSurfaceVariant}
                titleStyle={{ fontSize: 10, opacity: 0.6 }}
                activeStrokeColor={scoreColor}
                inActiveStrokeColor={theme.colors.surfaceVariant}
                inActiveStrokeOpacity={0.8}
                activeStrokeWidth={6}
                inActiveStrokeWidth={6}
            />
        </View>
    );
}

export default function AnalysisScreen() {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const router = useRouter();
    const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    useEffect(() => {
        if (imageUri) handleAnalyze();
    }, [imageUri]);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const analysis = await analyzeOutfit(imageUri!, i18n.language);
            setResult(analysis);
            await saveHistory('analysis', { imageUri, analysis }, analysis.score);
        } catch (e) {
            Alert.alert(t('scan.error_analysis'), t('scan.error_analysis'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.loadingCard, { backgroundColor: theme.colors.surface }]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.onSurface, fontWeight: '700' }}>
                        {t('analysis.analyzing')}
                    </Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, fontSize: 13 }}>
                        AI stilini değerlendiriyor...
                    </Text>
                </View>
            </View>
        );
    }

    if (!result) return null;

    const scoreColor = result.score >= 80 ? '#4CAF50' : result.score >= 60 ? '#FF9800' : '#F44336';

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{
                headerShown: false,
            }} />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroImageWrapper}>
                    <Image source={{ uri: imageUri! }} style={styles.heroImage} />
                    <View style={[styles.heroOverlay, { backgroundColor: theme.colors.background }]} />
                </View>

                <View style={[styles.contentContainer, { backgroundColor: theme.colors.background }]}>
                    {/* Back button */}
                    <Button
                        mode="text"
                        onPress={() => router.back()}
                        icon="arrow-left"
                        style={{ alignSelf: 'flex-start', marginBottom: 8, marginLeft: -8 }}
                        textColor={theme.colors.onSurfaceVariant}
                    >
                        Geri
                    </Button>

                    {/* Score Section */}
                    <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }]}>
                        <ScoreRing score={result.score} theme={theme} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.scoreTitle, { color: theme.colors.onSurface }]}>{t('analysis.score_title')}</Text>
                            <View style={styles.tagRow}>
                                {result.feedback.style_tags.map((tag, i) => (
                                    <View key={i} style={[styles.tag, { backgroundColor: theme.colors.primaryContainer }]}>
                                        <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* First Impression */}
                    <View style={[styles.section, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="star-four-points" size={20} color={theme.colors.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('analysis.first_impression')}</Text>
                        </View>
                        <Text style={[styles.sectionText, { color: theme.colors.onSurfaceVariant }]}>
                            "{result.feedback.compliment}"
                        </Text>
                    </View>

                    {/* Critique */}
                    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={theme.colors.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('analysis.critique')}</Text>
                        </View>
                        {result.feedback.critique.map((item, i) => (
                            <View key={i} style={styles.critiqueItem}>
                                <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
                                <Text style={[styles.critiqueText, { color: theme.colors.onSurfaceVariant }]}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Conclusion */}
                    <View style={[styles.conclusionCard, { backgroundColor: theme.colors.primaryContainer }]}>
                        <MaterialCommunityIcons name="check-decagram" size={24} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('analysis.conclusion')}</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.onSurfaceVariant }]}>
                            {result.feedback.conclusion}
                        </Text>
                    </View>

                    <Button
                        mode="outlined"
                        onPress={() => router.replace('/(tabs)/camera')}
                        style={[styles.retryButton, { borderColor: theme.colors.primary }]}
                        textColor={theme.colors.primary}
                        icon="camera-plus-outline"
                    >
                        {t('analysis.try_new_photo')}
                    </Button>
                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingCard: { padding: 32, borderRadius: 24, alignItems: 'center', width: '100%' },
    heroImageWrapper: { position: 'relative', height: width * 1.1 },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        opacity: 0.95, // Still using this trick to blend into the background
    },
    contentContainer: { paddingHorizontal: 20, marginTop: -20, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24 },
    scoreCard: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        padding: 24, borderRadius: 28, marginBottom: 16,
    },
    scoreRing: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 3,
        justifyContent: 'center', alignItems: 'center',
    },
    scoreNumber: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    scoreLabel: { fontSize: 10, letterSpacing: 0.5 },
    scoreTitle: { fontWeight: '900', fontSize: 14, marginBottom: 12 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    tagText: { fontSize: 11, fontWeight: '800' },
    section: { padding: 24, borderRadius: 24, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontWeight: '900', fontSize: 14 },
    sectionText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', letterSpacing: 0.2 },
    critiqueItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 10 },
    bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 }, // Circle bullet
    critiqueText: { flex: 1, fontSize: 14, lineHeight: 22 },
    conclusionCard: { padding: 24, borderRadius: 24, marginBottom: 24 },
    retryButton: { borderRadius: 16 },
});
