import { SpeciesResult } from '@/types/species';
import { LocalModelResult } from './localModel';

export function postprocessLocalResult(localResult: LocalModelResult): SpeciesResult {
  // Get label info from the label map
  const labelInfo = getLabelInfo(localResult.labelId);
  
  if (!labelInfo) {
    return {
      category: 'flower',
      canonicalName: 'Unknown',
      commonName: 'Unknown',
      rank: 'species',
      confidence: localResult.topK[0].prob,
      provider: 'local',
      meta: {
        modelVersion: 'v001',
        reasoning: 'Local model - unknown label'
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
    confidence: localResult.topK[0].prob,
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

function getLabelInfo(labelId: string): any {
  // This would normally load from the label map
  // For now, return a basic structure
  const labelMap = {
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
    'bee_honey': {
      category: 'bug',
      species: 'Apis mellifera',
      commonName: 'Honey Bee',
      description: 'Essential pollinator that produces honey'
    },
    'dog': {
      category: 'animal',
      species: 'Canis familiaris',
      commonName: 'Dog',
      description: 'Domesticated canine companion'
    }
  };
  
  return labelMap[labelId as keyof typeof labelMap];
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
