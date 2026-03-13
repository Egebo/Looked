import { useAuth } from '@/context/AuthContext';
import { auth } from '@/services/firebase';
import { Link, router, Stack } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

export default function LoginScreen() {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signInWithGoogle } = useAuth();

    async function signInWithEmail() {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.replace('/(tabs)');
        } catch (error: any) {
            let message = error.message;
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'E-posta veya şifre hatalı.';
            }
            Alert.alert('Giriş Başarısız', message);
        }
        setLoading(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen options={{ title: 'Login', headerShown: false }} />

            <View style={styles.form}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>
                    Hoşgeldiniz!
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
                    onPress={signInWithEmail}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={{ height: 50 }}
                >
                    Giriş Yap
                </Button>

                <Button
                    mode="outlined"
                    onPress={signInWithGoogle}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={{ height: 50 }}
                    icon="google"
                >
                    Google ile Giriş Yap
                </Button>

                <View style={styles.footer}>
                    <Text variant="bodyMedium">Hesabın yok mu? </Text>
                    <Link href="/auth/register" asChild>
                        <Button mode="text" compact>Kayıt Ol</Button>
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
