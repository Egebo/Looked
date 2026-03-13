import React from 'react';
import { StyleSheet, View, Image, Modal, ScrollView } from 'react-native';
import { Text, Button, Surface, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { WardrobeItem } from '@/services/storage';

interface OutfitResultProps {
    visible: boolean;
    onClose: () => void;
    loading: boolean;
    outfit: {
        top?: WardrobeItem;
        bottom?: WardrobeItem;
        shoes?: WardrobeItem;
    };
    aiSuggestion?: string;
    onRegenerate: () => void;
}

export const OutfitResult = ({ visible, onClose, loading, outfit, aiSuggestion, onRegenerate }: OutfitResultProps) => {
    const theme = useTheme();

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <IconButton icon="close" onPress={onClose} />
                    <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Todays Look</Text>
                    <IconButton icon="refresh" onPress={onRegenerate} disabled={loading} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                        <Text style={{ marginTop: 20 }}>Styling your wardrobe...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.outfitGrid}>
                            {outfit.top && (
                                <Surface style={styles.itemCard} elevation={2}>
                                    <Image source={{ uri: outfit.top.imageUri }} style={styles.image} />
                                    <Text style={styles.label}>Top</Text>
                                </Surface>
                            )}
                            {outfit.bottom && (
                                <Surface style={styles.itemCard} elevation={2}>
                                    <Image source={{ uri: outfit.bottom.imageUri }} style={styles.image} />
                                    <Text style={styles.label}>Bottom</Text>
                                </Surface>
                            )}
                            {outfit.shoes && (
                                <Surface style={styles.itemCard} elevation={2}>
                                    <Image source={{ uri: outfit.shoes.imageUri }} style={styles.image} />
                                    <Text style={styles.label}>Shoes</Text>
                                </Surface>
                            )}
                        </View>

                        {aiSuggestion && (
                            <Surface style={[styles.suggestionBox, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>AI Stylist</Text>
                                </View>
                                <Text style={{ lineHeight: 22, color: theme.colors.onSurfaceVariant }}>{aiSuggestion}</Text>
                            </Surface>
                        )}

                        <Button mode="contained" onPress={onClose} style={styles.button}>
                            Wear This!
                        </Button>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    outfitGrid: {
        marginBottom: 30,
        gap: 15,
    },
    itemCard: {
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
        paddingBottom: 10,
    },
    image: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    label: {
        marginTop: 8,
        fontWeight: 'bold',
        opacity: 0.6,
    },
    suggestionBox: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
        borderRadius: 30,
        height: 50,
        justifyContent: 'center',
    }
});
