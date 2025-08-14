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

  // Penalize generic terms and boost specific species
  const commonName = candidate.commonName?.toLowerCase() || '';
  const scientificName = candidate.scientificName?.toLowerCase() || '';
  
  // Generic terms to penalize
  const genericTerms = [
    'flower', 'petal', 'leaf', 'plant', 'color', 'yellow', 'white', 'red', 'blue',
    'close-up', 'image', 'photo', 'picture', 'object', 'thing', 'item'
  ];
  
  // Check if this is a generic term
  const isGeneric = genericTerms.some(term => 
    commonName.includes(term) || scientificName.includes(term)
  );
  
  // Check if this is a specific species (has scientific name format or specific common name)
  const isSpecificSpecies = 
    scientificName.includes(' ') || // Scientific names have spaces (genus species)
    (commonName.includes(' ') && !genericTerms.some(term => commonName.includes(term))) ||
    (scores.provider || 0) > 0.5; // High provider confidence indicates specific species
  
  // Apply penalties/boosts
  if (isGeneric) {
    weightedSum *= 0.6; // Penalize generic terms by 40%
  } else if (isSpecificSpecies) {
    weightedSum *= 1.3; // Boost specific species by 30%
  }
  
  return Math.min(1.0, Math.max(0.0, weightedSum));
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
      pick: sorted[0] 
    };
  }

  const top1 = sorted[0]!;
  const top2 = sorted[1];
  const scoreDiff = (top1.totalScore || 0) - (top2?.totalScore || 0);

  if (scoreDiff >= margin) {
    return { 
      mode: "pick", 
      pick: top1 
    };
  } else {
    return { 
      mode: "disambiguate", 
      top3: sorted.slice(0, 3) 
    };
  }
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
