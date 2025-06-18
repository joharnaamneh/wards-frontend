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