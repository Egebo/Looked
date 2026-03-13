import { deleteHistory, getHistory, getWardrobe, HistoryItem, WardrobeItem } from '@/services/storage';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Menu, Modal, Portal, Surface, Text, useTheme } from 'react-native-paper';

export default function CombinationsHistoryScreen() {
    const theme = useTheme();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    const loadData = async () => {
        const [hData, wData] = await Promise.all([
            getHistory('combination'),
            getWardrobe()
        ]);
        setHistory(hData);
        setWardrobe(wData);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getItemImage = (id: string) => {
        const item = wardrobe.find(w => w.id === id);
        return item ? item.imageUri : null;
    };

    const handleDelete = async (id: string) => {
        try {
            console.log("Deleting item:", id);
            // 1. Close modal immediately for better UX
            setSelectedItem(null);

            // 2. Optimistic update: Remove from local state immediately
            setHistory(prev => prev.filter(item => item.id !== id));

            // 3. Perform actual delete
            await deleteHistory(id);

            // 4. Reload data to ensure sync (optional but good for safety)
            await loadData();
        } catch (e) {
            console.error("Delete failed:", e);
            // Revert or show error if needed, but for now just logging
            alert("Silme işlemi başarısız oldu.");
        }
    };

    const handleBulkDelete = async (range: 'week' | 'month' | 'all') => {
        try {
            setMenuVisible(false);
            const now = Date.now();
            let itemsToDelete = history;
            if (range === 'week') {
                const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
                itemsToDelete = history.filter(item => {
                    const t = item.created_at?.toMillis ? item.created_at.toMillis() : 0;
                    return t >= oneWeekAgo && t <= now;
                });
            } else if (range === 'month') {
                const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
                itemsToDelete = history.filter(item => {
                    const t = item.created_at?.toMillis ? item.created_at.toMillis() : 0;
                    return t >= oneMonthAgo && t <= now;
                });
            }

            if (itemsToDelete.length === 0) {
                alert("Bu aralıkta silinecek öğe bulunamadı.");
                return;
            }

            // Optimistic update
            const idsToDelete = new Set(itemsToDelete.map(i => i.id));
            setHistory(prev => prev.filter(item => !idsToDelete.has(item.id)));

            // Delete from backend in parallel
            await Promise.all(itemsToDelete.map(item => deleteHistory(item.id)));
            await loadData();
        } catch (e) {
            console.error("Bulk delete failed:", e);
            alert("Toplu silme sırasında bir hata oluştu.");
            await loadData();
        }
    };

    const renderDetailModal = () => (
        <Portal>
            <Modal visible={!!selectedItem} onDismiss={() => setSelectedItem(null)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                {selectedItem && (
                    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}>
                        <Text variant="titleLarge" style={{ marginBottom: 4, fontWeight: '900', color: theme.colors.onSurface }}>
                            {selectedItem.data.context || 'Kombin'}
                        </Text>
                        <Text style={{ marginBottom: 24, color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                            {new Date(selectedItem.created_at?.toMillis ? selectedItem.created_at.toMillis() : Date.now()).toLocaleDateString('tr-TR')}
                        </Text>

                        <View style={styles.imageGrid}>
                            {selectedItem.data.selectedIds?.map((id: string) => {
                                const uri = getItemImage(id);
                                return uri ? (
                                    <Image key={id} source={{ uri }} style={[styles.gridImage, { backgroundColor: theme.colors.surfaceVariant }]} />
                                ) : null;
                            })}
                        </View>

                        <Surface style={[styles.reasoningCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                            <Text style={{ fontStyle: 'italic', lineHeight: 22, color: theme.colors.onSurfaceVariant }}>"{selectedItem.data.reasoning}"</Text>
                        </Surface>

                        <View style={{ flexDirection: 'row', marginTop: 24, gap: 12, width: '100%' }}>
                            <Button
                                mode="contained"
                                onPress={() => setSelectedItem(null)}
                                style={{ flex: 1, borderRadius: 16 }}
                            >
                                Kapat
                            </Button>
                            <Button
                                mode="outlined"
                                icon="delete"
                                onPress={() => handleDelete(selectedItem.id)}
                                textColor={theme.colors.error}
                                style={{ borderColor: theme.colors.error, flex: 1, borderRadius: 16 }}
                            >
                                Sil
                            </Button>
                        </View>
                    </ScrollView>
                )}
            </Modal>
        </Portal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen options={{
                title: 'Kaydedilen Kombinler',
                headerStyle: { backgroundColor: theme.colors.background },
                headerTintColor: theme.colors.onBackground,
                headerRight: () => (
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={<IconButton icon="dots-vertical" iconColor={theme.colors.onBackground} size={24} onPress={() => setMenuVisible(true)} />}
                        contentStyle={{ backgroundColor: theme.colors.surface }}
                    >
                        <Menu.Item titleStyle={{ color: theme.colors.onSurface }} onPress={() => handleBulkDelete('week')} title="Son 1 Haftayı Sil" />
                        <Menu.Item titleStyle={{ color: theme.colors.onSurface }} onPress={() => handleBulkDelete('month')} title="Son 1 Ayı Sil" />
                        <Divider style={{ marginVertical: 4 }} />
                        <Menu.Item titleStyle={{ color: theme.colors.error }} onPress={() => handleBulkDelete('all')} title="Tümünü Sil" />
                    </Menu>
                )
            }} />

            <ScrollView
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {history.length === 0 && !refreshing ? (
                    <Text style={{ textAlign: 'center', marginTop: 50, opacity: 0.5, color: theme.colors.onBackground }}>Henüz kaydedilen kombin yok.</Text>
                ) : (
                    history.map((item) => (
                        <Card key={item.id} style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 }]} onPress={() => setSelectedItem(item)}>
                            <Card.Content>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                                    <Text variant="titleMedium" style={{ fontWeight: '900', color: theme.colors.onSurface }}>{item.data.context || 'Kombin'}</Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                                        {new Date(item.created_at?.toMillis ? item.created_at.toMillis() : Date.now()).toLocaleDateString('tr-TR')}
                                    </Text>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {item.data.selectedIds?.map((id: string) => {
                                        const uri = getItemImage(id);
                                        return uri ? (
                                            <Image key={id} source={{ uri }} style={styles.thumb} />
                                        ) : null;
                                    })}
                                </ScrollView>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>

            {renderDetailModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 20 },
    card: { marginBottom: 16, borderRadius: 24 },
    modal: { padding: 28, margin: 24, borderRadius: 28, maxHeight: '85%' },
    gridImage: { width: 100, height: 100, borderRadius: 16, margin: 6 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24, gap: 4 },
    reasoningCard: { padding: 20, borderRadius: 20, width: '100%' },
    thumb: { width: 56, height: 56, borderRadius: 28, marginRight: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }
});
