export interface WardrobeItem {
    id: string;
    name: string;
    type: string;
    size: string;
    brand: string;
    color: string;
    material: string;
    image: string;
    created_at?: any;
}

export interface NewPieceForm {
    name: string;
    type: string;
    size: string;
    brand: string;
    color: string;
    material: string;
    image: string;
}
//types/OutfitTypes.ts

// Interface for item position in outfit
export interface OutfitItemPosition {
    x: number;
    y: number;
    rotation: number;
    scale: number;
    zIndex: number;
}

// Interface for outfit item with position
export interface OutfitItem {
    id: string;
    position: OutfitItemPosition;
}

export interface Outfit {
    id: string;
    name: string;
    description?: string;
    occasion: string;
    season: string;
    items: OutfitItem[]; // Updated to match Firebase structure
    image?: string;
    created_at?: any;
    favorite?: boolean;
}

export interface NewOutfitForm {
    name: string;
    description: string;
    occasion: string;
    season: string;
    items: OutfitItem[]; // Updated to match the new structure
    image: string;
    favorite: boolean;
}