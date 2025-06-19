// app/register.tsx
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
    Alert,
    StyleSheet,
    TextInput,
    ScrollView,
    View,
    Pressable,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface RegisterForm {
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    username: string;
    bio: string;
    location: string;
    profilePicture: string;
}

export default function RegisterScreen() {
    const [form, setForm] = useState<RegisterForm>({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        username: '',
        bio: '',
        location: '',
        profilePicture: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isPickingImage, setIsPickingImage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [userCreated, setUserCreated] = useState(false); // Track if user account is created

    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const validateStep1 = () => {
        if (!form.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!form.email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!form.password) {
            setError('Password is required');
            return false;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!form.displayName.trim()) {
            setError('Display name is required');
            return false;
        }
        // Make username mandatory
        if (!form.username.trim()) {
            setError('Username is required');
            return false;
        }
        if (form.username.length < 3) {
            setError('Username must be at least 3 characters long');
            return false;
        }
        if (form.bio && form.bio.length > 500) {
            setError('Bio must be less than 500 characters');
            return false;
        }
        return true;
    };

    const handleNextStep = async () => {
        setError(null);
        if (currentStep === 1 && validateStep1()) {
            setIsLoading(true);
            try {
                // Create user account in step 1
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    form.email,
                    form.password
                );

                console.log('User account created:', userCredential.user.uid);
                setUserCreated(true);
                setCurrentStep(2);
            } catch (error: any) {
                console.error('Account creation error:', error);
                let errorMessage = 'Failed to create account. Please try again.';

                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'This email is already registered. Please use a different email or try logging in.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Please enter a valid email address.';
                }
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handlePrevStep = () => {
        setError(null);
        if (currentStep === 2) {
            setCurrentStep(1);
        }
    };

    const pickImage = async () => {
        try {
            setIsPickingImage(true);
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
                return;
            }

            Alert.alert('Select Profile Picture', 'Choose an option', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Camera', onPress: () => openCamera() },
                { text: 'Photo Library', onPress: () => openImagePicker() },
            ]);
        } catch (error) {
            console.error('Error picking image:', error);
            setError('Failed to pick image. Please try again.');
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
            setError('Failed to open camera. Please try again.');
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
            setError('Failed to open image picker. Please try again.');
        }
    };

    const processImage = async (imageUri: string) => {
        try {
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 300, height: 300 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            setForm(prev => ({ ...prev, profilePicture: manipulatedImage.uri }));
        } catch (error) {
            console.error('Error processing image:', error);
            setError('Failed to process image. Please try again.');
        }
    };

    const uploadProfilePicture = async (imageUri: string, userId: string): Promise<string> => {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile-pictures/${userId}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };
    const handleRegister = async () => {
        setError(null);

        if (!validateStep2()) return;

        if (!userCreated || !auth.currentUser) {
            setError('Please complete step 1 first');
            return;
        }

        setIsLoading(true);

        try {
            const user = auth.currentUser;
            let profilePictureUrl = '';

            // Upload profile picture if provided
            if (form.profilePicture) {
                profilePictureUrl = await uploadProfilePicture(form.profilePicture, user.uid);
            }

            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: form.displayName,
                photoURL: profilePictureUrl,
            });

            // Create user document in Firestore with proper null checks
            const userProfile = {
                uid: user.uid,
                displayName: form.displayName || '',
                username: (form.username || '').toLowerCase().replace(/[^a-z0-9_]/g, ''),
                email: form.email || user.email || '',
                bio: form.bio || '',
                location: form.location || '', // Ensure it's never undefined
                profilePicture: profilePictureUrl || '',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await setDoc(doc(db, 'users', user.uid), userProfile);

            router.replace('/login');

        } catch (error: any) {
            console.error('Profile completion error:', error);

            let errorMessage = 'Failed to complete profile. Please try again.';

            // Handle specific Firebase errors
            if (error.code === 'storage/unauthorized') {
                errorMessage = 'Failed to upload profile picture. Please try again.';
            } else if (error.code === 'firestore/permission-denied') {
                errorMessage = 'Permission denied. Please try again.';
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
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

    const renderErrorBanner = () => {
        if (!error) return null;

        return (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructive }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#fff" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <Pressable onPress={() => setError(null)} style={styles.errorClose}>
                    <IconSymbol name="xmark" size={14} color="#fff" />
                </Pressable>
            </View>
        );
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, currentStep >= 1 && { backgroundColor: colors.accent }]} />
            <View style={[styles.stepLine, currentStep >= 2 && { backgroundColor: colors.accent }]} />
            <View style={[styles.stepDot, currentStep >= 2 && { backgroundColor: colors.accent }]} />
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <ThemedText type="title" style={styles.stepTitle}>Create Your Account</ThemedText>
            <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Let's get started with your basic information
            </ThemedText>

            <View style={styles.inputGroup}>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="envelope" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        placeholder="Email address"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text }]}
                        value={form.email}
                        onChangeText={(text) => setForm(prev => ({ ...prev, email: text }))}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                    />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        placeholder="Password (min. 6 characters)"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text }]}
                        value={form.password}
                        onChangeText={(text) => setForm(prev => ({ ...prev, password: text }))}
                        secureTextEntry
                        autoComplete="new-password"
                    />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        placeholder="Confirm password"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text }]}
                        value={form.confirmPassword}
                        onChangeText={(text) => setForm(prev => ({ ...prev, confirmPassword: text }))}
                        secureTextEntry
                        autoComplete="new-password"
                    />
                </View>
            </View>

            <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                onPress={handleNextStep}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <ThemedText style={styles.primaryButtonText}>Continue</ThemedText>
                        <IconSymbol name="arrow.right" size={16} color="#fff" />
                    </>
                )}
            </Pressable>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <ThemedText type="title" style={styles.stepTitle}>Complete Your Profile</ThemedText>
            <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Add some personal details to make your profile unique
            </ThemedText>

            {/* Profile Picture Section */}
            <View style={styles.profilePictureSection}>
                <Pressable
                    onPress={pickImage}
                    disabled={isPickingImage}
                    style={styles.profilePictureContainer}
                >
                    {form.profilePicture ? (
                        <Image source={{ uri: form.profilePicture }} style={styles.profilePicture} />
                    ) : (
                        <View style={[styles.profilePicture, styles.placeholderPicture, { backgroundColor: colors.accent }]}>
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
                    Add a profile photo (optional)
                </ThemedText>
            </View>

            <View style={styles.inputGroup}>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        placeholder="Display name*"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text }]}
                        value={form.displayName}
                        onChangeText={(text) => setForm(prev => ({ ...prev, displayName: text }))}
                        maxLength={50}
                    />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="at" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        placeholder="Username*"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text }]}
                        value={form.username}
                        onChangeText={(text) => setForm(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                        autoCapitalize="none"
                        maxLength={30}
                    />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="location" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        placeholder="Location (optional)"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text }]}
                        value={form.location}
                        onChangeText={(text) => setForm(prev => ({ ...prev, location: text }))}
                        maxLength={100}
                    />
                </View>

                <View style={[styles.textAreaContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                        placeholder="Bio (optional)"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.textArea, { color: colors.text }]}
                        value={form.bio}
                        onChangeText={(text) => setForm(prev => ({ ...prev, bio: text }))}
                        multiline
                        numberOfLines={3}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
                        {form.bio.length}/500
                    </ThemedText>
                </View>
            </View>

            <View style={styles.buttonRow}>
                <Pressable
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={handlePrevStep}
                    disabled={isLoading}
                >
                    <IconSymbol name="arrow.left" size={16} color={colors.text} />
                    <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Back</ThemedText>
                </Pressable>

                <Pressable
                    style={[styles.primaryButton, { backgroundColor: colors.accent, flex: 1 }]}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <ThemedText style={styles.primaryButtonText}>Create Account</ThemedText>
                            <IconSymbol name="checkmark" size={16} color="#fff" />
                        </>
                    )}
                </Pressable>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                {renderErrorBanner()}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderStepIndicator()}
                    {currentStep === 1 ? renderStep1() : renderStep2()}

                    <View style={styles.footer}>
                        <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                            Already have an account?{' '}
                            <ThemedText
                                style={[styles.footerLink, { color: colors.accent }]}
                                onPress={() => router.replace('/login')}
                            >
                                Sign in
                            </ThemedText>
                        </ThemedText>
                    </View>
                </ScrollView>
            </ThemedView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 60,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingTop: 60,
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    errorClose: {
        padding: 4,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E5E7EB',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
    },
    profilePictureSection: {
        alignItems: 'center',
        marginBottom: 32,
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
        borderWidth: 3,
        borderColor: '#fff',
    },
    photoHint: {
        fontSize: 14,
        textAlign: 'center',
    },
    inputGroup: {
        gap: 16,
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    textAreaContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
    },
    textArea: {
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 40,
    },
    footerText: {
        fontSize: 16,
        textAlign: 'center',
    },
    footerLink: {
        fontWeight: '600',
    },
});