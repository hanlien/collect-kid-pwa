import { SpeciesResult } from '@/types/species';
import { LocalModelResult } from './localModel';

export function postprocessLocalResult(localResult: LocalModelResult): SpeciesResult {
  // Get label info from the label map
  const labelInfo = getLabelInfo(localResult.labelId);
  
  if (!labelInfo) {
    return {
      category: 'flower',
      canonicalName: 'Mysterious!',
commonName: 'Mysterious!',
      rank: 'species',
      confidence: localResult.topK[0]?.prob || 0,
      provider: 'local',
      meta: {
        modelVersion: 'v001',
        reasoning: 'Local model - mysterious label'
      }
    };
  }

  // Check safety flags
  const safetyFlags = getSafetyFlags(localResult.labelId);
  
  return {
    category: labelInfo.category as any,
    canonicalName: labelInfo.species,
    commonName: labelInfo.commonName,
    rank: 'species',
    confidence: localResult.topK[0]?.prob || 0,
    provider: 'local',
    gbifKey: undefined, // Local model doesn't provide GBIF keys
    wiki: {
      summary: labelInfo.description,
      imageUrl: getDefaultImageUrl(localResult.labelId)
    },
    ui: {
      colorChips: getDefaultColorChips(labelInfo.category),
      funFacts: getDefaultFunFacts(localResult.labelId)
    },
    meta: {
      modelVersion: 'v001',
      reasoning: 'Local model inference',
      topK: localResult.topK,
      inferenceTime: localResult.inferenceTime
    },
    ...(safetyFlags && { safety: safetyFlags })
  };
}

// let labelMapCache: any = null;

// async function loadLabelMap(): Promise<any> {
//   if (!labelMapCache) {
//     const response = await fetch('/ml/label_map.json');
//     labelMapCache = await response.json();
//   }
//   return labelMapCache;
// }

function getLabelInfo(labelId: string): any {
  // For now, return a basic structure based on the label ID
  // In a full implementation, this would load from the label map
  const basicLabelMap: Record<string, any> = {
    'rose_garden': {
      category: 'flower',
      species: 'Rosa sp.',
      commonName: 'Garden Rose',
      description: 'Beautiful flowering shrub with fragrant blooms'
    },
    'dandelion': {
      category: 'flower',
      species: 'Taraxacum officinale',
      commonName: 'Dandelion',
      description: 'Yellow wildflower with fluffy seed heads'
    },
    'sunflower': {
      category: 'flower',
      species: 'Helianthus annuus',
      commonName: 'Sunflower',
      description: 'Tall yellow flower that follows the sun'
    },
    'daisy_oxeye': {
      category: 'flower',
      species: 'Leucanthemum vulgare',
      commonName: 'Oxeye Daisy',
      description: 'White flower with yellow center'
    },
    'tulip': {
      category: 'flower',
      species: 'Tulipa sp.',
      commonName: 'Tulip',
      description: 'Spring-blooming bulb flower'
    },
    'lily': {
      category: 'flower',
      species: 'Lilium sp.',
      commonName: 'Lily',
      description: 'Elegant flower with large blooms'
    },
    'marigold': {
      category: 'flower',
      species: 'Tagetes sp.',
      commonName: 'Marigold',
      description: 'Bright orange or yellow garden flower'
    },
    'clover_white': {
      category: 'flower',
      species: 'Trifolium repens',
      commonName: 'White Clover',
      description: 'Small white flower heads in lawns'
    },
    'bee_honey': {
      category: 'bug',
      species: 'Apis mellifera',
      commonName: 'Honey Bee',
      description: 'Essential pollinator that produces honey'
    },
    'butterfly_monarch': {
      category: 'bug',
      species: 'Danaus plexippus',
      commonName: 'Monarch Butterfly',
      description: 'Orange and black migratory butterfly'
    },
    'ladybug': {
      category: 'bug',
      species: 'Coccinella septempunctata',
      commonName: 'Seven-Spotted Ladybug',
      description: 'Red beetle with black spots'
    },
    'dragonfly_green': {
      category: 'bug',
      species: 'Anax junius',
      commonName: 'Common Green Darner',
      description: 'Large green dragonfly'
    },
    'ant_black_garden': {
      category: 'bug',
      species: 'Lasius niger',
      commonName: 'Black Garden Ant',
      description: 'Common black ant in gardens'
    },
    'spider_garden': {
      category: 'bug',
      species: 'Araneus diadematus',
      commonName: 'Garden Spider',
      description: 'Orb-weaving spider with cross pattern'
    },
    'dog': {
      category: 'animal',
      species: 'Canis familiaris',
      commonName: 'Dog',
      description: 'Domesticated canine companion'
    },
    'cat': {
      category: 'animal',
      species: 'Felis catus',
      commonName: 'Cat',
      description: 'Domestic feline companion'
    },
    'squirrel_gray': {
      category: 'animal',
      species: 'Sciurus carolinensis',
      commonName: 'Eastern Gray Squirrel',
      description: 'Common tree-dwelling rodent'
    },
    'rabbit_cottontail': {
      category: 'animal',
      species: 'Sylvilagus floridanus',
      commonName: 'Eastern Cottontail',
      description: 'Wild rabbit with white tail'
    },
    'bird_sparrow': {
      category: 'animal',
      species: 'Passer domesticus',
      commonName: 'House Sparrow',
      description: 'Small brown songbird'
    },
    'bird_robin': {
      category: 'animal',
      species: 'Turdus migratorius',
      commonName: 'American Robin',
      description: 'Orange-breasted thrush'
    },
    'chipmunk_eastern': {
      category: 'animal',
      species: 'Tamias striatus',
      commonName: 'Eastern Chipmunk',
      description: 'Striped ground squirrel'
    },
    'deer_whitetail': {
      category: 'animal',
      species: 'Odocoileus virginianus',
      commonName: 'White-tailed Deer',
      description: 'Large forest mammal with white tail'
    }
  };
  
  return basicLabelMap[labelId];
}

