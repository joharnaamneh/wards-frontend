import { useState, useEffect } from 'react';
import { auth, db, storage } from '@/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { UserProfile } from '@/types/UserTypes';

export function useUserProfile() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    await fetchUserProfile(user.uid);
                } catch (err) {
                    console.error('Error fetching user profile:', err);
                    setError('Failed to fetch user profile');
                }
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, 'users', userId));

            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserProfile({
                    uid: userId,
                    displayName: data.displayName || auth.currentUser?.displayName || '',
                    username: data.username || '',
                    email: data.email || auth.currentUser?.email || '',
                    bio: data.bio || '',
                    location: data.location || '',
                    profilePicture: data.profilePicture || auth.currentUser?.photoURL || '',
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                });
            } else {
                // Create a new user profile if it doesn't exist
                const newProfile: UserProfile = {
                    uid: userId,
                    displayName: auth.currentUser?.displayName || '',
                    username: '',
                    email: auth.currentUser?.email || '',
                    bio: '',
                    location: '',
                    profilePicture: auth.currentUser?.photoURL || '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await setDoc(doc(db, 'users', userId), {
                    ...newProfile,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                setUserProfile(newProfile);
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Failed to fetch user profile');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!auth.currentUser || !userProfile) {
            throw new Error('User not authenticated');
        }

        try {
            const userId = auth.currentUser.uid;
            const updatedProfile = {
                ...updates,
                updatedAt: new Date(),
            };

            // Update Firestore document
            await updateDoc(doc(db, 'users', userId), updatedProfile);

            // Update Firebase Auth profile if display name or photo changed
            if (updates.displayName || updates.profilePicture) {
                await updateProfile(auth.currentUser, {
                    displayName: updates.displayName || userProfile.displayName,
                    photoURL: updates.profilePicture || userProfile.profilePicture,
                });
            }

            // Update local state
            setUserProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
        } catch (err) {
            console.error('Error updating user profile:', err);
            throw err;
        }
    };

    const uploadProfilePicture = async (imageUri: string): Promise<string> => {
        if (!auth.currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            const userId = auth.currentUser.uid;
            const response = await fetch(imageUri);
            const blob = await response.blob();

            const storageRef = ref(storage, `profile-pictures/${userId}/${Date.now()}.jpg`);
            await uploadBytes(storageRef, blob);

            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            throw err;
        }
    };

    const deleteAccount = async () => {
        if (!auth.currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            const userId = auth.currentUser.uid;

            // Delete user document from Firestore
            await updateDoc(doc(db, 'users', userId), {
                deleted: true,
                deletedAt: new Date(),
            });

            // Delete Firebase Auth account
            await auth.currentUser.delete();

            setUserProfile(null);
        } catch (err) {
            console.error('Error deleting account:', err);
            throw err;
        }
    };

    return {
        userProfile,
        loading,
        error,
        updateProfile,
        uploadProfilePicture,
        deleteAccount,
        refetch: () => {
            if (auth.currentUser) {
                fetchUserProfile(auth.currentUser.uid);
            }
        },
    };
}