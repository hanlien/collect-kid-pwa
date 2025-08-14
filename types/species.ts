export type Category = 'flower' | 'bug' | 'animal' | 'unknown';
export type Provider = 'plantid' | 'gcv' | 'local' | 'inaturalist';

export type SpeciesResult = {
  category: Category;
  canonicalName: string;
  commonName?: string;
  rank?: 'species' | 'genus' | 'family' | 'kingdom' | 'class';
  confidence: number; // 0..1
  provider: Provider;
  gbifKey?: number;
  wiki?: { summary?: string; imageUrl?: string };
  ui?: { colorChips?: string[]; funFacts?: string[] };
  capturedImageUrl?: string; // URL of the captured image
  meta?: {
    modelVersion?: string;
    reasoning?: string;
    topK?: Array<{ labelId: string; prob: number }>;
    inferenceTime?: number;
  };
  details?: {
    taxonId?: number;
    rank?: string;
    iconicTaxon?: string;
    visionScore?: number;
    frequencyScore?: number;
  };
  safety?: {
    dangerous?: boolean;
    stinging?: boolean;
    venomous?: boolean;
  };
};

export type Capture = {
  id: string;
  userId: string;
  category: Category;
  provider: Provider;
  canonicalName: string;
  commonName?: string;
  rank?: string;
  confidence: number;
  gbifKey?: number;
  thumbUrl?: string;
  locationHint?: string;
  createdAt: string;
  summary?: string;
  funFacts?: string[];
  colorChips?: string[];
  coinsEarned: number;
  isNewSpecies: boolean;
};

export type Badge = {
  id: string;
  userId: string;
  category: string;
  subtype: string;
  level: number;
  count: number;
  nextGoal: number;
};

export type Achievement = {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  coinsRewarded: number;
  icon?: string;
  createdAt: string;
};

export type User = {
  id: string;
  kidMode: boolean;
  streakDays: number;
  createdAt: string;
  lastSeen: string;
  coins: number;
  level: number;
  totalCaptures: number;
  uniqueSpeciesCount: number;
};

export type RecognitionHint = 'auto' | 'flower' | 'bug' | 'animal';
