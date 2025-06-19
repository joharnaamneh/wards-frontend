import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ProfileStatsProps {
    stats: {
        outfits: number;
        items: number;
        favorites: number;
        categories: number;
    };
    colors: any;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats, colors }) => {
    const statItems = [
        {
            key: 'outfits',
            label: 'Outfits',
            value: stats.outfits,
            icon: 'shirt.fill',
            color: colors.accent,
        },
        {
            key: 'items',
            label: 'Items',
            value: stats.items,
            icon: 'tag.fill',
            color: colors.success,
        },
        {
            key: 'favorites',
            label: 'Favorites',
            value: stats.favorites,
            icon: 'heart.fill',
            color: '#FF3B30',
        },
        {
            key: 'categories',
            label: 'Categories',
            value: stats.categories,
            icon: 'square.grid.2x2.fill',
            color: colors.warning,
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
                <IconSymbol name="chart.bar.fill" size={20} color={colors.accent} />
                <ThemedText type="defaultSemiBold" style={styles.title}>
                    Your Stats
                </ThemedText>
            </View>

            <View style={styles.statsGrid}>
                {statItems.map((item) => (
                    <View key={item.key} style={[styles.statItem, { backgroundColor: colors.surface }]}>
                        <View style={[styles.statIcon, { backgroundColor: `${item.color}20` }]}>
                            <IconSymbol name={item.icon} size={20} color={item.color} />
                        </View>
                        <ThemedText type="title" style={styles.statValue}>
                            {item.value}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {item.label}
                        </ThemedText>
                    </View>
                ))}
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
                <View style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                        <ThemedText style={[styles.progressLabel, { color: colors.textSecondary }]}>
                            Wardrobe Utilization
                        </ThemedText>
                        <ThemedText style={[styles.progressValue, { color: colors.accent }]}>
                            {stats.outfits > 0 && stats.items > 0
                                ? Math.round((stats.outfits / stats.items) * 100)
                                : 0}%
                        </ThemedText>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: colors.accent,
                                    width: `${stats.outfits > 0 && stats.items > 0
                                        ? Math.min((stats.outfits / stats.items) * 100, 100)
                                        : 0}%`
                                }
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                        <ThemedText style={[styles.progressLabel, { color: colors.textSecondary }]}>
                            Favorite Rate
                        </ThemedText>
                        <ThemedText style={[styles.progressValue, { color: '#FF3B30' }]}>
                            {stats.outfits > 0
                                ? Math.round((stats.favorites / stats.outfits) * 100)
                                : 0}%
                        </ThemedText>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: '#FF3B30',
                                    width: `${stats.outfits > 0
                                        ? (stats.favorites / stats.outfits) * 100
                                        : 0}%`
                                }
                            ]}
                        />
                    </View>
                </View>
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    progressSection: {
        gap: 16,
    },
    progressItem: {
        gap: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 14,
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
});