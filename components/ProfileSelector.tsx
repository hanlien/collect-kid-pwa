'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Settings, User } from 'lucide-react';
import ProfileManager from '@/lib/profileManager';
import { Profile } from '@/types/profile';

interface ProfileSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSwitch: (profile: Profile) => void;
}

export default function ProfileSelector({ isOpen, onClose, onProfileSwitch }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmoji, setNewProfileEmoji] = useState('👤');

  const profileManager = ProfileManager.getInstance();

  const loadProfiles = useCallback(() => {
    const allProfiles = profileManager.getAllProfiles();
    const current = profileManager.getCurrentProfile();
    setProfiles(allProfiles);
    setCurrentProfile(current);
  }, [profileManager]);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen, loadProfiles]);

  const handleProfileSwitch = (profile: Profile) => {
    profileManager.switchProfile(profile.id);
    setCurrentProfile(profile);
    onProfileSwitch(profile);
    onClose();
  };

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      const newProfile = profileManager.createProfile(newProfileName.trim(), newProfileEmoji);
      setNewProfileName('');
      setNewProfileEmoji('👤');
      setShowCreateForm(false);
      loadProfiles();
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (profileManager.deleteProfile(profileId)) {
      loadProfiles();
    }
  };

  const emojiOptions = ['👦', '👧', '🧒', '👨', '👩', '👴', '👵', '👤', '🦊', '🐱', '🐶', '🐰', '🐻', '🐼', '🦁', '🐯'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Choose Profile
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {!showCreateForm ? (
                <>
                  {/* Current Profile */}
                  {currentProfile && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Current Profile</h3>
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{currentProfile.emoji}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{currentProfile.name}</h4>
                            <p className="text-sm text-gray-600">
                              Level {currentProfile.level} • {currentProfile.coins} coins
                            </p>
                          </div>
                          <div className="text-xs text-green-600 font-medium">Active</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile List */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500">Switch Profile</h3>
                    {profiles.map((profile) => (
                      <motion.button
                        key={profile.id}
                        onClick={() => handleProfileSwitch(profile)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all hover:scale-105 ${
                          profile.id === currentProfile?.id
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{profile.emoji}</div>
                          <div className="flex-1 text-left">
                            <h4 className="font-semibold text-gray-800">{profile.name}</h4>
                            <p className="text-sm text-gray-600">
                              Level {profile.level} • {profile.coins} coins • {profile.totalCaptures} captures
                            </p>
                          </div>
                          {profile.id !== currentProfile?.id && (
                            <div className="text-xs text-blue-600 font-medium">Switch</div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Create New Profile Button */}
                  <motion.button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" />
                      <span>Create New Profile</span>
                    </div>
                  </motion.button>
                </>
              ) : (
                /* Create Profile Form */
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Create New Profile</h3>
                  
                  {/* Emoji Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose Emoji</label>
                    <div className="grid grid-cols-8 gap-2">
                      {emojiOptions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setNewProfileEmoji(emoji)}
                          className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                            newProfileEmoji === emoji
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Name</label>
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Enter profile name"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={20}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateProfile}
                      disabled={!newProfileName.trim()}
                      className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
