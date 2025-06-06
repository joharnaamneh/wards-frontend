import { useEffect} from 'react';
import {getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';

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
            <Text>Hello World!</Text>
        </View>
    );
}

