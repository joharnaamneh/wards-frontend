import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, Image, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const db = getFirestore();
const auth = getAuth();

// Define the item type
interface WardrobeItem {
    id: string;
    name: string;
    type: string;
    size: string;
    brand: string;
    color: string;
    material: string;
    image: string;
    created_at?: any;
}

export default function WardrobeScreen() {
    const [items, setItems] = useState<WardrobeItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
    const [filterText, setFilterText] = useState('');
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();

    const [newPiece, setNewPiece] = useState({
        name: '',
        type: '',
        size: '',
        brand: '',
        color: '',
        material: '',
        image: '',
    });

    const fetchItems = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                console.log('No authenticated user');
                setLoading(false);
                return;
            }

            console.log('Fetching for user:', user.uid);

            const wardrobeSnap = await getDocs(query(collection(db, 'warderobe'), where('user_id', '==', user.uid)));
            console.log('Wardrobe docs found:', wardrobeSnap.docs.length);

            if (wardrobeSnap.empty) {
                console.log('No wardrobe found for user, creating one...');
                const newWardrobeDoc = await addDoc(collection(db, 'warderobe'), {
                    user_id: user.uid,
                    name: 'My Wardrobe',
                    created_at: serverTimestamp()
                });
                console.log('Created wardrobe with ID:', newWardrobeDoc.id);
                setItems([]);
                setLoading(false);
                return;
            }

            const wardrobeDoc = wardrobeSnap.docs[0];
            const wardrobeId = wardrobeDoc.id;
            console.log('Using wardrobe ID:', wardrobeId);

            const itemsSnap = await getDocs(collection(db, 'warderobe', wardrobeId, 'items'));
            console.log('Items found:', itemsSnap.docs.length);

            const itemsList = itemsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '',
                    type: data.type || '',
                    size: data.size || '',
                    brand: data.brand || '',
                    color: data.color || '',
                    material: data.material || '',
                    image: data.image || '',
                    created_at: data.created_at
                } as WardrobeItem;
            });

            console.log('Items list:', itemsList);
            setItems(itemsList);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User authenticated:', user.uid);
                fetchItems();
            } else {
                console.log('User not authenticated');
                setItems([]);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const handleAddPiece = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'No authenticated user for adding piece');
                return;
            }

            if (!newPiece.name.trim()) {
                Alert.alert('Required Field', 'Please enter a name for the piece');
                return;
            }

            let wardrobeSnap = await getDocs(query(collection(db, 'warderobe'), where('user_id', '==', user.uid)));
            let wardrobeId;

            if (wardrobeSnap.empty) {
                const newWardrobeDoc = await addDoc(collection(db, 'warderobe'), {
                    user_id: user.uid,
                    name: 'My Wardrobe',
                    created_at: serverTimestamp()
                });
                wardrobeId = newWardrobeDoc.id;
            } else {
                wardrobeId = wardrobeSnap.docs[0].id;
            }

            await addDoc(collection(db, 'warderobe', wardrobeId, 'items'), {
                name: newPiece.name,
                type: newPiece.type,
                size: newPiece.size,
                brand: newPiece.brand,
                color: newPiece.color,
                material: newPiece.material,
                image: newPiece.image,
                created_at: serverTimestamp(),
            });

            setModalVisible(false);
            setNewPiece({ name: '', type: '', size: '', brand: '', color: '', material: '', image: '' });
            fetchItems();
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
                            const user = auth.currentUser;
                            if (!user) return;

                            const wardrobeSnap = await getDocs(query(collection(db, 'warderobe'), where('user_id', '==', user.uid)));
                            const wardrobeDoc = wardrobeSnap.docs[0];

                            if (!wardrobeDoc) return;

                            const wardrobeId = wardrobeDoc.id;
                            await deleteDoc(doc(db, 'warderobe', wardrobeId, 'items', itemId));

                            setSelectedItem(null);
                            fetchItems();
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

    const filtered = items.filter((i) =>
        i.name?.toLowerCase().includes(filterText.toLowerCase()) ||
        i.type?.toLowerCase().includes(filterText.toLowerCase()) ||
        i.color?.toLowerCase().includes(filterText.toLowerCase()) ||
        i.brand?.toLowerCase().includes(filterText.toLowerCase())
    );

    const groupedItems = filtered.reduce((acc, item) => {
        const type = item.type || 'Other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
    }, {} as Record<string, WardrobeItem[]>);

    const renderItem = ({ item }: { item: WardrobeItem }) => (
        <Pressable style={styles.item} onPress={() => setSelectedItem(item)}>
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
                    <>
                            <ThemedText>
                                Your Collection ({items.length} items)
                            </ThemedText>


                        {Object.entries(groupedItems).map(([type, typeItems]) => (

                                <ThemedView style={styles.categoryContainer}>
                                    {typeItems.map((item) => (
                                        <ThemedView key={item.id} style={{ marginBottom: 8 }}>
                                            {renderItem({ item })}
                                        </ThemedView>
                                    ))}
                                </ThemedView>
                        ))}
                    </>
                )}

            </ParallaxScrollView>

            {/* Floating Action Button */}
            <Pressable onPress={() => setModalVisible(true)} style={styles.fab}>
                <IconSymbol name="house.fill" color="#fff" size={24} />
            </Pressable>

            {/* Item Details Modal */}
            <Modal visible={!!selectedItem} transparent animationType="slide">
                <ThemedView style={styles.modalOverlay}>
                    <ThemedView style={[styles.modal, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedItem?.image ? (
                                <Image
                                    source={{ uri: selectedItem.image }}
                                    style={styles.modalImage}
                                    onError={() => console.log('Error loading modal image:', selectedItem.image)}
                                />
                            ) : (
                                <ThemedView style={[styles.modalImage, styles.placeholderImage]}>
                                    <IconSymbol name="house.fill" size={48} color={colorScheme === 'dark' ? '#666' : '#ccc'} />
                                </ThemedView>
                            )}

                            <ThemedText type="title" style={styles.modalTitle}>{selectedItem?.name}</ThemedText>

                            <ThemedView style={styles.detailsGrid}>
                                {selectedItem?.type && (
                                    <ThemedView style={styles.detailItem}>
                                        <ThemedText type="defaultSemiBold">Type</ThemedText>
                                        <ThemedText>{selectedItem.type}</ThemedText>
                                    </ThemedView>
                                )}
                                {selectedItem?.size && (
                                    <ThemedView style={styles.detailItem}>
                                        <ThemedText type="defaultSemiBold">Size</ThemedText>
                                        <ThemedText>{selectedItem.size}</ThemedText>
                                    </ThemedView>
                                )}
                                {selectedItem?.brand && (
                                    <ThemedView style={styles.detailItem}>
                                        <ThemedText type="defaultSemiBold">Brand</ThemedText>
                                        <ThemedText>{selectedItem.brand}</ThemedText>
                                    </ThemedView>
                                )}
                                {selectedItem?.color && (
                                    <ThemedView style={styles.detailItem}>
                                        <ThemedText type="defaultSemiBold">Color</ThemedText>
                                        <ThemedText>{selectedItem.color}</ThemedText>
                                    </ThemedView>
                                )}
                                {selectedItem?.material && (
                                    <ThemedView style={styles.detailItem}>
                                        <ThemedText type="defaultSemiBold">Material</ThemedText>
                                        <ThemedText>{selectedItem.material}</ThemedText>
                                    </ThemedView>
                                )}
                            </ThemedView>

                            <ThemedView style={styles.modalButtons}>
                                <Pressable
                                    onPress={() => selectedItem && handleDelete(selectedItem.id)}
                                    style={[styles.modalButton, styles.deleteButton]}
                                >
                                    <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                                </Pressable>
                                <Pressable
                                    onPress={() => setSelectedItem(null)}
                                    style={[styles.modalButton, styles.closeButton]}
                                >
                                    <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                                </Pressable>
                            </ThemedView>
                        </ScrollView>
                    </ThemedView>
                </ThemedView>
            </Modal>

            {/* Add New Piece Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <ThemedView style={styles.modalOverlay}>
                    <ThemedView style={[styles.modal, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <ThemedText type="title" style={styles.modalTitle}>Add New Piece</ThemedText>

                            <ThemedView style={styles.formContainer}>
                                <ThemedView style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Name *</ThemedText>
                                    <TextInput
                                        placeholder="e.g., Blue Denim Jacket"
                                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                        style={[styles.input, {
                                            color: colorScheme === 'dark' ? '#fff' : '#000',
                                            borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                        }]}
                                        value={newPiece.name}
                                        onChangeText={(text) => setNewPiece({ ...newPiece, name: text })}
                                    />
                                </ThemedView>

                                <ThemedView style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Type</ThemedText>
                                    <TextInput
                                        placeholder="e.g., Jacket, T-Shirt, Jeans"
                                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                        style={[styles.input, {
                                            color: colorScheme === 'dark' ? '#fff' : '#000',
                                            borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                        }]}
                                        value={newPiece.type}
                                        onChangeText={(text) => setNewPiece({ ...newPiece, type: text })}
                                    />
                                </ThemedView>

                                <ThemedView style={styles.inputRow}>
                                    <ThemedView style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Size</ThemedText>
                                        <TextInput
                                            placeholder="S, M, L, XL"
                                            placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                            style={[styles.input, {
                                                color: colorScheme === 'dark' ? '#fff' : '#000',
                                                borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                            }]}
                                            value={newPiece.size}
                                            onChangeText={(text) => setNewPiece({ ...newPiece, size: text })}
                                        />
                                    </ThemedView>
                                    <ThemedView style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Color</ThemedText>
                                        <TextInput
                                            placeholder="Blue, Red, Black"
                                            placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                            style={[styles.input, {
                                                color: colorScheme === 'dark' ? '#fff' : '#000',
                                                borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                            }]}
                                            value={newPiece.color}
                                            onChangeText={(text) => setNewPiece({ ...newPiece, color: text })}
                                        />
                                    </ThemedView>
                                </ThemedView>

                                <ThemedView style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Brand</ThemedText>
                                    <TextInput
                                        placeholder="e.g., Nike, Zara, H&M"
                                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                        style={[styles.input, {
                                            color: colorScheme === 'dark' ? '#fff' : '#000',
                                            borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                        }]}
                                        value={newPiece.brand}
                                        onChangeText={(text) => setNewPiece({ ...newPiece, brand: text })}
                                    />
                                </ThemedView>

                                <ThemedView style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Material</ThemedText>
                                    <TextInput
                                        placeholder="e.g., Cotton, Denim, Polyester"
                                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                        style={[styles.input, {
                                            color: colorScheme === 'dark' ? '#fff' : '#000',
                                            borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                        }]}
                                        value={newPiece.material}
                                        onChangeText={(text) => setNewPiece({ ...newPiece, material: text })}
                                    />
                                </ThemedView>

                                <ThemedView style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Image URL</ThemedText>
                                    <TextInput
                                        placeholder="https://example.com/image.jpg"
                                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                        style={[styles.input, {
                                            color: colorScheme === 'dark' ? '#fff' : '#000',
                                            borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                        }]}
                                        value={newPiece.image}
                                        onChangeText={(text) => setNewPiece({ ...newPiece, image: text })}
                                    />
                                </ThemedView>
                            </ThemedView>

                            <ThemedView style={styles.modalButtons}>
                                <Pressable
                                    onPress={handleAddPiece}
                                    style={[styles.modalButton, styles.saveButton]}
                                >
                                    <ThemedText style={styles.saveButtonText}>Add to Wardrobe</ThemedText>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setModalVisible(false);
                                        setNewPiece({ name: '', type: '', size: '', brand: '', color: '', material: '', image: '' });
                                    }}
                                    style={[styles.modalButton, styles.cancelButton]}
                                >
                                    <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                                </Pressable>
                            </ThemedView>
                        </ScrollView>
                    </ThemedView>
                </ThemedView>
            </Modal>
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
    categoryContainer: {
        marginTop: 8,
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
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        margin: 20,
        padding: 20,
        borderRadius: 20,
        elevation: 10,
        maxHeight: '80%',
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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
    detailsGrid: {
        gap: 12,
        marginBottom: 20,
    },
    detailItem: {
        gap: 4,
    },
    formContainer: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: 'transparent',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
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
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 16,
    },
});