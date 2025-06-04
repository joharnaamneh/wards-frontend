import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, TextInput, Button } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebaseConfig';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Login fehlgeschlagen', error.message);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Login</ThemedText>

            <TextInput
                placeholder="E-Mail"
                placeholderTextColor="#888"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                placeholder="Passwort"
                placeholderTextColor="#888"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Button title="Login" onPress={handleLogin} />
            <ThemedText
                type="link"
                style={styles.link}
                onPress={() => router.replace('/register')}
            >
                No account? Register here
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#999',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        color: 'inherit', // use current color scheme
        backgroundColor: 'transparent',
    },
    link: {
        marginTop: 10,
        textAlign: 'center',
    },
});