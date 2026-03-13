import { DetectedItem, detectOutfitItems } from '@/services/ai';
import { addToWardrobe, Category } from '@/services/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
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
    TouchableOpacity,
    View,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { Portal, Snackbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function FocusedThumbnail({ uri, bbox }: { uri: string; bbox: [number, number, number, number] }) {
    const [ymin, xmin, ymax, xmax] = bbox;
    const width = xmax - xmin;
    const height = ymax - ymin;
    const centerX = xmin + width / 2;
    const centerY = ymin + height / 2;
    const zoom = Math.min(3, 1 / Math.max(width, height, 0.1));
    const ratio = width / height;

    // Determine the actual thumbnail box dimensions (max 70x70) keeping aspect ratio
    const boxWidth = ratio > 1 ? 70 : 70 * ratio;
    const boxHeight = ratio > 1 ? 70 / ratio : 70;

    return (
        <View style={[styles.thumbContainer, { width: boxWidth, height: boxHeight }]}>
            <Image
                source={{ uri }}
                style={{
                    width: boxWidth * zoom, height: boxHeight * zoom,
                    left: -centerX * (boxWidth * zoom) + (boxWidth / 2),
                    top: -centerY * (boxHeight * zoom) + (boxHeight / 2),
                    position: 'absolute',
                    resizeMode: 'cover',
                }}
            />
        </View>
    );
}

export default function ScanOutfitScreen() {
    const { t } = useTranslation();
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { source } = useLocalSearchParams<{ source: 'camera' | 'gallery' }>();

    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [items, setItems] = useState<DetectedItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');

    useEffect(() => { if (source) pickImage(source); }, [source]);

    const pickImage = async (mode: 'camera' | 'gallery') => {
        try {
            if (mode === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') { Alert.alert(t('camera.permission_needed'), t('camera.camera_permission_msg')); router.back(); return; }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') { Alert.alert(t('camera.permission_needed'), t('camera.gallery_permission_msg')); router.back(); return; }
            }
            const result = mode === 'camera'
                ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
                : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

            if (!result.canceled && result.assets[0].uri) {
                setImage(result.assets[0].uri);
                handleAnalyze(result.assets[0].uri);
            } else if (!image) { router.back(); }
        } catch { Alert.alert(t('camera.permission_needed'), t('camera.camera_permission_msg')); router.back(); }
    };

    const handleAnalyze = async (uri: string) => {
        setAnalyzing(true);
        try {
            const detected = await detectOutfitItems(uri);
            setItems(detected.map(d => ({ ...d, croppedUri: undefined })));
            setSelectedItems(detected.map((_, idx) => idx));
        } catch { Alert.alert(t('scan.error_analysis'), t('scan.error_analysis')); }
        finally { setAnalyzing(false); }
    };

    const toggleSelection = (index: number) => {
        setSelectedItems(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    // Open full image in cropper with AI bbox pre-selected if available
    const openCropper = async (index: number) => {
        const item = items[index] as any;
        setEditingIndex(index);

        try {
            // Note: react-native-image-crop-picker does not support normalized initial rects directly.
            // We just open the free-form cropper for the user to adjust based on visual feedback.
            const result = await ImageCropPicker.openCropper({
                path: item.croppedUri || image!,
                freeStyleCropEnabled: true,
                mediaType: 'photo',
                cropperToolbarTitle: t('wardrobe.edit_item'),
                cropperActiveWidgetColor: '#00ff00',
                cropperToolbarColor: theme.colors.surface,
                cropperToolbarWidgetColor: theme.colors.onSurface,
                cropperTintColor: '#00ff00',
                hideBottomControls: true,
            });

            const newItems = [...items] as any[];
            newItems[index].croppedUri = result.path;
            setItems(newItems);

        } catch (error: any) {
            if (error?.message !== 'User cancelled image selection') {
                Alert.alert('Hata', 'Kırpma işlemi iptal edildi veya başarısız oldu.');
            }
        }
    };

    const handleSave = async () => {
        if (selectedItems.length === 0) return;
        setSaving(true);
        try {
            const info = await ImageManipulator.manipulateAsync(image!, [], { compress: 0 });
            for (const index of selectedItems) {
                const item = items[index] as any;
                let finalUri = image!;
                if (item.croppedUri) {
                    finalUri = item.croppedUri;
                } else {
                    const [ymin, xmin, ymax, xmax] = item.bbox;
                    const cropRegion = {
                        originX: Math.max(0, Math.floor(xmin * info.width)),
                        originY: Math.max(0, Math.floor(ymin * info.height)),
                        width: Math.max(1, Math.floor((xmax - xmin) * info.width)),
                        height: Math.max(1, Math.floor((ymax - ymin) * info.height)),
                    };
                    const cropped = await ImageManipulator.manipulateAsync(image!, [{ crop: cropRegion }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
                    finalUri = cropped.uri;
                }
                await addToWardrobe({ imageUri: finalUri, category: item.category as Category, name: item.label });
            }
            setSnackbarMsg(t('scan.saved_msg', { count: selectedItems.length }));
            setSnackbarVisible(true);
            setTimeout(() => router.replace('/(tabs)/wardrobe'), 1500);
        } catch (e) { Alert.alert(t('scan.error_save'), t('scan.error_save')); }
        finally { setSaving(false); }
    };

    // ANALYZING STATE
    if (analyzing) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen options={{ title: t('scan.title'), headerShown: true }} />
                <View style={[styles.analyzingCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View style={[styles.analyzingIconBg, { backgroundColor: theme.colors.primaryContainer }]}>
                        <MaterialCommunityIcons name="magnify-scan" size={40} color={theme.colors.primary} />
                    </View>
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 24, marginBottom: 16 }} />
                    <Text style={[styles.analyzingTitle, { color: theme.colors.onSurface }]}>{t('scan.analyzing')}</Text>
                    <Text style={[styles.analyzingDesc, { color: theme.colors.onSurfaceVariant }]}>
                        AI kıyafetleri tespit ediyor...
                    </Text>
                </View>
            </View>
        );
    }

    // LANDING (no image selected yet)
    if (!image) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen options={{ title: t('scan.title'), headerShown: true }} />
                <View style={[styles.landingWrapper, { paddingBottom: insets.bottom + 20 }]}>
                    {/* Visual hero */}
                    <View style={[styles.landingHero, { backgroundColor: theme.colors.primaryContainer }]}>
                        <View style={[styles.heroCircle1, { backgroundColor: theme.colors.primary, opacity: 0.08 }]} />
                        <View style={[styles.heroCircle2, { backgroundColor: theme.colors.primary, opacity: 0.06 }]} />
                        <MaterialCommunityIcons name="magnify-scan" size={72} color={theme.colors.primary} />
                        <View style={[styles.heroBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={[styles.heroBadgeText, { color: theme.colors.onPrimary }]}>AI STYLIST</Text>
                        </View>
                    </View>

                    <Text style={[styles.landingTitle, { color: theme.colors.onBackground }]}>
                        {t('scan.title')}
                    </Text>
                    <Text style={[styles.landingDesc, { color: theme.colors.onSurfaceVariant }]}>
                        {t('scan.desc')}
                    </Text>

                    {/* Steps */}
                    <View style={styles.steps}>
                        {[
                            { icon: 'camera-outline', text: 'Boydan fotoğraf yükle' },
                            { icon: 'auto-fix', text: 'AI kıyafetleri otomatik tespit eder' },
                            { icon: 'check-circle-outline', text: 'İstediğini seç ve kaydet' },
                        ].map((step, i) => (
                            <View key={i} style={styles.step}>
                                <View style={[styles.stepIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                                    <MaterialCommunityIcons name={step.icon as any} size={18} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.stepText, { color: theme.colors.onSurfaceVariant }]}>{step.text}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Buttons */}
                    <View style={styles.landingButtons}>
                        <TouchableOpacity
                            style={[styles.landingBtn, { backgroundColor: theme.colors.primary }]}
                            onPress={() => pickImage('camera')}
                            activeOpacity={0.88}
                        >
                            <MaterialCommunityIcons name="camera-outline" size={22} color={theme.colors.onPrimary} />
                            <Text style={[styles.landingBtnText, { color: theme.colors.onPrimary }]}>{t('camera.take_photo')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.landingBtn, { backgroundColor: theme.colors.surfaceVariant, borderWidth: 1.5, borderColor: theme.colors.outlineVariant }]}
                            onPress={() => pickImage('gallery')}
                            activeOpacity={0.88}
                        >
                            <MaterialCommunityIcons name="image-multiple-outline" size={22} color={theme.colors.primary} />
                            <Text style={[styles.landingBtnText, { color: theme.colors.onSurface }]}>{t('camera.pick_image')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // RESULTS
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen options={{ title: t('scan.title'), headerShown: true }} />
            <ScrollView contentContainerStyle={[styles.resultsScroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
                {/* Thumbnail of original */}
                <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />

                {/* Header */}
                <View style={styles.resultsHeaderBox}>
                    <View>
                        <Text style={[styles.resultsTitle, { color: theme.colors.onBackground }]}>
                            {t('scan.items_found', { count: items.length })}
                        </Text>
                        <Text style={[styles.resultsTip, { color: theme.colors.onSurfaceVariant }]}>{t('scan.tip')}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.retryChip, { backgroundColor: theme.colors.surfaceVariant }]}
                        onPress={() => pickImage(source || 'gallery')}
                    >
                        <MaterialCommunityIcons name="refresh" size={14} color={theme.colors.primary} />
                        <Text style={[styles.retryChipText, { color: theme.colors.primary }]}>{t('scan.retry')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Item list */}
                <View style={styles.list}>
                    {items.map((item, index) => {
                        const isSelected = selectedItems.includes(index);
                        const anyItem = item as any;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.listItem,
                                    {
                                        backgroundColor: theme.colors.surface,
                                        borderColor: isSelected ? theme.colors.primary : theme.colors.outlineVariant,
                                        borderWidth: isSelected ? 2 : 1,
                                    }
                                ]}
                                onPress={() => toggleSelection(index)}
                                activeOpacity={0.85}
                            >
                                {/* Checkbox */}
                                <View style={[styles.checkbox, { backgroundColor: isSelected ? theme.colors.primary : 'transparent', borderColor: isSelected ? theme.colors.primary : theme.colors.outline }]}>
                                    {isSelected && <MaterialCommunityIcons name="check" size={14} color={theme.colors.onPrimary} />}
                                </View>

                                {/* Thumbnail */}
                                <TouchableOpacity onPress={() => openCropper(index)} style={{ width: 70, height: 70, justifyContent: 'center', alignItems: 'center' }}>
                                    {anyItem.croppedUri ? (
                                        <Image source={{ uri: anyItem.croppedUri }} style={styles.customCropThumb} />
                                    ) : (
                                        <FocusedThumbnail uri={image!} bbox={item.bbox} />
                                    )}
                                </TouchableOpacity>

                                {/* Info */}
                                <View style={styles.itemInfo}>
                                    <Text style={[styles.itemLabel, { color: theme.colors.onSurface }]}>{item.label}</Text>
                                    <View style={[styles.categoryTag, { backgroundColor: theme.colors.primaryContainer }]}>
                                        <Text style={[styles.categoryTagText, { color: theme.colors.primary }]}>
                                            {t(`wardrobe.categories.${item.category}`)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Edit */}
                                <TouchableOpacity
                                    style={[styles.editBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                                    onPress={() => openCropper(index)}
                                >
                                    <MaterialCommunityIcons name="crop" size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant, paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: selectedItems.length > 0 ? theme.colors.primary : theme.colors.surfaceVariant }]}
                    onPress={handleSave}
                    disabled={selectedItems.length === 0 || saving}
                    activeOpacity={0.88}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="content-save-outline" size={20} color={selectedItems.length > 0 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
                            <Text style={[styles.saveBtnText, { color: selectedItems.length > 0 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                {t('scan.save_x_items', { count: selectedItems.length })}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <Portal>
                <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000}>
                    {snackbarMsg}
                </Snackbar>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    analyzingCard: { width: '100%', borderRadius: 32, padding: 32, alignItems: 'center' },
    analyzingIconBg: { width: 90, height: 90, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    analyzingTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    analyzingDesc: { fontSize: 14, opacity: 0.8 },

    // Landing
    landingWrapper: { flex: 1, padding: 24, justifyContent: 'center' },
    landingHero: { width: '100%', height: 200, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden', position: 'relative' },
    heroCircle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, top: -80, right: -60 },
    heroCircle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, bottom: -40, left: -30 },
    heroBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    heroBadgeText: { fontWeight: '800', fontSize: 12 },
    landingTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
    landingDesc: { fontSize: 14, lineHeight: 22, marginVertical: 12, marginBottom: 24 },
    steps: { gap: 12, marginBottom: 28 },
    step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    stepText: { fontSize: 14, flex: 1 },
    landingButtons: { gap: 12 },
    landingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 16 },
    landingBtnText: { fontSize: 15, fontWeight: '700' },

    // Results
    resultsScroll: { padding: 16 },
    previewImage: { width: '100%', height: 200, borderRadius: 20, marginBottom: 16 },
    resultsHeaderBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    resultsTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    resultsTip: { fontSize: 12 },
    retryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    retryChipText: { fontSize: 12, fontWeight: '700' },
    list: { gap: 10 },
    listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20 },
    checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    thumbContainer: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#222' },
    customCropThumb: { width: '100%', height: '100%', borderRadius: 14, resizeMode: 'contain', backgroundColor: '#222' },
    itemInfo: { flex: 1, gap: 6 },
    itemLabel: { fontWeight: '700', fontSize: 14 },
    categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    categoryTagText: { fontSize: 11, fontWeight: '600' },
    editBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingTop: 12, borderTopWidth: 1 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 16 },
    saveBtnText: { fontSize: 15, fontWeight: '800' },
});
