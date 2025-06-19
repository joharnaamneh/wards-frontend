import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    ScrollView,
    Image,
    View,
    Alert
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { NewOutfitForm } from '@/types/OutfitTypes';
import { WardrobeItem } from '@/types/WardrobeTypes';

interface AddOutfitModalProps {
    visible: boolean;
    wardrobeItems: WardrobeItem[];
    onClose: () => void;
    onSubmit: (outfit: Omit<NewOutfitForm, 'id' | 'created_at'>) => void;
    colorScheme: 'light' | 'dark' | null;
}

const occasions = ['Casual', 'Work', 'Formal', 'Party', 'Date', 'Sport', 'Travel', 'Other'];
const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'AllSeasons'];

export const AddOutfitModal: React.FC<AddOutfitModalProps> = ({
                                                                  visible,
                                                                  wardrobeItems,
                                                                  onClose,
                                                                  onSubmit,
                                                                  colorScheme
                                                              }) => {
    const initial: NewOutfitForm = {
        name: '',
        description: '',
        occasion: 'Casual',
        season: 'AllSeasons',
        items: [],
        image: '',
        favorite: false
    };

    const [form, setForm] = useState<NewOutfitForm>(initial);
    const [activeDropdown, setActiveDropdown] = useState<'occasion' | 'season' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isDark = colorScheme === 'dark';
    const colors = {
        background: isDark ? '#1c1c1e' : '#fff',
        surface: isDark ? '#2c2c2e' : '#f8f9fa',
        border: isDark ? '#444' : '#e0e0e0',
        text: isDark ? '#fff' : '#000',
        textSecondary: isDark ? '#888' : '#666',
        accent: '#007AFF',
        success: '#34C759',
        danger: '#FF3B30'
    };

    const reset = () => {
        setForm(initial);
        setSearchTerm('');
        setActiveDropdown(null);
        setSelectedCategory('All');
        setIsSubmitting(false);
    };

    const handleClose = () => {
        if (isSubmitting) return; // Prevent closing during submission
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            Alert.alert('Missing Information', 'Please enter a name for your outfit.');
            return;
        }
        if (form.items.length === 0) {
            Alert.alert('Missing Information', 'Please select at least one item for your outfit.');
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(form);
            reset();
        } catch (error) {
            console.error('Error creating outfit:', error);
            Alert.alert(
                'Error',
                'Failed to create outfit. Please check your permissions and try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleItem = (id: string) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.includes(id)
                ? prev.items.filter(x => x !== id)
                : [...prev.items, id]
        }));
    };

    const handleDropdownSelect = (type: 'occasion' | 'season', value: string) => {
        setForm(prev => ({ ...prev, [type]: value }));
        setActiveDropdown(null);
    };

    // Filter wardrobe items
    const filteredItems = wardrobeItems.filter(item => {
        const matchesSearch = searchTerm === '' ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.type === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Get unique categories
    const categories = ['All', ...Array.from(new Set(wardrobeItems.map(item => item.type)))];

    return (
        <Modal visible={visible} transparent animationType="slide">
            <ThemedView style={styles.overlay}>
                <ThemedView style={[styles.modal, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <ThemedText type="title">Create New Outfit</ThemedText>
                        <Pressable
                            onPress={handleClose}
                            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
                            disabled={isSubmitting}
                        >
                            <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Name Input */}
                        <View style={styles.section}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                Outfit Name *
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        borderColor: colors.border,
                                        color: colors.text,
                                        backgroundColor: colors.surface
                                    }
                                ]}
                                placeholder="Enter outfit name"
                                placeholderTextColor={colors.textSecondary}
                                value={form.name}
                                onChangeText={text => setForm(f => ({ ...f, name: text }))}
                                maxLength={50}
                                editable={!isSubmitting}
                            />
                        </View>

                        {/* Description Input */}
                        <View style={styles.section}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                Description
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    {
                                        borderColor: colors.border,
                                        color: colors.text,
                                        backgroundColor: colors.surface
                                    }
                                ]}
                                placeholder="Describe your outfit (optional)"
                                placeholderTextColor={colors.textSecondary}
                                value={form.description}
                                onChangeText={text => setForm(f => ({ ...f, description: text }))}
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                                editable={!isSubmitting}
                            />
                        </View>

                        {/* Occasion & Season Row */}
                        <View style={styles.row}>
                            <View style={[styles.section, styles.half]}>
                                <ThemedText type="defaultSemiBold" style={styles.label}>
                                    Occasion
                                </ThemedText>
                                <Pressable
                                    style={[
                                        styles.dropdown,
                                        {
                                            borderColor: activeDropdown === 'occasion' ? colors.accent : colors.border,
                                            backgroundColor: colors.surface
                                        }
                                    ]}
                                    onPress={() => setActiveDropdown(activeDropdown === 'occasion' ? null : 'occasion')}
                                    disabled={isSubmitting}
                                >
                                    <ThemedText>{form.occasion}</ThemedText>
                                    <IconSymbol
                                        name={activeDropdown === 'occasion' ? 'chevron.up' : 'chevron.down'}
                                        size={16}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                                {activeDropdown === 'occasion' && (
                                    <View
                                        style={[
                                            styles.dropdownList,
                                            {
                                                backgroundColor: colors.background,
                                                borderColor: colors.border,
                                                shadowColor: colors.text
                                            }
                                        ]}
                                    >
                                        {occasions.map(occasion => (
                                            <Pressable
                                                key={occasion}
                                                style={[
                                                    styles.dropdownItem,
                                                    form.occasion === occasion && { backgroundColor: colors.surface }
                                                ]}
                                                onPress={() => handleDropdownSelect('occasion', occasion)}
                                            >
                                                <ThemedText
                                                    style={[
                                                        form.occasion === occasion && {
                                                            color: colors.accent,
                                                            fontWeight: '600'
                                                        }
                                                    ]}
                                                >
                                                    {occasion}
                                                </ThemedText>
                                                {form.occasion === occasion && (
                                                    <IconSymbol name="checkmark" size={16} color={colors.accent} />
                                                )}
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={[styles.section, styles.half]}>
                                <ThemedText type="defaultSemiBold" style={styles.label}>
                                    Season
                                </ThemedText>
                                <Pressable
                                    style={[
                                        styles.dropdown,
                                        {
                                            borderColor: activeDropdown === 'season' ? colors.accent : colors.border,
                                            backgroundColor: colors.surface
                                        }
                                    ]}
                                    onPress={() => setActiveDropdown(activeDropdown === 'season' ? null : 'season')}
                                    disabled={isSubmitting}
                                >
                                    <ThemedText>{form.season}</ThemedText>
                                    <IconSymbol
                                        name={activeDropdown === 'season' ? 'chevron.up' : 'chevron.down'}
                                        size={16}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                                {activeDropdown === 'season' && (
                                    <View
                                        style={[
                                            styles.dropdownList,
                                            {
                                                backgroundColor: colors.background,
                                                borderColor: colors.border,
                                                shadowColor: colors.text
                                            }
                                        ]}
                                    >
                                        {seasons.map(season => (
                                            <Pressable
                                                key={season}
                                                style={[
                                                    styles.dropdownItem,
                                                    form.season === season && { backgroundColor: colors.surface }
                                                ]}
                                                onPress={() => handleDropdownSelect('season', season)}
                                            >
                                                <ThemedText
                                                    style={[
                                                        form.season === season && {
                                                            color: colors.accent,
                                                            fontWeight: '600'
                                                        }
                                                    ]}
                                                >
                                                    {season}
                                                </ThemedText>
                                                {form.season === season && (
                                                    <IconSymbol name="checkmark" size={16} color={colors.accent} />
                                                )}
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Items Selection */}
                        <View style={styles.section}>
                            <View style={styles.itemsHeader}>
                                <ThemedText type="defaultSemiBold" style={styles.label}>
                                    Select Items * ({form.items.length} selected)
                                </ThemedText>
                                {form.items.length > 0 && (
                                    <Pressable
                                        onPress={() => setForm(prev => ({ ...prev, items: [] }))}
                                        style={styles.clearButton}
                                        disabled={isSubmitting}
                                    >
                                        <ThemedText style={[styles.clearButtonText, { color: colors.danger }]}>
                                            Clear All
                                        </ThemedText>
                                    </Pressable>
                                )}
                            </View>

                            {/* Search Input */}
                            <TextInput
                                style={[
                                    styles.searchInput,
                                    {
                                        borderColor: colors.border,
                                        color: colors.text,
                                        backgroundColor: colors.surface
                                    }
                                ]}
                                placeholder="Search items..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                editable={!isSubmitting}
                            />

                            {/* Category Filter */}
                            <ScrollView
                                horizontal
                                style={styles.categoryScroll}
                                showsHorizontalScrollIndicator={false}
                            >
                                {categories.map(category => (
                                    <Pressable
                                        key={category}
                                        style={[
                                            styles.categoryChip,
                                            {
                                                backgroundColor: selectedCategory === category ? colors.accent : colors.surface,
                                                borderColor: colors.border
                                            }
                                        ]}
                                        onPress={() => setSelectedCategory(category)}
                                        disabled={isSubmitting}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.categoryChipText,
                                                { color: selectedCategory === category ? '#fff' : colors.text }
                                            ]}
                                        >
                                            {category}
                                        </ThemedText>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* Items List */}
                            <ScrollView
                                style={[styles.itemsList, { borderColor: colors.border }]}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled
                            >
                                {filteredItems.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <IconSymbol name="magnifyingglass" size={32} color={colors.textSecondary} />
                                        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            No items found
                                        </ThemedText>
                                    </View>
                                ) : (
                                    filteredItems.map(item => {
                                        const isSelected = form.items.includes(item.id);
                                        return (
                                            <Pressable
                                                key={item.id}
                                                style={[
                                                    styles.itemCard,
                                                    {
                                                        borderColor: isSelected ? colors.accent : colors.border,
                                                        backgroundColor: isSelected ? `${colors.accent}15` : colors.surface
                                                    }
                                                ]}
                                                onPress={() => toggleItem(item.id)}
                                                disabled={isSubmitting}
                                            >
                                                {item.image ? (
                                                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                                                ) : (
                                                    <View
                                                        style={[
                                                            styles.itemImage,
                                                            styles.placeholderImage,
                                                            { backgroundColor: colors.border }
                                                        ]}
                                                    >
                                                        <IconSymbol name="camera" size={20} color={colors.textSecondary} />
                                                    </View>
                                                )}
                                                <View style={styles.itemInfo}>
                                                    <ThemedText type="defaultSemiBold" numberOfLines={1}>
                                                        {item.name}
                                                    </ThemedText>
                                                    <ThemedText style={[styles.itemType, { color: colors.textSecondary }]}>
                                                        {item.type}
                                                    </ThemedText>
                                                    {item.color && (
                                                        <ThemedText style={[styles.itemColor, { color: colors.textSecondary }]}>
                                                            {item.color}
                                                        </ThemedText>
                                                    )}
                                                </View>
                                                {isSelected && (
                                                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.accent} />
                                                )}
                                            </Pressable>
                                        );
                                    })
                                )}
                            </ScrollView>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <Pressable
                            onPress={handleSubmit}
                            style={[
                                styles.button,
                                styles.primaryButton,
                                {
                                    backgroundColor: (!form.name.trim() || form.items.length === 0 || isSubmitting)
                                        ? colors.border
                                        : colors.accent
                                }
                            ]}
                            disabled={!form.name.trim() || form.items.length === 0 || isSubmitting}
                        >
                            <ThemedText
                                style={[
                                    styles.buttonText,
                                    {
                                        color: (!form.name.trim() || form.items.length === 0 || isSubmitting)
                                            ? colors.textSecondary
                                            : '#fff'
                                    }
                                ]}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Outfit'}
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={handleClose}
                            style={[styles.button, styles.secondaryButton, { backgroundColor: colors.surface }]}
                            disabled={isSubmitting}
                        >
                            <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                                Cancel
                            </ThemedText>
                        </Pressable>
                    </View>
                </ThemedView>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        maxHeight: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    closeBtn: {
        padding: 8,
        borderRadius: 12,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    half: {
        flex: 1,
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        position: 'relative',
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 12,
        maxHeight: 200,
        zIndex: 1000,
        elevation: 5,
        marginTop: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    itemsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    clearButton: {
        padding: 4,
    },
    clearButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    searchInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    categoryScroll: {
        marginBottom: 12,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 8,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    itemsList: {
        maxHeight: 250,
        borderWidth: 1,
        borderRadius: 12,
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 8,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        gap: 2,
    },
    itemType: {
        fontSize: 14,
    },
    itemColor: {
        fontSize: 12,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButton: {
        // Primary button styles handled dynamically
    },
    secondaryButton: {
        // Secondary button styles handled dynamically
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});