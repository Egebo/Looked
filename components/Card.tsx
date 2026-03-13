import React from 'react';
import { Card as PaperCard, Text, useTheme } from 'react-native-paper';
import { StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';

interface CustomCardProps {
    title?: string;
    subtitle?: string;
    content?: React.ReactNode;
    coverUrl?: string; // We'll assume web URL just for simplicity, but could be source
    actions?: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    mode?: 'elevated' | 'outlined' | 'contained';
}

export const Card = ({ title, subtitle, content, coverUrl, actions, style, onPress, mode = 'elevated' }: CustomCardProps) => {
    const theme = useTheme();

    return (
        <PaperCard style={[styles.card, { backgroundColor: theme.colors.surface }, style]} onPress={onPress} mode={mode}>
            {coverUrl && <PaperCard.Cover source={{ uri: coverUrl }} style={styles.cover} />}
            {(title || subtitle) && (
                <PaperCard.Title
                    title={title}
                    subtitle={subtitle}
                    titleStyle={{ fontWeight: 'bold', fontSize: 18 }}
                    subtitleStyle={{ opacity: 0.7 }}
                />
            )}
            {content && <PaperCard.Content>{content}</PaperCard.Content>}
            {actions && <PaperCard.Actions>{actions}</PaperCard.Actions>}
        </PaperCard>
    );
};

const styles = StyleSheet.create({
    card: {
        marginVertical: 10,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cover: {
        height: 180,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    }
});
