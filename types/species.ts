export type Category = 'flower' | 'bug' | 'animal';
export type Provider = 'plantid' | 'gcv';

export type SpeciesResult = {
  category: Category;
  canonicalName: string;
  commonName?: string;
  rank?: 'species' | 'genus' | 'family';
  confidence: number; // 0..1
  provider: Provider;
  gbifKey?: number;
  wiki?: { summary?: string; imageUrl?: string };
  ui?: { colorChips?: string[]; funFacts?: string[] };
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
};

export type Badge = {
  id: string;
  userId: string;
  category: string;
  subtype: string;
  level: number;
  count: number;
};

export type User = {
  id: string;
  kidMode: boolean;
  streakDays: number;
  createdAt: string;
};

export type RecognitionHint = 'auto' | 'flower' | 'bug' | 'animal';
