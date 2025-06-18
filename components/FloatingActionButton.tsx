import { Pressable, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface FloatingActionButtonProps {
    onPress: () => void;
}

export const FloatingActionButton = ({ onPress }: FloatingActionButtonProps) => {
    return (
        <Pressable onPress={onPress} style={styles.fab}>
            <IconSymbol name="plus" color="#fff" size={24} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 100, // Raised higher to avoid tab navigation collision
        right: 30,
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 1000, // Ensure it's above other elements
    },
});