import { auth } from '@/services/firebase';
import { Link, router, Stack } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

export default function RegisterScreen() {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            Alert.alert('Başarılı', 'Hesabınız başarıyla oluşturuldu!');
            router.replace('/(tabs)');
        } catch (error: any) {
            let message = error.message;
            if (error.code === 'auth/email-already-in-use') {
                message = 'Bu e-posta adresi zaten kullanımda.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Şifre çok zayıf. En az 6 karakter olmalı.';
            }
            Alert.alert('Kayıt Başarısız', message);
        }
        setLoading(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen options={{ title: 'Hesap Oluştur', headerTransparent: true }} />

            <View style={styles.form}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                    Bize Katıl
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 30, textAlign: 'center', color: theme.colors.outline }}>
                    Dijital gardırobunuzu bugün oluşturun.
                </Text>

                <TextInput
                    label="E-posta"
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    mode="outlined"
                />
                <TextInput
                    label="Şifre"
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                    mode="outlined"
                />

                <Button
                    mode="contained"
                    onPress={signUpWithEmail}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={{ height: 50 }}
                >
                    Kayıt Ol
                </Button>

                <View style={styles.footer}>
                    <Text variant="bodyMedium">Zaten bir hesabın var mı? </Text>
                    <Link href="/auth/login" asChild>
                        <Button mode="text" compact>Giriş Yap</Button>
                    </Link>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    form: {
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
        marginBottom: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
