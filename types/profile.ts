export type Profile = {
  id: string;
  name: string;
  emoji: string;
  level: number;
  coins: number;
  totalCaptures: number;
  uniqueSpeciesCount: number;
  createdAt: string;
  lastSeen: string;
  kidMode: boolean;
  streakDays: number;
  isDefault?: boolean;
};

export type ProfileSettings = {
  currentProfileId: string;
  profiles: Profile[];
  autoSave: boolean;
  cloudSync: boolean;
};

export type ProfileStats = {
  captures: Capture[];
  badges: Badge[];
  achievements: Achievement[];
  scanHistory: ScanRecord[];
};

export type ScanRecord = {
  id: string;
  profileId: string;
  timestamp: string;
  speciesName: string;
  category: string;
  confidence: number;
  imageUrl?: string;
  location?: string;
};

export type Capture = {
  id: string;
  profileId: string;
  category: 'flower' | 'bug' | 'animal';
  provider: 'plantid' | 'gcv';
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
  capturedImageUrl?: string;
};

export type Badge = {
  id: string;
  profileId: string;
  category: string;
  subtype: string;
  level: number;
  count: number;
  nextGoal: number;
  unlockedAt: string;
};

export type Achievement = {
  id: string;
  profileId: string;
  type: string;
  title: string;
  description: string;
  coinsRewarded: number;
  icon?: string;
  createdAt: string;
  unlockedAt?: string;
};
