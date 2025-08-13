export interface BadgeDefinition {
  id: string;
  category: 'flower' | 'bug' | 'animal';
  subtype: string;
  name: string;
  description: string;
  emoji: string;
  levels: {
    level: number;
    count: number;
    nextGoal: number;
    name: string;
    color: string;
  }[];
}

export const ALL_BADGES: BadgeDefinition[] = [
  // Flower Badges
  {
    id: 'flower-rose',
    category: 'flower',
    subtype: 'rose',
    name: 'Rose Collector',
    description: 'Collect different types of roses',
    emoji: '🌹',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Rose', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Rose', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Rose', color: 'gold' }
    ]
  },
  {
    id: 'flower-daisy',
    category: 'flower',
    subtype: 'daisy',
    name: 'Daisy Discoverer',
    description: 'Find beautiful daisies',
    emoji: '🌼',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Daisy', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Daisy', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Daisy', color: 'gold' }
    ]
  },
  {
    id: 'flower-tulip',
    category: 'flower',
    subtype: 'tulip',
    name: 'Tulip Tracker',
    description: 'Track colorful tulips',
    emoji: '🌷',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Tulip', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Tulip', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Tulip', color: 'gold' }
    ]
  },
  {
    id: 'flower-sunflower',
    category: 'flower',
    subtype: 'sunflower',
    name: 'Sunflower Seeker',
    description: 'Seek out sunny sunflowers',
    emoji: '🌻',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Sunflower', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Sunflower', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Sunflower', color: 'gold' }
    ]
  },
  {
    id: 'flower-general',
    category: 'flower',
    subtype: 'flower',
    name: 'Flower Finder',
    description: 'Discover various flowers',
    emoji: '🌸',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Flower', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Flower', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Flower', color: 'gold' }
    ]
  },

  // Bug Badges
  {
    id: 'bug-butterfly',
    category: 'bug',
    subtype: 'butterfly',
    name: 'Butterfly Hunter',
    description: 'Hunt for beautiful butterflies',
    emoji: '🦋',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Butterfly', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Butterfly', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Butterfly', color: 'gold' }
    ]
  },
  {
    id: 'bug-bee',
    category: 'bug',
    subtype: 'bee',
    name: 'Bee Buddy',
    description: 'Make friends with busy bees',
    emoji: '🐝',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Bee', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Bee', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Bee', color: 'gold' }
    ]
  },
  {
    id: 'bug-ladybug',
    category: 'bug',
    subtype: 'ladybug',
    name: 'Ladybug Lover',
    description: 'Love those lucky ladybugs',
    emoji: '🐞',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Ladybug', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Ladybug', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Ladybug', color: 'gold' }
    ]
  },
  {
    id: 'bug-dragonfly',
    category: 'bug',
    subtype: 'dragonfly',
    name: 'Dragonfly Dreamer',
    description: 'Dream of darting dragonflies',
    emoji: '🦗',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Dragonfly', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Dragonfly', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Dragonfly', color: 'gold' }
    ]
  },
  {
    id: 'bug-general',
    category: 'bug',
    subtype: 'bug',
    name: 'Bug Buddy',
    description: 'Be friends with all bugs',
    emoji: '🦗',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Bug', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Bug', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Bug', color: 'gold' }
    ]
  },

  // Animal Badges
  {
    id: 'animal-bird',
    category: 'animal',
    subtype: 'bird',
    name: 'Bird Watcher',
    description: 'Watch wonderful birds',
    emoji: '🐦',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Bird', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Bird', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Bird', color: 'gold' }
    ]
  },
  {
    id: 'animal-dog',
    category: 'animal',
    subtype: 'dog',
    name: 'Dog Detective',
    description: 'Detect delightful dogs',
    emoji: '🐕',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Dog', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Dog', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Dog', color: 'gold' }
    ]
  },
  {
    id: 'animal-cat',
    category: 'animal',
    subtype: 'cat',
    name: 'Cat Companion',
    description: 'Companion with curious cats',
    emoji: '🐱',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Cat', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Cat', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Cat', color: 'gold' }
    ]
  },
  {
    id: 'animal-squirrel',
    category: 'animal',
    subtype: 'squirrel',
    name: 'Squirrel Spotter',
    description: 'Spot speedy squirrels',
    emoji: '🐿️',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Squirrel', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Squirrel', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Squirrel', color: 'gold' }
    ]
  },
  {
    id: 'animal-general',
    category: 'animal',
    subtype: 'animal',
    name: 'Animal Adventurer',
    description: 'Adventure with amazing animals',
    emoji: '🐾',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Animal', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Animal', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Animal', color: 'gold' }
    ]
  }
];

export function getBadgeDefinition(category: string, subtype: string): BadgeDefinition | undefined {
  return ALL_BADGES.find(badge => 
    badge.category === category && badge.subtype === subtype
  );
}

export function getAllBadgesForCategory(category: string): BadgeDefinition[] {
  return ALL_BADGES.filter(badge => badge.category === category);
}
