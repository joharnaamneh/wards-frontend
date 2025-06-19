// hooks/useOutfitData.ts - Enhanced with better error handling and debugging
import { useEffect, useState } from 'react';
import {
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
import { auth, db } from '../firebaseConfig';
import { Outfit } from '../types/OutfitTypes';

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
                query(
                    collection(db, 'outfits'),
                    where('user_id', '==', user.uid)
                )
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

        // Additional validation
        if (!newOutfit.name.trim()) {
            throw new Error('Please enter a name for the outfit');
        }

        if (newOutfit.items.length === 0) {
            throw new Error('Please select at least one item for the outfit');
        }

        try {
            console.log('Adding outfit for user:', user.uid);
            console.log('Outfit data:', newOutfit);

            // Check if user is authenticated and has a valid token
            const idToken = await user.getIdToken();
            console.log('User has valid token:', !!idToken);

            const outfitData = {
                ...newOutfit,
                user_id: user.uid,
                created_at: serverTimestamp(),
            };

            console.log('Final outfit data to save:', outfitData);

            const docRef = await addDoc(collection(db, 'outfits'), outfitData);
            console.log('Outfit added with ID:', docRef.id);

            await fetchOutfits(); // Refresh the outfits list
        } catch (error) {
            console.error('Detailed error adding outfit:', error);

            // More specific error messages
            if (error.code === 'permission-denied') {
                throw new Error('Permission denied. Please check your Firestore security rules.');
            } else if (error.code === 'unauthenticated') {
                throw new Error('User not authenticated. Please sign in again.');
            } else if (error.code === 'failed-precondition') {
                throw new Error('Database operation failed. Please try again.');
            } else {
                throw new Error(`Failed to create outfit: ${error.message}`);
            }
        }
    };

    const deleteOutfit = async (outfitId: string) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            await deleteDoc(doc(db, 'outfits', outfitId));
            await fetchOutfits(); // Refresh the outfits list
        } catch (error) {
            console.error('Error deleting outfit:', error);
            throw new Error('Failed to delete outfit. Please try again.');
        }
    };

    const toggleFavorite = async (outfitId: string, currentFavorite: boolean) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            await updateDoc(doc(db, 'outfits', outfitId), {
                favorite: !currentFavorite
            });
            await fetchOutfits(); // Refresh the outfits list
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw new Error('Failed to update favorite status. Please try again.');
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User authenticated:', user.uid);
                // Wait a bit for the auth state to fully settle
                setTimeout(() => {
                    fetchOutfits();
                }, 100);
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