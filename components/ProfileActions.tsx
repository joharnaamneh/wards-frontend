import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ProfileActionsProps {
    colors: any;
    onEditProfile: () => void;
    onSettings: () => void;
    onShareProfile: () => void;
    onSignOut: () => void;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({
                                                                  colors,
                                                                  onEditProfile,
                                                                  onSettings,
                                                                  onShareProfile,
                                                                  onSignOut
                                                              }) => {
    const actions = [
        {
            key: 'edit',
            label: 'Edit Profile',
            icon: 'person.crop.circle',
            color: colors.accent,
            onPress: onEditProfile,
        },
        {
            key: 'settings',
            label: 'Settings',
            icon: 'gear',
            color: colors.textSecondary,
            onPress: onSettings,
        },
        {
            key: 'share',
            label: 'Share Profile',
            icon: 'square.and.arrow.up',
            color: colors.success,
            onPress: onShareProfile,
        },
        {
            key: 'signout',
            label: 'Sign Out',
            icon: 'rectangle.portrait.and.arrow.right',
            color: colors.danger,
            onPress: onSignOut,
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
                <IconSymbol name="list.bullet" size={20} color={colors.accent} />
                <ThemedText type="defaultSemiBold" style={styles.title}>
                    Quick Actions
                </ThemedText>
            </View>

            <View style={styles.actionsGrid}>
                {actions.map((action) => (
                    <Pressable
                        key={action.key}
                        style={[
                            styles.actionButton,
                            { backgroundColor: colors.surface, borderColor: colors.border }
                        ]}
                        onPress={action.onPress}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                            <IconSymbol name={action.icon} size={24} color={action.color} />
                        </View>
                        <ThemedText style={styles.actionLabel} numberOfLines={2}>
                            {action.label}
                        </ThemedText>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});