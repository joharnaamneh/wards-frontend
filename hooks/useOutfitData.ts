// hooks/useOutfitData.ts
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
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { Outfit } from '../types/OutfitTypes';

const db = getFirestore();
const auth = getAuth();

export const useOutfitData = () => {
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOutfits = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                console.log('No authenticated user');
                setLoading(false);
                return;
            }

            console.log('Fetching outfits for user:', user.uid);

            const outfitsSnap = await getDocs(
                query(collection(db, 'outfits'), where('user_id', '==', user.uid))
            );
            console.log('Outfit docs found:', outfitsSnap.docs.length);

            const outfitsList = outfitsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '',
                    description: data.description || '',
                    occasion: data.occasion || '',
                    season: data.season || '',
                    items: data.items || [],
                    image: data.image || '',
                    favorite: data.favorite || false,
                    created_at: data.created_at
                } as Outfit;
            });

            console.log('Outfits list:', outfitsList);
            setOutfits(outfitsList);
        } catch (error) {
            console.error('Error fetching outfits:', error);
        } finally {
            setLoading(false);
        }
    };

    const addOutfit = async (newOutfit: Omit<Outfit, 'id' | 'created_at'>) => {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No authenticated user for adding outfit');
        }

        if (!newOutfit.name.trim()) {
            throw new Error('Please enter a name for the outfit');
        }

        if (newOutfit.items.length === 0) {
            throw new Error('Please select at least one item for the outfit');
        }

        await addDoc(collection(db, 'outfits'), {
            ...newOutfit,
            user_id: user.uid,
            created_at: serverTimestamp(),
        });

        await fetchOutfits(); // Refresh the outfits list
    };

    const deleteOutfit = async (outfitId: string) => {
        const user = auth.currentUser;
        if (!user) return;

        await deleteDoc(doc(db, 'outfits', outfitId));
        await fetchOutfits(); // Refresh the outfits list
    };

    const toggleFavorite = async (outfitId: string, currentFavorite: boolean) => {
        const user = auth.currentUser;
        if (!user) return;

        await updateDoc(doc(db, 'outfits', outfitId), {
            favorite: !currentFavorite
        });

        await fetchOutfits(); // Refresh the outfits list
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User authenticated:', user.uid);
                fetchOutfits();
            } else {
                console.log('User not authenticated');
                setOutfits([]);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    return {
        outfits,
        loading,
        addOutfit,
        deleteOutfit,
        toggleFavorite,
        refreshOutfits: fetchOutfits
    };
};