import React, { useState, useRef } from 'react';
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
    ActivityIndicator,
    Switch,
    Dimensions,
    PanResponder, PixelRatio,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { WardrobeItem } from '@/types/WardrobeTypes';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
    withSpring,
} from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

const storage = getStorage();
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const targetPixelCount = 1080; // If you want full HD pictures
const pixelRatio = PixelRatio.get(); // The pixel ratio of the device
const pixels = targetPixelCount / pixelRatio;


const OCCASIONS = [
    'Casual',
    'Work',
    'Formal',
    'Party',
    'Sport',
    'Date',
    'Vacation',
    'Special Event'
];

interface OutfitItem extends WardrobeItem {
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    zIndex: number;
}

interface AddOutfitModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (outfit: any) => Promise<void>;
    colorScheme: 'light' | 'dark' | null;
    wardrobeItems: WardrobeItem[];
}

interface DropdownProps {
    options: string[];
    value: string;
    onSelect: (value: string) => void;
    placeholder: string;
    colorScheme: 'light' | 'dark' | null;
    zIndex: number;
}

const Dropdown: React.FC<DropdownProps> = ({
                                               options,
                                               value,
                                               onSelect,
                                               placeholder,
                                               colorScheme,
                                               zIndex
                                           }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={[styles.dropdownContainer, { zIndex: isOpen ? zIndex : 1 }]}>
            <Pressable
                style={[
                    styles.dropdownButton,
                    {
                        borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                        backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                    },
                ]}
                onPress={() => setIsOpen(!isOpen)}
            >
                <ThemedText
                    style={[
                        styles.dropdownButtonText,
                        !value && { color: colorScheme === 'dark' ? '#888' : '#666' },
                    ]}
                >
                    {value || placeholder}
                </ThemedText>
                <IconSymbol
                    name={isOpen ? 'chevron.up' : 'chevron.down'}
                    size={16}
                    color={colorScheme === 'dark' ? '#888' : '#666'}
                />
            </Pressable>
            {isOpen && (
                <View
                    style={[
                        styles.dropdownList,
                        {
                            backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                            borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                            zIndex: zIndex + 1,
                        },
                    ]}
                >
                    <ScrollView
                        style={styles.dropdownScroll}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={true}
                    >
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
                                <ThemedText
                                    style={[
                                        styles.dropdownOptionText,
                                        value === option && styles.selectedOptionText,
                                    ]}
                                >
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

interface DraggableItemProps {
    item: OutfitItem;
    onUpdate: (id: string, updates: Partial<OutfitItem>) => void;
    colorScheme: 'light' | 'dark' | null;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
                                                         item,
                                                         onUpdate,
                                                         colorScheme,
                                                         isSelected,
                                                         onSelect
                                                     }) => {
    const translateX = useSharedValue(item.position.x);
    const translateY = useSharedValue(item.position.y);
    const scale = useSharedValue(item.scale);
    const rotation = useSharedValue(item.rotation);
    const lastScale = useSharedValue(1);
    const lastRotation = useSharedValue(0);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            onSelect(item.id);
        },
        onPanResponderMove: (event, gestureState) => {
            // Handle single finger drag
            if (event.nativeEvent.touches.length === 1) {
                translateX.value = item.position.x + gestureState.dx;
                translateY.value = item.position.y + gestureState.dy;
            }
            // Handle pinch to scale
            else if (event.nativeEvent.touches.length === 2) {
                const touches = event.nativeEvent.touches;
                const distance = Math.sqrt(
                    Math.pow(touches[0].pageX - touches[1].pageX, 2) +
                    Math.pow(touches[0].pageY - touches[1].pageY, 2)
                );

                if (lastScale.value === 1) {
                    lastScale.value = distance;
                }

                const newScale = Math.max(0.3, Math.min(3, item.scale * (distance / lastScale.value)));
                scale.value = newScale;

                // Handle rotation
                const angle = Math.atan2(
                    touches[1].pageY - touches[0].pageY,
                    touches[1].pageX - touches[0].pageX
                );

                if (lastRotation.value === 0) {
                    lastRotation.value = angle;
                }

                rotation.value = item.rotation + (angle - lastRotation.value);
            }
        },
        onPanResponderRelease: (event, gestureState) => {
            // Update position
            const newX = item.position.x + gestureState.dx;
            const newY = item.position.y + gestureState.dy;

            onUpdate(item.id, {
                position: { x: newX, y: newY },
                scale: scale.value,
                rotation: rotation.value,
            });

            // Reset values
            lastScale.value = 1;
            lastRotation.value = 0;
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: `${rotation.value}rad` },
            ],
            zIndex: item.zIndex,
        };
    });

    return (
        <View
            {...panResponder.panHandlers}
            style={[
                styles.draggableItem,
                {
                    left: item.position.x,
                    top: item.position.y,
                    transform: [
                        { scale: item.scale },
                        { rotate: `${item.rotation}rad` },
                    ],
                    zIndex: item.zIndex,
                },
                isSelected && {
                    borderWidth: 2,
                    borderColor: '#007AFF',
                    borderStyle: 'dashed',
                },
            ]}
        >
            <Image
                source={{ uri: item.image }}
                style={styles.outfitItemImage}
            />
            <Pressable
                style={styles.deleteItemButton}
                onPress={() => onUpdate(item.id, { remove: true } as any)}
            >
                <IconSymbol name="xmark.circle.fill" size={20} color="#ff3b30" />
            </Pressable>
        </View>
    );
};

