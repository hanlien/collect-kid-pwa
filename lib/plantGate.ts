import { VisionBundle } from '@/types/recognition';

const PLANT_TERMS = [
  'leaf', 'leaves', 'flower', 'flowers', 'petal', 'petals', 
  'bark', 'stem', 'stems', 'branch', 'branches', 'bud', 'buds',
  'bloom', 'blooms', 'foliage', 'plant', 'plants', 'tree', 'trees',
  'shrub', 'shrubbery', 'grass', 'grass', 'vine', 'vines',
  'seed', 'seeds', 'fruit', 'fruits', 'berry', 'berries',
  'garden', 'garden', 'flora', 'vegetation', 'greenery'
];

const PLANT_THRESHOLD = 0.6;

export function plantGate(visionBundle: VisionBundle): boolean {
  // Check main labels
  const mainPlantScore = Math.max(
    ...visionBundle.labels
      .filter(label => PLANT_TERMS.some(term => 
        label.desc.toLowerCase().includes(term)
      ))
      .map(label => label.score)
  );

  // Check crop labels
  const cropPlantScore = Math.max(
    ...visionBundle.cropLabels
      .filter(label => PLANT_TERMS.some(term => 
        label.desc.toLowerCase().includes(term)
      ))
      .map(label => label.score)
  );

  // Check web best guess
  const webPlantMatch = visionBundle.webBestGuess.some(guess =>
    PLANT_TERMS.some(term => guess.toLowerCase().includes(term))
  );

  // Return true if any plant indicator meets threshold
  return (
    mainPlantScore >= PLANT_THRESHOLD ||
    cropPlantScore >= PLANT_THRESHOLD ||
    webPlantMatch
  );
}

export function getPlantConfidence(visionBundle: VisionBundle): number {
  const mainPlantScore = Math.max(
    ...visionBundle.labels
      .filter(label => PLANT_TERMS.some(term => 
        label.desc.toLowerCase().includes(term)
      ))
      .map(label => label.score)
  );

  const cropPlantScore = Math.max(
    ...visionBundle.cropLabels
      .filter(label => PLANT_TERMS.some(term => 
        label.desc.toLowerCase().includes(term)
      ))
      .map(label => label.score)
  );

  return Math.max(mainPlantScore, cropPlantScore, 0);
}
