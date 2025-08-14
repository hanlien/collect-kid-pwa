import { Candidate, RecognitionDecision } from '@/types/recognition';

const WEIGHTS = { 
  vision: 0.28, 
  webGuess: 0.18, 
  kgMatch: 0.14, 
  provider: 0.25, 
  cropAgree: 0.10, 
  habitatTime: 0.05 
};

export function score(candidate: Candidate): number {
  const scores = candidate.scores;
  
  // Base weighted sum
  let weightedSum = 
    (scores.vision || 0) * WEIGHTS.vision +
    (scores.webGuess || 0) * WEIGHTS.webGuess +
    (scores.kgMatch || 0) * WEIGHTS.kgMatch +
    (scores.provider || 0) * WEIGHTS.provider +
    (scores.cropAgree || 0) * WEIGHTS.cropAgree +
    (scores.habitatTime || 0) * WEIGHTS.habitatTime;

  // Apply kid-friendly scoring adjustments
  weightedSum = applyKidFriendlyScoring(candidate, weightedSum);
  
  return Math.min(1.0, Math.max(0.0, weightedSum));
}

function applyKidFriendlyScoring(candidate: Candidate, baseScore: number): number {
  const commonName = candidate.commonName?.toLowerCase() || '';
  const scientificName = candidate.scientificName?.toLowerCase() || '';
  let adjustedScore = baseScore;

  // 1. PENALIZE GENERIC TERMS (too simple)
  const genericTerms = [
    'flower', 'petal', 'leaf', 'plant', 'color', 'yellow', 'white', 'red', 'blue',
    'close-up', 'image', 'photo', 'picture', 'object', 'thing', 'item', 'green',
    'brown', 'black', 'orange', 'pink', 'purple', 'tree', 'grass', 'weed'
  ];
  
  const isGeneric = genericTerms.some(term => 
    commonName.includes(term) || scientificName.includes(term)
  );
  
  if (isGeneric) {
    adjustedScore *= 0.5; // 50% penalty for too generic
  }

  // 2. PENALIZE OVERLY COMPLEX SCIENTIFIC NAMES (too hard)
  const complexScientificPenalty = calculateComplexityPenalty(scientificName, commonName);
  adjustedScore *= complexScientificPenalty;

  // 3. BOOST KID-FRIENDLY SPECIFIC NAMES (just right)
  const kidFriendlyBoost = calculateKidFriendlyBoost(commonName, scientificName, candidate.scores);
  adjustedScore *= kidFriendlyBoost;

  // 4. BOOST EDUCATIONAL VALUE (teaches something new)
  const educationalBoost = calculateEducationalValue(commonName, scientificName);
  adjustedScore *= educationalBoost;

  return adjustedScore;
}

function calculateComplexityPenalty(scientificName: string, commonName: string): number {
  // If we have a good common name, don't penalize scientific name complexity
  if (commonName && commonName.length > 0 && !commonName.includes(' ')) {
    return 1.0; // No penalty if we have a simple common name
  }

  // Penalize overly complex scientific names
  const wordCount = scientificName.split(' ').length;
  const avgWordLength = scientificName.replace(/\s+/g, '').length / Math.max(wordCount, 1);
  
  if (wordCount > 2 || avgWordLength > 8) {
    return 0.7; // 30% penalty for very complex names
  } else if (wordCount > 1 || avgWordLength > 6) {
    return 0.85; // 15% penalty for moderately complex names
  }
  
  return 1.0; // No penalty for simple names
}

