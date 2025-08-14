'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, ShoppingCart, Coins, Star, CheckCircle, AlertCircle, Info } from 'lucide-react';
import BigButton from '@/components/BigButton';
import Toast from '@/components/Toast';
import ProfileManager from '@/lib/profileManager';
import { Profile } from '@/types/profile';

interface GiftItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'gift-card' | 'toy' | 'book' | 'special';
  available: boolean;
}

const GIFT_ITEMS: GiftItem[] = [
  {
    id: 'amazon-10',
    name: 'Amazon Gift Card',
    description: '$10 Amazon gift card for online shopping',
    price: 500,
    image: '🛒',
    category: 'gift-card',
    available: true,
  },
  {
    id: 'amazon-20',
    name: 'Amazon Gift Card',
    description: '$20 Amazon gift card for online shopping',
    price: 2000,
    image: '🛒',
    category: 'gift-card',
    available: true,
  },
  {
    id: 'target-10',
    name: 'Target Gift Card',
    description: '$10 Target gift card for in-store shopping',
    price: 500,
    image: '🎯',
    category: 'gift-card',
    available: true,
  },
  {
    id: 'target-20',
    name: 'Target Gift Card',
    description: '$20 Target gift card for in-store shopping',
    price: 2000,
    image: '🎯',
    category: 'gift-card',
    available: true,
  },
  {
    id: 'bug-catcher',
    name: 'Bug Catcher Kit',
    description: 'Professional bug catching and observation kit',
    price: 300,
    image: '🦋',
    category: 'toy',
    available: true,
  },
  {
    id: 'nature-journal',
    name: 'Nature Journal',
    description: 'Beautiful journal for recording discoveries',
    price: 200,
    image: '📖',
    category: 'book',
    available: true,
  },
  {
    id: 'magnifying-glass',
    name: 'Magnifying Glass',
    description: 'High-quality magnifying glass for close observation',
    price: 150,
    image: '🔍',
    category: 'toy',
    available: true,
  },
  {
    id: 'special-badge',
    name: 'Special Explorer Badge',
    description: 'Exclusive badge for top collectors',
    price: 1000,
    image: '🏆',
    category: 'special',
    available: true,
  },
];

export default function GiftShopPage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  useEffect(() => {
    const profileManager = ProfileManager.getInstance();
    const profile = profileManager.getCurrentProfile();
    setCurrentProfile(profile);
  }, []);

  const handleRedeem = async (item: GiftItem) => {
    if (!currentProfile) return;

    if (currentProfile.coins < item.price) {
      setToast({
        message: `Not enough coins! You need ${item.price - currentProfile.coins} more $BRANDON coins.`,
        type: 'error',
      });
      return;
    }

    setIsRedeeming(item.id);

    try {
      // Simulate API call for redemption
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile coins
      const profileManager = ProfileManager.getInstance();
      profileManager.updateProfile(currentProfile.id, {
        coins: currentProfile.coins - item.price,
      });

      // Update local state
      setCurrentProfile(prev => prev ? { ...prev, coins: prev.coins - item.price } : null);

      setToast({
        message: `🎉 Successfully redeemed ${item.name}! Check your email for details.`,
        type: 'success',
      });

      // Add redemption to history (you can implement this)
      console.log(`Redeemed: ${item.name} for ${item.price} coins`);

    } catch (error) {
      console.error('Redemption error:', error);
      setToast({
        message: 'Failed to redeem item. Please try again!',
        type: 'error',
      });
    } finally {
      setIsRedeeming(null);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? GIFT_ITEMS 
    : GIFT_ITEMS.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All Items', icon: '🎁' },
    { id: 'gift-card', name: 'Gift Cards', icon: '💳' },
    { id: 'toy', name: 'Toys & Tools', icon: '🧸' },
    { id: 'book', name: 'Books', icon: '📚' },
    { id: 'special', name: 'Special', icon: '⭐' },
  ];

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <BigButton
            onClick={() => router.push('/scan')}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </BigButton>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">🎁 Gift Shop</h1>
            <p className="text-sm text-gray-500">Redeem your $BRANDON coins!</p>
          </div>
          
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-3 py-1">
            <Coins className="w-4 h-4" />
            <span className="font-bold">${currentProfile.coins}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Gift Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Item Image */}
              <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <span className="text-6xl">{item.image}</span>
              </div>

              {/* Item Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-gray-800">{item.price}</span>
                  </div>
                  
                  {item.category === 'gift-card' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Digital</span>
                    </div>
                  )}
                </div>

                {/* Redeem Button */}
                <BigButton
                  onClick={() => handleRedeem(item)}
                  disabled={currentProfile.coins < item.price || isRedeeming === item.id}
                  className={`w-full flex items-center justify-center gap-2 py-3 ${
                    currentProfile.coins >= item.price
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isRedeeming === item.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Redeeming...</span>
                    </>
                  ) : currentProfile.coins >= item.price ? (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>Redeem Now</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Not Enough Coins</span>
                    </>
                  )}
                </BigButton>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No items found</h3>
            <p className="text-gray-600">Try selecting a different category.</p>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            How it works
          </h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Earn $BRANDON coins by discovering new species</li>
            <li>• Gift cards will be sent to your email</li>
            <li>• Physical items will be shipped to your address</li>
            <li>• Special items unlock exclusive features</li>
          </ul>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
