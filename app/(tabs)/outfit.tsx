import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useWardrobeData } from '@/hooks/useWardrobeData';
import { useOutfitData } from '@/hooks/useOutfitData';
import { OutfitsList } from '@/components/OutfitsList';
import { OutfitDetailsModal } from '@/components/OutfitDetailsModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import type { Outfit } from '@/types/OutfitTypes';
import type { WardrobeItem } from '@/types/WardrobeTypes';
import {AddOutfitModal} from "@/components/AddOutfitModal";

export default function OutfitScreen() {
    const colorScheme = useColorScheme();
    const { items: wardrobeItems, loading: wkLoading, refreshItems } = useWardrobeData();
    const { outfits, loading: ofLoading, addOutfit, deleteOutfit, toggleFavorite, refreshOutfits } = useOutfitData();

    const [adding, setAdding] = useState(false);
    const [detail, setDetail] = useState<Outfit | null>(null);

    useEffect(() => {
        if (!wkLoading) refreshItems();
    }, []);

    // group outfits by occasion
    const grouped = outfits.reduce((acc, of) => {
        const key = of.occasion || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(of);
        return acc;
    }, {} as Record<string, Outfit[]>);

    if (wkLoading || ofLoading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator size="large" />
                <ThemedText>Loading...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
                headerImage={
                    <IconSymbol
                        size={310}
                        color="#808080"
                        name="shirt.fill"
                        style={styles.headerIcon}
                    />
                }
            >
                <ThemedView style={styles.titleSection}>
                    <ThemedText type="title">Outfits</ThemedText>
                    <ThemedText>Capture and combine your lookbook</ThemedText>
                </ThemedView>

                <OutfitsList
                    groupedOutfits={grouped}
                    totalOutfits={outfits.length}
                    onOutfitPress={setDetail}
                    onFavoritePress={toggleFavorite}
                    colorScheme={colorScheme}
                />
            </ParallaxScrollView>

            <FloatingActionButton onPress={() => setAdding(true)} />

            <AddOutfitModal
                visible={adding}
                wardrobeItems={wardrobeItems as WardrobeItem[]}
                onClose={() => setAdding(false)}
                onSubmit={async (form) => {
                    await addOutfit(form);
                    setAdding(false);
                }}
                colorScheme={colorScheme}
            />

            <OutfitDetailsModal
                outfit={detail}
                wardrobeItems={wardrobeItems as WardrobeItem[]}
                onClose={() => setDetail(null)}
                onDelete={async (id) => {
                    await deleteOutfit(id);
                    setDetail(null);
                }}
                onToggleFavorite={toggleFavorite}
                colorScheme={colorScheme}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerIcon: { position: 'absolute', bottom: -90, left: -35 },
    titleSection: { paddingHorizontal: 16, marginBottom: 16, gap: 4 },
});