function calculateKidFriendlyBoost(commonName: string, _scientificName: string, scores: any): number {
  // Perfect kid-friendly names: 2-3 words, descriptive, memorable
  const perfectKidNames = [
    'oxeye daisy', 'common daisy', 'english daisy', 'shasta daisy',
    'monarch butterfly', 'painted lady', 'swallowtail', 'blue jay',
    'cardinal', 'robin', 'sparrow', 'goldfinch', 'hummingbird',
    'ladybug', 'firefly', 'dragonfly', 'butterfly', 'bee', 'ant',
    'dandelion', 'sunflower', 'rose', 'tulip', 'daffodil', 'lily',
    'maple tree', 'oak tree', 'pine tree', 'birch tree',
    'shih tzu', 'golden retriever', 'labrador retriever', 'german shepherd',
    'bulldog', 'poodle', 'beagle', 'chihuahua', 'pomeranian', 'yorkshire terrier'
  ];

  // Check if this is a perfect kid-friendly name
  if (perfectKidNames.includes(commonName)) {
    return 1.5; // 50% boost for perfect kid names (increased from 40%)
  }

  // Penalize generic terms more heavily
  const genericTerms = [
    'toy dog', 'dog', 'cat', 'bird', 'fish', 'flower', 'plant', 'tree',
    'animal', 'pet', 'creature', 'thing', 'object'
  ];
  
  if (genericTerms.includes(commonName.toLowerCase())) {
    return 0.3; // 70% penalty for generic terms
  }

  // Boost specific breed names (2+ words, not generic)
  const isSpecificBreed = 
    commonName.includes(' ') && 
    commonName.split(' ').length >= 2 &&
    !genericTerms.some(term => commonName.toLowerCase().includes(term));

  if (isSpecificBreed) {
    return 1.3; // 30% boost for specific breeds
  }

  // Good kid-friendly patterns
  const hasGoodPattern = 
    (commonName.includes(' ') && commonName.split(' ').length <= 3) || // 2-3 word names
    (commonName.length >= 4 && commonName.length <= 15) || // Good length (increased max)
    (scores.provider || 0) > 0.6; // High confidence from specialized providers

  if (hasGoodPattern) {
    return 1.2; // 20% boost for good patterns
  }

  return 1.0; // No boost
}

function calculateEducationalValue(commonName: string, _scientificName: string): number {
  // High educational value: teaches specific identification
  const highValueTerms = [
    'daisy', 'butterfly', 'ladybug', 'cardinal', 'robin', 'maple', 'oak',
    'sunflower', 'rose', 'tulip', 'daffodil', 'lily', 'bee', 'ant',
    'dragonfly', 'firefly', 'hummingbird', 'blue jay', 'goldfinch'
  ];

  // Medium educational value: teaches categories
  const mediumValueTerms = [
    'flower', 'bird', 'insect', 'tree', 'shrub', 'grass', 'mushroom'
  ];

  // Check educational value
  if (highValueTerms.some(term => commonName.includes(term))) {
    return 1.3; // 30% boost for high educational value
  } else if (mediumValueTerms.some(term => commonName.includes(term))) {
    return 1.1; // 10% boost for medium educational value
  }

  return 1.0; // No boost for low educational value
}

export function decide(
  candidates: Candidate[], 
  margin: number = 0.15
): RecognitionDecision {
  // Score all candidates
  const scoredCandidates = candidates.map(candidate => ({
    ...candidate,
    totalScore: score(candidate)
  }));

  // Sort by total score (descending)
  const sorted = scoredCandidates.sort((a, b) => 
    (b.totalScore || 0) - (a.totalScore || 0)
  );

  if (sorted.length === 0) {
    return { mode: "no_match" };
  }

  if (sorted.length === 1) {
    return { 
      mode: "pick", 
      pick: selectBestDisplayName(sorted[0]!, candidates)
    };
  }

  const top1 = sorted[0]!;
  const top2 = sorted[1];
  const scoreDiff = (top1.totalScore || 0) - (top2?.totalScore || 0);

  if (scoreDiff >= margin) {
    return { 
      mode: "pick", 
      pick: selectBestDisplayName(top1, candidates)
    };
  } else {
    // For disambiguation, select the best display name for each top candidate
    const top3WithBestNames = sorted.slice(0, 3).map(candidate => 
      selectBestDisplayName(candidate, candidates)
    );
    
    return { 
      mode: "disambiguate", 
      top3: top3WithBestNames
    };
  }
}

