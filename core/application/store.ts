import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  UserProfile, 
  Species, 
  Capture, 
  Badge, 
  RecognitionResult,
  // TrainingFeedback,
  FeatureFlags,
  RecognitionError
} from '../domain/types';

// App state interface
interface AppState {
  // User state
  user: UserProfile | null;
  isAuthenticated: boolean;
  
  // Recognition state
  currentRecognition: RecognitionResult | null;
  recognitionHistory: RecognitionResult[];
  isRecognizing: boolean;
  recognitionError: RecognitionError | null;
  
  // Collection state
  captures: Capture[];
  species: Species[];
  badges: Badge[];
  
  // UI state
  isLoading: boolean;
  currentView: 'scan' | 'result' | 'collection' | 'shop' | 'training';
  modal: {
    isOpen: boolean;
    type: 'feedback' | 'badge' | 'settings' | null;
    data?: any;
  };
  
  // Feature flags
  features: FeatureFlags;
  
  // Actions
  actions: {
    // User actions
    setUser: (user: UserProfile) => void;
    updateUser: (updates: Partial<UserProfile>) => void;
    logout: () => void;
    
    // Recognition actions
    startRecognition: () => void;
    setRecognitionResult: (result: RecognitionResult) => void;
    setRecognitionError: (error: RecognitionError) => void;
    clearRecognition: () => void;
    
    // Collection actions
    addCapture: (capture: Capture) => void;
    addSpecies: (species: Species) => void;
    unlockBadge: (badge: Badge) => void;
    updateBadgeProgress: (badgeId: string, progress: number) => void;
    
    // UI actions
    setLoading: (loading: boolean) => void;
    setCurrentView: (view: AppState['currentView']) => void;
    openModal: (type: AppState['modal']['type'], data?: any) => void;
    closeModal: () => void;
    
    // Feature flags
    updateFeatureFlags: (flags: Partial<FeatureFlags>) => void;
  };
}

// Default feature flags
const defaultFeatureFlags: FeatureFlags = {
  enableLocalModel: false,
  enableAdvancedAnalytics: false,
  enableFamilySharing: false,
  enableOfflineMode: true,
  enableTestFlight: false,
};

// Default user preferences
// const defaultUserPreferences = {
//   notifications: true,
//   soundEnabled: true,
//   autoSpeak: false,
//   theme: 'auto' as const,
//   language: 'en',
// };

// Create the store
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        currentRecognition: null,
        recognitionHistory: [],
        isRecognizing: false,
        recognitionError: null,
        captures: [],
        species: [],
        badges: [],
        isLoading: false,
        currentView: 'scan',
        modal: {
          isOpen: false,
          type: null,
          data: undefined,
        },
        features: defaultFeatureFlags,
        
        // Actions
        actions: {
          // User actions
          setUser: (user: UserProfile) => {
            set({ user, isAuthenticated: true });
          },
          
          updateUser: (updates: Partial<UserProfile>) => {
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: {
                  ...currentUser,
                  ...updates,
                  lastActiveAt: new Date(),
                },
              });
            }
          },
          
          logout: () => {
            set({
              user: null,
              isAuthenticated: false,
              currentRecognition: null,
              recognitionHistory: [],
              captures: [],
              species: [],
              badges: [],
              currentView: 'scan',
              modal: { isOpen: false, type: null },
            });
          },
          
          // Recognition actions
          startRecognition: () => {
            set({
              isRecognizing: true,
              recognitionError: null,
              currentRecognition: null,
            });
          },
          
          setRecognitionResult: (result: RecognitionResult) => {
            const { recognitionHistory } = get();
            set({
              currentRecognition: result,
              isRecognizing: false,
              recognitionError: null,
              recognitionHistory: [result, ...recognitionHistory.slice(0, 49)], // Keep last 50
            });
          },
          
          setRecognitionError: (error: RecognitionError) => {
            set({
              recognitionError: error,
              isRecognizing: false,
              currentRecognition: null,
            });
          },
          
          clearRecognition: () => {
            set({
              currentRecognition: null,
              recognitionError: null,
              isRecognizing: false,
            });
          },
          
          // Collection actions
          addCapture: (capture: Capture) => {
            const { captures, species, user } = get();
            const newCaptures = [capture, ...captures];
            
            // Check if this is a new species
            const isNewSpecies = !species.some(s => s.id === capture.speciesId);
            
            set({ captures: newCaptures });
            
            // Update user stats
            if (user) {
              const newTotalCaptures = user.totalCaptures + 1;
              const newUniqueSpeciesCount = isNewSpecies 
                ? user.uniqueSpeciesCount + 1 
                : user.uniqueSpeciesCount;
              
              get().actions.updateUser({
                totalCaptures: newTotalCaptures,
                uniqueSpeciesCount: newUniqueSpeciesCount,
              });
            }
          },
          
          addSpecies: (species: Species) => {
            const { species: currentSpecies } = get();
            const isNewSpecies = !currentSpecies.some(s => s.id === species.id);
            
            if (isNewSpecies) {
              set({ species: [species, ...currentSpecies] });
            }
          },
          
          unlockBadge: (badge: Badge) => {
            const { badges, user } = get();
            const isNewBadge = !badges.some(b => b.id === badge.id);
            
            if (isNewBadge) {
              set({ badges: [badge, ...badges] });
              
              // Update user coins if badge gives rewards
              if (user && badge.category === 'achievement') {
                const coinReward = 50; // Base reward for achievements
                get().actions.updateUser({
                  coins: user.coins + coinReward,
                });
              }
            }
          },
          
          updateBadgeProgress: (badgeId: string, progress: number) => {
            const { badges } = get();
            const updatedBadges = badges.map(badge =>
              badge.id === badgeId
                ? { ...badge, progress: Math.min(progress, badge.maxProgress || progress) }
                : badge
            );
            set({ badges: updatedBadges });
          },
          
          // UI actions
          setLoading: (loading: boolean) => {
            set({ isLoading: loading });
          },
          
          setCurrentView: (view: AppState['currentView']) => {
            set({ currentView: view });
          },
          
          openModal: (type: AppState['modal']['type'], data?: any) => {
            set({
              modal: {
                isOpen: true,
                type,
                data,
              },
            });
          },
          
          closeModal: () => {
            set({
              modal: {
                isOpen: false,
                type: null,
                data: undefined,
              },
            });
          },
          
          // Feature flags
          updateFeatureFlags: (flags: Partial<FeatureFlags>) => {
            const { features } = get();
            set({
              features: { ...features, ...flags },
            });
          },
        },
      }),
      {
        name: 'backyard-brandon-storage',
        partialize: (state) => ({
          user: state.user,
          captures: state.captures,
          species: state.species,
          badges: state.badges,
          features: state.features,
        }),
      }
    ),
    {
      name: 'backyard-brandon-store',
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useCurrentRecognition = () => useAppStore((state) => state.currentRecognition);
export const useIsRecognizing = () => useAppStore((state) => state.isRecognizing);
export const useRecognitionError = () => useAppStore((state) => state.recognitionError);
export const useCaptures = () => useAppStore((state) => state.captures);
export const useSpecies = () => useAppStore((state) => state.species);
export const useBadges = () => useAppStore((state) => state.badges);
export const useCurrentView = () => useAppStore((state) => state.currentView);
export const useModal = () => useAppStore((state) => state.modal);
export const useFeatures = () => useAppStore((state) => state.features);
export const useAppActions = () => useAppStore((state) => state.actions);
