// components/OutfitsList.tsx
import { Pressable, StyleSheet, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Outfit } from '../types/OutfitTypes';

interface OutfitsListProps {
    groupedOutfits: Record<string, Outfit[]>;
    totalOutfits: number;
    onOutfitPress: (outfit: Outfit) => void;
    onFavoritePress: (outfitId: string, currentFavorite: boolean) => void;
    colorScheme: 'light' | 'dark' | null;
}

export const OutfitsList = ({
                                groupedOutfits,
                                totalOutfits,
                                onOutfitPress,
                                onFavoritePress,
                                colorScheme
                            }: OutfitsListProps) => {
    const renderOutfit = (outfit: Outfit) => (
        <Pressable key={outfit.id} style={styles.outfit} onPress={() => onOutfitPress(outfit)}>
            {outfit.image ? (
                <Image
                    source={{ uri: outfit.image }}
                    style={styles.outfitImage}
                    onError={() => console.log('Error loading outfit image:', outfit.image)}
                />
            ) : (
                <ThemedView style={[styles.outfitImage, styles.placeholderImage]}>
                    <IconSymbol
                        name="house.fill"
                        size={24}
                        color={colorScheme === 'dark' ? '#666' : '#ccc'}
                    />
                </ThemedView>
            )}
            <ThemedView style={styles.outfitInfo}>
                <ThemedView style={styles.outfitHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.outfitName}>
                        {outfit.name}
                    </ThemedText>
                    <Pressable
                        onPress={() => onFavoritePress(outfit.id, outfit.favorite || false)}
                        style={styles.favoriteButton}
                    >
                        <IconSymbol
                            name={outfit.favorite ? "heart.fill" : "heart"}
                            size={20}
                            color={outfit.favorite ? "#FF3B30" : (colorScheme === 'dark' ? '#666' : '#ccc')}
                        />
                    </Pressable>
                </ThemedView>
                <ThemedText style={styles.outfitDetails}>
                    {outfit.season && `${outfit.season} • `}
                    {outfit.items.length} item{outfit.items.length !== 1 ? 's' : ''}
                </ThemedText>
                {outfit.description && (
                    <ThemedText style={styles.outfitDescription} numberOfLines={2}>
                        {outfit.description}
                    </ThemedText>
                )}
            </ThemedView>
        </Pressable>
    );

    return (
        <>
            <ThemedText style={styles.collectionTitle}>
                Your Outfits ({totalOutfits} outfit{totalOutfits !== 1 ? 's' : ''})
            </ThemedText>

            {Object.entries(groupedOutfits).map(([occasion, occasionOutfits]) => (
                <ThemedView key={occasion} style={styles.categoryContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>
                        {occasion} ({occasionOutfits.length})
                    </ThemedText>
                    {occasionOutfits.map(renderOutfit)}
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
    outfit: {
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
    outfitImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    placeholderImage: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outfitInfo: {
        flex: 1,
        gap: 4,
    },
    outfitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    outfitName: {
        fontSize: 16,
        flex: 1,
    },
    favoriteButton: {
        padding: 4,
    },
    outfitDetails: {
        fontSize: 14,
        opacity: 0.7,
    },
    outfitDescription: {
        fontSize: 13,
        opacity: 0.6,
        fontStyle: 'italic',
        lineHeight: 18,
    },
});