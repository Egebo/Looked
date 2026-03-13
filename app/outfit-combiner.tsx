import { autoCreateOutfit, AutoOutfitResult, suggestOutfitCombination } from '@/services/ai';
import { getWardrobe, saveHistory, WardrobeItem } from '@/services/storage';
import { getWeather, WeatherData } from '@/services/weather';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal as RNModal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Button,
    IconButton,
    Portal,
    SegmentedButtons,
    Surface,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CATEGORIES = ['Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Accessories'];

const AUTO_CONTEXTS = [
    { key: 'Casual', emoji: '☀️' },
    { key: 'Office', emoji: '💼' },
    { key: 'Dinner', emoji: '🍽️' },
    { key: 'Sport', emoji: '🏃' },
    { key: 'Party', emoji: '🎉' },
    { key: 'First Date', emoji: '💫' },
];

export default function OutfitCombinerScreen() {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const router = useRouter();

    const [mode, setMode] = useState('manual');
    const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [weather, setWeather] = useState<WeatherData | null>(null);

    const [selectedOutfit, setSelectedOutfit] = useState<{ [key: string]: WardrobeItem | null }>({
        Tops: null, Bottoms: null, Shoes: null, Outerwear: null, Accessories: null,
    });
    const [selectorModalVisible, setSelectorModalVisible] = useState(false);
    const [activeSlot, setActiveSlot] = useState<string | null>(null);

    const [autoPrompt, setAutoPrompt] = useState('');
    const [autoResult, setAutoResult] = useState<AutoOutfitResult | null>(null);
    const [manualAnalysis, setManualAnalysis] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [items, weatherData] = await Promise.all([getWardrobe(), getWeather()]);
            setWardrobe(items);
            setWeather(weatherData);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openSlotSelector = (category: string) => { setActiveSlot(category); setSelectorModalVisible(true); };
    const selectItemForSlot = (item: WardrobeItem) => { setSelectedOutfit(prev => ({ ...prev, [activeSlot!]: item })); setSelectorModalVisible(false); };
    const clearSlot = (category: string) => setSelectedOutfit(prev => ({ ...prev, [category]: null }));

    const handleManualCombine = async () => {
        const items = Object.values(selectedOutfit).filter(i => i !== null) as WardrobeItem[];
        if (items.length < 2) return;
        setLoading(true);
        try {
            const aiItems = items.map(item => ({ uri: item.imageUri, category: item.category, label: item.name }));
            const weatherCtx = weather ? `${weather.temperature}°C, ${weather.description}` : undefined;
            const result = await suggestOutfitCombination(aiItems, weatherCtx, i18n.language);
            setManualAnalysis(result);
            await saveHistory('combination', { type: 'manual', items: aiItems, result });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAutoCreate = async (customPrompt?: string) => {
        const promptToUse = customPrompt || autoPrompt;
        if (!promptToUse) return;
        setLoading(true);
        setAutoResult(null);
        try {
            const weatherCtx = weather ? `${weather.temperature}°C, ${weather.description}` : undefined;
            const items = wardrobe.map(i => ({ id: i.id, uri: i.imageUri, category: i.category, label: i.name }));
            const result = await autoCreateOutfit(items, promptToUse, weatherCtx, i18n.language);
            console.log('Auto outfit result:', JSON.stringify(result));
            console.log('Wardrobe IDs:', wardrobe.map(w => w.id));
            setAutoResult(result);
            const selectedItems = wardrobe.filter(w => result.selectedIds.includes(w.id));
            console.log('Matched items:', selectedItems.length);
            await saveHistory('combination', { type: 'auto', prompt: promptToUse, selectedItems, result: result.reasoning });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filteredItemsForModal = activeSlot ? wardrobe.filter(i => i.category === activeSlot) : [];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <SegmentedButtons
                    value={mode}
                    onValueChange={v => { setMode(v); setManualAnalysis(null); setAutoResult(null); }}
                    buttons={[
                        { value: 'manual', label: t('combiner.tab_manual'), icon: 'hand-pointing-up' },
                        { value: 'auto', label: t('combiner.tab_auto'), icon: 'auto-fix' },
                    ]}
                    style={styles.segmented}
                />
                {weather && (
                    <View style={[styles.weatherRow, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <MaterialCommunityIcons name="weather-partly-cloudy" size={16} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.weatherText, { color: theme.colors.onSurfaceVariant }]}>
                            {t('combiner.current_weather', { temp: Math.round(weather.temperature), desc: weather.description })}
                        </Text>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {mode === 'manual' ? (
                    <View>
                        <Text style={[styles.modeDesc, { color: theme.colors.onSurfaceVariant }]}>
                            {t('combiner.manual_desc')}
                        </Text>
                        <View style={styles.slotsGrid}>
                            {CATEGORIES.map(category => {
                                const selectedItem = selectedOutfit[category];
                                return (
                                    <View key={category} style={styles.slotContainer}>
                                        <Text style={[styles.slotLabel, { color: theme.colors.onSurfaceVariant }]}>
                                            {t(`wardrobe.categories.${category}`)}{category === 'Tops' || category === 'Bottoms' ? '*' : ''}
                                        </Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.slot,
                                                selectedItem
                                                    ? { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 }
                                                    : { backgroundColor: theme.colors.surfaceVariant, elevation: 0, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.outline }
                                            ]}
                                            onPress={() => openSlotSelector(category)}
                                            activeOpacity={0.8}
                                        >
                                            {selectedItem ? (
                                                <>
                                                    <Image source={{ uri: selectedItem.imageUri }} style={styles.slotImage} resizeMode="cover" />
                                                    <TouchableOpacity
                                                        style={[styles.clearBtn, { backgroundColor: theme.colors.error }]}
                                                        onPress={(e) => { e.stopPropagation?.(); clearSlot(category); }}
                                                    >
                                                        <MaterialCommunityIcons name="close" size={12} color="white" />
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                <MaterialCommunityIcons name="plus" size={28} color={theme.colors.outlineVariant} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : (
                    <View>
                        <Text style={[styles.autoTitle, { color: theme.colors.onBackground }]}>
                            {t('combiner.auto_title')}
                        </Text>
                        <Text style={[styles.modeDesc, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
                            {t('combiner.auto_desc')}
                        </Text>
                        <View style={styles.contextGrid}>
                            {AUTO_CONTEXTS.map(({ key, emoji }) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.contextChip, { backgroundColor: theme.colors.surfaceVariant }]}
                                    onPress={() => { setAutoPrompt(t(`combiner.contexts.${key}`)); handleAutoCreate(t(`combiner.contexts.${key}`)); }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.contextEmoji}>{emoji}</Text>
                                    <Text style={[styles.contextLabel, { color: theme.colors.onSurfaceVariant }]}>{t(`combiner.contexts.${key}`)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={[styles.orLabel, { color: theme.colors.onSurfaceVariant }]}>{t('combiner.input_label')}</Text>
                        <TextInput
                            value={autoPrompt}
                            onChangeText={setAutoPrompt}
                            placeholder={t('combiner.input_placeholder')}
                            mode="outlined"
                            style={[styles.autoInput, { backgroundColor: 'transparent' }]}
                            outlineStyle={{ borderRadius: 14 }}
                            right={<TextInput.Icon icon="send" onPress={() => handleAutoCreate()} color={theme.colors.primary} />}
                        />
                    </View>
                )}

                {/* Loading */}
                {loading && (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                            {mode === 'manual' ? t('combiner.analyzing') : t('combiner.magic_working')}
                        </Text>
                    </View>
                )}

                {/* Manual Result */}
                {manualAnalysis && mode === 'manual' && (
                    <View style={[styles.resultCard, { backgroundColor: theme.colors.primaryContainer }]}>
                        <View style={styles.resultHeader}>
                            <MaterialCommunityIcons name="star-four-points" size={20} color={theme.colors.primary} />
                            <Text style={[styles.resultTitle, { color: theme.colors.onSurface }]}>{t('combiner.result_stylist')}</Text>
                        </View>
                        <Text style={[styles.resultText, { color: theme.colors.onSurfaceVariant }]}>{manualAnalysis}</Text>
                        <Button mode="text" onPress={() => setManualAnalysis(null)} style={{ alignSelf: 'flex-end', borderRadius: 12 }} textColor={theme.colors.primary}>{t('combiner.close')}</Button>
                    </View>
                )}

                {/* Auto Result */}
                {autoResult && mode === 'auto' && (() => {
                    const matchedItems = wardrobe.filter(w => autoResult.selectedIds.includes(w.id));
                    return (
                        <View style={styles.autoResultContainer}>
                            <Text style={[styles.resultTitle, { color: theme.colors.onBackground, marginBottom: 16 }]}>✨ {t('combiner.result_stylist')}</Text>
                            {matchedItems.length > 0 ? (
                                <View style={styles.matchedGrid}>
                                    {matchedItems.map(item => (
                                        <Image
                                            key={item.id}
                                            source={{ uri: item.imageUri }}
                                            style={[styles.matchedImage, { borderColor: theme.colors.outlineVariant, borderWidth: 1 }]}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center', marginBottom: 16, opacity: 0.5 }}>
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>Parça görselleri yüklenemedi.</Text>
                                </View>
                            )}
                            <View style={[styles.reasoningCard, { backgroundColor: theme.colors.primaryContainer }]}>
                                <Text style={[styles.resultText, { color: theme.colors.onSurface, fontStyle: 'italic' }]}>"{autoResult.reasoning}"</Text>
                            </View>
                            <Button mode="contained" onPress={() => setAutoResult(null)} style={[styles.newOutfitBtn, { marginTop: 16 }]}>{t('combiner.btn_new')}</Button>
                        </View>
                    );
                })()}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Item selector modal */}
            <Portal>
                <RNModal visible={selectorModalVisible} onDismiss={() => setSelectorModalVisible(false)} transparent animationType="slide">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <Surface style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                            <View style={styles.modalHeader}>
                                <Text variant="titleMedium" style={{ fontWeight: '800' }}>{t('combiner.pick_item', { category: t(`wardrobe.categories.${activeSlot}`) })}</Text>
                                <IconButton icon="close" onPress={() => setSelectorModalVisible(false)} />
                            </View>
                            <ScrollView>
                                {filteredItemsForModal.length > 0 ? (
                                    <View style={styles.modalGrid}>
                                        {filteredItemsForModal.map((item) => (
                                            <TouchableOpacity key={item.id} style={[styles.modalItem, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]} onPress={() => selectItemForSlot(item)}>
                                                <Image source={{ uri: item.imageUri }} style={styles.modalImage} resizeMode="cover" />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={{ padding: 40, alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="wardrobe-outline" size={40} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.4, marginBottom: 10 }} />
                                        <Text style={{ color: theme.colors.onSurfaceVariant, opacity: 0.6 }}>{t('combiner.empty_category')}</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </Surface>
                    </View>
                </RNModal>
            </Portal>

            {/* Manual analyze footer */}
            {mode === 'manual' && !manualAnalysis && (
                <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 6 }]}>
                    <Button
                        mode="contained"
                        onPress={handleManualCombine}
                        loading={loading}
                        disabled={loading || !selectedOutfit.Tops || !selectedOutfit.Bottoms}
                        style={styles.analyzeBtn}
                        labelStyle={{ fontSize: 15, fontWeight: '800' }}
                    >
                        {loading ? t('combiner.analyzing') : t('combiner.btn_analyze')}
                    </Button>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 15, paddingBottom: 0 },
    segmented: { marginBottom: 10 },
    weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 8 },
    weatherText: { fontSize: 13, fontWeight: '700' },
    scroll: { padding: 15 },
    modeDesc: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    slotContainer: { width: '47%', alignItems: 'center' },
    slotLabel: { marginBottom: 6, fontWeight: '700', fontSize: 13 },
    slot: { width: '100%', aspectRatio: 1, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    slotImage: { width: '100%', height: '100%' },
    clearBtn: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    autoTitle: { fontSize: 28, fontWeight: '900', marginBottom: 6, letterSpacing: -0.5 },
    contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    contextChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    contextEmoji: { fontSize: 15 },
    contextLabel: { fontWeight: '700', fontSize: 13 },
    orLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
    autoInput: { marginBottom: 10 },
    loadingBox: { padding: 40, alignItems: 'center', gap: 12 },
    loadingText: { fontWeight: '700', fontSize: 14 },
    resultCard: { marginTop: 16, borderRadius: 24, padding: 20 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    resultTitle: { fontWeight: '900', fontSize: 15 },
    resultText: { fontSize: 14, lineHeight: 24 },
    autoResultContainer: { marginTop: 10 },
    matchedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 20 },
    matchedImage: { width: SCREEN_WIDTH * 0.42, height: SCREEN_WIDTH * 0.42, borderRadius: 24, overflow: 'hidden' },
    reasoningCard: { padding: 20, borderRadius: 24 },
    newOutfitBtn: { borderRadius: 16 },
    modalContent: { padding: 24, maxHeight: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    modalItem: { width: '31%', aspectRatio: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
    modalImage: { width: '100%', height: '100%' },
    footer: { padding: 20, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 },
    analyzeBtn: { borderRadius: 16, paddingVertical: 6 },
});
