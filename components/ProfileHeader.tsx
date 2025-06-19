import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/types/UserTypes';

interface ProfileHeaderProps {
    userProfile: UserProfile | null;
    colors: any;
    onEditPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
                                                                userProfile,
                                                                colors,
                                                                onEditPress
                                                            }) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.headerContent}>
                {/* Profile Picture */}
                <View style={styles.profilePictureContainer}>
                    {userProfile?.profilePicture ? (
                        <Image
                            source={{ uri: userProfile.profilePicture }}
                            style={styles.profilePicture}
                        />
                    ) : (
                        <View style={[styles.profilePicture, styles.placeholderPicture, { backgroundColor: colors.accent }]}>
                            <ThemedText style={styles.initials}>
                                {userProfile?.displayName ? getInitials(userProfile.displayName) : 'U'}
                            </ThemedText>
                        </View>
                    )}

                    {/* Online Status Indicator */}
                    <View style={[styles.statusIndicator, { backgroundColor: colors.success }]} />
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <ThemedText type="title" style={styles.displayName}>
                        {userProfile?.displayName || 'User'}
                    </ThemedText>

                    {userProfile?.username && (
                        <ThemedText style={[styles.username, { color: colors.textSecondary }]}>
                            @{userProfile.username}
                        </ThemedText>
                    )}

                    {userProfile?.bio && (
                        <ThemedText style={[styles.bio, { color: colors.textSecondary }]}>
                            {userProfile.bio}
                        </ThemedText>
                    )}

                    {userProfile?.location && (
                        <View style={styles.locationContainer}>
                            <IconSymbol name="location" size={14} color={colors.textSecondary} />
                            <ThemedText style={[styles.location, { color: colors.textSecondary }]}>
                                {userProfile.location}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Edit Button */}
                <Pressable
                    style={[styles.editButton, { backgroundColor: colors.accent }]}
                    onPress={onEditPress}
                >
                    <IconSymbol name="pencil" size={16} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: 60, // Account for status bar
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    profilePictureContainer: {
        position: 'relative',
    },
    profilePicture: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    placeholderPicture: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#fff',
    },
    userInfo: {
        flex: 1,
        gap: 4,
    },
    displayName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 16,
        fontWeight: '500',
    },
    bio: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    location: {
        fontSize: 12,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});