function getSafetyFlags(labelId: string): any {
  const safetyMap: Record<string, any> = {
    'spider_garden': { dangerous: true, venomous: false },
    'bee_honey': { stinging: true, dangerous: false }
  };
  
  return safetyMap[labelId];
}

function getDefaultImageUrl(labelId: string): string {
  // Return placeholder image URLs
  const imageMap: Record<string, string> = {
    'rose_garden': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rosa_rubiginosa_1.jpg/800px-Rosa_rubiginosa_1.jpg',
    'dandelion': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Taraxacum_officinale_flower.jpg/800px-Taraxacum_officinale_flower.jpg',
    'bee_honey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Apis_mellifera_Western_honey_bee.jpg/800px-Apis_mellifera_Western_honey_bee.jpg',
    'dog': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/11-02-06-smile-by-ralphbijker.jpg/800px-11-02-06-smile-by-ralphbijker.jpg'
  };
  
  return imageMap[labelId] || 'https://via.placeholder.com/400x300?text=Species+Image';
}

function getDefaultColorChips(category: string): string[] {
  const colorMap: Record<string, string[]> = {
    'flower': ['rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(34, 139, 34)'],
    'bug': ['rgb(255, 215, 0)', 'rgb(0, 0, 0)', 'rgb(255, 0, 0)'],
    'animal': ['rgb(139, 69, 19)', 'rgb(128, 128, 128)', 'rgb(255, 255, 255)']
  };
  
  return colorMap[category] || ['rgb(128, 128, 128)'];
}

function getDefaultFunFacts(labelId: string): string[] {
  const factsMap: Record<string, string[]> = {
    'rose_garden': [
      'Roses have been cultivated for over 5,000 years!',
      'There are over 300 species of roses.',
      'Rose hips are rich in vitamin C.'
    ],
    'dandelion': [
      'Dandelion seeds can travel up to 5 miles on the wind!',
      'Every part of the dandelion is edible.',
      'They can grow in almost any soil condition.'
    ],
    'bee_honey': [
      'A honey bee can fly up to 15 miles per hour!',
      'It takes 556 worker bees to gather 1 pound of honey.',
      'Bees can recognize human faces.'
    ],
    'dog': [
      'Dogs have been domesticated for over 15,000 years!',
      'A dog\'s sense of smell is 40 times greater than a human\'s.',
      'Dogs can understand up to 250 words and gestures.'
    ]
  };
  
  return factsMap[labelId] || [
    'This is a fascinating species!',
    'Each species has unique characteristics.',
    'Nature is full of amazing discoveries.'
  ];
}
