import { auth } from '@/services/firebase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    User
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

type AuthContextType = {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    signInWithGoogle: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Configure Google Sign-In
        GoogleSignin.configure({
            scopes: ['https://www.googleapis.com/auth/userinfo.email'],
            webClientId: '315872166719-dpuk977772skcjd9ov67dsvnl4938lp6.apps.googleusercontent.com',
        });

        // Listen for changes on auth state
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
                // Create a Google credential with the token
                const credential = GoogleAuthProvider.credential(userInfo.data.idToken);

                // Sign in with the credential from the Google user
                await signInWithCredential(auth, credential);
            } else {
                throw new Error('No ID token present!');
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Hata', 'Google Play Hizmetleri kullanılamıyor.');
            } else {
                // some other error happened
                console.error(error);
                Alert.alert('Google Giriş Hatası', error.message || 'Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    };

    const value = {
        user,
        loading,
        isAdmin: false,
        signInWithGoogle,
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
