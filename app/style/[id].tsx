import { STYLES_DB } from '@/constants/StylesData';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

export default function StyleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();

    // Find the style from our local db
    const styleData = STYLES_DB.find(s => s.id === id);

    if (!styleData) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen options={{ title: 'Tarz Bulunamadı' }} />
                <Text>Bu tarz bulunamadı.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen options={{ title: styleData.name, headerTransparent: true, headerTintColor: 'white' }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Header Area */}
                <ImageBackground source={{ uri: styleData.coverImage }} style={styles.heroImage}>
                    <View style={styles.darkOverlay} />
                    <View style={styles.heroTextContainer}>
                        {styleData.isTrending && (
                            <View style={styles.trendingBadge}>
                                <Text style={styles.trendingBadgeText}>🔥 TRENDING</Text>
                            </View>
                        )}
                        <Text variant="displaySmall" style={styles.heroTitle}>{styleData.name}</Text>
                    </View>
                </ImageBackground>

                {/* Body Content */}
                <View style={[styles.bodyContainer, { backgroundColor: theme.colors.background }]}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 10 }}>Bu Tarz Nedir?</Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 24, marginBottom: 30 }}>
                        {styleData.description}
                    </Text>

                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 15 }}>Kombinler</Text>

                    {/* Examples Grid/List */}
                    <View style={styles.examplesContainer}>
                        {styleData.exampleItems.map((item, index) => (
                            <Card key={index} style={[styles.exampleCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                <Image source={{ uri: item.imageUrl }} style={styles.exampleImage} />
                                <Card.Content style={{ padding: 10 }}>
                                    <Text variant="labelLarge" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                        {item.name}
                                    </Text>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroImage: {
        width: '100%',
        height: 350,
        justifyContent: 'flex-end',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    heroTextContainer: {
        padding: 20,
        paddingBottom: 30,
        zIndex: 2,
    },
    heroTitle: {
        color: 'white',
        fontWeight: 'bold',
    },
    trendingBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    trendingBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    bodyContainer: {
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20, // Slide up over the hero image slightly
    },
    examplesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    exampleCard: {
        width: '47%', // 2 per row
        borderRadius: 16,
        overflow: 'hidden',
    },
    exampleImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    }
});
