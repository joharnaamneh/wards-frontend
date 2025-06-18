// components/AddOutfitModal.tsx
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, ScrollView, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { NewOutfitForm } from '../types/OutfitTypes';
import { WardrobeItem } from '../types/WardrobeTypes';

interface AddOutfitModalProps {
    visible: boolean;
    wardrobeItems: WardrobeItem[];
    onClose: () => void;
    onSubmit: (outfit: Omit<NewOutfitForm, 'id' | 'created_at'>) => void;
    colorScheme: 'light' | 'dark' | null;
}

const occasions = ['Casual', 'Work', 'Formal', 'Party', 'Date', 'Sport', 'Travel', 'Other'];
const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'All Seasons'];

export const AddOutfitModal = ({ visible, wardrobeItems, onClose, onSubmit, colorScheme }: AddOutfitModalProps) => {
    const initialForm: NewOutfitForm = {
        name: '',
        description: '',
        occasion: 'Casual',
        season: 'All Seasons',
        items: [],
        image: '',
        favorite: false
    };

    const [form, setForm] = useState<NewOutfitForm>(initialForm);
    const [showOccasions, setShowOccasions] = useState(false);
    const [showSeasons, setShowSeasons] = useState(false);

    const handleSubmit = () => {
        onSubmit(form);
        setForm(initialForm);
    };

    const handleClose = () => {
        setForm(initialForm);
        onClose();
    };

    const toggleItemSelection = (itemId: string) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.includes(itemId)
                ? prev.items.filter(id => id !== itemId)
                : [...prev.items, itemId]
        }));
    };

    const selectedItems = wardrobeItems.filter(item => form.items.includes(item.id));

    return (
        <Modal visible={visible} transparent animationType="slide">
            <ThemedView style={styles.modalOverlay}>
                <ThemedView style={[
                    styles.modal,
                    { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }
                ]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <ThemedText type="title" style={styles.modalTitle}>Create New Outfit</ThemedText>

                        <ThemedView style={styles.formGroup}>
                            <ThemedText type="defaultSemiBold">Name *</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    color: colorScheme === 'dark' ? '#fff' : '#000',
                                    borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                }]}
                                placeholder="Enter outfit name"
                                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                value={form.name}
                                onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
                            />
                        </ThemedView>

                        <ThemedView style={styles.formGroup}>
                            <ThemedText type="defaultSemiBold">Description</ThemedText>
                            <TextInput
                                style={[styles.input, styles.textArea, {
                                    color: colorScheme === 'dark' ? '#fff' : '#000',
                                    borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                }]}
                                placeholder="Describe this outfit..."
                                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                value={form.description}
                                onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
                                multiline
                                numberOfLines={3}
                            />
                        </ThemedView>

                        <ThemedView style={styles.formRow}>
                            <ThemedView style={styles.formGroupHalf}>
                                <ThemedText type="defaultSemiBold">Occasion</ThemedText>
                                <Pressable
                                    style={[styles.dropdown, {
                                        borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                    }]}
                                    onPress={() => setShowOccasions(!showOccasions)}
                                >
                                    <ThemedText>{form.occasion}</ThemedText>
                                    <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#888' : '#666'} />
                                </Pressable>
                                {showOccasions && (
                                    <ThemedView style={[styles.dropdownList, {
                                        backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                                        borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                    }]}>
                                        {occasions.map(occasion => (
                                            <Pressable
                                                key={occasion}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setForm(prev => ({ ...prev, occasion }));
                                                    setShowOccasions(false);
                                                }}
                                            >
                                                <ThemedText>{occasion}</ThemedText>
                                            </Pressable>
                                        ))}
                                    </ThemedView>
                                )}
                            </ThemedView>

                            <ThemedView style={styles.formGroupHalf}>
                                <ThemedText type="defaultSemiBold">Season</ThemedText>
                                <Pressable
                                    style={[styles.dropdown, {
                                        borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                    }]}
                                    onPress={() => setShowSeasons(!showSeasons)}
                                >
                                    <ThemedText>{form.season}</ThemedText>
                                    <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#888' : '#666'} />
                                </Pressable>
                                {showSeasons && (
                                    <ThemedView style={[styles.dropdownList, {
                                        backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                                        borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                    }]}>
                                        {seasons.map(season => (
                                            <Pressable
                                                key={season}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setForm(prev => ({ ...prev, season }));
                                                    setShowSeasons(false);
                                                }}
                                            >
                                                <ThemedText>{season}</ThemedText>
                                            </Pressable>
                                        ))}
                                    </ThemedView>
                                )}
                            </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.formGroup}>
                            <ThemedText type="defaultSemiBold">
                                Select Items * ({form.items.length} selected)
                            </ThemedText>
                            <ScrollView
                                style={styles.itemsContainer}
                                showsVerticalScrollIndicator={false}
                            >
                                {wardrobeItems.map(item => {
                                    const isSelected = form.items.includes(item.id);
                                    return (
                                        <Pressable
                                            key={item.id}
                                            style={[
                                                styles.wardrobeItem,
                                                isSelected && styles.selectedItem,
                                                {
                                                    borderColor: isSelected
                                                        ? '#007AFF'
                                                        : (colorScheme === 'dark' ? '#444' : '#ddd')
                                                }
                                            ]}
                                            onPress={() => toggleItemSelection(item.id)}
                                        >
                                            {item.image ? (
                                                <Image
                                                    source={{ uri: item.image }}
                                                    style={styles.wardrobeItemImage}
                                                />
                                            ) : (
                                                <ThemedView style={[styles.wardrobeItemImage, styles.placeholderImage]}>
                                                    <IconSymbol
                                                        name="house.fill"
                                                        size={16}
                                                        color={colorScheme === 'dark' ? '#666' : '#ccc'}
                                                    />
                                                </ThemedView>
                                            )}
                                            <ThemedView style={styles.wardrobeItemInfo}>
                                                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                                                <ThemedText style={styles.wardrobeItemType}>{item.type}</ThemedText>
                                            </ThemedView>
                                            {isSelected && (
                                                <IconSymbol name="checkmark.circle.fill" size={20} color="#007AFF" />