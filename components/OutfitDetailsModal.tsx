// components/OutfitDetailsModal.tsx
import { Modal, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Outfit } from '../types/OutfitTypes';
import { WardrobeItem } from '../types/WardrobeTypes';

interface OutfitDetailsModalProps {
    outfit: Outfit | null;
    wardrobeItems: WardrobeItem[];
    onClose: () => void;
    onDelete: (outfitId: string) => void;
    onToggleFavorite: (outfitId: string, currentFavorite: boolean) => void;
    colorScheme: 'light' | 'dark' | null;
}

export const OutfitDetailsModal = ({
                                       outfit,
                                       wardrobeItems,
                                       onClose,
                                       onDelete,
                                       onToggleFavorite,
                                       colorScheme
                                   }: OutfitDetailsModalProps) => {
    if (!outfit) return null;

    const outfitItems = wardrobeItems.filter(item => outfit.items.includes(item.id));

    return (
        <Modal visible={!!outfit} transparent animationType="slide">
            <ThemedView style={styles.modalOverlay}>
                <ThemedView style={[
                    styles.modal,
                    { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }
                ]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {outfit.image ? (
                            <Image
                                source={{ uri: outfit.image }}
                                style={styles.modalImage}
                                onError={() => console.log('Error loading modal image:', outfit.image)}
                            />
                        ) : (
                            <ThemedView style={[styles.modalImage, styles.placeholderImage]}>
                                <IconSymbol
                                    name="house.fill"
                                    size={48}
                                    color={colorScheme === 'dark' ? '#666' : '#ccc'}
                                />
                            </ThemedView>
                        )}

                        <ThemedView style={styles.titleContainer}>
                            <ThemedText type="title" style={styles.modalTitle}>{outfit.name}</ThemedText>
                            <Pressable
                                onPress={() => onToggleFavorite(outfit.id, outfit.favorite || false)}
                                style={styles.favoriteButton}
                            >
                                <IconSymbol
                                    name={outfit.favorite ? "heart.fill" : "heart"}
                                    size={24}
                                    color={outfit.favorite ? "#FF3B30" : (colorScheme === 'dark' ? '#666' : '#ccc')}
                                />
                            </Pressable>
                        </ThemedView>

                        <ThemedView style={styles.detailsGrid}>
                            {outfit.occasion && (
                                <ThemedView style={styles.detailItem}>
                                    <ThemedText type="defaultSemiBold">Occasion</ThemedText>
                                    <ThemedText>{outfit.occasion}</ThemedText>
                                </ThemedView>
                            )}
                            {outfit.season && (
                                <ThemedView style={styles.detailItem}>
                                    <ThemedText type="defaultSemiBold">Season</ThemedText>
                                    <ThemedText>{outfit.season}</ThemedText>
                                </ThemedView>
                            )}
                            {outfit.description && (
                                <ThemedView style={styles.detailItem}>
                                    <ThemedText type="defaultSemiBold">Description</ThemedText>
                                    <ThemedText>{outfit.description}</ThemedText>
                                </ThemedView>
                            )}
                        </ThemedView>

                        <ThemedView style={styles.itemsSection}>
                            <ThemedText type="defaultSemiBold" style={styles.itemsTitle}>
                                Items in this outfit ({outfitItems.length})
                            </ThemedText>
                            {outfitItems.map(item => (
                                <ThemedView key={item.id} style={styles.outfitItem}>
                                    {item.image ? (
                                        <Image
                                            source={{ uri: item.image }}
                                            style={styles.itemImage}
                                        />
                                    ) : (
                                        <ThemedView style={[styles.itemImage, styles.placeholderImage]}>
                                            <IconSymbol
                                                name="house.fill"
                                                size={16}
                                                color={colorScheme === 'dark' ? '#666' : '#ccc'}
                                            />
                                        </ThemedView>
                                    )}
                                    <ThemedView style={styles.itemInfo}>
                                        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                                        <ThemedText style={styles.itemType}>{item.type}</ThemedText>
                                        {item.color && (
                                            <ThemedText style={styles.itemColor}>{item.color}</ThemedText>
                                        )}
                                    </ThemedView>
                                </ThemedView>
                            ))}
                        </ThemedView>
                    </ScrollView>

                    <ThemedView style={styles.modalButtons}>
                        <Pressable
                            onPress={() => onDelete(outfit.id)}
                            style={[styles.modalButton, styles.deleteButton]}
                        >
                            <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={onClose}
                            style={[styles.modalButton, styles.closeButton]}
                        >
                            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                        </Pressable>
                    </ThemedView>
                </ThemedView>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        borderRadius: 20,
        elevation: 10,
        width: '100%',
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 0,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        flex: 1,
    },
    favoriteButton: {
        padding: 8,
    },
    modalImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
    },
    placeholderImage: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsGrid: {
        gap: 12,
        marginBottom: 20,
    },
    detailItem: {
        gap: 4,
    },
    itemsSection: {
        gap: 12,
        marginBottom: 20,
    },
    itemsTitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    outfitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    itemImage: {
        width: 40,
        height: 40,
        borderRadius: 6,
    },
    itemInfo: {
        flex: 1,
        gap: 2,
    },
    itemType: {
        fontSize: 12,
        opacity: 0.7,
    },
    itemColor: {
        fontSize: 11,
        opacity: 0.5,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    closeButton: {
        backgroundColor: '#f0f0f0',
    },
    closeButtonText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 16,
    },
});