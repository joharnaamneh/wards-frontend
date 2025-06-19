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

interface EditProfileModalProps {
    visible: boolean;
    userProfile: UserProfile | null;
    onClose: () => void;
    onSave: (profile: Partial<UserProfile>) => Promise<void>;
    colors: any;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
                                                                      visible,
                                                                      userProfile,
                                                                      onClose,
                                                                      onSave,
                                                                      colors,
                                                                  }) => {
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

    useEffect(() => {
        if (userProfile) {
            setForm({
                displayName: userProfile.displayName || '',
                username: userProfile.username || '',
                bio: userProfile.bio || '',
                location: userProfile.location || '',
                profilePicture: userProfile.profilePicture || '',
                website: userProfile.website || '',
                phoneNumber: userProfile.phoneNumber || '',
            });
        }
    }, [userProfile]);

    const reset = () => {
        if (userProfile) {
            setForm({
                displayName: userProfile.displayName || '',
                username: userProfile.username || '',
                bio: userProfile.bio || '',
                location: userProfile.location || '',
                profilePicture: userProfile.profilePicture || '',
                website: userProfile.website || '',
                phoneNumber: userProfile.phoneNumber || '',
            });
        }
        setIsSubmitting(false);
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

    const isValidUrl = (string: string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSave(form);
            Alert.alert('Success', 'Profile updated successfully!');
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
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

    const processImage = async (imageUri: string) => {
        try {
            // Resize and compress the image
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 300, height: 300 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            setForm(prev => ({ ...prev, profilePicture: manipulatedImage.uri }));
        } catch (error) {
            console.error('Error processing image:', error);
            Alert.alert('Error', 'Failed to process image. Please try again.');
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
                                disabled={isPickingImage}
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