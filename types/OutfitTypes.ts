// types/OutfitTypes.ts
export interface Outfit {
    id: string;
    name: string;
    description?: string;
    occasion: string;
    season: string;
    items: string[]; // Array of wardrobe item IDs
    image?: string;
    created_at?: any;
    favorite?: boolean;
}

export interface NewOutfitForm {
    name: string;
    description: string;
    occasion: string;
    season: string;
    items: string[];
    image: string;
    favorite: boolean;
}