import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useColorScheme } from '@/hooks/useColorScheme';
import {WardrobeItem} from "@/types/WardrobeTypes";
import {useWardrobeData} from "@/hooks/useWardrobeData";
import {ItemsList} from "@/components/ItemsList";
import {FloatingActionButton} from "@/components/FloatingActionButton";
import {ItemDetailsModal} from "@/components/ItemDetailsModal";
import {AddItemModal} from "@/components/AddItemModal";

export default function WardrobeScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
    const [filterText, setFilterText] = useState('');
    const colorScheme = useColorScheme();

    const { items, loading, addItem, deleteItem, refreshItems } = useWardrobeData();

    const handleAddPiece = async (newPiece: Omit<WardrobeItem, 'id' | 'created_at'>) => {
        try {
            await addItem(newPiece);
            setModalVisible(false);
            Alert.alert('Success', 'Piece added to your wardrobe!');
        } catch (error) {
            console.error('Error adding piece:', error);
            Alert.alert('Error', 'Failed to add piece. Please try again.');
        }
    };

    const handleDelete = async (itemId: string) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item from your wardrobe?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteItem(itemId);
                            setSelectedItem(null);
                            Alert.alert('Success', 'Item deleted from wardrobe');
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            Alert.alert('Error', 'Failed to delete item. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const filteredItems = items.filter((item) =>
        item.name?.toLowerCase().includes(filterText.toLowerCase()) ||
        item.type?.toLowerCase().includes(filterText.toLowerCase()) ||
        item.color?.toLowerCase().includes(filterText.toLowerCase()) ||
        item.brand?.toLowerCase().includes(filterText.toLowerCase())
    );

    const groupedItems = filteredItems.reduce((acc, item) => {
        const type = item.type || 'Other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
    }, {} as Record<string, WardrobeItem[]>);

    return (
        <ThemedView style={styles.container}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
                headerImage={
                    <IconSymbol
                        size={310}
                        color="#808080"
                        name="house.fill"
                        style={styles.headerImage}
                    />
                }>

                <ThemedView style={styles.titleContainer}>
                    <ThemedText type="title">My Wardrobe</ThemedText>
                    <ThemedText>Organize and manage your clothing collection</ThemedText>
                </ThemedView>

                <ThemedView style={styles.searchContainer}>
                    <TextInput
                        style={[styles.searchInput, {
                            color: colorScheme === 'dark' ? '#fff' : '#000',
                            borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                        }]}
                        placeholder="Search by name, type, color, or brand..."
                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                        value={filterText}
                        onChangeText={setFilterText}
                    />
                </ThemedView>

                {loading ? (
                    <ThemedView style={styles.centerContent}>
                        <ThemedText>Loading your wardrobe...</ThemedText>
                    </ThemedView>
                ) : items.length === 0 ? (
                    <Collapsible title="Getting Started">
                        <ThemedText>
                            Welcome to your wardrobe! Start by adding your first clothing item using the + button below.
                        </ThemedText>
                        <ThemedText style={{ marginTop: 10 }}>
                            You can add details like brand, size, color, and material to help organize your collection.
                        </ThemedText>
                    </Collapsible>
                ) : (
                    <ItemsList
                        groupedItems={groupedItems}
                        totalItems={items.length}
                        onItemPress={setSelectedItem}
                        colorScheme={colorScheme}
                    />
                )}

            </ParallaxScrollView>

            <FloatingActionButton onPress={() => setModalVisible(true)} />

            <ItemDetailsModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onDelete={handleDelete}
                colorScheme={colorScheme}
            />

            <AddItemModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleAddPiece}
                colorScheme={colorScheme}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    titleContainer: {
        gap: 8,
        marginBottom: 16,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        borderWidth: 1,
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: 'transparent',
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
});