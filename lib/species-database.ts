import { SpeciesResult } from '@/types/species';

export interface LocalSpecies {
  id: string;
  category: 'flower' | 'bug' | 'animal';
  commonName: string;
  scientificName: string;
  rank: 'species' | 'genus' | 'family' | 'kingdom' | 'class';
  confidence: number;
  imageUrl: string;
  summary: string;
  funFacts: string[];
  colorChips: string[];
  keywords: string[];
  gbifKey?: number;
  dangerous?: boolean;
}

export const speciesDatabase: LocalSpecies[] = [
  // === ANIMALS ===
  {
    id: 'dog',
    category: 'animal',
    commonName: 'Dog',
    scientificName: 'Canis familiaris',
    rank: 'species',
    confidence: 0.95,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/11-02-06-smile-by-ralphbijker.jpg/800px-11-02-06-smile-by-ralphbijker.jpg',
    summary: 'Dogs are domesticated mammals and one of the most popular pets worldwide. They are known for their loyalty, intelligence, and ability to form strong bonds with humans.',
    funFacts: [
      'Dogs have been domesticated for over 15,000 years!',
      'A dog\'s sense of smell is 40 times greater than a human\'s.',
      'Dogs can understand up to 250 words and gestures.',
      'There are over 340 different dog breeds worldwide.'
    ],
    colorChips: ['rgb(139, 69, 19)', 'rgb(160, 82, 45)', 'rgb(210, 180, 140)', 'rgb(255, 228, 196)'],
    keywords: ['dog', 'puppy', 'canine', 'pet', 'domestic', 'mammal'],
    gbifKey: 5219404
  },
  {
    id: 'cat',
    category: 'animal',
    commonName: 'Cat',
    scientificName: 'Felis catus',
    rank: 'species',
    confidence: 0.95,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/800px-Cat03.jpg',
    summary: 'Cats are small, carnivorous mammals that are popular pets. They are known for their independence, agility, and hunting skills.',
    funFacts: [
      'Cats spend 70% of their lives sleeping - that\'s 13-16 hours a day!',
      'A cat\'s purr vibrates at a frequency that promotes bone healing.',
      'Cats have over 20 muscles that control their ears.',
      'A group of cats is called a "clowder."'
    ],
    colorChips: ['rgb(169, 169, 169)', 'rgb(128, 128, 128)', 'rgb(105, 105, 105)', 'rgb(255, 255, 255)'],
    keywords: ['cat', 'kitten', 'feline', 'pet', 'domestic', 'mammal'],
    gbifKey: 2435022
  },
  {
    id: 'squirrel',
    category: 'animal',
    commonName: 'Eastern Gray Squirrel',
    scientificName: 'Sciurus carolinensis',
    rank: 'species',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Eastern_Grey_Squirrel.jpg/800px-Eastern_Grey_Squirrel.jpg',
    summary: 'Eastern gray squirrels are common tree-dwelling rodents found in urban and suburban areas. They are excellent climbers and known for storing nuts.',
    funFacts: [
      'Squirrels can jump up to 20 feet horizontally!',
      'They bury thousands of nuts each year and remember where most of them are.',
      'Squirrels can rotate their ankles 180 degrees to climb down trees head-first.',
      'A squirrel\'s front teeth never stop growing.'
    ],
    colorChips: ['rgb(128, 128, 128)', 'rgb(169, 169, 169)', 'rgb(105, 105, 105)', 'rgb(255, 255, 255)'],
    keywords: ['squirrel', 'gray squirrel', 'rodent', 'tree', 'wildlife', 'mammal'],
    gbifKey: 2437598
  },
  {
    id: 'rabbit',
    category: 'animal',
    commonName: 'Eastern Cottontail',
    scientificName: 'Sylvilagus floridanus',
    rank: 'species',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Oryctolagus_cuniculus_Rcdo.jpg/800px-Oryctolagus_cuniculus_Rcdo.jpg',
    summary: 'Eastern cottontails are common wild rabbits found in gardens and fields. They are known for their cotton-like white tail and excellent hearing.',
    funFacts: [
      'Rabbits can rotate their ears 270 degrees to detect predators.',
      'They can jump up to 3 feet high and 9 feet long!',
      'Rabbits can see behind them without turning their heads.',
      'A rabbit\'s teeth never stop growing throughout its life.'
    ],
    colorChips: ['rgb(255, 255, 255)', 'rgb(245, 245, 245)', 'rgb(220, 220, 220)', 'rgb(169, 169, 169)'],
    keywords: ['rabbit', 'bunny', 'cottontail', 'wildlife', 'mammal', 'herbivore'],
    gbifKey: 2436598
  },
  {
    id: 'bird-sparrow',
    category: 'animal',
    commonName: 'House Sparrow',
    scientificName: 'Passer domesticus',
    rank: 'species',
    confidence: 0.85,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Passer_domesticus_male_%2815%29.jpg/800px-Passer_domesticus_male_%2815%29.jpg',
    summary: 'House sparrows are small, social birds that have adapted well to human environments. They are found in cities, towns, and agricultural areas.',
    funFacts: [
      'House sparrows can swim underwater to escape predators!',
      'They can fly at speeds up to 24 miles per hour.',
      'Sparrows have been living alongside humans for over 10,000 years.',
      'A sparrow\'s heart beats up to 1,000 times per minute during flight.'
    ],
    colorChips: ['rgb(139, 69, 19)', 'rgb(160, 82, 45)', 'rgb(255, 215, 0)', 'rgb(128, 128, 128)'],
    keywords: ['sparrow', 'house sparrow', 'bird', 'songbird', 'passerine'],
    gbifKey: 2492343
  },
  {
    id: 'bird-robin',
    category: 'animal',
    commonName: 'American Robin',
    scientificName: 'Turdus migratorius',
    rank: 'species',
    confidence: 0.85,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Turdus_migratorius_-_American_Robin_-_XC125881.ogg/800px-Turdus_migratorius_-_American_Robin_-_XC125881.ogg.jpg',
    summary: 'American robins are familiar songbirds with distinctive orange-red breasts. They are often seen hopping on lawns searching for worms.',
    funFacts: [
      'Robins can see earthworms moving underground!',
      'They migrate up to 3,000 miles each year.',
      'Robins can fly at speeds up to 36 miles per hour.',
      'A robin\'s song can have over 100 different variations.'
    ],
    colorChips: ['rgb(255, 69, 0)', 'rgb(255, 140, 0)', 'rgb(128, 128, 128)', 'rgb(255, 255, 255)'],
    keywords: ['robin', 'american robin', 'bird', 'songbird', 'thrush'],
    gbifKey: 2492343
  },

  // === BUGS ===
  {
    id: 'bee-honey',
    category: 'bug',
    commonName: 'Honey Bee',
    scientificName: 'Apis mellifera',
    rank: 'species',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Apis_mellifera_Western_honey_bee.jpg/800px-Apis_mellifera_Western_honey_bee.jpg',
    summary: 'Honey bees are essential pollinators that live in colonies. They produce honey and are crucial for pollinating many food crops.',
    funFacts: [
      'A honey bee can fly up to 15 miles per hour!',
      'It takes 556 worker bees to gather 1 pound of honey.',
      'Bees can recognize human faces.',
      'A queen bee can lay up to 2,000 eggs per day.'
    ],
    colorChips: ['rgb(255, 215, 0)', 'rgb(255, 255, 0)', 'rgb(0, 0, 0)', 'rgb(139, 69, 19)'],
    keywords: ['bee', 'honey bee', 'insect', 'pollinator', 'hymenoptera'],
    gbifKey: 1341976
  },
  {
    id: 'butterfly-monarch',
    category: 'bug',
    commonName: 'Monarch Butterfly',
    scientificName: 'Danaus plexippus',
    rank: 'species',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Monarch_Butterfly_Danaus_plexippus_Male_2664px.jpg/800px-Monarch_Butterfly_Danaus_plexippus_Male_2664px.jpg',
    summary: 'Monarch butterflies are famous for their long migrations and distinctive orange and black wings. They are important pollinators.',
    funFacts: [
      'Monarchs can fly up to 3,000 miles during migration!',
      'They taste with their feet.',
      'A monarch\'s wingspan can reach up to 4 inches.',
      'They can fly at speeds up to 12 miles per hour.'
    ],
    colorChips: ['rgb(255, 140, 0)', 'rgb(255, 69, 0)', 'rgb(0, 0, 0)', 'rgb(255, 255, 255)'],
    keywords: ['butterfly', 'monarch', 'insect', 'lepidoptera', 'pollinator'],
    gbifKey: 1891274
  },
  {
    id: 'ladybug',
    category: 'bug',
    commonName: 'Seven-Spotted Ladybug',
    scientificName: 'Coccinella septempunctata',
    rank: 'species',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Coccinella_septempunctata_01.jpg/800px-Coccinella_septempunctata_01.jpg',
    summary: 'Ladybugs are beneficial insects that eat aphids and other garden pests. They are easily recognized by their red wings with black spots.',
    funFacts: [
      'Ladybugs can eat up to 5,000 aphids in their lifetime!',
      'They can fly at speeds up to 37 miles per hour.',
      'Ladybugs can live up to 2-3 years.',
      'They release a foul-smelling liquid when threatened.'
    ],
    colorChips: ['rgb(255, 0, 0)', 'rgb(220, 20, 60)', 'rgb(0, 0, 0)', 'rgb(255, 255, 255)'],
    keywords: ['ladybug', 'ladybird', 'beetle', 'insect', 'beneficial'],
    gbifKey: 1046674
  },
  {
    id: 'dragonfly',
    category: 'bug',
    commonName: 'Common Green Darner',
    scientificName: 'Anax junius',
    rank: 'species',
    confidence: 0.85,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Anax_junius_%28Common_Green_Darner%29.jpg/800px-Anax_junius_%28Common_Green_Darner%29.jpg',
    summary: 'Dragonflies are ancient insects with excellent flying abilities. They are important predators of mosquitoes and other flying insects.',
    funFacts: [
      'Dragonflies can fly up to 35 miles per hour!',
      'They can see in all directions at once.',
      'Dragonflies have been around for 300 million years.',
      'They can fly backwards and hover in place.'
    ],
    colorChips: ['rgb(0, 128, 0)', 'rgb(34, 139, 34)', 'rgb(0, 255, 0)', 'rgb(0, 0, 0)'],
    keywords: ['dragonfly', 'darner', 'insect', 'odonata', 'predator'],
    gbifKey: 1427894
  },

  // === FLOWERS ===
  {
    id: 'dandelion',
    category: 'flower',
    commonName: 'Dandelion',
    scientificName: 'Taraxacum officinale',
    rank: 'species',
    confidence: 0.95,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Taraxacum_officinale_flower.jpg/800px-Taraxacum_officinale_flower.jpg',
    summary: 'Dandelions are common wildflowers with bright yellow flowers that turn into fluffy white seed heads. They are edible and have medicinal properties.',
    funFacts: [
      'Dandelion seeds can travel up to 5 miles on the wind!',
      'Every part of the dandelion is edible.',
      'They can grow in almost any soil condition.',
      'Dandelions are related to sunflowers and daisies.'
    ],
    colorChips: ['rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(255, 255, 255)', 'rgb(34, 139, 34)'],
    keywords: ['dandelion', 'flower', 'wildflower', 'weed', 'yellow'],
    gbifKey: 3152523
  },
  {
    id: 'clover',
    category: 'flower',
    commonName: 'White Clover',
    scientificName: 'Trifolium repens',
    rank: 'species',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Trifolium_repens_flowers.jpg/800px-Trifolium_repens_flowers.jpg',
    summary: 'White clover is a common lawn plant with white flower heads and three-part leaves. It fixes nitrogen in the soil and attracts bees.',
    funFacts: [
      'Clover can fix nitrogen from the air into the soil!',
      'Four-leaf clovers are rare mutations.',
      'Clover flowers are actually many tiny flowers grouped together.',
      'Bees love clover nectar and make excellent honey from it.'
    ],
    colorChips: ['rgb(255, 255, 255)', 'rgb(240, 248, 255)', 'rgb(34, 139, 34)', 'rgb(0, 100, 0)'],
    keywords: ['clover', 'white clover', 'flower', 'lawn', 'legume'],
    gbifKey: 2972195
  },
  {
    id: 'sunflower',
    category: 'flower',
    commonName: 'Common Sunflower',
    scientificName: 'Helianthus annuus',
    rank: 'species',
    confidence: 0.95,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sunflower_sky_backdrop.jpg/800px-Sunflower_sky_backdrop.jpg',
    summary: 'Sunflowers are tall, bright yellow flowers that follow the sun throughout the day. They produce edible seeds and are important for pollinators.',
    funFacts: [
      'Sunflowers can grow up to 12 feet tall!',
      'They follow the sun from east to west during the day.',
      'A single sunflower can produce up to 2,000 seeds.',
      'Sunflower seeds are actually fruits, not seeds.'
    ],
    colorChips: ['rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(139, 69, 19)', 'rgb(34, 139, 34)'],
    keywords: ['sunflower', 'flower', 'yellow', 'tall', 'seeds'],
    gbifKey: 3119134
  },
  {
    id: 'daisy',
    category: 'flower',
    commonName: 'Oxeye Daisy',
    scientificName: 'Leucanthemum vulgare',
    rank: 'species',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Leucanthemum_vulgare_%27Filigran%27_Flower_2200px.jpg/800px-Leucanthemum_vulgare_%27Filigran%27_Flower_2200px.jpg',
    summary: 'Oxeye daisies are classic white flowers with yellow centers. They are common in meadows and roadsides and attract many pollinators.',
    funFacts: [
      'Daisies can grow in almost any soil type!',
      'Each "flower" is actually many tiny flowers grouped together.',
      'Daisies can bloom from spring to fall.',
      'They are related to sunflowers and dandelions.'
    ],
    colorChips: ['rgb(255, 255, 255)', 'rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(34, 139, 34)'],
    keywords: ['daisy', 'oxeye daisy', 'flower', 'white', 'meadow'],
    gbifKey: 3152523
  },
  {
    id: 'rose',
    category: 'flower',
    commonName: 'Garden Rose',
    scientificName: 'Rosa',
    rank: 'genus',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rosa_rubiginosa_1.jpg/800px-Rosa_rubiginosa_1.jpg',
    summary: 'Roses are beautiful flowering shrubs with fragrant blooms. They come in many colors and are popular garden plants worldwide.',
    funFacts: [
      'Roses have been cultivated for over 5,000 years!',
      'There are over 300 species of roses.',
      'Rose hips are rich in vitamin C.',
      'Roses are related to apples, strawberries, and almonds.'
    ],
    colorChips: ['rgb(255, 0, 0)', 'rgb(255, 192, 203)', 'rgb(255, 255, 255)', 'rgb(34, 139, 34)'],
    keywords: ['rose', 'flower', 'garden', 'fragrant', 'shrub'],
    gbifKey: 3152523
  },
  {
    id: 'tulip',
    category: 'flower',
    commonName: 'Tulip',
    scientificName: 'Tulipa',
    rank: 'genus',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Tulip_-_floriade_canberra.jpg/800px-Tulip_-_floriade_canberra.jpg',
    summary: 'Tulips are spring-blooming flowers with cup-shaped blooms. They come in many colors and are popular garden and cut flowers.',
    funFacts: [
      'Tulips were once more valuable than gold in Holland!',
      'They can continue growing up to an inch after being cut.',
      'Tulips are related to lilies and onions.',
      'There are over 3,000 registered varieties of tulips.'
    ],
    colorChips: ['rgb(255, 0, 0)', 'rgb(255, 255, 0)', 'rgb(255, 255, 255)', 'rgb(34, 139, 34)'],
    keywords: ['tulip', 'flower', 'spring', 'bulb', 'garden'],
    gbifKey: 3152523
  },
  {
    id: 'lily',
    category: 'flower',
    commonName: 'Lily',
    scientificName: 'Lilium',
    rank: 'genus',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Lilium_%27Stargazer%27.jpg/800px-Lilium_%27Stargazer%27.jpg',
    summary: 'Lilies are elegant flowers with large, showy blooms. They come in many colors and are popular in gardens and as cut flowers.',
    funFacts: [
      'Lilies have been cultivated for over 3,000 years!',
      'Some lilies can grow up to 8 feet tall.',
      'Lily bulbs can be eaten and are used in Asian cuisine.',
      'Lilies are toxic to cats but safe for humans.'
    ],
    colorChips: ['rgb(255, 255, 255)', 'rgb(255, 192, 203)', 'rgb(255, 0, 0)', 'rgb(34, 139, 34)'],
    keywords: ['lily', 'flower', 'elegant', 'garden', 'bulb'],
    gbifKey: 3152523
  },
  {
    id: 'marigold',
    category: 'flower',
    commonName: 'Marigold',
    scientificName: 'Tagetes',
    rank: 'genus',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Tagetes_erecta_%27Inca_II%27.jpg/800px-Tagetes_erecta_%27Inca_II%27.jpg',
    summary: 'Marigolds are bright, cheerful flowers that are easy to grow. They are popular in gardens and are known for repelling pests.',
    funFacts: [
      'Marigolds can repel mosquitoes and other insects!',
      'They are edible and used in cooking and tea.',
      'Marigolds are native to the Americas.',
      'They can bloom from spring until frost.'
    ],
    colorChips: ['rgb(255, 255, 0)', 'rgb(255, 140, 0)', 'rgb(255, 69, 0)', 'rgb(34, 139, 34)'],
    keywords: ['marigold', 'flower', 'orange', 'yellow', 'garden'],
    gbifKey: 3152523
  },
  {
    id: 'ant',
    category: 'bug',
    commonName: 'Black Garden Ant',
    scientificName: 'Lasius niger',
    rank: 'species',
    confidence: 0.85,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Lasius_niger_worker.jpg/800px-Lasius_niger_worker.jpg',
    summary: 'Black garden ants are common social insects that live in colonies. They are important for soil health and seed dispersal.',
    funFacts: [
      'Ants can carry objects 50 times their body weight!',
      'They communicate using chemicals called pheromones.',
      'Ant colonies can have up to 15,000 workers.',
      'Ants have been around for over 100 million years.'
    ],
    colorChips: ['rgb(0, 0, 0)', 'rgb(64, 64, 64)', 'rgb(128, 128, 128)', 'rgb(169, 169, 169)'],
    keywords: ['ant', 'black ant', 'garden ant', 'insect', 'colony'],
    gbifKey: 1314167
  },
  {
    id: 'spider-garden',
    category: 'bug',
    commonName: 'Garden Spider',
    scientificName: 'Araneus diadematus',
    rank: 'species',
    confidence: 0.85,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Araneus_diadematus_female.jpg/800px-Araneus_diadematus_female.jpg',
    summary: 'Garden spiders are orb-weaving spiders that build beautiful circular webs. They are beneficial predators that eat many garden pests.',
    funFacts: [
      'Spiders can produce up to 7 different types of silk!',
      'They can eat insects up to twice their size.',
      'Spider silk is stronger than steel of the same thickness.',
      'Spiders have been around for over 300 million years.'
    ],
    colorChips: ['rgb(139, 69, 19)', 'rgb(160, 82, 45)', 'rgb(0, 0, 0)', 'rgb(255, 255, 255)'],
    keywords: ['spider', 'garden spider', 'web', 'arachnid', 'predator'],
    gbifKey: 2159586
  },
  {
    id: 'chipmunk',
    category: 'animal',
    commonName: 'Eastern Chipmunk',
    scientificName: 'Tamias striatus',
    rank: 'species',
    confidence: 0.85,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Eastern_Chipmunk_%28Tamias_striatus%29.jpg/800px-Eastern_Chipmunk_%28Tamias_striatus%29.jpg',
    summary: 'Eastern chipmunks are small, striped rodents that are common in forests and gardens. They are excellent climbers and store food for winter.',
    funFacts: [
      'Chipmunks can stuff up to 32 beechnuts in their cheeks!',
      'They can climb trees and swim.',
      'Chipmunks hibernate for up to 8 months.',
      'They can run at speeds up to 21 miles per hour.'
    ],
    colorChips: ['rgb(139, 69, 19)', 'rgb(160, 82, 45)', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)'],
    keywords: ['chipmunk', 'eastern chipmunk', 'rodent', 'striped', 'wildlife'],
    gbifKey: 2437598
  },
  {
    id: 'deer',
    category: 'animal',
    commonName: 'White-tailed Deer',
    scientificName: 'Odocoileus virginianus',
    rank: 'species',
    confidence: 0.9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/White-tailed_deer.jpg/800px-White-tailed_deer.jpg',
    summary: 'White-tailed deer are common large mammals found in forests and fields. They are excellent jumpers and can run at high speeds.',
    funFacts: [
      'Deer can jump up to 10 feet high and 30 feet long!',
      'They can run at speeds up to 30 miles per hour.',
      'Deer can swim and are excellent swimmers.',
      'They can see in color and have excellent night vision.'
    ],
    colorChips: ['rgb(139, 69, 19)', 'rgb(160, 82, 45)', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)'],
    keywords: ['deer', 'white-tailed deer', 'mammal', 'wildlife', 'forest'],
    gbifKey: 2441176
  }
];

