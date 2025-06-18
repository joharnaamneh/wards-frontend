import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { WardrobeItem } from '../types/WardrobeTypes';

const db = getFirestore();
const auth = getAuth();

export const useWardrobeData = () => {
    const [items, setItems] = useState<WardrobeItem[]>([]);
    const [loading, setLoading] = useState(true);

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

            const wardrobeSnap = await getDocs(
                query(collection(db, 'warderobe'), where('user_id', '==', user.uid))
            );
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

    const addItem = async (newItem: Omit<WardrobeItem, 'id' | 'created_at'>) => {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No authenticated user for adding piece');
        }

        if (!newItem.name.trim()) {
            throw new Error('Please enter a name for the piece');
        }

        let wardrobeSnap = await getDocs(
            query(collection(db, 'warderobe'), where('user_id', '==', user.uid))
        );
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
            ...newItem,
            created_at: serverTimestamp(),
        });

        await fetchItems(); // Refresh the items list
    };

    const deleteItem = async (itemId: string) => {
        const user = auth.currentUser;
        if (!user) return;

        const wardrobeSnap = await getDocs(
            query(collection(db, 'warderobe'), where('user_id', '==', user.uid))
        );
        const wardrobeDoc = wardrobeSnap.docs[0];

        if (!wardrobeDoc) return;

        const wardrobeId = wardrobeDoc.id;
        await deleteDoc(doc(db, 'warderobe', wardrobeId, 'items', itemId));

        await fetchItems(); // Refresh the items list
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

    return {
        items,
        loading,
        addItem,
        deleteItem,
        refreshItems: fetchItems
    };
};