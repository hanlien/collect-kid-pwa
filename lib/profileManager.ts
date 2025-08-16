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
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEYS.PROFILE_SETTINGS);
        if (stored) {
          return JSON.parse(stored);
        }
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
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.PROFILE_SETTINGS, JSON.stringify(this.settings));
      }
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
      const existingProfile = this.settings.profiles[profileIndex];
      // @ts-ignore - exactOptionalPropertyTypes conflict with spread operator
      this.settings.profiles[profileIndex] = {
        ...existingProfile,
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

    console.log('Adding capture:', newCapture);

    const captures = this.getCaptures();
    console.log('Current captures before adding:', captures);
    
    captures.push(newCapture);
    this.saveCaptures(captures);
    
    console.log('Captures after saving:', this.getCaptures());

    // Update profile stats
    this.updateProfileStats(newCapture);
    
    // Sync to server
    this.syncProgressToServer();
    
    return newCapture;
  }

  getCaptures(): Capture[] {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `${STORAGE_KEYS.PROFILE_DATA}-captures-${this.getCurrentProfile().id}`;
        console.log('Loading captures with key:', key);
        const stored = localStorage.getItem(key);
        if (stored) {
          const captures = JSON.parse(stored);
          console.log('Loaded captures:', captures);
          return captures;
        } else {
          console.log('No captures found for key:', key);
        }
      }
    } catch (error) {
      console.error('Failed to load captures:', error);
    }
    return [];
  }

  private saveCaptures(captures: Capture[]): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `${STORAGE_KEYS.PROFILE_DATA}-captures-${this.getCurrentProfile().id}`;
        console.log('Saving captures with key:', key);
        console.log('Saving captures data:', captures);
        localStorage.setItem(key, JSON.stringify(captures));
        console.log('Captures saved successfully');
      }
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

    console.log('Adding badge:', newBadge);

    const badges = this.getBadges();
    console.log('Current badges before adding:', badges);
    
    badges.push(newBadge);
    this.saveBadges(badges);
    
    console.log('Badges after saving:', this.getBadges());
    
    // Sync to server
    this.syncProgressToServer();
    
    return newBadge;
  }

  getBadges(): Badge[] {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(`${STORAGE_KEYS.PROFILE_DATA}-badges-${this.getCurrentProfile().id}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load badges:', error);
    }
    return [];
  }

  private saveBadges(badges: Badge[]): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`${STORAGE_KEYS.PROFILE_DATA}-badges-${this.getCurrentProfile().id}`, JSON.stringify(badges));
      }
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
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(`${STORAGE_KEYS.PROFILE_DATA}-achievements-${this.getCurrentProfile().id}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
    return [];
  }

  private saveAchievements(achievements: Achievement[]): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`${STORAGE_KEYS.PROFILE_DATA}-achievements-${this.getCurrentProfile().id}`, JSON.stringify(achievements));
      }
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
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(`${STORAGE_KEYS.SCAN_HISTORY}-${this.getCurrentProfile().id}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
    return [];
  }

  private saveScanHistory(history: ScanRecord[]): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`${STORAGE_KEYS.SCAN_HISTORY}-${this.getCurrentProfile().id}`, JSON.stringify(history));
      }
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

    // Level up logic - based on unique species count
    const newLevel = Math.floor(updates.uniqueSpeciesCount! / 5) + 1;
    if (newLevel > profile.level) {
      updates.level = newLevel;
      console.log(`🎉 Level up! ${profile.name} reached level ${newLevel}!`);
    }

    this.updateProfile(profile.id, updates);
  }

  private clearProfileData(profileId: string): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(`${STORAGE_KEYS.PROFILE_DATA}-${profileId}`);
        localStorage.removeItem(`${STORAGE_KEYS.PROFILE_DATA}-badges-${profileId}`);
        localStorage.removeItem(`${STORAGE_KEYS.PROFILE_DATA}-achievements-${profileId}`);
        localStorage.removeItem(`${STORAGE_KEYS.SCAN_HISTORY}-${profileId}`);
      }
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

  // Server-side progress synchronization
  async syncProgressToServer(): Promise<void> {
    try {
      const profile = this.getCurrentProfile();
      const captures = this.getCaptures();
      const badges = this.getBadges();

      const progressData = {
        profileId: profile.id,
        collections: captures,
        badges: badges,
        coins: profile.coins,
        level: profile.level,
        experience: profile.totalCaptures * 10, // Simple XP calculation
      };

      const response = await fetch('/api/progress/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        console.error('Failed to sync progress to server');
      } else {
        console.log('Progress synced to server successfully');
      }
    } catch (error) {
      console.error('Error syncing progress to server:', error);
    }
  }

  async loadProgressFromServer(): Promise<void> {
    try {
      const profile = this.getCurrentProfile();
      
      const response = await fetch(`/api/progress/save?profileId=${profile.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Update local storage with server data
          this.saveCaptures(data.data.collections || []);
          this.saveBadges(data.data.badges || []);
          
          // Update profile stats
          this.updateProfile(profile.id, {
            coins: data.data.coins || 0,
            level: data.data.level || 1,
          });
          
          console.log('Progress loaded from server successfully');
        }
      }
    } catch (error) {
      console.error('Error loading progress from server:', error);
    }
  }

  // Auto-sync on profile switch
  async switchProfileWithSync(profileId: string): Promise<boolean> {
    const success = this.switchProfile(profileId);
    if (success) {
      await this.loadProgressFromServer();
    }
    return success;
  }
}

export default ProfileManager;
