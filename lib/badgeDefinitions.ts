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
  // Flower Badges (20 total)
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
    id: 'flower-lily',
    category: 'flower',
    subtype: 'lily',
    name: 'Lily Locator',
    description: 'Locate elegant lilies',
    emoji: '⚜️',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Lily', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Lily', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Lily', color: 'gold' }
    ]
  },
  {
    id: 'flower-orchid',
    category: 'flower',
    subtype: 'orchid',
    name: 'Orchid Observer',
    description: 'Observe exotic orchids',
    emoji: '🪴',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Orchid', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Orchid', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Orchid', color: 'gold' }
    ]
  },
  {
    id: 'flower-dandelion',
    category: 'flower',
    subtype: 'dandelion',
    name: 'Dandelion Detective',
    description: 'Detect dainty dandelions',
    emoji: '🌱',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Dandelion', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Dandelion', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Dandelion', color: 'gold' }
    ]
  },
  {
    id: 'flower-lavender',
    category: 'flower',
    subtype: 'lavender',
    name: 'Lavender Lover',
    description: 'Love lovely lavender',
    emoji: '💜',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Lavender', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Lavender', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Lavender', color: 'gold' }
    ]
  },
  {
    id: 'flower-marigold',
    category: 'flower',
    subtype: 'marigold',
    name: 'Marigold Master',
    description: 'Master marigold mysteries',
    emoji: '🟠',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Marigold', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Marigold', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Marigold', color: 'gold' }
    ]
  },
  {
    id: 'flower-pansy',
    category: 'flower',
    subtype: 'pansy',
    name: 'Pansy Pioneer',
    description: 'Pioneer pansy paths',
    emoji: '🟣',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Pansy', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Pansy', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Pansy', color: 'gold' }
    ]
  },
  {
    id: 'flower-carnation',
    category: 'flower',
    subtype: 'carnation',
    name: 'Carnation Collector',
    description: 'Collect colorful carnations',
    emoji: '🌺',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Carnation', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Carnation', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Carnation', color: 'gold' }
    ]
  },
  {
    id: 'flower-iris',
    category: 'flower',
    subtype: 'iris',
    name: 'Iris Inspector',
    description: 'Inspect iridescent irises',
    emoji: '🔮',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Iris', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Iris', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Iris', color: 'gold' }
    ]
  },
  {
    id: 'flower-peony',
    category: 'flower',
    subtype: 'peony',
    name: 'Peony Pioneer',
    description: 'Pioneer peony paradise',
    emoji: '🎀',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Peony', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Peony', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Peony', color: 'gold' }
    ]
  },
  {
    id: 'flower-azalea',
    category: 'flower',
    subtype: 'azalea',
    name: 'Azalea Adventurer',
    description: 'Adventure through azalea avenues',
    emoji: '🌿',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Azalea', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Azalea', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Azalea', color: 'gold' }
    ]
  },
  {
    id: 'flower-camellia',
    category: 'flower',
    subtype: 'camellia',
    name: 'Camellia Champion',
    description: 'Champion camellia causes',
    emoji: '🌺',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Camellia', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Camellia', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Camellia', color: 'gold' }
    ]
  },
  {
    id: 'flower-gardenia',
    category: 'flower',
    subtype: 'gardenia',
    name: 'Gardenia Guardian',
    description: 'Guard gardenia gardens',
    emoji: '🤍',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Gardenia', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Gardenia', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Gardenia', color: 'gold' }
    ]
  },
  {
    id: 'flower-hydrangea',
    category: 'flower',
    subtype: 'hydrangea',
    name: 'Hydrangea Hunter',
    description: 'Hunt for hydrangea happiness',
    emoji: '💙',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Hydrangea', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Hydrangea', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Hydrangea', color: 'gold' }
    ]
  },
  {
    id: 'flower-geranium',
    category: 'flower',
    subtype: 'geranium',
    name: 'Geranium Guide',
    description: 'Guide through geranium groves',
    emoji: '🩷',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Geranium', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Geranium', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Geranium', color: 'gold' }
    ]
  },
  {
    id: 'flower-zinnia',
    category: 'flower',
    subtype: 'zinnia',
    name: 'Zinnia Zealot',
    description: 'Zealously seek zinnias',
    emoji: '🌈',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Zinnia', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Zinnia', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Zinnia', color: 'gold' }
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

  // Bug Badges (20 total)
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
    description: 'Love lucky ladybugs',
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
    name: 'Dragonfly Detective',
    description: 'Detect darting dragonflies',
    emoji: '🦗',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Dragonfly', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Dragonfly', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Dragonfly', color: 'gold' }
    ]
  },
  {
    id: 'bug-firefly',
    category: 'bug',
    subtype: 'firefly',
    name: 'Firefly Finder',
    description: 'Find flickering fireflies',
    emoji: '✨',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Firefly', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Firefly', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Firefly', color: 'gold' }
    ]
  },
  {
    id: 'bug-moth',
    category: 'bug',
    subtype: 'moth',
    name: 'Moth Master',
    description: 'Master moth mysteries',
    emoji: '🦋',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Moth', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Moth', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Moth', color: 'gold' }
    ]
  },
  {
    id: 'bug-ant',
    category: 'bug',
    subtype: 'ant',
    name: 'Ant Adventurer',
    description: 'Adventure with active ants',
    emoji: '🐜',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Ant', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Ant', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Ant', color: 'gold' }
    ]
  },
  {
    id: 'bug-spider',
    category: 'bug',
    subtype: 'spider',
    name: 'Spider Spotter',
    description: 'Spot skillful spiders',
    emoji: '🕷️',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Spider', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Spider', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Spider', color: 'gold' }
    ]
  },
  {
    id: 'bug-grasshopper',
    category: 'bug',
    subtype: 'grasshopper',
    name: 'Grasshopper Guide',
    description: 'Guide green grasshoppers',
    emoji: '🦗',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Grasshopper', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Grasshopper', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Grasshopper', color: 'gold' }
    ]
  },
  {
    id: 'bug-cricket',
    category: 'bug',
    subtype: 'cricket',
    name: 'Cricket Collector',
    description: 'Collect chirping crickets',
    emoji: '🦗',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Cricket', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Cricket', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Cricket', color: 'gold' }
    ]
  },
  {
    id: 'bug-beetle',
    category: 'bug',
    subtype: 'beetle',
    name: 'Beetle Buddy',
    description: 'Buddy up with beetles',
    emoji: '🪲',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Beetle', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Beetle', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Beetle', color: 'gold' }
    ]
  },
  {
    id: 'bug-mosquito',
    category: 'bug',
    subtype: 'mosquito',
    name: 'Mosquito Monitor',
    description: 'Monitor mighty mosquitoes',
    emoji: '🦟',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Mosquito', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Mosquito', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Mosquito', color: 'gold' }
    ]
  },
  {
    id: 'bug-fly',
    category: 'bug',
    subtype: 'fly',
    name: 'Fly Finder',
    description: 'Find flying flies',
    emoji: '🪰',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Fly', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Fly', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Fly', color: 'gold' }
    ]
  },
  {
    id: 'bug-wasp',
    category: 'bug',
    subtype: 'wasp',
    name: 'Wasp Watcher',
    description: 'Watch wasps at work',
    emoji: '🐝',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Wasp', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Wasp', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Wasp', color: 'gold' }
    ]
  },
  {
    id: 'bug-hornet',
    category: 'bug',
    subtype: 'hornet',
    name: 'Hornet Hunter',
    description: 'Hunt for hornets',
    emoji: '🐝',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Hornet', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Hornet', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Hornet', color: 'gold' }
    ]
  },
  {
    id: 'bug-cicada',
    category: 'bug',
    subtype: 'cicada',
    name: 'Cicada Seeker',
    description: 'Seek singing cicadas',
    emoji: '🦗',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Cicada', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Cicada', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Cicada', color: 'gold' }
    ]
  },
  {
    id: 'bug-mantis',
    category: 'bug',
    subtype: 'mantis',
    name: 'Mantis Master',
    description: 'Master praying mantis',
    emoji: '🦗',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Mantis', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Mantis', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Mantis', color: 'gold' }
    ]
  },
  {
    id: 'bug-stick',
    category: 'bug',
    subtype: 'stick',
    name: 'Stick Insect Spotter',
    description: 'Spot stick insects',
    emoji: '🦗',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Stick Insect', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Stick Insect', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Stick Insect', color: 'gold' }
    ]
  },
  {
    id: 'bug-general',
    category: 'bug',
    subtype: 'bug',
    name: 'Bug Buddy',
    description: 'Discover various bugs',
    emoji: '🐛',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Bug', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Bug', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Bug', color: 'gold' }
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

  // Animal Badges (20 total)
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
    id: 'animal-rabbit',
    category: 'animal',
    subtype: 'rabbit',
    name: 'Rabbit Runner',
    description: 'Run with rapid rabbits',
    emoji: '🐰',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Rabbit', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Rabbit', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Rabbit', color: 'gold' }
    ]
  },
  {
    id: 'animal-deer',
    category: 'animal',
    subtype: 'deer',
    name: 'Deer Discoverer',
    description: 'Discover dainty deer',
    emoji: '🦌',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Deer', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Deer', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Deer', color: 'gold' }
    ]
  },
  {
    id: 'animal-fox',
    category: 'animal',
    subtype: 'fox',
    name: 'Fox Finder',
    description: 'Find foxy foxes',
    emoji: '🦊',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Fox', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Fox', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Fox', color: 'gold' }
    ]
  },
  {
    id: 'animal-raccoon',
    category: 'animal',
    subtype: 'raccoon',
    name: 'Raccoon Ranger',
    description: 'Ranger with raccoons',
    emoji: '🦝',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Raccoon', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Raccoon', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Raccoon', color: 'gold' }
    ]
  },
  {
    id: 'animal-possum',
    category: 'animal',
    subtype: 'possum',
    name: 'Possum Pioneer',
    description: 'Pioneer with possums',
    emoji: '🦝',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Possum', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Possum', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Possum', color: 'gold' }
    ]
  },
  {
    id: 'animal-skunk',
    category: 'animal',
    subtype: 'skunk',
    name: 'Skunk Spotter',
    description: 'Spot striped skunks',
    emoji: '🦨',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Skunk', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Skunk', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Skunk', color: 'gold' }
    ]
  },
  {
    id: 'animal-chipmunk',
    category: 'animal',
    subtype: 'chipmunk',
    name: 'Chipmunk Champion',
    description: 'Champion chipmunks',
    emoji: '🐿️',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Chipmunk', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Chipmunk', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Chipmunk', color: 'gold' }
    ]
  },
  {
    id: 'animal-groundhog',
    category: 'animal',
    subtype: 'groundhog',
    name: 'Groundhog Guardian',
    description: 'Guard groundhogs',
    emoji: '🦫',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Groundhog', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Groundhog', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Groundhog', color: 'gold' }
    ]
  },
  {
    id: 'animal-beaver',
    category: 'animal',
    subtype: 'beaver',
    name: 'Beaver Builder',
    description: 'Build with beavers',
    emoji: '🦫',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Beaver', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Beaver', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Beaver', color: 'gold' }
    ]
  },
  {
    id: 'animal-hedgehog',
    category: 'animal',
    subtype: 'hedgehog',
    name: 'Hedgehog Hunter',
    description: 'Hunt for hedgehogs',
    emoji: '🦔',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Hedgehog', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Hedgehog', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Hedgehog', color: 'gold' }
    ]
  },
  {
    id: 'animal-mole',
    category: 'animal',
    subtype: 'mole',
    name: 'Mole Miner',
    description: 'Mine with moles',
    emoji: '🦫',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Mole', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Mole', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Mole', color: 'gold' }
    ]
  },
  {
    id: 'animal-mouse',
    category: 'animal',
    subtype: 'mouse',
    name: 'Mouse Master',
    description: 'Master mouse mysteries',
    emoji: '🐭',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Mouse', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Mouse', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Mouse', color: 'gold' }
    ]
  },
  {
    id: 'animal-rat',
    category: 'animal',
    subtype: 'rat',
    name: 'Rat Ranger',
    description: 'Ranger with rats',
    emoji: '🐀',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Rat', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Rat', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Rat', color: 'gold' }
    ]
  },
  {
    id: 'animal-hamster',
    category: 'animal',
    subtype: 'hamster',
    name: 'Hamster Helper',
    description: 'Help hamsters',
    emoji: '🐹',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Hamster', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Hamster', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Hamster', color: 'gold' }
    ]
  },
  {
    id: 'animal-guinea-pig',
    category: 'animal',
    subtype: 'guinea-pig',
    name: 'Guinea Pig Guide',
    description: 'Guide guinea pigs',
    emoji: '🐹',
    levels: [
      { level: 1, count: 1, nextGoal: 3, name: 'Bronze Guinea Pig', color: 'bronze' },
      { level: 2, count: 3, nextGoal: 7, name: 'Silver Guinea Pig', color: 'silver' },
      { level: 3, count: 7, nextGoal: 0, name: 'Gold Guinea Pig', color: 'gold' }
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
