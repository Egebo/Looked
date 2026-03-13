import { useAuth } from '@/context/AuthContext';
import { Category, deleteFromWardrobe, getWardrobe, updateWardrobeItem, WardrobeItem } from '@/services/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Dimensions, RefreshControl, Image as RNImage, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { Button, Chip, FAB, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COL_GAP = 12;
const PADDING = 16;
const ITEM_WIDTH = (SCREEN_WIDTH - PADDING * 2 - COL_GAP) / 2;

const CATEGORY_ICONS: Record<string, string> = {
    Tops: 'tshirt-crew-outline',
    Bottoms: 'hanger',
    Shoes: 'shoe-sneaker',
    Outerwear: 'coat-rack',
    Accessories: 'glasses',
};

export default function WardrobeScreen() {
    const { t } = useTranslation();
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [items, setItems] = useState<WardrobeItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
    const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editCategory, setEditCategory] = useState<Category>('Tops');
    const [editImageUri, setEditImageUri] = useState<string>('');
    const [editName, setEditName] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);

    const loadWardrobe = async () => { setItems(await getWardrobe()); };
    useFocusEffect(useCallback(() => { loadWardrobe(); }, []));
    const onRefresh = useCallback(async () => { setRefreshing(true); await loadWardrobe(); setRefreshing(false); }, []);

    const openEditModal = (item: WardrobeItem) => {
        setSelectedItem(item);
        setEditName(item.name || '');
        setEditCategory(item.category);
        setEditImageUri(item.imageUri);
        setEditModalVisible(true);
    };

    const handleUpdatePhoto = async () => {
        try {
            const image = await ImageCropPicker.openPicker({
                cropping: true,
                freeStyleCropEnabled: true,
                mediaType: 'photo',
                cropperToolbarTitle: t('wardrobe.edit_item'),
                cropperActiveWidgetColor: '#00ff00', // Making active corners intensely green so they are very visible
                cropperStatusBarColor: theme.colors.background,
                cropperToolbarColor: theme.colors.surface,
                cropperToolbarWidgetColor: theme.colors.onSurface,
                cropperTintColor: '#00ff00', // iOS tint color
                hideBottomControls: true,
            });
            setEditImageUri(image.path);
        } catch (error: any) {
            if (error?.message !== 'User cancelled image selection') {
                Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
            }
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedItem) return;
        setSaving(true);
        try {
            const updatedItem = await updateWardrobeItem(selectedItem.id, { category: editCategory, name: editName, imageUri: editImageUri });
            if (updatedItem) setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
            setEditModalVisible(false);
            loadWardrobe();
        } catch (error: any) { Alert.alert(t('scan.error_save'), error.message); }
        finally { setSaving(false); }
    };

    const handleDelete = () => {
        if (!selectedItem) return;
        Alert.alert(t('wardrobe.delete_confirm_title'), t('wardrobe.delete_confirm_msg'), [
            { text: t('wardrobe.cancel'), style: 'cancel' },
            { text: t('wardrobe.delete'), style: 'destructive', onPress: async () => { await deleteFromWardrobe(selectedItem.id); setEditModalVisible(false); loadWardrobe(); } }
        ]);
    };

    const categories: (Category | 'All')[] = ['All', 'Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Accessories'];
    const translateCategory = (cat: string) => cat === 'All' ? t('wardrobe.all') : t(`wardrobe.categories.${cat}`);
    const filteredItems = selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);

    // Split into two columns for masonry feel
    const leftCol = filteredItems.filter((_, i) => i % 2 === 0);
    const rightCol = filteredItems.filter((_, i) => i % 2 === 1);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: theme.colors.background }]}>
                <View style={[styles.headerRow, { paddingBottom: 10 }]}>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
                            {t('wardrobe.title')}
                        </Text>
                        <Text style={[styles.headerSub, { color: theme.colors.onSurfaceVariant }]}>
                            {items.length} {t('wardrobe.items')}
                        </Text>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Text style={[styles.countText, { color: theme.colors.onSurfaceVariant }]}>{items.length}</Text>
                    </View>
                </View>

                {/* Category Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: selectedCategory === cat ? theme.colors.primary : theme.colors.surfaceVariant,
                                }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                            activeOpacity={0.8}
                        >
                            {cat !== 'All' && (
                                <MaterialCommunityIcons
                                    name={CATEGORY_ICONS[cat] as any}
                                    size={13}
                                    color={selectedCategory === cat ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                                />
                            )}
                            <Text style={[
                                styles.chipText,
                                { color: selectedCategory === cat ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }
                            ]}>
                                {translateCategory(cat)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <MaterialCommunityIcons name="hanger" size={42} color={theme.colors.onSurfaceVariant} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>{t('wardrobe.empty_title')}</Text>
                    <Text style={[styles.emptySub, { color: theme.colors.onSurfaceVariant }]}>
                        {t('wardrobe.empty_desc')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={() => router.push('/scan-outfit')}
                    >
                        <Text style={[styles.emptyBtnText, { color: theme.colors.onPrimary }]}>{t('wardrobe.scan_all')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.columns}>
                        {/* Left column */}
                        <View style={styles.column}>
                            {leftCol.map((item) => (
                                <WardrobeCard key={item.id} item={item} onPress={openEditModal} theme={theme} />
                            ))}
                        </View>
                        {/* Right column */}
                        <View style={styles.column}>
                            {rightCol.map((item) => (
                                <WardrobeCard key={item.id} item={item} onPress={openEditModal} theme={theme} />
                            ))}
                        </View>
                    </View>
                </ScrollView>
            )}

            {/* Edit Modal */}
            <Portal>
                <Modal
                    visible={editModalVisible}
                    onDismiss={() => setEditModalVisible(false)}
                    contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
                >
                    <ScrollView contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
                        <View style={styles.modalHandle} />
                        <Text variant="titleLarge" style={{ marginBottom: 20, fontWeight: '800', color: theme.colors.onSurface }}>
                            {t('wardrobe.edit_item')}
                        </Text>
                        {/* Image */}
                        <TouchableOpacity onPress={handleUpdatePhoto} style={styles.editImageWrapper}>
                            <RNImage source={{ uri: editImageUri }} style={styles.editImage} />
                            <View style={[styles.editOverlay, { backgroundColor: theme.colors.primary }]}>
                                <MaterialCommunityIcons name="camera-outline" size={16} color="white" />
                            </View>
                        </TouchableOpacity>

                        <TextInput
                            label={t('wardrobe.item_name')}
                            value={editName}
                            onChangeText={setEditName}
                            style={{ width: '100%', marginBottom: 12, backgroundColor: 'transparent' }}
                            mode="outlined"
                            outlineStyle={{ borderRadius: 12 }}
                        />

                        <Text style={{ alignSelf: 'flex-start', fontWeight: '700', fontSize: 13, marginBottom: 10, color: theme.colors.onSurface }}>
                            {t('wardrobe.category')}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 20 }}>
                            {categories.filter(c => c !== 'All').map((cat) => (
                                <Chip
                                    key={cat}
                                    selected={editCategory === cat}
                                    onPress={() => setEditCategory(cat as Category)}
                                    style={editCategory === cat ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceVariant }}
                                    textStyle={{ color: editCategory === cat ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, fontWeight: '600' }}
                                    showSelectedOverlay={false}
                                >
                                    {translateCategory(cat)}
                                </Chip>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                            <Button mode="contained" onPress={handleSaveEdit} loading={saving} style={{ flex: 1, borderRadius: 14 }}>
                                {t('wardrobe.save')}
                            </Button>
                            <Button mode="outlined" onPress={handleDelete} textColor={theme.colors.error} style={{ flex: 1, borderRadius: 14, borderColor: theme.colors.error }}>
                                {t('wardrobe.delete')}
                            </Button>
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>

            <FAB.Group
                open={fabOpen}
                visible
                icon={fabOpen ? 'close' : 'plus'}
                actions={[
                    { icon: 'camera-plus', label: t('wardrobe.scan_all'), onPress: () => router.push('/scan-outfit'), style: { backgroundColor: theme.colors.primaryContainer } },
                    { icon: 'hanger', label: t('wardrobe.add_item_title'), onPress: () => router.push('/add-item'), style: { backgroundColor: theme.colors.primaryContainer } },
                    { icon: 'magic-staff', label: t('tabs.assistant'), onPress: () => router.push('/outfit-combiner'), style: { backgroundColor: theme.colors.primaryContainer } },
                ]}
                onStateChange={({ open }) => setFabOpen(open)}
                onPress={() => { }}
                fabStyle={{ backgroundColor: theme.colors.primary, borderRadius: 18 }}
                color={theme.colors.onPrimary}
            />
        </View>
    );
}

