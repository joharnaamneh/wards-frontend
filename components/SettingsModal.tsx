import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    ScrollView,
    View,
    Alert,
    Switch,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    colors: any;
    onSignOut: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
                                                                visible,
                                                                onClose,
                                                                colors,
                                                                onSignOut,
                                                            }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [privateProfile, setPrivateProfile] = useState(false);

    const settingsSections = [
        {
            title: 'Preferences',
            items: [
                {
                    key: 'notifications',
                    label: 'Push Notifications',
                    icon: 'bell.fill',
                    type: 'toggle',
                    value: notificationsEnabled,
                    onToggle: setNotificationsEnabled,
                },
                {
                    key: 'darkmode',
                    label: 'Dark Mode',
                    icon: 'moon.fill',
                    type: 'toggle',
                    value: darkModeEnabled,
                    onToggle: setDarkModeEnabled,
                },
            ],
        },
        {
            title: 'Privacy',
            items: [
                {
                    key: 'private',
                    label: 'Private Profile',
                    icon: 'lock.fill',
                    type: 'toggle',
                    value: privateProfile,
                    onToggle: setPrivateProfile,
                },
                {
                    key: 'data',
                    label: 'Data & Privacy',
                    icon: 'shield.fill',
                    type: 'action',
                    onPress: () => Alert.alert('Data & Privacy', 'Data settings coming soon!'),
                },
            ],
        },
        {
            title: 'Support',
            items: [
                {
                    key: 'help',
                    label: 'Help Center',
                    icon: 'questionmark.circle.fill',
                    type: 'action',
                    onPress: () => Alert.alert('Help Center', 'Help documentation coming soon!'),
                },
                {
                    key: 'feedback',
                    label: 'Send Feedback',
                    icon: 'envelope.fill',
                    type: 'action',
                    onPress: () => Alert.alert('Feedback', 'Feedback form coming soon!'),
                },
                {
                    key: 'about',
                    label: 'About Wards',
                    icon: 'info.circle.fill',
                    type: 'action',
                    onPress: () => Alert.alert('About Wards', 'Wards v1.0.0\nMade with ❤️ for fashion lovers'),
                },
            ],
        },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <IconSymbol name="xmark" size={20} color={colors.text} />
                    </Pressable>
                    <ThemedText type="title" style={styles.headerTitle}>
                        Settings
                    </ThemedText>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {settingsSections.map((section) => (
                        <View key={section.title} style={styles.section}>
                            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                {section.title.toUpperCase()}
                            </ThemedText>

                            <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                {section.items.map((item, index) => (
                                    <View key={item.key}>
                                        <Pressable
                                            style={[styles.settingItem, item.type === 'action' ? {} : styles.disabledPress]}
                                            onPress={item.type === 'action' ? item.onPress : undefined}
                                        >
                                            <View style={styles.settingLeft}>
                                                <View style={[styles.settingIcon, { backgroundColor: `${colors.accent}20` }]}>
                                                    <IconSymbol name={item.icon} size={18} color={colors.accent} />
                                                </View>
                                                <ThemedText style={styles.settingLabel}>{item.label}</ThemedText>
                                            </View>

                                            {item.type === 'toggle' && (
                                                <Switch
                                                    value={item.value}
                                                    onValueChange={item.onToggle}
                                                    trackColor={{ false: colors.border, true: colors.accent }}
                                                    thumbColor="#fff"
                                                />
                                            )}

                                            {item.type === 'action' && (
                                                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                                            )}
                                        </Pressable>

                                        {index < section.items.length - 1 && (
                                            <View style={[styles.separator, { backgroundColor: colors.border }]} />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Sign Out Button */}
                    <View style={styles.section}>
                        <Pressable
                            style={[styles.signOutButton, { backgroundColor: colors.danger }]}
                            onPress={() => {
                                onClose();
                                onSignOut();
                            }}
                        >
                            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#fff" />
                            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
                        </Pressable>
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
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
    },
    section: {
        margin: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionContent: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    disabledPress: {
        // Disable press feedback for toggle items
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 16,
        flex: 1,
    },
    separator: {
        height: 1,
        marginLeft: 60,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    signOutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});