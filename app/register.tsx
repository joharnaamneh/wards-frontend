// app/register.tsx
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Button, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebaseConfig';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleRegister = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            Alert.alert('Registration successful!');
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Registration failed', error.message);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Register</ThemedText>

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
                placeholder="Password (min. 6 chars)"
                placeholderTextColor="#888"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Button title="Register" onPress={handleRegister} />
            <ThemedText
                type="link"
                style={styles.link}
                onPress={() => router.replace('/login')}
            >
                Already have an account? Login
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
        color: 'inherit',
        backgroundColor: 'transparent',
    },
    link: {
        marginTop: 10,
        textAlign: 'center',
    },
});