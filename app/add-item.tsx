import { removeBackground } from '@/services/ai';
import { addToWardrobe, Category } from '@/services/storage';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { Button, Chip, Portal, Snackbar, Text, useTheme } from 'react-native-paper';

export default function AddItemScreen() {
    const { t } = useTranslation();
    const theme = useTheme();
    const router = useRouter();

    const [image, setImage] = useState<string | null>(null);
    const [imageRatio, setImageRatio] = useState<number>(1);
    const [category, setCategory] = useState<Category | ''>('');
    const [loading, setLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [magicCleaning, setMagicCleaning] = useState(false);

    const pickImage = async (mode: 'camera' | 'gallery' = 'gallery') => {
        try {
            const options = {
                cropping: true,
                freeStyleCropEnabled: true,
                mediaType: 'photo' as const,
                cropperToolbarTitle: t('wardrobe.edit_item'),
                cropperActiveWidgetColor: '#00ff00',
                cropperStatusBarColor: theme.colors.background,
                cropperToolbarColor: theme.colors.surface,
                cropperToolbarWidgetColor: theme.colors.onSurface,
                cropperTintColor: '#00ff00',
                hideBottomControls: true,
            };

            const result = mode === 'camera'
                ? await ImageCropPicker.openCamera(options)
                : await ImageCropPicker.openPicker(options);

            const selectedPath = result.path;
            setImage(selectedPath);
            Image.getSize(selectedPath, (w, h) => {
                setImageRatio(Math.max(0.6, Math.min(1.8, w / h)));
            }, () => setImageRatio(1));
        } catch (error: any) {
            if (error?.message !== 'User cancelled image selection') {
                Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
            }
        }
    };

    const handleMagicClean = async () => {
        if (!image) return;
        setMagicCleaning(true);
        try {
            const cleanImage = await removeBackground(image);
            setImage(cleanImage);
            Image.getSize(cleanImage, (w, h) => {
                setImageRatio(Math.max(0.5, Math.min(2.0, w / h)));
            }, () => setImageRatio(1));
        } catch (error) {
            Alert.alert(t('scan.error_analysis'), '');
        } finally {
            setMagicCleaning(false);
        }
    };

    const handleSave = async () => {
        if (!image || !category) {
            Alert.alert(t('scan.error_save'), '');
            return;
        }

        setLoading(true);
        try {
            await addToWardrobe({
                imageUri: image,
                category: category as Category,
                name: '',
            });
            setSnackbarVisible(true);
            setTimeout(() => {
                router.replace('/(tabs)/wardrobe');
            }, 1000);
        } catch (e) {
            Alert.alert(t('scan.error_save'), '');
        } finally {
            setLoading(false);
        }
    };

    const categories: Category[] = ['Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Accessories'];

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{ title: t('wardrobe.add_item_title') }} />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <TouchableOpacity
                        style={[styles.imagePlaceholder, { backgroundColor: '#1a1a1a', aspectRatio: imageRatio }]}
                        onPress={() => pickImage()}
                    >
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text variant="bodyLarge" style={{ color: '#888' }}>
                                    {t('wardrobe.empty_image')}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.pickButtonRow}>
                        <Button
                            mode="outlined"
                            onPress={() => pickImage('camera')}
                            style={styles.pickButton}
                            icon="camera"
                            textColor="white"
                        >
                            {t('camera.take_photo').split(' ')[0]}
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => pickImage('gallery')}
                            style={styles.pickButton}
                            icon="image"
                            textColor="white"
                        >
                            {t('camera.pick_image').split(' ')[0]}
                        </Button>
                    </View>

                    {image && (
                        <Button
                            mode="outlined"
                            onPress={handleMagicClean}
                            loading={magicCleaning}
                            disabled={magicCleaning}
                            style={styles.magicCleanButton}
                            icon="auto-fix"
                            textColor="white"
                        >
                            {t('wardrobe.magic_clean')}
                        </Button>
                    )}

                    <Button
                        mode="contained"
                        onPress={() => router.push('/scan-outfit')}
                        style={styles.scanButton}
                        icon="crop-free"
                        buttonColor="#333"
                        textColor="white"
                    >
                        {t('scan.title')}
                    </Button>

                    <Text variant="titleMedium" style={styles.sectionTitle}>{t('wardrobe.category')}</Text>
                    <View style={styles.chipContainer}>
                        {categories.map((cat) => (
                            <Chip
                                key={cat}
                                selected={category === cat}
                                onPress={() => setCategory(cat)}
                                style={[styles.chip, { backgroundColor: category === cat ? theme.colors.primary : '#222' }]}
                                textStyle={{ color: category === cat ? 'black' : 'white' }}
                            >
                                {t(`wardrobe.categories.${cat}`)}
                            </Chip>
                        ))}
                    </View>
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    disabled={!image || !category || loading}
                    style={styles.saveButton}
                    buttonColor="white"
                    textColor="black"
                >
                    {t('wardrobe.save')}
                </Button>
            </View>

            <Portal>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={1500}
                >
                    {t('scan.success')}
                </Snackbar>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    imagePlaceholder: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pickButtonRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    pickButton: { flex: 1, borderRadius: 12, borderColor: '#444' },
    magicCleanButton: { borderRadius: 12, marginBottom: 20, borderColor: '#fff' },
    scanButton: { borderRadius: 12, marginBottom: 30, backgroundColor: '#222' },
    sectionTitle: { marginBottom: 15, fontWeight: 'bold' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderRadius: 12, borderColor: '#333', borderWidth: 1 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, backgroundColor: 'transparent' },
    saveButton: { borderRadius: 12, height: 56, justifyContent: 'center' },
});
