import { useEffect} from 'react';
import {getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import {ThemedText} from "@/components/ThemedText";
import {HelloWave} from "@/components/HelloWave";

export default function IndexRedirect() {
    const auth = getAuth();
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, user => {
            if (user) {
                router.replace('/(tabs)');
            } else {
                router.replace('/login');
            }
        });

        return () => unsub();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText>Coming Soon</ThemedText>
            <HelloWave />
        </View>
    );
}

