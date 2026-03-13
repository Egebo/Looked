import { STYLES_DB } from '@/constants/StylesData';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

export default function StylesScreen() {
    const { t } = useTranslation();
    const theme = useTheme();

    const trendingStyles = STYLES_DB.filter(s => s.isTrending);
    const allStyles = STYLES_DB;

    const navigateToStyle = (id: string) => {
        router.push(`/style/${id}`);
    };

    const renderTrendingItem = ({ item }: { item: typeof STYLES_DB[0] }) => (
        <TouchableOpacity onPress={() => navigateToStyle(item.id)} activeOpacity={0.8}>
            <Surface style={styles.trendingCard} elevation={2}>
                <ImageBackground source={{ uri: item.coverImage }} style={styles.cardImage} imageStyle={styles.cardImageStyle}>
                    <View style={styles.darkOverlay} />
                    <View style={styles.cardContent}>
                        <View style={styles.trendingBadge}>
                            <Text style={styles.trendingBadgeText}>🔥 {t('styles.trending_badge')}</Text>
                        </View>
                        <Text variant="titleMedium" style={styles.cardTitle}>{item.name}</Text>
                    </View>
                </ImageBackground>
            </Surface>
        </TouchableOpacity>
    );

    const renderAllStylesItem = ({ item }: { item: typeof STYLES_DB[0] }) => (
        <TouchableOpacity onPress={() => navigateToStyle(item.id)} activeOpacity={0.8}>
            <Surface style={[styles.allStylesCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                <ImageBackground source={{ uri: item.coverImage }} style={styles.allCardImage} imageStyle={styles.allCardImageStyle}>
                </ImageBackground>
                <View style={styles.allCardContent}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.name}</Text>
                    <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        {item.description}
                    </Text>
                </View>
            </Surface>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>{t('styles.title')}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t('styles.subtitle')}</Text>
            </View>

            <FlatList
                data={allStyles}
                keyExtractor={(item) => item.id}
                renderItem={renderAllStylesItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.trendingSection}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>{t('styles.trending')}</Text>
                        <FlatList
                            data={trendingStyles}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => 'trend-' + item.id}
                            renderItem={renderTrendingItem}
                            contentContainerStyle={styles.trendingListContent}
                        />
                        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 30 }]}>{t('styles.all')}</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    listContent: {
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    trendingSection: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 15,
    },
    trendingListContent: {
        paddingRight: 20,
        gap: 15,
    },
    trendingCard: {
        width: 250,
        height: 160,
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    cardImageStyle: {
        borderRadius: 20,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
    },
    cardContent: {
        padding: 15,
        zIndex: 2,
    },
    cardTitle: {
        color: 'white',
        fontWeight: 'bold',
    },
    trendingBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    trendingBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    allStylesCard: {
        flexDirection: 'row',
        height: 100,
        borderRadius: 16,
        marginBottom: 15,
        overflow: 'hidden',
    },
    allCardImage: {
        width: 100,
        height: 100,
    },
    allCardImageStyle: {
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    allCardContent: {
        flex: 1,
        padding: 15,
        justifyContent: 'center',
    },
});