// Helper function to find species by keywords
export function findSpeciesByKeywords(labels: string[]): LocalSpecies | null {
  const lowerLabels = labels.map(label => label.toLowerCase());
  
  console.log('🔍 Searching for species with labels:', labels);
  
  // Define category-specific terms to avoid cross-category confusion
  const flowerTerms = ['flower', 'bloom', 'petal', 'rose', 'tulip', 'lily', 'daisy', 'sunflower', 'dandelion', 'clover', 'marigold', 'plant', 'garden plant'];
  const bugTerms = ['insect', 'bug', 'bee', 'butterfly', 'ant', 'spider', 'ladybug', 'dragonfly', 'moth', 'wasp', 'hornet', 'firefly', 'cicada', 'stick insect', 'praying mantis'];
  const animalTerms = ['animal', 'mammal', 'bird', 'reptile', 'amphibian', 'fish', 'dog', 'cat', 'squirrel', 'rabbit', 'deer', 'fox', 'raccoon', 'skunk', 'chipmunk', 'mouse', 'rat', 'hamster', 'guinea pig', 'ferret', 'horse', 'cow', 'pig', 'sheep', 'goat', 'duck', 'goose', 'chicken', 'turkey', 'pigeon', 'sparrow', 'robin', 'cardinal', 'blue jay', 'crow', 'hawk', 'eagle', 'owl', 'snake', 'lizard', 'turtle', 'frog', 'toad', 'goldfish', 'koi'];
  
  let bestMatch: LocalSpecies | null = null;
  let bestScore = 0;
  
  for (const species of speciesDatabase) {
    let currentScore = 0;
    const lowerCommonName = species.commonName.toLowerCase();
    const lowerScientificName = species.scientificName.toLowerCase();
    
    // 1. Exact match on common or scientific name
    if (lowerLabels.includes(lowerCommonName) || lowerLabels.includes(lowerScientificName)) {
      currentScore += 100; // High score for exact match
    }
    
    // 2. Category-specific keyword matches
    for (const label of lowerLabels) {
      if (species.category === 'flower' && flowerTerms.includes(label)) {
        currentScore += 20;
      } else if (species.category === 'bug' && bugTerms.includes(label)) {
        currentScore += 20;
      } else if (species.category === 'animal' && animalTerms.includes(label)) {
        currentScore += 20;
      }
    }
    
    // 3. General keyword matches (case-insensitive, partial)
    for (const keyword of species.keywords) {
      for (const label of lowerLabels) {
        if (label.includes(keyword) || keyword.includes(label)) {
          currentScore += 10;
        }
      }
    }
    
    // 4. Confidence boost (if species has high confidence)
    currentScore += species.confidence * 50; // Scale confidence to add to score
    
    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestMatch = species;
    }
  }
  
  if (bestMatch) {
    console.log(`✅ Best match found: ${bestMatch.commonName} with score ${bestScore}`);
  } else {
    console.log('❌ No strong local match found.');
  }
  
  return bestMatch;
}

// Helper function to convert LocalSpecies to SpeciesResult
export function localSpeciesToResult(species: LocalSpecies): SpeciesResult {
  return {
    category: species.category,
    canonicalName: species.scientificName,
    commonName: species.commonName,
    rank: species.rank,
    confidence: species.confidence,
    provider: 'local' as any,
    gbifKey: species.gbifKey,
    wiki: {
      summary: species.summary,
      imageUrl: species.imageUrl,
    },
    ui: {
      colorChips: species.colorChips,
      funFacts: species.funFacts,
    },
  };
}