interface EditorToolbarProps {
    selectedItem: OutfitItem | null;
    onLayerChange: (direction: 'front' | 'back') => void;
    onFlip: () => void;
    onReset: () => void;
    onAddBackground: () => void;
    colorScheme: 'light' | 'dark' | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
                                                         selectedItem,
                                                         onLayerChange,
                                                         onFlip,
                                                         onReset,
                                                         onAddBackground,
                                                         colorScheme,
                                                     }) => {
    return (
        <View style={[styles.toolbar, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f8f8f8' }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.toolbarContent}
            >
                <Pressable
                    style={[styles.toolButton, !selectedItem && styles.disabledToolButton]}
                    onPress={() => selectedItem && onLayerChange('front')}
                    disabled={!selectedItem}
                >
                    <IconSymbol name="arrow.up" size={16} color={selectedItem ? '#007AFF' : '#ccc'} />
                    <ThemedText style={[styles.toolButtonText, { color: selectedItem ? '#007AFF' : '#ccc' }]}>
                        Front
                    </ThemedText>
                </Pressable>

                <Pressable
                    style={[styles.toolButton, !selectedItem && styles.disabledToolButton]}
                    onPress={() => selectedItem && onLayerChange('back')}
                    disabled={!selectedItem}
                >
                    <IconSymbol name="arrow.down" size={16} color={selectedItem ? '#007AFF' : '#ccc'} />
                    <ThemedText style={[styles.toolButtonText, { color: selectedItem ? '#007AFF' : '#ccc' }]}>
                        Back
                    </ThemedText>
                </Pressable>

                <Pressable
                    style={[styles.toolButton, !selectedItem && styles.disabledToolButton]}
                    onPress={() => selectedItem && onFlip()}
                    disabled={!selectedItem}
                >
                    <IconSymbol name="arrow.left.arrow.right" size={16} color={selectedItem ? '#007AFF' : '#ccc'} />
                    <ThemedText style={[styles.toolButtonText, { color: selectedItem ? '#007AFF' : '#ccc' }]}>
                        Flip
                    </ThemedText>
                </Pressable>

                <Pressable
                    style={[styles.toolButton, !selectedItem && styles.disabledToolButton]}
                    onPress={() => selectedItem && onReset()}
                    disabled={!selectedItem}
                >
                    <IconSymbol name="arrow.clockwise" size={16} color={selectedItem ? '#007AFF' : '#ccc'} />
                    <ThemedText style={[styles.toolButtonText, { color: selectedItem ? '#007AFF' : '#ccc' }]}>
                        Reset
                    </ThemedText>
                </Pressable>

                <Pressable
                    style={styles.toolButton}
                    onPress={onAddBackground}
                >
                    <IconSymbol name="photo" size={16} color="#007AFF" />
                    <ThemedText style={[styles.toolButtonText, { color: '#007AFF' }]}>
                        Background
                    </ThemedText>
                </Pressable>
            </ScrollView>
        </View>
    );
};

export const AddOutfitModal: React.FC<AddOutfitModalProps> = ({
                                                                  visible,
                                                                  onClose,
                                                                  onSubmit,
                                                                  colorScheme,
                                                                  wardrobeItems,
                                                              }) => {
    const [step, setStep] = useState<'details' | 'editor'>('details');
    const [outfitData, setOutfitData] = useState({
        name: '',
        occasion: '',
        description: '',
        isPrivate: false,
    });
    const [selectedItems, setSelectedItems] = useState<OutfitItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const canvasRef = useRef<View>(null);

    const resetForm = () => {
        setStep('details');
        setOutfitData({ name: '', occasion: '', description: '', isPrivate: false });
        setSelectedItems([]);
        setSelectedItemId(null);
        setBackgroundImage(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const addItemToOutfit = (item: WardrobeItem) => {
        const outfitItem: OutfitItem = {
            ...item,
            position: { x: Math.random() * 100, y: Math.random() * 100 },
            scale: 1,
            rotation: 0,
            zIndex: selectedItems.length + 1,
        };
        setSelectedItems(prev => [...prev, outfitItem]);
    };

    const updateOutfitItem = (id: string, updates: Partial<OutfitItem> & { remove?: boolean }) => {
        if (updates.remove) {
            setSelectedItems(prev => prev.filter(item => item.id !== id));
            setSelectedItemId(null);
        } else {
            setSelectedItems(prev =>
                prev.map(item => (item.id === id ? { ...item, ...updates } : item))
            );
        }
    };

    const selectedItem = selectedItems.find(item => item.id === selectedItemId);

    const handleLayerChange = (direction: 'front' | 'back') => {
        if (!selectedItemId) return;

        setSelectedItems(prev => {
            const items = [...prev];
            const currentItem = items.find(item => item.id === selectedItemId);
            if (!currentItem) return items;

            if (direction === 'front') {
                const maxZIndex = Math.max(...items.map(item => item.zIndex));
                currentItem.zIndex = maxZIndex + 1;
            } else {
                const minZIndex = Math.min(...items.map(item => item.zIndex));
                currentItem.zIndex = minZIndex - 1;
            }

            return items;
        });
    };

    const handleFlip = () => {
        if (!selectedItemId) return;
        updateOutfitItem(selectedItemId, {
            rotation: selectedItem ? selectedItem.rotation + Math.PI : 0
        });
    };

    const handleReset = () => {
        if (!selectedItemId) return;
        updateOutfitItem(selectedItemId, {
            position: { x: 50, y: 50 },
            scale: 1,
            rotation: 0,
        });
    };

    const handleAddBackground = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setBackgroundImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Background selection error:', error);
            Alert.alert('Error', 'Failed to select background image.');
        }
    };

    const captureOutfitImage = async (): Promise<string> => {
        if (!canvasRef.current) {
            throw new Error('Canvas reference not available');
        }

        try {
            // Add a delay to ensure all animations are settled
            await new Promise(resolve => setTimeout(resolve, 500));

            const uri = await captureRef(canvasRef, {
                result: 'tmpfile',
                height: pixels,
                width: pixels,
                quality: 1,
                format: 'png',
            });
            return uri;
        } catch (error) {
            console.error('Capture error:', error);
            throw error;
        }
    };

    const uploadOutfitImage = async (imageUri: string): Promise<string> => {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const filename = `outfit_images/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
        const imageRef = ref(storage, filename);
        await uploadBytes(imageRef, blob);
        return await getDownloadURL(imageRef);
    };

    const handleNextStep = () => {
        if (!outfitData.name.trim()) {
            Alert.alert('Required Field', 'Please enter a name for the outfit.');
            return;
        }
        if (!outfitData.occasion.trim()) {
            Alert.alert('Required Field', 'Please select an occasion.');
            return;
        }
        if (selectedItems.length === 0) {
            Alert.alert('No Items', 'Please select at least one item for your outfit.');
            return;
        }
        setStep('editor');
    };

    const handleSubmit = async () => {
        setUploading(true);
        try {
            const outfitImageUri = await captureOutfitImage();
            const outfitImageUrl = await uploadOutfitImage(outfitImageUri);

            const outfit = {
                name: outfitData.name,
                occasion: outfitData.occasion,
                description: outfitData.description,
                isPrivate: outfitData.isPrivate,
                items: selectedItems.map(item => ({
                    id: item.id,
                    position: item.position,
                    scale: item.scale,
                    rotation: item.rotation,
                    zIndex: item.zIndex,
                })),
                backgroundImage,
                image: outfitImageUrl,
            };

            await onSubmit(outfit);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Submit error', error);
            Alert.alert('Error', 'Failed to create outfit. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <View style={[styles.modal, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
                    <View style={styles.header}>
                        <ThemedText type="title" style={styles.title}>
                            {step === 'details' ? 'Create New Outfit' : 'Design Your Outfit'}
                        </ThemedText>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={20} />
                        </Pressable>
                    </View>

                    {step === 'details' ? (
                        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                            <View style={styles.form}>
                                {/* Basic Information */}
                                <View style={styles.section}>
                                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                        Outfit Details
                                    </ThemedText>

                                    <View style={styles.inputGroup}>
                                        <ThemedText type="defaultSemiBold">Name*</ThemedText>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                                                    color: colorScheme === 'dark' ? '#fff' : '#000',
                                                    backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                                                },
                                            ]}
                                            placeholder="e.g., Business Casual Look"
                                            placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                            value={outfitData.name}
                                            onChangeText={text => setOutfitData({ ...outfitData, name: text })}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <ThemedText type="defaultSemiBold">Occasion*</ThemedText>
                                        <Dropdown
                                            options={OCCASIONS}
                                            value={outfitData.occasion}
                                            onSelect={occasion => setOutfitData({ ...outfitData, occasion })}
                                            placeholder="Select occasion"
                                            colorScheme={colorScheme}
                                            zIndex={1000}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <ThemedText type="defaultSemiBold">Description</ThemedText>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                styles.textArea,
                                                {
                                                    borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                                                    color: colorScheme === 'dark' ? '#fff' : '#000',
                                                    backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                                                },
                                            ]}
                                            placeholder="Describe your outfit..."
                                            placeholderTextColor={colorScheme === 'dark' ? '#888' : '#666'}
                                            value={outfitData.description}
                                            onChangeText={text => setOutfitData({ ...outfitData, description: text })}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>

                                    <View style={styles.switchContainer}>
                                        <ThemedText type="defaultSemiBold">Private Outfit</ThemedText>
                                        <Switch
                                            value={outfitData.isPrivate}
                                            onValueChange={value => setOutfitData({ ...outfitData, isPrivate: value })}
                                            trackColor={{ false: '#767577', true: '#007AFF' }}
                                            thumbColor={outfitData.isPrivate ? '#ffffff' : '#f4f3f4'}
                                        />
                                    </View>
                                </View>

                                {/* Item Selection */}
                                <View style={styles.section}>
                                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                        Select Items ({selectedItems.length} selected)
                                    </ThemedText>
                                    <ThemedText type="caption" style={styles.stepHint}>
                                        Choose items for your outfit, then proceed to design
                                    </ThemedText>

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.itemsScroll}
                                    >
                                        {wardrobeItems.map(item => (
                                            <Pressable
                                                key={item.id}
                                                style={[
                                                    styles.wardrobeItem,
                                                    selectedItems.some(selected => selected.id === item.id) && styles.selectedItem,
                                                ]}
                                                onPress={() => {
                                                    if (selectedItems.some(selected => selected.id === item.id)) {
                                                        setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
                                                    } else {
                                                        addItemToOutfit(item);
                                                    }
                                                }}
                                            >
                                                <Image
                                                    source={{ uri: item.image }}
                                                    style={styles.wardrobeItemImage}
                                                />
                                                <ThemedText type="caption" style={styles.itemName} numberOfLines={1}>
                                                    {item.name}
                                                </ThemedText>
                                                {selectedItems.some(selected => selected.id === item.id) && (
                                                    <View style={styles.selectedBadge}>
                                                        <IconSymbol name="checkmark" size={12} color="#fff" />
                                                    </View>
                                                )}
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </ScrollView>
                    ) : (
                        <View style={styles.editorContainer}>
                            <EditorToolbar
                                selectedItem={selectedItem}
                                onLayerChange={handleLayerChange}
                                onFlip={handleFlip}
                                onReset={handleReset}
                                onAddBackground={handleAddBackground}
                                colorScheme={colorScheme}
                            />

                            <View style={styles.canvasContainer}>
                                <View
                                    ref={canvasRef}
                                    style={[
                                        styles.canvas,
                                        { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f8f8f8' },
                                    ]}
                                    collapsable={false}
                                >
                                    {backgroundImage && (
                                        <Image
                                            source={{ uri: backgroundImage }}
                                            style={styles.backgroundImage}
                                        />
                                    )}
                                    {selectedItems.map(item => (
                                        <DraggableItem
                                            key={item.id}
                                            item={item}
                                            onUpdate={updateOutfitItem}
                                            colorScheme={colorScheme}
                                            isSelected={selectedItemId === item.id}
                                            onSelect={setSelectedItemId}
                                        />
                                    ))}
                                </View>
                            </View>

                            <View style={styles.editorControls}>
                                <ThemedText type="caption" style={styles.helpText}>
                                    Tap to select • Drag to move • Pinch to resize • Rotate with two fingers
                                </ThemedText>
                                <ThemedText type="caption" style={styles.stepHint}>
                                    Arrange your items, then create your outfit
                                </ThemedText>
                            </View>
                        </View>
                    )}

                    <View style={styles.footer}>
                        {step === 'details' ? (
                            <Pressable
                                onPress={handleNextStep}
                                style={[
                                    styles.button,
                                    styles.nextBtn,
                                    (!outfitData.name.trim() || !outfitData.occasion.trim() || selectedItems.length === 0) &&
                                    styles.disabledButton,
                                ]}
                                disabled={!outfitData.name.trim() || !outfitData.occasion.trim() || selectedItems.length === 0}
                            >
                                <ThemedText style={styles.buttonText}>Next: Design Outfit</ThemedText>
                            </Pressable>
                        ) : (
                            <View style={styles.editorFooter}>
                                <Pressable
                                    onPress={() => setStep('details')}
                                    style={[styles.button, styles.backBtn]}
                                >
                                    <ThemedText style={styles.backButtonText}>Back</ThemedText>
                                </Pressable>
                                <Pressable
                                    onPress={handleSubmit}
                                    style={[styles.button, styles.saveBtn, uploading && styles.disabledButton]}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <View style={styles.uploadingContainer}>
                                            <ActivityIndicator size="small" color="#fff" />
                                            <ThemedText style={[styles.buttonText, { marginLeft: 8 }]}>
                                                Creating...
                                            </ThemedText>
                                        </View>
                                    ) : (
                                        <ThemedText style={styles.buttonText}>Create Outfit</ThemedText>
                                    )}
                                </Pressable>
                            </View>
                        )}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    stepHint: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 12,
        fontStyle: 'italic',
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    // Dropdown styles
    dropdownContainer: {
        position: 'relative',
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
        maxHeight: 150,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    dropdownScroll: {
        maxHeight: 150,
    },
    dropdownOption: {
        padding: 12,
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
    // Item selection styles
    itemsScroll: {
        paddingVertical: 8,
    },
    wardrobeItem: {
        marginRight: 12,
        alignItems: 'center',
        width: 80,
        position: 'relative',
    },
    selectedItem: {
        opacity: 0.8,
    },
    wardrobeItemImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginBottom: 4,
    },
    itemName: {
        textAlign: 'center',
        fontSize: 12,
    },
    selectedBadge: {
        position: 'absolute',
        top: -5,
        right: 5,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Editor styles
    editorContainer: {
        flex: 1,
    },
    toolbar: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    toolbarContent: {
        alignItems: 'center',
        gap: 16,
    },
    toolButton: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 60,
    },
    disabledToolButton: {
        opacity: 0.5,
    },
    toolButtonText: {
        fontSize: 12,
        marginTop: 2,
        fontWeight: '500',
    },
    canvasContainer: {
        flex: 1,
        margin: 16,
    },
    canvas: {
        flex: 1,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    draggableItem: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    outfitItemImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    deleteItemButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    editorControls: {
        padding: 16,
        alignItems: 'center',
    },
    helpText: {
        textAlign: 'center',
        opacity: 0.7,
        fontSize: 14,
        marginBottom: 4,
    },
    // Footer styles
    footer: {
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    editorFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flex: 1,
    },
    nextBtn: {
        backgroundColor: '#007AFF',
    },
    backBtn: {
        backgroundColor: '#f0f0f0',
        flex: 0.4,
    },
    saveBtn: {
        backgroundColor: '#007AFF',
        flex: 0.6,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});