function selectBestDisplayName(topCandidate: Candidate, allCandidates: Candidate[]): Candidate {
  // Find all candidates that represent the same species (similar scientific names)
  const sameSpecies = allCandidates.filter(candidate => 
    candidate.scientificName === topCandidate.scientificName ||
    candidate.commonName === topCandidate.commonName ||
    (candidate.scientificName && topCandidate.scientificName && fuzzyMatch(candidate.scientificName, topCandidate.scientificName)) ||
    (candidate.commonName && topCandidate.commonName && fuzzyMatch(candidate.commonName, topCandidate.commonName))
  );

  if (sameSpecies.length === 1) {
    return topCandidate;
  }

  // Among the same species, pick the most kid-friendly name
  const bestKidFriendly = sameSpecies.reduce((best, current) => {
    const bestScore = calculateKidFriendlyNameScore(best);
    const currentScore = calculateKidFriendlyNameScore(current);
    return currentScore > bestScore ? current : best;
  });

  return bestKidFriendly;
}

function calculateKidFriendlyNameScore(candidate: Candidate): number {
  const commonName = candidate.commonName?.toLowerCase() || '';
  const scientificName = candidate.scientificName?.toLowerCase() || '';
  let score = 0;

  // Perfect kid-friendly names get highest score
  const perfectKidNames = [
    'oxeye daisy', 'common daisy', 'english daisy', 'shasta daisy',
    'monarch butterfly', 'painted lady', 'swallowtail', 'blue jay',
    'cardinal', 'robin', 'sparrow', 'goldfinch', 'hummingbird',
    'ladybug', 'firefly', 'dragonfly', 'butterfly', 'bee', 'ant',
    'dandelion', 'sunflower', 'rose', 'tulip', 'daffodil', 'lily',
    'maple tree', 'oak tree', 'pine tree', 'birch tree'
  ];

  if (perfectKidNames.includes(commonName)) {
    score += 100;
  }

  // Prefer common names over scientific names
  if (commonName && !scientificName.includes(' ')) {
    score += 50;
  }

  // Prefer shorter names
  score += Math.max(0, 20 - commonName.length);

  // Prefer names without special characters
  if (!/[^a-zA-Z\s]/.test(commonName)) {
    score += 10;
  }

  // Bonus for names that are 2-3 words
  const wordCount = commonName.split(' ').length;
  if (wordCount >= 2 && wordCount <= 3) {
    score += 15;
  }

  return score;
}

export function normalizeConfidence(confidence: number, source: string): number {
  // Normalize different provider confidence scales to 0-1
  switch (source) {
    case 'plantid':
      // Plant.id returns 0-1 already
      return Math.max(0, Math.min(1, confidence));
    case 'inat':
      // iNaturalist scores need normalization
      return Math.max(0, Math.min(1, confidence / 100));
    default:
      return Math.max(0, Math.min(1, confidence));
  }
}

export function calculateCropAgreement(
  visionLabels: { desc: string; score: number }[],
  cropLabels: { desc: string; score: number }[]
): number {
  if (visionLabels.length === 0 || cropLabels.length === 0) {
    return 0;
  }

  const visionTop = visionLabels[0]?.desc.toLowerCase() || '';
  const cropTop = cropLabels[0]?.desc.toLowerCase() || '';

  // Check if top labels are similar
  if (visionTop === cropTop) {
    return 1.0;
  }

  // Check for partial matches
  const visionWords = visionTop.split(' ');
  const cropWords = cropTop.split(' ');
  
  const commonWords = visionWords.filter(word => 
    cropWords.includes(word) && word.length > 2
  );

  if (commonWords.length > 0) {
    return 0.5 + (commonWords.length * 0.1);
  }

  return 0;
}

export function fuzzyMatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const commonWords = words1.filter(word => 
    words2.some(w2 => w2.includes(word) || word.includes(w2))
  );
  
  if (commonWords.length === 0) return 0;
  
  return Math.min(0.6, commonWords.length * 0.2);
}
