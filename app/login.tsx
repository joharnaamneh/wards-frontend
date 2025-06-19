// app/login.tsx
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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface LoginForm {
    email: string;
    password: string;
}

export default function LoginScreen() {
    const [form, setForm] = useState<LoginForm>({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const validateForm = () => {
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
        return true;
    };

    const handleLogin = async () => {
        setError(null);

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, form.email, form.password);
            console.log('Login successful');
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Login error:', error);

            let errorMessage = 'Failed to sign in. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
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

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                {renderErrorBanner()}

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Welcome Section */}
                    <View style={styles.welcomeSection}>
                        <View style={[styles.logoContainer, { backgroundColor: colors.accent }]}>
                            <IconSymbol name="person.circle.fill" size={48} color="#fff" />
                        </View>
                        <ThemedText type="title" style={styles.welcomeTitle}>
                            Welcome Back
                        </ThemedText>
                        <ThemedText style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                            Sign in to continue to your wardrobe
                        </ThemedText>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formSection}>
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
                                    placeholder="Password"
                                    placeholderTextColor={colors.textSecondary}
                                    style={[styles.input, { color: colors.text }]}
                                    value={form.password}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, password: text }))}
                                    secureTextEntry
                                    autoComplete="current-password"
                                />
                            </View>
                        </View>

                        {/* Forgot Password */}
                        <Pressable style={styles.forgotPassword}>
                            <ThemedText style={[styles.forgotPasswordText, { color: colors.accent }]}>
                                Forgot Password?
                            </ThemedText>
                        </Pressable>

                        {/* Login Button */}
                        <Pressable
                            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
                                    <IconSymbol name="arrow.right" size={16} color="#fff" />
                                </>
                            )}
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                            <ThemedText style={[styles.dividerText, { color: colors.textSecondary }]}>
                                or
                            </ThemedText>
                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        </View>

                        {/* Social Login Buttons */}
                        <View style={styles.socialButtonsContainer}>
                            <Pressable style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <IconSymbol name="applelogo" size={20} color={colors.text} />
                                <ThemedText style={[styles.socialButtonText, { color: colors.text }]}>
                                    Continue with Apple
                                </ThemedText>
                            </Pressable>

                            <Pressable style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <IconSymbol name="globe" size={20} color={colors.text} />
                                <ThemedText style={[styles.socialButtonText, { color: colors.text }]}>
                                    Continue with Google
                                </ThemedText>
                            </Pressable>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                            Don't have an account?{' '}
                            <ThemedText
                                style={[styles.footerLink, { color: colors.accent }]}
                                onPress={() => router.replace('/register')}
                            >
                                Sign up
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
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    formSection: {
        flex: 1,
    },
    inputGroup: {
        gap: 16,
        marginBottom: 16,
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
    forgotPassword: {
        alignItems: 'flex-end',
        marginBottom: 32,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '500',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        marginBottom: 32,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 14,
    },
    socialButtonsContainer: {
        gap: 12,
        marginBottom: 32,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '500',
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