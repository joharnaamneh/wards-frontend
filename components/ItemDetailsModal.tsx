// components/ItemDetailsModal.tsx
import { Modal, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { WardrobeItem } from '../types/WardrobeTypes';

interface ItemDetailsModalProps {
    item: WardrobeItem | null;
    onClose: () => void;
    onDelete: (itemId: string) => void;
    colorScheme: 'light' | 'dark' | null;
}

export const ItemDetailsModal = ({ item, onClose, onDelete, colorScheme }: ItemDetailsModalProps) => {
    if (!item) return null;

    return (
        <Modal visible={!!item} transparent animationType="slide">
            <ThemedView style={styles.modalOverlay}>
                <ThemedView style={[
                    styles.modal,
                    { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }
                ]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {item.image ? (
                            <Image
                                source={{ uri: item.image }}
                                style={styles.modalImage}
                                onError={() => console.log('Error loading modal image:', item.image)}
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

                        <ThemedText type="title" style={styles.modalTitle}>{item.name}</ThemedText>

                        <ThemedView style={styles.detailsGrid}>
                            {item.type && (
                                <ThemedView style={styles.detailItem}>
                                    <ThemedText type="defaultSemiBold">Type</ThemedText>
                                    <ThemedText>{item.type}</ThemedText>
                                </ThemedView>
                            )}
                            {item.size && (
                                <ThemedView style={styles.detailItem}>
                                    <ThemedText type="defaultSemiBold">Size</ThemedText>
                                    <ThemedText>{item.size}</ThemedText>
                                </ThemedView>
                            )}
                            {item.brand && (
                                <ThemedView style={styles.detailItem}>
                                    <ThemedText type="defaultSemiBold">Brand</ThemedText>
                                    <ThemedText>{item.brand}</ThemedText>
                                </ThemedView>
                            )}
                            {item.color && (
                                <ThemedView style={styles.detailItem}>
                                    <ThemedText type="defaultSemiBold">Color</ThemedText>
                                    <ThemedText>{item.color}</ThemedText>
                                </ThemedView>
                            )}
                            {item.material && (
                                <ThemedView style={styles.detailItem}>
                                    <ThemedText type="defaultSemiBold">Material</ThemedText>
                                    <ThemedText>{item.material}</ThemedText>
                                </ThemedView>
                            )}
                        </ThemedView>
                    </ScrollView>

                    <ThemedView style={styles.modalButtons}>
                        <Pressable
                            onPress={() => onDelete(item.id)}
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
        maxHeight: '85%', // Reduced to ensure buttons are visible
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 0, // Remove bottom padding to make room for buttons
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 20,
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