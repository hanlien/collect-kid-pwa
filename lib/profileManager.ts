import { Profile, ProfileSettings, Capture, Badge, Achievement, ScanRecord } from '@/types/profile';

const STORAGE_KEYS = {
  PROFILE_SETTINGS: 'profileSettings',
  PROFILE_DATA: 'profileData',
  SCAN_HISTORY: 'scanHistory',
};

// Default Brandon profile
const DEFAULT_PROFILE: Profile = {
  id: 'brandon-default',
  name: 'Brandon',
  emoji: '👦',
  level: 1,
  coins: 0,
  totalCaptures: 0,
  uniqueSpeciesCount: 0,
  createdAt: new Date().toISOString(),
  lastSeen: new Date().toISOString(),
  kidMode: true,
  streakDays: 0,
  isDefault: true,
};

class ProfileManager {
  private static instance: ProfileManager;
  private settings: ProfileSettings;

  private constructor() {
    this.settings = this.loadSettings();
    this.ensureDefaultProfile();
  }

  static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  private loadSettings(): ProfileSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE_SETTINGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load profile settings:', error);
    }

    // Initialize with default settings
    return {
      currentProfileId: DEFAULT_PROFILE.id,
      profiles: [DEFAULT_PROFILE],
      autoSave: true,
      cloudSync: false,
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE_SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save profile settings:', error);
    }
  }

  private ensureDefaultProfile(): void {
    const hasDefault = this.settings.profiles.some(p => p.isDefault);
    if (!hasDefault) {
      this.settings.profiles.unshift(DEFAULT_PROFILE);
      this.saveSettings();
    }
  }

  // Profile Management
  getCurrentProfile(): Profile {
    const profile = this.settings.profiles.find(p => p.id === this.settings.currentProfileId);
    return profile || DEFAULT_PROFILE;
  }

  getAllProfiles(): Profile[] {
    return this.settings.profiles;
  }

  switchProfile(profileId: string): boolean {
    const profile = this.settings.profiles.find(p => p.id === profileId);
    if (profile) {
      this.settings.currentProfileId = profileId;
      profile.lastSeen = new Date().toISOString();
      this.saveSettings();
      return true;
    }
    return false;
  }

  createProfile(name: string, emoji: string): Profile {
    const newProfile: Profile = {
      id: `profile-${Date.now()}`,
      name,
      emoji,
      level: 1,
      coins: 0,
      totalCaptures: 0,
      uniqueSpeciesCount: 0,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      kidMode: true,
      streakDays: 0,
    };

    this.settings.profiles.push(newProfile);
    this.saveSettings();
    return newProfile;
  }

  updateProfile(profileId: string, updates: Partial<Profile>): boolean {
    const profileIndex = this.settings.profiles.findIndex(p => p.id === profileId);
    if (profileIndex !== -1) {
      this.settings.profiles[profileIndex] = {
        ...this.settings.profiles[profileIndex],
        ...updates,
        lastSeen: new Date().toISOString(),
      };
      this.saveSettings();
      return true;
    }
    return false;
  }

  deleteProfile(profileId: string): boolean {
    if (profileId === DEFAULT_PROFILE.id) {
      return false; // Cannot delete default profile
    }

    const profileIndex = this.settings.profiles.findIndex(p => p.id === profileId);
    if (profileIndex !== -1) {
      this.settings.profiles.splice(profileIndex, 1);
      
      // If deleted profile was current, switch to default
      if (this.settings.currentProfileId === profileId) {
        this.settings.currentProfileId = DEFAULT_PROFILE.id;
      }
      
      this.saveSettings();
      
      // Clean up profile data
      this.clearProfileData(profileId);
      return true;
    }
    return false;
  }

  // Collection Management
  addCapture(capture: Omit<Capture, 'id' | 'profileId'>): Capture {
    const newCapture: Capture = {
      ...capture,
      id: `capture-${Date.now()}`,
      profileId: this.getCurrentProfile().id,
    };

    const captures = this.getCaptures();
    captures.push(newCapture);
    this.saveCaptures(captures);

    // Update profile stats
    this.updateProfileStats(newCapture);
    return newCapture;
  }

  getCaptures(): Capture[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.PROFILE_DATA}-${this.getCurrentProfile().id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load captures:', error);
    }
    return [];
  }

  private saveCaptures(captures: Capture[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.PROFILE_DATA}-${this.getCurrentProfile().id}`, JSON.stringify(captures));
    } catch (error) {
      console.error('Failed to save captures:', error);
    }
  }

  addBadge(badge: Omit<Badge, 'id' | 'profileId' | 'unlockedAt'>): Badge {
    const newBadge: Badge = {
      ...badge,
      id: `badge-${Date.now()}`,
      profileId: this.getCurrentProfile().id,
      unlockedAt: new Date().toISOString(),
    };

    const badges = this.getBadges();
    badges.push(newBadge);
    this.saveBadges(badges);
    return newBadge;
  }

  getBadges(): Badge[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.PROFILE_DATA}-badges-${this.getCurrentProfile().id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load badges:', error);
    }
    return [];
  }

  private saveBadges(badges: Badge[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.PROFILE_DATA}-badges-${this.getCurrentProfile().id}`, JSON.stringify(badges));
    } catch (error) {
      console.error('Failed to save badges:', error);
    }
  }

  addAchievement(achievement: Omit<Achievement, 'id' | 'profileId' | 'createdAt'>): Achievement {
    const newAchievement: Achievement = {
      ...achievement,
      id: `achievement-${Date.now()}`,
      profileId: this.getCurrentProfile().id,
      createdAt: new Date().toISOString(),
      unlockedAt: new Date().toISOString(),
    };

    const achievements = this.getAchievements();
    achievements.push(newAchievement);
    this.saveAchievements(achievements);
    return newAchievement;
  }

  getAchievements(): Achievement[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.PROFILE_DATA}-achievements-${this.getCurrentProfile().id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
    return [];
  }

  private saveAchievements(achievements: Achievement[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.PROFILE_DATA}-achievements-${this.getCurrentProfile().id}`, JSON.stringify(achievements));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }

  addScanRecord(record: Omit<ScanRecord, 'id' | 'profileId' | 'timestamp'>): ScanRecord {
    const newRecord: ScanRecord = {
      ...record,
      id: `scan-${Date.now()}`,
      profileId: this.getCurrentProfile().id,
      timestamp: new Date().toISOString(),
    };

    const history = this.getScanHistory();
    history.push(newRecord);
    this.saveScanHistory(history);
    return newRecord;
  }

  getScanHistory(): ScanRecord[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.SCAN_HISTORY}-${this.getCurrentProfile().id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
    return [];
  }

  private saveScanHistory(history: ScanRecord[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.SCAN_HISTORY}-${this.getCurrentProfile().id}`, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  }

  private updateProfileStats(capture: Capture): void {
    const profile = this.getCurrentProfile();
    const captures = this.getCaptures();
    
    const updates: Partial<Profile> = {
      totalCaptures: captures.length,
      uniqueSpeciesCount: new Set(captures.map(c => c.canonicalName)).size,
      coins: profile.coins + capture.coinsEarned,
    };

    // Level up logic
    const newLevel = Math.floor(updates.totalCaptures! / 10) + 1;
    if (newLevel > profile.level) {
      updates.level = newLevel;
    }

    this.updateProfile(profile.id, updates);
  }

  private clearProfileData(profileId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.PROFILE_DATA}-${profileId}`);
      localStorage.removeItem(`${STORAGE_KEYS.PROFILE_DATA}-badges-${profileId}`);
      localStorage.removeItem(`${STORAGE_KEYS.PROFILE_DATA}-achievements-${profileId}`);
      localStorage.removeItem(`${STORAGE_KEYS.SCAN_HISTORY}-${profileId}`);
    } catch (error) {
      console.error('Failed to clear profile data:', error);
    }
  }

  // Utility methods
  getProfileStats(): { captures: number; badges: number; achievements: number; scans: number } {
    return {
      captures: this.getCaptures().length,
      badges: this.getBadges().length,
      achievements: this.getAchievements().length,
      scans: this.getScanHistory().length,
    };
  }

  exportProfileData(profileId: string): string {
    const profile = this.settings.profiles.find(p => p.id === profileId);
    if (!profile) return '';

    const data = {
      profile,
      captures: this.getCaptures().filter(c => c.profileId === profileId),
      badges: this.getBadges().filter(b => b.profileId === profileId),
      achievements: this.getAchievements().filter(a => a.profileId === profileId),
      scanHistory: this.getScanHistory().filter(s => s.profileId === profileId),
    };

    return JSON.stringify(data, null, 2);
  }
}

export default ProfileManager;
