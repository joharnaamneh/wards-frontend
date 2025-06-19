import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Pressable,
    Alert,
    View,
    Dimensions
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';

import { useWardrobeData } from '@/hooks/useWardrobeData';
import { useOutfitData } from '@/hooks/useOutfitData';

import { auth } from '@/firebaseConfig';
import { signOut } from 'firebase/auth';
import {useUserProfile} from "@/hooks/useUserProfile";
import {ProfileHeader} from "@/components/ProfileHeader";
import {ProfileStats} from "@/components/ProfileStats";
import {ProfileActions} from "@/components/ProfileActions";
import {EditProfileModal} from "@/components/EditProfileModal";
import {SettingsModal} from "@/components/SettingsModal";

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const { userProfile, loading: profileLoading, updateProfile } = useUserProfile();
    const { items: wardrobeItems, loading: wardrobeLoading } = useWardrobeData();
    const { outfits, loading: outfitsLoading } = useOutfitData();

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);

    const isDark = colorScheme === 'dark';
    const colors = {
        background: isDark ? '#000' : '#fff',
        surface: isDark ? '#1c1c1e' : '#f8f9fa',
        card: isDark ? '#2c2c2e' : '#fff',
        border: isDark ? '#444' : '#e0e0e0',
        text: isDark ? '#fff' : '#000',
        textSecondary: isDark ? '#888' : '#666',
        accent: '#007AFF',
        danger: '#FF3B30',
        success: '#34C759',
        warning: '#FF9500'
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                        } catch (error) {
                            console.error('Error signing out:', error);
                            Alert.alert('Error', 'Failed to sign out. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        setEditModalVisible(true);
    };

    const handleSettings = () => {
        setSettingsModalVisible(true);
    };

    const handleShareProfile = () => {
        // Implement share functionality
        Alert.alert('Share Profile', 'Share functionality coming soon!');
    };

    if (profileLoading || wardrobeLoading || outfitsLoading) {
        return (
            <ThemedView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                    Loading profile...
                </ThemedText>
            </ThemedView>
        );
    }

    const stats = {
        outfits: outfits.length,
        items: wardrobeItems.length,
        favorites: outfits.filter(outfit => outfit.favorite).length,
        categories: new Set(wardrobeItems.map(item => item.type)).size
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header */}
                <ProfileHeader
                    userProfile={userProfile}
                    colors={colors}
                    onEditPress={handleEditProfile}
                />

                {/* Profile Stats */}
                <ProfileStats
                    stats={stats}
                    colors={colors}
                />

                {/* Quick Actions */}
                <ProfileActions
                    colors={colors}
                    onEditProfile={handleEditProfile}
                    onSettings={handleSettings}
                    onShareProfile={handleShareProfile}
                    onSignOut={handleSignOut}
                />

                {/* Recent Activity Section */}
                <ThemedView style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="clock" size={20} color={colors.accent} />
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                            Recent Activity
                        </ThemedText>
                    </View>

                    <View style={styles.activityList}>
                        {outfits.slice(0, 3).map((outfit, index) => (
                            <View key={outfit.id} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
                                <View style={[styles.activityIcon, { backgroundColor: `${colors.accent}20` }]}>
                                    <IconSymbol name="shirt.fill" size={16} color={colors.accent} />
                                </View>
                                <View style={styles.activityContent}>
                                    <ThemedText numberOfLines={1}>Created "{outfit.name}"</ThemedText>
                                    <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                                        {outfit.occasion} • {outfit.season}
                                    </ThemedText>
                                </View>
                            </View>
                        ))}

                        {outfits.length === 0 && (
                            <View style={styles.emptyActivity}>
                                <IconSymbol name="tray" size={32} color={colors.textSecondary} />
                                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No recent activity
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </ThemedView>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <ThemedText style={[styles.appVersion, { color: colors.textSecondary }]}>
                        Wards v1.0.0
                    </ThemedText>
                    <ThemedText style={[styles.copyright, { color: colors.textSecondary }]}>
                        Made with ❤️ for fashion lovers
                    </ThemedText>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <EditProfileModal
                visible={editModalVisible}
                userProfile={userProfile}
                onClose={() => setEditModalVisible(false)}
                onSave={updateProfile}
                colors={colors}
            />

            {/* Settings Modal */}
            <SettingsModal
                visible={settingsModalVisible}
                onClose={() => setSettingsModalVisible(false)}
                colors={colors}
                onSignOut={handleSignOut}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    section: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
    },
    activityList: {
        gap: 12,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
        gap: 2,
    },
    activityTime: {
        fontSize: 12,
    },
    emptyActivity: {
        alignItems: 'center',
        padding: 20,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
    },
    appInfo: {
        alignItems: 'center',
        marginTop: 20,
        gap: 4,
    },
    appVersion: {
        fontSize: 12,
    },
    copyright: {
        fontSize: 12,
    },
});