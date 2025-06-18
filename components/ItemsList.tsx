import { Pressable, StyleSheet, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { WardrobeItem } from '../types/WardrobeTypes';

interface ItemsListProps {
    groupedItems: Record<string, WardrobeItem[]>;
    totalItems: number;
    onItemPress: (item: WardrobeItem) => void;
    colorScheme: 'light' | 'dark' | null;
}

export const ItemsList = ({ groupedItems, totalItems, onItemPress, colorScheme }: ItemsListProps) => {
    const renderItem = (item: WardrobeItem) => (
        <Pressable key={item.id} style={styles.item} onPress={() => onItemPress(item)}>
            {item.image ? (
                <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    onError={() => console.log('Error loading image:', item.image)}
                />
            ) : (
                <ThemedView style={[styles.itemImage, styles.placeholderImage]}>
                    <IconSymbol name="house.fill" size={24} color={colorScheme === 'dark' ? '#666' : '#ccc'} />
                </ThemedView>
            )}
            <ThemedView style={styles.itemInfo}>
                <ThemedText type="defaultSemiBold" style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemDetails}>
                    {item.color && `${item.color} • `}{item.size && `${item.size} • `}{item.brand}
                </ThemedText>
                {item.material && (
                    <ThemedText style={styles.itemMaterial}>{item.material}</ThemedText>
                )}
            </ThemedView>
        </Pressable>
    );

    return (
        <>
            <ThemedText style={styles.collectionTitle}>
                Your Collection ({totalItems} items)
            </ThemedText>

            {Object.entries(groupedItems).map(([type, typeItems]) => (
                <ThemedView key={type} style={styles.categoryContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>
                        {type} ({typeItems.length})
                    </ThemedText>
                    {typeItems.map(renderItem)}
                </ThemedView>
            ))}
        </>
    );
};

const styles = StyleSheet.create({
    collectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    categoryContainer: {
        marginBottom: 24,
        gap: 8,
    },
    categoryTitle: {
        fontSize: 16,
        marginBottom: 8,
        opacity: 0.8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 8,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    placeholderImage: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        gap: 4,
    },
    itemName: {
        fontSize: 16,
    },
    itemDetails: {
        fontSize: 14,
        opacity: 0.7,
    },
    itemMaterial: {
        fontSize: 12,
        opacity: 0.5,
        fontStyle: 'italic',
    },
});