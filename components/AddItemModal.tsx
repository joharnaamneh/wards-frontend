import React, { useState } from 'react';
import {
    Modal,
    View,
    Pressable,
    StyleSheet,
    TextInput,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { WardrobeItem } from '@/types/WardrobeTypes';

const storage = getStorage();

// Clothing categories and types
const CLOTHING_CATEGORIES = {
    'Tops': ['T-Shirt', 'Shirt', 'Blouse', 'Tank Top', 'Sweater', 'Hoodie', 'Cardigan', 'Blazer', 'Vest'],
    'Bottoms': ['Jeans', 'Pants', 'Shorts', 'Skirt', 'Leggings', 'Sweatpants', 'Dress Pants', 'Cargo Pants'],
    'Dresses & Suits': ['Dress', 'Jumpsuit', 'Romper', 'Suit', 'Two-piece Set'],
    'Outerwear': ['Jacket', 'Coat', 'Windbreaker', 'Puffer Jacket', 'Trench Coat', 'Bomber Jacket', 'Denim Jacket'],
    'Footwear': ['Sneakers', 'Dress Shoes', 'Boots', 'Sandals', 'Heels', 'Flats', 'Loafers', 'Athletic Shoes'],
    'Accessories': ['Hat', 'Scarf', 'Belt', 'Bag', 'Jewelry', 'Watch', 'Sunglasses', 'Tie', 'Bow Tie'],
    'Underwear & Sleepwear': ['Underwear', 'Bra', 'Socks', 'Tights', 'Pajamas', 'Nightgown', 'Robe'],
    'Activewear': ['Gym Top', 'Yoga Pants', 'Sports Bra', 'Athletic Shorts', 'Track Suit', 'Swimwear']
};

const SIZES = {
    'Clothing': ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    'Shoes': ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13'],
    'One Size': ['One Size']
};

const COLORS = [
    'Black', 'White', 'Gray', 'Navy', 'Blue', 'Light Blue', 'Red', 'Pink',
    'Green', 'Olive', 'Yellow', 'Orange', 'Purple', 'Brown', 'Beige', 'Cream',
    'Gold', 'Silver', 'Multi-Color', 'Pattern'
];

interface AddItemModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (item: Omit<WardrobeItem, 'id' | 'created_at'>) => Promise<void>;
    colorScheme: 'light' | 'dark' | null;
}

