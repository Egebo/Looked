import { deleteHistory, getHistory, HistoryItem } from '@/services/storage';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { Button, Card, Divider, IconButton, Menu, Modal, Portal, Surface, Text, useTheme } from 'react-native-paper';

export default function AnalysisHistoryScreen() {
    const theme = useTheme();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    const loadData = async () => {
        const data = await getHistory('analysis');
        setHistory(data);
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

    const getScoreColor = (score?: number) => {
        if (!score) return theme.colors.outline;
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FF9800';
        return '#F44336';
    };

    const handleDelete = async (id: string) => {
        try {
            console.log("Deleting item:", id);
            setSelectedItem(null);
            setHistory(prev => prev.filter(item => item.id !== id));
            await deleteHistory(id);
            await loadData();
        } catch (e) {
            console.error("Delete failed:", e);
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
            <Modal
                visible={!!selectedItem}
                onDismiss={() => setSelectedItem(null)}
                contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
            >
                {selectedItem && (
                    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
                        {/* Header Image if available (optional, but good for UI) */}
                        {selectedItem.data.imageUri && (
                            <Image
                                source={{ uri: selectedItem.data.imageUri }}
                                style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 20 }}
                                resizeMode="cover"
                            />
                        )}

                        <Text variant="headlineSmall" style={{ marginBottom: 16, fontWeight: '900', color: theme.colors.onSurface }}>
                            Stil Puanı
                        </Text>

                        <View style={{ marginBottom: 24 }}>
                            <CircularProgress
                                value={selectedItem.score || 0}
                                radius={60}
                                duration={1500}
                                progressValueColor={theme.colors.onSurface}
                                maxValue={100}
                                title={'100'}
                                titleColor={theme.colors.onSurfaceVariant}
                                titleStyle={{ fontSize: 12, opacity: 0.6 }}
                                activeStrokeColor={getScoreColor(selectedItem.score)}
                                inActiveStrokeColor={theme.colors.surfaceVariant}
                                inActiveStrokeOpacity={0.8}
                                activeStrokeWidth={8}
                                inActiveStrokeWidth={8}
                            />
                        </View>

                        <View style={styles.detailContainer}>
                            <Text variant="titleMedium" style={{ marginBottom: 15, fontWeight: '700', color: theme.colors.onSurfaceVariant }}>Stilistin Notları:</Text>
                            {(selectedItem.data.analysis?.suggestions || selectedItem.data.suggestions)?.map((s: string, i: number) => (
                                <Surface key={i} style={[styles.suggestionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                    <Text style={{ color: theme.colors.onSurface, lineHeight: 20 }}>{s}</Text>
                                </Surface>
                            ))}
                            {/* Support for new structured feedback */}
                            {(selectedItem.data.analysis?.feedback || selectedItem.data.feedback)?.compliment && (
                                <Surface style={[styles.suggestionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                    <Text style={{ color: theme.colors.primary, fontWeight: '900', marginBottom: 5 }}>✨ İlk İzlenim</Text>
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{(selectedItem.data.analysis?.feedback || selectedItem.data.feedback).compliment}</Text>
                                </Surface>
                            )}
                            {(selectedItem.data.analysis?.feedback || selectedItem.data.feedback)?.critique?.map((s: string, i: number) => (
                                <Surface key={`crit-${i}`} style={[styles.suggestionCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
                                    <Text style={{ color: theme.colors.onSurface, fontWeight: '900', marginBottom: 5 }}>💡 Öneri {i + 1}</Text>
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{s}</Text>
                                </Surface>
                            ))}
                            {(selectedItem.data.analysis?.feedback || selectedItem.data.feedback)?.conclusion && (
                                <Surface style={[styles.suggestionCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                                    <Text style={{ color: theme.colors.primary, fontWeight: '900', marginBottom: 5 }}>🎯 Sonuç</Text>
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{(selectedItem.data.analysis?.feedback || selectedItem.data.feedback).conclusion}</Text>
                                </Surface>
                            )}
                        </View>

                        <View style={{ flexDirection: 'row', marginTop: 20, gap: 10, width: '100%' }}>
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
                title: 'Analiz Geçmişi',
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {history.length === 0 && !refreshing ? (
                    <View style={{ alignItems: 'center', marginTop: 100 }}>
                        <Text variant="bodyLarge" style={{ opacity: 0.5, color: theme.colors.onSurface }}>Henüz geçmiş analiz yok.</Text>
                    </View>
                ) : (
                    history.map((item) => (
                        <Card key={item.id} style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 }]} onPress={() => setSelectedItem(item)}>
                            <Card.Title
                                title={new Date(item.created_at?.toMillis ? item.created_at.toMillis() : Date.now()).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                titleStyle={{ color: theme.colors.onSurface, fontWeight: '800' }}
                                subtitle={`Skor: ${item.score}`}
                                subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                                left={(props) => <View style={{ width: 10, height: 50, backgroundColor: getScoreColor(item.score), borderRadius: 5, marginRight: 10 }} />}
                                right={(props) => <Text variant="titleLarge" style={{ marginRight: 20, color: getScoreColor(item.score), fontWeight: 'bold' }}>{item.score}</Text>}
                            />
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
    detailContainer: { width: '100%', marginTop: 8 },
    suggestionCard: { padding: 18, marginBottom: 12, borderRadius: 20 }
});
