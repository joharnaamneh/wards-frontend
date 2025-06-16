import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, Image, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
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

            // Based on your Firestore screenshot, it looks like you have a wardrobe collection
            // with documents that have user_id field, and items subcollection
            // Let's try to find the wardrobe document for this user
            const wardrobeSnap = await getDocs(query(collection(db, 'warderobe'), where('user_id', '==', user.uid)));
            console.log('Wardrobe docs found:', wardrobeSnap.docs.length);

            if (wardrobeSnap.empty) {
                console.log('No wardrobe found for user, creating one...');
                // Create a wardrobe document if it doesn't exist
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

            // Fetch items from the subcollection
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
                console.log('No authenticated user for adding piece');
                return;
            }

            // Validate required fields
            if (!newPiece.name.trim()) {
                alert('Please enter a name for the piece');
                return;
            }

            // Find or create wardrobe
            let wardrobeSnap = await getDocs(query(collection(db, 'warderobe'), where('user_id', '==', user.uid)));
            let wardrobeId;

            if (wardrobeSnap.empty) {
                console.log('Creating new wardrobe for user');
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

            console.log('Piece added successfully');
            setModalVisible(false);
            setNewPiece({ name: '', type: '', size: '', brand: '', color: '', material: '', image: '' });
            fetchItems();
        } catch (error) {
            console.error('Error adding piece:', error);
            alert('Error adding piece. Please try again.');
        }
    };

    const handleDelete = async (itemId: string) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.log('No authenticated user for deleting');
                return;
            }

            const wardrobeSnap = await getDocs(query(collection(db, 'warderobe'), where('user_id', '==', user.uid)));
            const wardrobeDoc = wardrobeSnap.docs[0];

            if (!wardrobeDoc) {
                console.log('No wardrobe found when deleting');
                return;
            }

            const wardrobeId = wardrobeDoc.id;
            await deleteDoc(doc(db, 'warderobe', wardrobeId, 'items', itemId));
            console.log('Item deleted successfully');

            setSelectedItem(null);
            fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Error deleting item. Please try again.');
        }
    };

    const filtered = items.filter((i) =>
        i.name?.toLowerCase().includes(filterText.toLowerCase()) ||
        i.type?.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Wardrobe</ThemedText>

            <TextInput
                style={styles.input}
                placeholder="Filter by name or type (e.g. T-Shirt)"
                placeholderTextColor="#888"
                value={filterText}
                onChangeText={setFilterText}
            />

            {loading ? (
                <ThemedText>Loading wardrobe...</ThemedText>
            ) : items.length === 0 ? (
                <ThemedText>No items found. Add some pieces to your wardrobe!</ThemedText>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Pressable style={styles.item} onPress={() => setSelectedItem(item)}>
                            {item.image ? (
                                <Image
                                    source={{ uri: item.image }}
                                    style={styles.itemImage}
                                    onError={() => console.log('Error loading image:', item.image)}
                                />
                            ) : (
                                <ThemedView style={[styles.itemImage, styles.placeholderImage]}>
                                    <IconSymbol name="photo" size={24} color="#ccc" />
                                </ThemedView>
                            )}
                            <ThemedView style={styles.itemInfo}>
                                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                                <ThemedText type="subtitle" style={styles.itemDetails}>
                                    {item.type} • {item.color}
                                </ThemedText>
                            </ThemedView>
                        </Pressable>
                    )}
                />
            )}

            <Pressable onPress={() => setModalVisible(true)} style={styles.fab}>
                <IconSymbol name="plus.circle" color="#fff" size={32} />
            </Pressable>

            {/* Item Details Modal */}
            <Modal visible={!!selectedItem} transparent animationType="slide">
                <ThemedView style={styles.modalOverlay}>
                    <ThemedView style={styles.modal}>
                        {selectedItem?.image ? (
                            <Image
                                source={{ uri: selectedItem.image }}
                                style={styles.modalImage}
                                onError={() => console.log('Error loading modal image:', selectedItem.image)}
                            />
                        ) : (
                            <ThemedView style={[styles.modalImage, styles.placeholderImage]}>
                                <IconSymbol name="photo" size={48} color="#ccc" />
                            </ThemedView>
                        )}
                        <ThemedText type="title">{selectedItem?.name}</ThemedText>
                        <ThemedText>{selectedItem?.type}</ThemedText>
                        <ThemedText>{selectedItem?.size} • {selectedItem?.brand}</ThemedText>
                        <ThemedText>{selectedItem?.color} • {selectedItem?.material}</ThemedText>

                        <ThemedView style={styles.modalButtons}>
                            <Pressable
                                onPress={() => handleDelete(selectedItem?.id)}
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
                    </ThemedView>
                </ThemedView>
            </Modal>

            {/* Add New Piece Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <ThemedView style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={styles.modal}>
                        <ThemedText type="title">Add New Piece</ThemedText>
                        {['name', 'type', 'size', 'brand', 'color', 'material', 'image'].map((field) => (
                            <TextInput
                                key={field}
                                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                placeholderTextColor="#888"
                                style={styles.input}
                                value={newPiece[field as keyof typeof newPiece]}
                                onChangeText={(text) => setNewPiece({ ...newPiece, [field]: text })}
                            />
                        ))}

                        <ThemedView style={styles.modalButtons}>
                            <Pressable
                                onPress={handleAddPiece}
                                style={[styles.modalButton, styles.saveButton]}
                            >
                                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={() => setModalVisible(false)}
                                style={[styles.modalButton, styles.cancelButton]}
                            >
                                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                            </Pressable>
                        </ThemedView>
                    </ScrollView>
                </ThemedView>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        gap: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#999',
        padding: 10,
        borderRadius: 5,
        marginBottom: 8,
        color: 'inherit',
        backgroundColor: 'transparent',
    },
    item: {
        padding: 14,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    placeholderImage: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontWeight: '600',
        marginBottom: 2,
    },
    itemDetails: {
        fontSize: 12,
        opacity: 0.7,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#000',
        padding: 12,
        borderRadius: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: '#fff',
        margin: 30,
        padding: 20,
        borderRadius: 20,
        elevation: 10,
        gap: 10,
        maxWidth: '90%',
        width: '100%',
    },
    modalImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    closeButton: {
        backgroundColor: '#f0f0f0',
    },
    closeButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: '600',
    },
});