interface DropdownProps {
    options: string[];
    value: string;
    onSelect: (value: string) => void;
    placeholder: string;
    colorScheme: 'light' | 'dark' | null;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onSelect, placeholder, colorScheme }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.dropdownContainer}>
            <Pressable
                style={[
                    styles.dropdownButton,
                    {
                        borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                        backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff'
                    }
                ]}
                onPress={() => setIsOpen(!isOpen)}
            >
                <ThemedText style={[
                    styles.dropdownButtonText,
                    !value && { color: colorScheme === 'dark' ? '#888' : '#666' }
                ]}>
                    {value || placeholder}
                </ThemedText>
                <IconSymbol
                    name={isOpen ? 'chevron.up' : 'chevron.down'}
                    size={16}
                    color={colorScheme === 'dark' ? '#888' : '#666'}
                />
            </Pressable>

            {isOpen && (
                <View style={[
                    styles.dropdownList,
                    {
                        backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                        borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                    }
                ]}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {options.map((option, index) => (
                            <Pressable
                                key={index}
                                style={[
                                    styles.dropdownOption,
                                    value === option && styles.selectedOption
                                ]}
                                onPress={() => {
                                    onSelect(option);
                                    setIsOpen(false);
                                }}
                            >
                                <ThemedText style={[
                                    styles.dropdownOptionText,
                                    value === option && styles.selectedOptionText
                                ]}>
                                    {option}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export const AddItemModal: React.FC<AddItemModalProps> = ({ visible, onClose, onSubmit, colorScheme }) => {
    const [newPiece, setNewPiece] = useState({
        name: '',
        type: '',
        size: '',
        brand: '',
        color: '',
        material: '',
        category: ''
    });
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);

    const resetForm = () => {
        setNewPiece({
            name: '',
            type: '',
            size: '',
            brand: '',
            color: '',
            material: '',
            category: ''
        });
        setImageUri(null);
        setShowImageOptions(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const requestPermissions = async (): Promise<boolean> => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Camera and photo library permissions are required to add images.'
            );
            return false;
        }
        return true;
    };

    const compressImage = async (uri: string): Promise<string> => {
        try {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 800 } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            return result.uri;
        } catch (e) {
            console.error('Image compress error', e);
            return uri;
        }
    };

    const uploadImageToFirebase = async (uri: string): Promise<string> => {
        const compressed = await compressImage(uri);
        const response = await fetch(compressed);
        const blob = await response.blob();

        // Option 1: Simple shared folder (use the Firebase rules above)
        const filename = `wardrobe_images/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;

        // Option 2: User-specific folder (requires auth and different rules)
        // const user = auth.currentUser;
        // if (!user) throw new Error('User not authenticated');
        // const filename = `wardrobe_images/${user.uid}/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;

        const imageRef = ref(storage, filename);
        await uploadBytes(imageRef, blob);
        return await getDownloadURL(imageRef);
    };

    const pickImageFromLibrary = async () => {
        const ok = await requestPermissions();
        if (!ok) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            aspect: [1, 1],
        });
        if (!result.canceled && result.assets?.[0]) {
            setImageUri(result.assets[0].uri);
            setShowImageOptions(false);
        }
    };

    const pickImageFromCamera = async () => {
        const ok = await requestPermissions();
        if (!ok) return;
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
            aspect: [1, 1],
        });
        if (!result.canceled && result.assets?.[0]) {
            setImageUri(result.assets[0].uri);
            setShowImageOptions(false);
        }
    };

    const handleSubmit = async () => {
        if (!newPiece.name.trim()) {
            Alert.alert('Required Field', 'Please enter a name for the item.');
            return;
        }
        if (!newPiece.type.trim()) {
            Alert.alert('Required Field', 'Please select a type for the item.');
            return;
        }

        setUploading(true);
        try {
            const imageUrl = imageUri ? await uploadImageToFirebase(imageUri) : '';

            // Create the item object without undefined fields
            const itemData: Omit<WardrobeItem, 'id' | 'created_at'> = {
                name: newPiece.name,
                type: newPiece.type,
                size: newPiece.size,
                brand: newPiece.brand,
                color: newPiece.color,
                material: newPiece.material,
                image: imageUrl,
            };

            await onSubmit(itemData);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Submit error', error);
            Alert.alert('Error', 'Failed to add item. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getAvailableTypes = () => {
        if (!newPiece.category) return [];
        return CLOTHING_CATEGORIES[newPiece.category] || [];
    };

    const getSizeOptions = () => {
        if (newPiece.category === 'Footwear') return SIZES['Shoes'];
        if (newPiece.category === 'Accessories') return SIZES['One Size'];
        return SIZES['Clothing'];
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <View style={[
                    styles.modal,
                    { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }
                ]}>
                    <View style={styles.header}>
                        <ThemedText type="title" style={styles.title}>Add New Item</ThemedText>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={20} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.form}>
                            {/* Image Section - moved to top for better UX */}
                            <View style={styles.imageSection}>
                                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Photo</ThemedText>

                                <Pressable
                                    onPress={() => setShowImageOptions(!showImageOptions)}
                                    style={styles.imageContainer}
                                >
                                    {imageUri ? (
                                        <>
                                            <Image source={{ uri: imageUri }} style={styles.preview} />
                                            <View style={styles.imageOverlay}>
                                                <IconSymbol name="pencil" size={20} color="#fff" />
                                            </View>
                                        </>
                                    ) : (
                                        <ThemedView style={[styles.preview, styles.placeholder]}>
                                            <IconSymbol name="camera" size={32} />
                                            <ThemedText type="caption" style={styles.placeholderText}>
                                                Tap to add photo
                                            </ThemedText>
                                        </ThemedView>
                                    )}
                                </Pressable>

                                {showImageOptions && (
                                    <View style={styles.imageOptions}>
                                        <Pressable onPress={pickImageFromCamera} style={styles.imageOptionButton}>
                                            <IconSymbol name="camera" size={20} />
                                            <ThemedText type="caption">Camera</ThemedText>
                                        </Pressable>
                                        <Pressable onPress={pickImageFromLibrary} style={styles.imageOptionButton}>
                                            <IconSymbol name="photo" size={20} />
                                            <ThemedText type="caption">Gallery</ThemedText>
                                        </Pressable>
                                        {imageUri && (
                                            <Pressable
                                                onPress={() => {
                                                    setImageUri(null);
                                                    setShowImageOptions(false);
                                                }}
                                                style={[styles.imageOptionButton, styles.removeButton]}
                                            >
                                                <IconSymbol name="trash" size={20} color="#ff3b30" />
                                                <ThemedText type="caption" style={{ color: '#ff3b30' }}>Remove</ThemedText>
                                            </Pressable>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Basic Information */}
                            <View style={styles.section}>
                                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Basic Information</ThemedText>

                                <View style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold">Name *</ThemedText>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                                                color: colorScheme === 'dark' ? '#fff' : '#000',
                                                backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff'
                                            }
                                        ]}
                                        placeholder="e.g., Blue Denim Jacket"
                                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                        value={newPiece.name}
                                        onChangeText={text => setNewPiece({ ...newPiece, name: text })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold">Category *</ThemedText>
                                    <Dropdown
                                        options={Object.keys(CLOTHING_CATEGORIES)}
                                        value={newPiece.category}
                                        onSelect={(category) => setNewPiece({ ...newPiece, category, type: '' })}
                                        placeholder="Select category"
                                        colorScheme={colorScheme}
                                    />
                                </View>

                                {newPiece.category && (
                                    <View style={styles.inputGroup}>
                                        <ThemedText type="defaultSemiBold">Type *</ThemedText>
                                        <Dropdown
                                            options={getAvailableTypes()}
                                            value={newPiece.type}
                                            onSelect={(type) => setNewPiece({ ...newPiece, type })}
                                            placeholder="Select type"
                                            colorScheme={colorScheme}
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Details */}
                            <View style={styles.section}>
                                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Details</ThemedText>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, styles.flex]}>
                                        <ThemedText type="defaultSemiBold">Size</ThemedText>
                                        <Dropdown
                                            options={getSizeOptions()}
                                            value={newPiece.size}
                                            onSelect={(size) => setNewPiece({ ...newPiece, size })}
                                            placeholder="Select size"
                                            colorScheme={colorScheme}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, styles.flex, { marginLeft: 12 }]}>
                                        <ThemedText type="defaultSemiBold">Color</ThemedText>
                                        <Dropdown
                                            options={COLORS}
                                            value={newPiece.color}
                                            onSelect={(color) => setNewPiece({ ...newPiece, color })}
                                            placeholder="Select color"
                                            colorScheme={colorScheme}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold">Brand</ThemedText>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                                                color: colorScheme === 'dark' ? '#fff' : '#000',
                                                backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff'
                                            }
                                        ]}
                                        placeholder="e.g., Nike, Zara, H&M"
                                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                        value={newPiece.brand}
                                        onChangeText={text => setNewPiece({ ...newPiece, brand: text })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText type="defaultSemiBold">Material</ThemedText>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                                                color: colorScheme === 'dark' ? '#fff' : '#000',
                                                backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff'
                                            }
                                        ]}
                                        placeholder="e.g., Cotton, Polyester, Denim"
                                        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                        value={newPiece.material}
                                        onChangeText={text => setNewPiece({ ...newPiece, material: text })}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable
                            onPress={handleSubmit}
                            style={[
                                styles.button,
                                styles.saveBtn,
                                (uploading || !newPiece.name.trim() || !newPiece.type.trim()) && styles.disabledButton
                            ]}
                            disabled={uploading || !newPiece.name.trim() || !newPiece.type.trim()}
                        >
                            {uploading ? (
                                <View style={styles.uploadingContainer}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <ThemedText style={[styles.saveText, { marginLeft: 8 }]}>Adding...</ThemedText>
                                </View>
                            ) : (
                                <ThemedText style={styles.saveText}>Add to Wardrobe</ThemedText>
                            )}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modal: {
        height: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    scrollContainer: {
        flex: 1,
    },
    form: {
        paddingBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 12,
        color: '#007AFF',
    },
    inputGroup: {
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    flex: {
        flex: 1,
    },

    // Image styles
    imageSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    imageContainer: {
        position: 'relative',
    },
    preview: {
        width: 140,
        height: 140,
        borderRadius: 16,
        marginVertical: 8,
    },
    placeholder: {
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    placeholderText: {
        marginTop: 8,
        textAlign: 'center',
    },
    imageOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 16,
        padding: 6,
    },
    imageOptions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 12,
    },
    imageOptionButton: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        minWidth: 80,
    },
    removeButton: {
        borderColor: '#ff3b30',
    },

    // Dropdown styles
    dropdownContainer: {
        position: 'relative',
        zIndex: 1000,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginTop: 4,
    },
    dropdownButtonText: {
        fontSize: 16,
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 12,
        maxHeight: 200,
        zIndex: 1001,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownOption: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedOption: {
        backgroundColor: '#007AFF20',
    },
    dropdownOptionText: {
        fontSize: 16,
    },
    selectedOptionText: {
        color: '#007AFF',
        fontWeight: '500',
    },

    // Footer styles
    footer: {
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtn: {
        backgroundColor: '#007AFF',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});