function WardrobeCard({ item, onPress, theme }: { item: WardrobeItem; onPress: (i: WardrobeItem) => void; theme: any }) {
    const [aspectRatio, setAspectRatio] = useState<number>(1);

    useEffect(() => {
        if (item.imageUri) {
            RNImage.getSize(item.imageUri, (w, h) => {
                // Ensure reasonable aspect ratios limits (e.g. not wider than 2:1 or taller than 1:2)
                const ratio = Math.max(0.6, Math.min(1.8, w / h));
                setAspectRatio(ratio);
            }, () => setAspectRatio(1));
        }
    }, [item.imageUri]);

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, aspectRatio }]}
            onPress={() => onPress(item)}
            activeOpacity={0.88}
        >
            <RNImage source={{ uri: item.imageUri }} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
                {item.name ? (
                    <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                ) : null}
                <View style={[styles.categoryPill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <Text style={styles.categoryPillText}>{item.category}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingBottom: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, marginTop: 4, letterSpacing: 0.5 },
    countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    countText: { fontWeight: '700', fontSize: 13 },
    chips: { paddingBottom: 16, gap: 8, paddingRight: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    chipText: { fontSize: 13, fontWeight: '700' },
    grid: { padding: PADDING, paddingTop: 10 },
    columns: { flexDirection: 'row', gap: COL_GAP },
    column: { flex: 1, gap: COL_GAP },
    card: { width: '100%', borderRadius: 24, overflow: 'hidden', position: 'relative' },
    cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
    cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.05)' },
    cardName: { color: 'white', fontSize: 12, fontWeight: '700', flex: 1, marginRight: 6, letterSpacing: 0.2 },
    categoryPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' },
    categoryPillText: { color: 'white', fontSize: 10, fontWeight: '800' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
    emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 22, opacity: 0.6, letterSpacing: 0.5 },
    emptyBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 12 },
    emptyBtnText: { fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
    modal: { margin: 20, padding: 24, borderRadius: 24, maxHeight: '88%' },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 16 },
    editImageWrapper: { width: 180, height: 180, borderRadius: 20, overflow: 'hidden', marginBottom: 20, position: 'relative' },
    editImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    editOverlay: { position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});
