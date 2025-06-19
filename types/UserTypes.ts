export interface UserProfile {
    uid: string;
    displayName: string;
    username: string;
    email: string;
    bio: string;
    location: string;
    profilePicture: string;
    createdAt: Date;
    updatedAt: Date;
    // Optional fields
    dateOfBirth?: Date;
    phoneNumber?: string;
    website?: string;
    isPrivate?: boolean;
    isVerified?: boolean;
    followerCount?: number;
    followingCount?: number;
    // Preferences
    preferences?: UserPreferences;
    // Social links
    socialLinks?: SocialLinks;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    language: string;
    currency: string;
    measurementUnit: 'metric' | 'imperial';
}

export interface NotificationSettings {
    pushNotifications: boolean;
    emailNotifications: boolean;
    outfitReminders: boolean;
    weeklyReports: boolean;
    socialUpdates: boolean;
    promotionalEmails: boolean;
}

export interface PrivacySettings {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    allowTagging: boolean;
    dataSharing: boolean;
}

export interface SocialLinks {
    instagram?: string;
    twitter?: string;
    pinterest?: string;
    tiktok?: string;
    website?: string;
}

// User activity and engagement types
export interface UserActivity {
    id: string;
    userId: string;
    type: ActivityType;
    description: string;
    metadata?: any;
    createdAt: Date;
}

export type ActivityType =
    | 'outfit_created'
    | 'outfit_updated'
    | 'outfit_deleted'
    | 'item_added'
    | 'item_removed'
    | 'outfit_favorited'
    | 'outfit_unfavorited'
    | 'profile_updated'
    | 'wardrobe_organized';

// User statistics
export interface UserStats {
    totalOutfits: number;
    totalItems: number;
    favoriteOutfits: number;
    categoriesUsed: number;
    outfitsThisMonth: number;
    itemsThisMonth: number;
    mostUsedCategory: string;
    averageOutfitRating: number;
    wardrobeUtilization: number; // percentage
    favoriteRate: number; // percentage
}

// User achievements and badges
export interface UserAchievement {
    id: string;
    userId: string;
    badgeId: string;
    unlockedAt: Date;
    progress?: number;
    maxProgress?: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    category: BadgeCategory;
    requirement: BadgeRequirement;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export type BadgeCategory =
    | 'wardrobe'
    | 'outfits'
    | 'social'
    | 'style'
    | 'organization'
    | 'special';

export interface BadgeRequirement {
    type: 'count' | 'streak' | 'rating' | 'special';
    target: number;
    metric: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
}

// User relationships (following/followers)
export interface UserRelationship {
    id: string;
    followerId: string;
    followingId: string;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: Date;
    updatedAt: Date;
}

// User subscription/premium features
export interface UserSubscription {
    id: string;
    userId: string;
    planId: string;
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
    features: string[];
    paymentMethod?: string;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    features: PlanFeature[];
    isPopular?: boolean;
}

export interface PlanFeature {
    id: string;
    name: string;
    description: string;
    included: boolean;
    limit?: number;
}