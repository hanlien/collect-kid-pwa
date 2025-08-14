// Core domain types for the application

export interface Species {
  id: string;
  canonicalName: string;
  commonName?: string;
  scientificName: string;
  category: 'flower' | 'bug' | 'animal' | 'mysterious';
  confidence: number;
  imageUrl?: string;
  facts?: SpeciesFacts;
  colors?: string[];
  capturedAt?: Date;
  location?: GeoLocation;
}

export interface SpeciesFacts {
  summary: string;
  habitat?: string;
  diet?: string;
  lifespan?: string;
  funFacts?: string[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface RecognitionResult {
  species: Species;
  provider: RecognitionProvider;
  processingTime: number;
  timestamp: Date;
}

export type RecognitionProvider = 'iNaturalist' | 'Plant.id' | 'GoogleVision' | 'LocalModel';

export interface UserProfile {
  id: string;
  name: string;
  level: number;
  coins: number;
  totalCaptures: number;
  uniqueSpeciesCount: number;
  badges: Badge[];
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  unlockedAt: Date;
  progress?: number;
  maxProgress?: number;
}

export type BadgeCategory = 'collection' | 'discovery' | 'achievement' | 'special';

export interface UserPreferences {
  notifications: boolean;
  soundEnabled: boolean;
  autoSpeak: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface Capture {
  id: string;
  speciesId: string;
  imageUrl: string;
  capturedAt: Date;
  location?: GeoLocation;
  confidence: number;
  provider: RecognitionProvider;
  userCorrection?: {
    correctSpeciesId: string;
    correctedAt: Date;
    reason?: string;
  };
}

export interface TrainingFeedback {
  id: string;
  captureId: string;
  originalSpeciesId: string;
  userCorrection?: {
    correctSpeciesId: string;
    reason: string;
  };
  isCorrect: boolean;
  feedbackType: 'confirmation' | 'correction' | 'rejection';
  submittedAt: Date;
  imageUrl?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export type RecognitionError = 
  | { type: 'NO_RESULTS'; message: string }
  | { type: 'LOW_CONFIDENCE'; confidence: number; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'PROVIDER_ERROR'; provider: RecognitionProvider; message: string }
  | { type: 'UNKNOWN'; message: string };

// Feature flags
export interface FeatureFlags {
  enableLocalModel: boolean;
  enableAdvancedAnalytics: boolean;
  enableFamilySharing: boolean;
  enableOfflineMode: boolean;
  enableTestFlight: boolean;
}
