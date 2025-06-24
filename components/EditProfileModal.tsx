import React, { useState, useEffect } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    ScrollView,
    Image,
    View,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/types/UserTypes';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@/firebaseConfig';

const storage = getStorage();

interface EditProfileModalProps {
    visible: boolean;
    userProfile: UserProfile | null;
    onClose: () => void;
    onSave: (profile: Partial<UserProfile>) => Promise<void>;
    colors: any;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({visible, userProfile, onClose, onSave, colors,}) => {
    const [form, setForm] = useState({
        displayName: '',
        username: '',
        bio: '',
        location: '',
        profilePicture: '',
        website: '',
        phoneNumber: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPickingImage, setIsPickingImage] = useState(false);
    const [originalProfilePicture, setOriginalProfilePicture] = useState('');

    useEffect(() => {
        if (userProfile) {
            const profileData = {
                displayName: userProfile.displayName || '',
                username: userProfile.username || '',
                bio: userProfile.bio || '',
                location: userProfile.location || '',
                profilePicture: userProfile.profilePicture || '',
                website: userProfile.website || '',
                phoneNumber: userProfile.phoneNumber || '',
            };
            setForm(profileData);
            setOriginalProfilePicture(userProfile.profilePicture || '');
        }
    }, [userProfile]);

    const reset = () => {
        if (userProfile) {
            const profileData = {
                displayName: userProfile.displayName || '',
                username: userProfile.username || '',
                bio: userProfile.bio || '',
                location: userProfile.location || '',
                profilePicture: userProfile.profilePicture || '',
                website: userProfile.website || '',
                phoneNumber: userProfile.phoneNumber || '',
            };
            setForm(profileData);
            setOriginalProfilePicture(userProfile.profilePicture || '');
        }
        setIsSubmitting(false);
    };
    // 1. Fix the isValidUrl function
    const isValidUrl = (string: string) => {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false; // ← Fixed: should return false for invalid URLs
        }
    };

// 2. Add debugging to the handleSubmit function
    const handleSubmit = async () => {
        if (!validateForm()) return;

        if (!auth.currentUser) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            let updatedForm = { ...form };

            console.log('=== PROFILE PICTURE DEBUG ===');
            console.log('Current profilePicture:', form.profilePicture);
            console.log('Original profilePicture:', originalProfilePicture);
            console.log('Has changed:', form.profilePicture !== originalProfilePicture);
            console.log('Starts with file://:', form.profilePicture?.startsWith('file://'));

            // Check if profile picture has changed and needs to be uploaded
            if (form.profilePicture && form.profilePicture !== originalProfilePicture) {
                console.log('Profile picture has changed, checking if it needs upload...');

                // Check if it's a local URI (starts with file://)
                if (form.profilePicture.startsWith('file://')) {
                    console.log('Uploading new profile picture...');
                    const downloadURL = await uploadProfilePicture(form.profilePicture, auth.currentUser.uid);
                    updatedForm.profilePicture = downloadURL;
                    console.log('Profile picture uploaded successfully:', downloadURL);
                } else {
                    console.log('Profile picture is not a local file, skipping upload');
                }
            } else {
                console.log('Profile picture has not changed, skipping upload');
            }

            console.log('Final updatedForm.profilePicture:', updatedForm.profilePicture);
            console.log('=== END DEBUG ===');

            await onSave(updatedForm);
            Alert.alert('Success', 'Profile updated successfully!');
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            let errorMessage = 'Failed to update profile. Please try again.';

            if (error && typeof error === 'object') {
                const err = error as any; // Type assertion for Firebase error codes
                if (err.code === 'storage/unauthorized') {
                    errorMessage = 'Failed to upload profile picture. Please try again.';
                } else if (err.code === 'firestore/permission-denied') {
                    errorMessage = 'Permission denied. Please try again.';
                } else if (err.message) {
                    errorMessage = err.message;
                }
            }


            Alert.alert('Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

// 3. Add debugging to the processImage function
    const processImage = async (imageUri: string) => {
        try {
            console.log('=== PROCESS IMAGE DEBUG ===');
            console.log('Original imageUri:', imageUri);

            // Resize and compress the image
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 300, height: 300 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            console.log('Manipulated image URI:', manipulatedImage.uri);
            console.log('=== END PROCESS IMAGE DEBUG ===');

            setForm(prev => ({ ...prev, profilePicture: manipulatedImage.uri }));
        } catch (error) {
            console.error('Error processing image:', error);
            Alert.alert('Error', 'Failed to process image. Please try again.');
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        reset();
        onClose();
    };

    const validateForm = () => {
        if (!form.displayName.trim()) {
            Alert.alert('Missing Information', 'Please enter your display name.');
            return false;
        }

        if (form.username && form.username.length < 3) {
            Alert.alert('Invalid Username', 'Username must be at least 3 characters long.');
            return false;
        }

        if (form.bio && form.bio.length > 500) {
            Alert.alert('Bio Too Long', 'Bio must be less than 500 characters.');
            return false;
        }

        if (form.website && !isValidUrl(form.website)) {
            Alert.alert('Invalid Website', 'Please enter a valid website URL.');
            return false;
        }

        return true;
    };


    const uploadProfilePicture = async (imageUri: string, userId: string): Promise<string> => {
        try {
            console.log('Starting image upload for URI:', imageUri);
            console.log('User ID:', userId);

            // Check if storage is properly initialized
            if (!storage) {
                throw new Error('Firebase Storage is not initialized');
            }

            console.log('Firebase Storage instance:', storage);
            console.log('Storage app:', storage.app);

            // Simple fetch approach that works with Expo
            const response = await fetch(imageUri);
            console.log('Fetch response status:', response.status, response.ok);

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            console.log('Blob created - Size:', blob.size, 'Type:', blob.type);

            if (!blob || blob.size === 0) {
                throw new Error('Invalid image data - blob is empty');
            }

            const timestamp = Date.now();
            const filename = `profile_${timestamp}.jpg`;
            const storagePath = `profile-pictures/${userId}/${filename}`;

            console.log('Storage path:', storagePath);

            // Try to create storage reference with additional error checking
            let storageRef;
            try {
                storageRef = ref(storage, storagePath);
                console.log('Storage ref created successfully:', storageRef);
            } catch (refError) {
                console.error('Error creating storage reference:', refError);
                throw new Error(`Failed to create storage reference: ${refError.message}`);
            }

            console.log('Starting Firebase upload...');
            const uploadResult = await uploadBytes(storageRef, blob);
            console.log('Upload successful. Metadata:', uploadResult.metadata);

            const downloadURL = await getDownloadURL(storageRef);
            console.log('Download URL obtained:', downloadURL);

            return downloadURL;
        } catch (error) {
            console.error('Detailed error in uploadProfilePicture:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                imageUri,
                userId
            });

            // Re-throw with original error message for debugging
            throw error;
        }
    };
   const pickImage = async () => {
        try {
            setIsPickingImage(true);

            // Request permissions
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
                return;
            }

            // Show action sheet
            Alert.alert('Select Profile Picture', 'Choose an option', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Camera', onPress: () => openCamera() },
                { text: 'Photo Library', onPress: () => openImagePicker() },
            ]);
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        } finally {
            setIsPickingImage(false);
        }
    };

    const openCamera = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please grant permission to access your camera.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error opening camera:', error);
            Alert.alert('Error', 'Failed to open camera. Please try again.');
        }
    };

    const openImagePicker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error opening image picker:', error);
            Alert.alert('Error', 'Failed to open image picker. Please try again.');
        }
    };


    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={handleClose} style={styles.cancelButton} disabled={isSubmitting}>
                        <ThemedText style={[styles.cancelText, { color: colors.text }]}>
                            Cancel
                        </ThemedText>
                    </Pressable>
                    <ThemedText type="title" style={styles.headerTitle}>
                        Edit Profile
                    </ThemedText>
                    <Pressable
                        onPress={handleSubmit}
                        style={[styles.saveButton, { backgroundColor: colors.accent }]}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <ThemedText style={styles.saveText}>Save</ThemedText>
                        )}
                    </Pressable>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Profile Picture Section */}
                    <View style={styles.section}>
                        <View style={styles.profilePictureSection}>
                            <Pressable
                                onPress={pickImage}
                                disabled={isPickingImage || isSubmitting}
                                style={styles.profilePictureContainer}
                            >
                                {form.profilePicture ? (
                                    <Image source={{ uri: form.profilePicture }} style={styles.profilePicture} />
                                ) : (
                                    <View
                                        style={[
                                            styles.profilePicture,
                                            styles.placeholderPicture,
                                            { backgroundColor: colors.accent },
                                        ]}
                                    >
                                        <ThemedText style={styles.initials}>
                                            {form.displayName ? getInitials(form.displayName) : 'U'}
                                        </ThemedText>
                                    </View>
                                )}
                                <View style={[styles.editIcon, { backgroundColor: colors.accent }]}>
                                    {isPickingImage ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <IconSymbol name="camera.fill" size={16} color="#fff" />
                                    )}
                                </View>
                            </Pressable>
                            <ThemedText style={[styles.photoHint, { color: colors.textSecondary }]}>
                                Tap to change profile photo
                            </ThemedText>
                        </View>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.section}>
                        <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.inputContainer}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Display Name *
                                </ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={form.displayName}
                                    onChangeText={text => setForm(prev => ({ ...prev, displayName: text }))}
                                    placeholder="Enter your display name"
                                    placeholderTextColor={colors.textSecondary}
                                    editable={!isSubmitting}
                                    maxLength={50}
                                />
                            </View>

                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            <View style={styles.inputContainer}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Username
                                </ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={form.username}
                                    onChangeText={text =>
                                        setForm(prev => ({
                                            ...prev,
                                            username: text.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                                        }))
                                    }
                                    placeholder="Enter a unique username"
                                    placeholderTextColor={colors.textSecondary}
                                    editable={!isSubmitting}
                                    autoCapitalize="none"
                                    maxLength={30}
                                />
                            </View>

                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            <View style={styles.inputContainer}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Bio
                                </ThemedText>
                                <TextInput
                                    style={[styles.textArea, { color: colors.text }]}
                                    value={form.bio}
                                    onChangeText={text => setForm(prev => ({ ...prev, bio: text }))}
                                    placeholder="Tell us about yourself..."
                                    placeholderTextColor={colors.textSecondary}
                                    editable={!isSubmitting}
                                    multiline
                                    numberOfLines={3}
                                    maxLength={500}
                                />
                                <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
                                    {form.bio.length}/500
                                </ThemedText>
                            </View>

                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            <View style={styles.inputContainer}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Location
                                </ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={form.location}
                                    onChangeText={text => setForm(prev => ({ ...prev, location: text }))}
                                    placeholder="Enter your location"
                                    placeholderTextColor={colors.textSecondary}
                                    editable={!isSubmitting}
                                    maxLength={100}
                                />
                            </View>

                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            <View style={styles.inputContainer}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Website
                                </ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={form.website}
                                    onChangeText={text => setForm(prev => ({ ...prev, website: text }))}
                                    placeholder="https://your-website.com"
                                    placeholderTextColor={colors.textSecondary}
                                    editable={!isSubmitting}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                            </View>

                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            <View style={styles.inputContainer}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Phone Number
                                </ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={form.phoneNumber}
                                    onChangeText={text => setForm(prev => ({ ...prev, phoneNumber: text }))}
                                    placeholder="Enter your phone number"
                                    placeholderTextColor={colors.textSecondary}
                                    editable={!isSubmitting}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Additional Info */}
                    <View style={styles.section}>
                        <ThemedText style={[styles.sectionNote, { color: colors.textSecondary }]}>
                            * Required fields
                        </ThemedText>
                        <ThemedText style={[styles.sectionNote, { color: colors.textSecondary }]}>
                            Your profile information helps others discover and connect with you.
                        </ThemedText>
                    </View>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    cancelButton: {
        paddingVertical: 8,
    },
    cancelText: {
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        margin: 16,
    },
    profilePictureSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profilePictureContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    placeholderPicture: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    photoHint: {
        fontSize: 14,
        textAlign: 'center',
    },
    inputGroup: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    inputContainer: {
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        paddingVertical: 4,
    },
    textArea: {
        fontSize: 16,
        paddingVertical: 4,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
    separator: {
        height: 1,
        marginLeft: 16,
    },
    sectionNote: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 4,
    },
});