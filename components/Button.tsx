import React from 'react';
import { Button as PaperButton, ButtonProps } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

interface CustomButtonProps extends ButtonProps {
    style?: ViewStyle;
}

export const Button = ({ style, mode = 'contained', ...props }: CustomButtonProps) => {
    return (
        <PaperButton
            mode={mode}
            style={[styles.button, style]}
            contentStyle={styles.content}
            {...props}
        />
    );
};

const styles = StyleSheet.create({
    button: {
        marginVertical: 8,
        borderRadius: 8,
    },
    content: {
        height: 48,
    },
});
